"use client"

/**
 * Queue Context
 *
 * Manages playback queue, shuffle/repeat modes, and queue operations.
 * Integrates with queuePersistence for localStorage state management.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { announce } from '@/components/accessibility/ScreenReaderAnnouncer';
import { logger } from '@/lib/logger';
import { loadQueueState, saveQueueState, clearQueueState } from '@/lib/queue-persistence';
import { isStorageAvailable, STORAGE_KEYS, getRawValue, setRawValue } from '@/lib/storage/persistence';
import type {
  Track,
  RepeatMode,
  QueueContext as QueueContextType,
  QueueContextValue,
  QueuePersistenceMetadata,
} from '@/types';

const QueueContext = createContext<QueueContextValue | null>(null);

export function QueueProvider({ children }: { children: React.ReactNode }) {
  // Queue state
  const [queue, setQueue] = useState<Track[]>([]);
  const [autoQueue, setAutoQueue] = useState<Track[]>([]);
  const [manualTrackIds, setManualTrackIds] = useState<string[]>([]);
  const [queueContext, setQueueContext] = useState<QueueContextType>('collection');
  const [persistenceMetadata, setPersistenceMetadata] = useState<QueuePersistenceMetadata | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const hasPersistedOnceRef = useRef(false);
  const persistenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Queue modes (persisted to localStorage)
  // Use server-safe defaults to prevent hydration mismatch
  // Actual values are hydrated in useEffect below
  const [isShuffleEnabled, setIsShuffleEnabled] = useState(false);
  const [repeatMode, setRepeatModeState] = useState<RepeatMode>('queue');
  const [repeatModeUserSet, setRepeatModeUserSet] = useState<boolean>(false);

  // Hydrate queue state and modes from localStorage on mount
  // This runs only on client after initial render to prevent hydration mismatch
  useEffect(() => {
    const persisted = loadQueueState();

    if (persisted) {
      setQueue(persisted.queue ?? []);
      setAutoQueue(persisted.autoQueue ?? []);
      setManualTrackIds(persisted.manualTrackIds ?? []);
      setQueueContext(persisted.queueContext ?? 'collection');
      setPersistenceMetadata({
        selectedCollection: persisted.selectedCollection,
        searchQuery: persisted.searchQuery,
        currentTrackId: persisted.currentTrackId,
        currentIndex: persisted.currentIndex,
        wasPlaying: persisted.wasPlaying,
        restoredAt: Date.now(),
      });
      hasPersistedOnceRef.current = true;
      logger.debug('Hydrated queue state from storage', {
        size: persisted.queue?.length ?? 0,
        context: persisted.queueContext,
      });
    } else {
      hasPersistedOnceRef.current = false;
    }

    // Hydrate repeat mode from localStorage (separate from queue persistence)
    if (isStorageAvailable()) {
      const storedRepeatMode = getRawValue(STORAGE_KEYS.REPEAT_MODE);
      const storedUserSet = getRawValue(STORAGE_KEYS.REPEAT_MODE_USER_SET) === 'true';

      if (storedRepeatMode) {
        // Validate and set repeat mode
        if (storedRepeatMode === 'none') {
          setRepeatModeState(storedUserSet ? 'none' : 'queue');
        } else if (storedRepeatMode === 'track' || storedRepeatMode === 'queue') {
          setRepeatModeState(storedRepeatMode);
        }
      }
      setRepeatModeUserSet(storedUserSet);
    }

    setIsHydrated(true);
  }, []); // Only run once on mount

  // Persist queue state to localStorage whenever it changes (after hydration)
  // Debounced to prevent excessive writes during rapid operations (drag-reorder, bulk adds)
  useEffect(() => {
    if (!isHydrated) return;

    // Clear any pending persistence
    if (persistenceTimeoutRef.current) {
      clearTimeout(persistenceTimeoutRef.current);
      persistenceTimeoutRef.current = null;
    }

    const hasMetadata =
      Boolean(persistenceMetadata?.selectedCollection) || Boolean(persistenceMetadata?.searchQuery);
    const shouldPersist = queue.length > 0 || manualTrackIds.length > 0 || hasMetadata;

    if (!shouldPersist) {
      if (hasPersistedOnceRef.current) {
        clearQueueState();
        hasPersistedOnceRef.current = false;
      }
      return;
    }

    // Debounce persistence by 300ms to batch rapid operations
    persistenceTimeoutRef.current = setTimeout(() => {
      saveQueueState(
        queue,
        manualTrackIds,
        queueContext,
        persistenceMetadata?.selectedCollection,
        persistenceMetadata?.searchQuery,
        persistenceMetadata?.currentTrackId,
        persistenceMetadata?.currentIndex,
        autoQueue,
        persistenceMetadata?.wasPlaying
      );
      hasPersistedOnceRef.current = true;
      persistenceTimeoutRef.current = null;
    }, 300);

    // Cleanup on unmount or before next effect run
    return () => {
      if (persistenceTimeoutRef.current) {
        clearTimeout(persistenceTimeoutRef.current);
        persistenceTimeoutRef.current = null;
      }
    };
  }, [queue, manualTrackIds, queueContext, persistenceMetadata, isHydrated, autoQueue]);

  // Persist repeat mode to localStorage
  useEffect(() => {
    if (!isStorageAvailable()) return;
    setRawValue(STORAGE_KEYS.REPEAT_MODE, repeatMode);
    setRawValue(STORAGE_KEYS.REPEAT_MODE_USER_SET, repeatModeUserSet ? 'true' : 'false');
  }, [repeatMode, repeatModeUserSet]);

  const updatePersistenceMetadata = useCallback((metadata: QueuePersistenceMetadata) => {
    setPersistenceMetadata((prev) => ({
      ...(prev ?? {}),
      ...metadata,
    }));
  }, []);

  // Setter for repeat mode with localStorage persistence
  const setRepeatMode = useCallback((mode: RepeatMode, userInitiated = true) => {
    setRepeatModeState(mode);
    if (userInitiated) {
      setRepeatModeUserSet(true);
      // Announce repeat mode change to screen readers
      const modeLabels: Record<RepeatMode, string> = {
        none: 'Repeat disabled',
        track: 'Repeat track enabled',
        queue: 'Repeat queue enabled',
      };
      announce(modeLabels[mode], { type: 'status', priority: 'polite' });
    }
  }, []);

  // Announce queue size changes to screen readers
  const prevQueueLengthRef = useRef(queue.length);
  useEffect(() => {
    if (!isHydrated) return;

    const prevLength = prevQueueLengthRef.current;
    const currentLength = queue.length;

    if (currentLength > prevLength) {
      const added = currentLength - prevLength;
      announce(`${added} ${added === 1 ? 'track' : 'tracks'} added to queue`, {
        type: 'status',
        priority: 'polite',
      });
    } else if (currentLength < prevLength) {
      const removed = prevLength - currentLength;
      announce(`${removed} ${removed === 1 ? 'track' : 'tracks'} removed from queue`, {
        type: 'status',
        priority: 'polite',
      });
    }

    prevQueueLengthRef.current = currentLength;
  }, [queue.length, isHydrated]);

  const value: QueueContextValue = useMemo(() => ({
    // Queue state
    queue,
    autoQueue,
    manualTrackIds,
    queueContext,
    persistenceMetadata,
    isHydrated,

    // Queue modes
    isShuffleEnabled,
    repeatMode,

    // Queue operations
    setQueue,
    updatePersistenceMetadata,

    // Context management
    setQueueContext,

    // Internal state setters
    setManualTrackIds,
    setAutoQueue,
    setIsShuffleEnabled,
    setRepeatMode,
  }), [
    queue,
    autoQueue,
    manualTrackIds,
    queueContext,
    persistenceMetadata,
    isHydrated,
    isShuffleEnabled,
    repeatMode,
    setQueue,
    updatePersistenceMetadata,
    setQueueContext,
    setManualTrackIds,
    setAutoQueue,
    setIsShuffleEnabled,
    setRepeatMode,
  ]);

  return (
    <QueueContext.Provider value={value}>
      {children}
    </QueueContext.Provider>
  );
}

/**
 * Hook to access queue context
 * @throws Error if used outside QueueProvider
 */
export function useQueue(): QueueContextValue {
  const context = useContext(QueueContext);

  if (!context) {
    throw new Error('useQueue must be used within QueueProvider');
  }

  return context;
}
