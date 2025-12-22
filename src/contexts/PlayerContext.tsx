"use client"

/**
 * Player Context - Performance Optimized
 *
 * Manages audio playback state, controls, and volume for MetaDJ Nexus.
 *
 * PERFORMANCE ARCHITECTURE:
 * - PlayerContext: Slow-changing values (track, volume, play/pause state)
 * - PlaybackTimeContext: Fast-changing values (currentTime, duration)
 * - currentTimeRef: For components that need time without re-renders
 *
 * This split prevents cascade re-renders during playback. Components that
 * don't need time updates won't re-render 4-5x/second during playback.
 */

import { createContext, useCallback, useContext, useMemo, useRef, useState, useEffect } from 'react';
import { announce } from '@/components/accessibility/ScreenReaderAnnouncer';
import { STORAGE_KEYS, getNumber, setNumber, isStorageAvailable } from '@/lib/storage';
import { toasts } from '@/lib/toast-helpers';
import { useToast } from './ToastContext';
import type { Track, PlayerContextValue, PlaybackTimeContextValue } from '@/types';

// Separate contexts for performance optimization
const PlayerContext = createContext<PlayerContextValue | null>(null);
const PlaybackTimeContext = createContext<PlaybackTimeContextValue | null>(null);

/**
 * PlaybackTimeProvider - Isolated time updates
 *
 * Only components using usePlaybackTime() will re-render on time changes.
 * This is the key performance optimization - most components don't need
 * continuous time updates.
 */
function PlaybackTimeProvider({
  children,
  audioRef,
  audioVersion
}: {
  children: React.ReactNode;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  audioVersion: number;
}) {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Sync with audio element - re-runs when audioVersion changes (when audio element is attached)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleDurationChange = () => {
      setDuration(audio.duration || 0);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [audioRef, audioVersion]);

  const value = useMemo(() => ({
    currentTime,
    duration,
    setCurrentTime,
  }), [currentTime, duration]);

  return (
    <PlaybackTimeContext.Provider value={value}>
      {children}
    </PlaybackTimeContext.Provider>
  );
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const { showToast } = useToast();

  // Current playback state
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [shouldPlay, setShouldPlay] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Actual playback state (updated by AudioPlayer via setters)
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);

  // Ref-based time for components that need instant access without re-renders
  const currentTimeRef = useRef<number>(0);
  const setCurrentTimeRef = useCallback((time: number) => {
    currentTimeRef.current = time;
  }, []);

  // Audio element reference (set by AudioPlayer component)
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Audio version counter - incremented when audio element is attached
  // This triggers PlaybackTimeProvider to re-attach its listeners
  const [audioVersion, setAudioVersion] = useState(0);
  const notifyAudioReady = useCallback(() => {
    setAudioVersion(v => v + 1);
  }, []);

  // Volume state (persisted via unified storage layer)
  const [volume, setVolumeState] = useState<number>(() => {
    if (!isStorageAvailable()) return 1.0;
    const stored = getNumber(STORAGE_KEYS.VOLUME, 1.0);
    return stored >= 0 && stored <= 1 ? stored : 1.0;
  });

  const [isMuted, setIsMuted] = useState(false);

  // Track ref-based time updates from audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      currentTimeRef.current = audio.currentTime;
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    return () => audio.removeEventListener('timeupdate', handleTimeUpdate);
  }, []);

  // Announce playback state changes to screen readers
  useEffect(() => {
    if (!currentTrack) return;

    const trackInfo = `${currentTrack.title}${currentTrack.artist ? ` by ${currentTrack.artist}` : ''}`;
    const statusMessage = shouldPlay
      ? `Now playing: ${trackInfo}`
      : `Paused: ${trackInfo}`;

    announce(statusMessage, { type: 'status', priority: 'polite' });
  }, [currentTrack, shouldPlay]);

  // Volume control with unified storage persistence and debounced toast
  const volumeToastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const setVolume = useCallback((newVolume: number) => {
    const clamped = Math.max(0, Math.min(1, newVolume));
    setVolumeState(clamped);
    setNumber(STORAGE_KEYS.VOLUME, clamped);

    // Debounce toast notification to prevent spam during slider drag
    if (volumeToastTimeoutRef.current) {
      clearTimeout(volumeToastTimeoutRef.current);
    }
    volumeToastTimeoutRef.current = setTimeout(() => {
      const volumePercent = Math.round(clamped * 100);
      showToast(toasts.volumeChanged(volumePercent));
    }, 300);
  }, [showToast]);

  const toggleMute = useCallback(() => {
    const nextMutedState = !isMuted;
    setIsMuted(nextMutedState);

    showToast(toasts.muteToggled(nextMutedState));
  }, [isMuted, showToast]);

  // Playback controls
  const play = useCallback(() => {
    setShouldPlay(true);
  }, []);

  const pause = useCallback(() => {
    setShouldPlay(false);
  }, []);

  /**
   * Navigate to next track in queue.
   *
   * ARCHITECTURE NOTE: These are intentional no-ops at the PlayerContext level.
   * Queue-aware navigation is handled by useQueueControls hook which has access
   * to both PlayerContext and QueueContext. This separation keeps PlayerContext
   * focused on playback state while queue logic lives in dedicated hooks.
   *
   * See: src/hooks/home/use-queue-controls.ts for actual implementation.
   */
  const next = useCallback(() => {
    // Intentional no-op - queue navigation handled by useQueueControls
  }, []);

  /**
   * Navigate to previous track in queue.
   *
   * ARCHITECTURE NOTE: Same as next() - see comment above.
   */
  const previous = useCallback(() => {
    // Intentional no-op - queue navigation handled by useQueueControls
  }, []);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  }, []);

  // Memoize context value - EXCLUDES currentTime for performance
  const value: PlayerContextValue = useMemo(() => ({
    // Current state
    currentTrack,
    currentIndex,
    shouldPlay,
    isLoading,

    // Actual playback state (excludes currentTime)
    isPlaying,
    duration,

    audioRef,

    // Playback controls
    play,
    pause,
    next,
    previous,
    seek,

    // Volume controls
    volume,
    isMuted,
    setVolume,
    toggleMute,

    // State setters (for queue/page management)
    setCurrentTrack,
    setCurrentIndex,
    setShouldPlay,
    setIsLoading,
    setIsPlaying,
    setDuration,

    // Ref-based time access (no re-renders)
    currentTimeRef,
    setCurrentTimeRef,

    // Audio ready notification (for PlaybackTimeProvider sync)
    notifyAudioReady,
  }), [
    currentTrack,
    currentIndex,
    shouldPlay,
    isLoading,
    isPlaying,
    duration,
    play,
    pause,
    next,
    previous,
    seek,
    volume,
    isMuted,
    setVolume,
    toggleMute,
    setCurrentTimeRef,
    notifyAudioReady,
  ]);

  return (
    <PlayerContext.Provider value={value}>
      <PlaybackTimeProvider audioRef={audioRef} audioVersion={audioVersion}>
        {children}
      </PlaybackTimeProvider>
    </PlayerContext.Provider>
  );
}

/**
 * Hook to access player context (slow-changing values)
 *
 * Use this for most components. Does NOT include currentTime to prevent
 * unnecessary re-renders during playback.
 *
 * @throws Error if used outside PlayerProvider
 */
export function usePlayer(): PlayerContextValue {
  const context = useContext(PlayerContext);

  if (!context) {
    throw new Error('usePlayer must be used within PlayerProvider');
  }

  return context;
}

/**
 * Hook to access playback time (fast-changing values)
 *
 * PERFORMANCE: Only use this in components that need continuous time updates
 * (progress bars, time displays). Components using this will re-render 4-5x/second
 * during playback.
 *
 * @throws Error if used outside PlayerProvider
 */
export function usePlaybackTime(): PlaybackTimeContextValue {
  const context = useContext(PlaybackTimeContext);

  if (!context) {
    throw new Error('usePlaybackTime must be used within PlayerProvider');
  }

  return context;
}

/**
 * Hook to get current time without causing re-renders
 *
 * Returns a ref that updates every timeupdate event. Use this for
 * calculations that need current time but don't need to trigger renders.
 *
 * Example: const time = useCurrentTimeRef().current;
 */
export function useCurrentTimeRef(): React.RefObject<number> {
  const { currentTimeRef } = usePlayer();
  return currentTimeRef;
}
