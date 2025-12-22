/**
 * @file use-queue-mutations.ts
 * @description Queue mutation operations: add, remove, reorder, clear, insert.
 * Handles all modifications to the queue structure.
 */

import { useCallback } from "react";
import { announce } from "@/components/accessibility/ScreenReaderAnnouncer";
import { useToast } from "@/contexts/ToastContext";
import { trackQueueAction } from "@/lib/analytics";
import { logger } from "@/lib/logger";
import { toasts } from "@/lib/toast-helpers";
import type { CommitQueueFn } from "./use-queue-core";
import type { PlayerContextValue, QueueContextValue, Track } from "@/types";

export interface UseQueueMutationsOptions {
  player: PlayerContextValue;
  queue: QueueContextValue;
  commitQueue: CommitQueueFn;
}

export interface UseQueueMutationsResult {
  /** Add a track to the priority queue */
  handleTrackQueueAdd: (track: Track) => void;
  /** Reorder tracks within the queue */
  handleQueueReorder: (fromIndex: number, toIndex: number) => void;
  /** Remove a track from the queue */
  handleQueueRemove: (trackId: string) => void;
  /** Clear all tracks from the queue */
  handleQueueClear: () => void;
  /** Insert tracks at a specific position (used for undo) */
  handleQueueInsert: (tracks: Track[], index: number) => void;
}

/**
 * Queue mutation operations for modifying queue structure.
 *
 * This hook provides:
 * - `handleTrackQueueAdd`: Add tracks to priority queue (FIFO order)
 * - `handleQueueReorder`: Reorder within manual or auto sections
 * - `handleQueueRemove`: Remove tracks (manual: permanent, auto: temporary)
 * - `handleQueueClear`: Clear entire queue
 * - `handleQueueInsert`: Insert tracks at position (for undo functionality)
 */
export function useQueueMutations({
  player,
  queue,
  commitQueue,
}: UseQueueMutationsOptions): UseQueueMutationsResult {
  const { showToast } = useToast();

  /**
   * Add a track to the priority (manual) queue.
   * Uses FIFO ordering - new tracks go to the end.
   */
  const handleTrackQueueAdd = useCallback(
    (track: Track) => {
      if (queue.manualTrackIds.includes(track.id)) {
        showToast({ message: `${track.title} is already in your queue` });
        announce(`${track.title} is already in your queue`, { type: 'status' });
        return;
      }

      // FIFO: Add new tracks to the END of the priority queue
      // This ensures tracks are played in the order they were added (First In, First Out)
      // Example: Add A, then B, then C → Queue order: [A, B, C] → A plays first
      const nextManualIds = [...queue.manualTrackIds, track.id];
      const baseTracks = [...queue.autoQueue];
      if (!baseTracks.some((item) => item.id === track.id)) {
        baseTracks.push(track);
      }

      commitQueue(baseTracks, nextManualIds, { preserveCurrent: true });
      showToast(toasts.trackAddedToQueue(track.title));
      announce(`${track.title} added to queue`, { type: 'log' });

      try {
        const predictedSize =
          nextManualIds.length + baseTracks.length - baseTracks.filter((t) => nextManualIds.includes(t.id)).length;
        trackQueueAction({ action: "add", trackId: track.id, queueSize: Math.max(queue.queue.length, predictedSize) });
      } catch {
        // ignore analytics failures
      }
    },
    [queue, showToast, commitQueue]
  );

  /**
   * Reorder tracks within the queue.
   * Handles reordering within manual section or auto section separately.
   */
  const handleQueueReorder = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex) return;

      const manualCount = queue.manualTrackIds.length;

      // Reorder within manual queue
      if (fromIndex < manualCount && toIndex < manualCount) {
        const nextManual = [...queue.manualTrackIds];
        const [moved] = nextManual.splice(fromIndex, 1);
        nextManual.splice(toIndex, 0, moved);
        commitQueue(queue.autoQueue, nextManual, { preserveCurrent: true });
        announce(`Track moved to position ${toIndex + 1}`, { type: 'status' });
        try {
          trackQueueAction({ action: "reorder", queueSize: queue.queue.length });
        } catch (error) {
          logger.debug('Analytics: trackQueueAction failed', { action: 'reorder', error: String(error) })
        }
        return;
      }

      // Reorder within auto queue
      if (fromIndex >= manualCount && toIndex >= manualCount) {
        const relativeFrom = fromIndex - manualCount;
        const relativeTo = toIndex - manualCount;

        if (
          relativeFrom < 0 ||
          relativeFrom >= queue.autoQueue.length ||
          relativeTo < 0 ||
          relativeTo >= queue.autoQueue.length
        ) {
          return;
        }

        const nextAuto = [...queue.autoQueue];
        const [moved] = nextAuto.splice(relativeFrom, 1);
        nextAuto.splice(relativeTo, 0, moved);
        commitQueue(nextAuto, queue.manualTrackIds, { preserveCurrent: true });
        announce(`Track moved to position ${toIndex + 1}`, { type: 'status' });
        try {
          trackQueueAction({ action: "reorder", queueSize: queue.queue.length });
        } catch (error) {
          logger.debug('Analytics: trackQueueAction failed', { action: 'reorder', error: String(error) })
        }
      }
    },
    [queue, commitQueue]
  );

  /**
   * Remove a track from the queue.
   * Manual tracks are removed permanently.
   * Auto tracks are removed temporarily (reappear on queue rebuild).
   */
  const handleQueueRemove = useCallback(
    (trackId: string) => {
      const isCurrentTrack = player.currentTrack?.id === trackId;

      // If removing currently playing track, clear it first to prevent stale state
      if (isCurrentTrack) {
        player.setCurrentTrack(null);
        player.setCurrentIndex(-1);
      }

      // MANUAL TRACK REMOVAL: Remove from manualTrackIds permanently
      if (queue.manualTrackIds.includes(trackId)) {
        const nextManual = queue.manualTrackIds.filter((id) => id !== trackId);

        // Build base tracks for commitQueue
        // Include current track in base if it's manual and not being removed
        let baseTracks = [...queue.autoQueue];
        if (!isCurrentTrack && player.currentTrack && queue.manualTrackIds.includes(player.currentTrack.id)) {
          // Current track is manual and not being removed - include it in base so buildQueue can anchor
          baseTracks = [player.currentTrack, ...baseTracks];
        }

        // Remove from manual queue and rebuild
        // If current track: preserveCurrent=false so commitQueue picks next track
        // If different track: preserveCurrent=true to keep current playback
        commitQueue(baseTracks, nextManual, {
          preserveCurrent: !isCurrentTrack,
          autoplay: isCurrentTrack ? true : undefined,
        });

        try {
          trackQueueAction({ action: "remove", trackId, queueSize: Math.max(0, queue.queue.length - 1) });
        } catch {}
        return;
      }

      // AUTO TRACK REMOVAL: Temporarily remove from current autoQueue
      // Track will reappear when queue rebuilds (collection change, shuffle toggle, etc.)
      // This allows it to "skip for current loop but come around again"
      const nextAuto = queue.autoQueue.filter((track) => track.id !== trackId);

      // Remove from current autoQueue and rebuild the queue
      // If current track: preserveCurrent=false so commitQueue picks next track
      // If different track: preserveCurrent=true to keep current playback
      commitQueue(nextAuto, queue.manualTrackIds, {
        preserveCurrent: !isCurrentTrack,
        autoplay: isCurrentTrack ? true : undefined,
      });

      try {
        trackQueueAction({ action: "remove", trackId, queueSize: Math.max(0, queue.queue.length - 1) });
      } catch (error) {
        logger.debug('Analytics: trackQueueAction failed', { action: 'remove', error: String(error) })
      }
    },
    [queue, player, commitQueue]
  );

  /**
   * Clear the entire queue (manual + auto) and reset player.
   */
  const handleQueueClear = useCallback(() => {
    if (queue.queue.length === 0 && queue.manualTrackIds.length === 0) return;

    // Fully clear queue (manual + auto) and reset player
    commitQueue([], [], { preserveCurrent: false, autoplay: false });
    queue.setQueueContext("collection");
    showToast(toasts.queueCleared());
    announce('Queue cleared', { type: 'status' });
    try {
      trackQueueAction({ action: "clear", queueSize: 0 });
    } catch (error) {
      logger.debug('Analytics: trackQueueAction failed', { action: 'clear', error: String(error) })
    }
  }, [queue, commitQueue, showToast]);

  /**
   * Insert tracks at a specific position in the queue (used for undo functionality).
   * Handles both manual and auto tracks by checking if they're in manualTrackIds.
   */
  const handleQueueInsert = useCallback(
    (tracks: Track[], index: number) => {
      if (tracks.length === 0) return;

      // Determine which tracks were manual vs auto based on whether they were in manualTrackIds
      const tracksToInsertAsManual = tracks.filter(
        (t) => queue.manualTrackIds.includes(t.id) || !queue.autoQueue.some((a) => a.id === t.id)
      );
      const tracksToInsertAsAuto = tracks.filter((t) => !tracksToInsertAsManual.includes(t));

      // Restore manual track IDs
      let nextManualIds = [...queue.manualTrackIds];
      for (const t of tracksToInsertAsManual) {
        if (!nextManualIds.includes(t.id)) {
          nextManualIds.push(t.id);
        }
      }

      // Restore auto tracks at appropriate position
      let nextAuto = [...queue.autoQueue];
      const autoIndex = Math.max(0, Math.min(index, nextAuto.length));
      for (const t of tracksToInsertAsAuto) {
        if (!nextAuto.some((a) => a.id === t.id)) {
          nextAuto.splice(autoIndex, 0, t);
        }
      }

      // Rebuild queue with restored tracks
      commitQueue(nextAuto, nextManualIds, { preserveCurrent: true });

      try {
        trackQueueAction({ action: "add", queueSize: queue.queue.length + tracks.length });
      } catch (error) {
        logger.debug('Analytics: trackQueueAction failed', { action: 'add', error: String(error) })
      }
    },
    [queue, commitQueue]
  );

  return {
    handleTrackQueueAdd,
    handleQueueReorder,
    handleQueueRemove,
    handleQueueClear,
    handleQueueInsert,
  };
}
