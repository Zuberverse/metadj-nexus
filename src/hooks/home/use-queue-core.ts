/**
 * @file use-queue-core.ts
 * @description Core queue building logic and filtered track computations.
 * Provides the foundational `commitQueue` function and memoized filtered tracks
 * that other queue hooks depend on.
 */

import { useCallback, useMemo } from "react";
import { flushSync } from "react-dom";
import { buildQueue, buildShuffledQueue, filterTracksExcludingManual } from "@/lib/music/queue-builder";
import type { PlayerContextValue, QueueContextValue, Track } from "@/types";

export interface UseQueueCoreOptions {
  player: PlayerContextValue;
  queue: QueueContextValue;
  collectionTracks: Track[];
  searchResults: Track[];
}

export interface CommitQueueOptions {
  anchorTrackId?: string;
  autoplay?: boolean;
  preserveCurrent?: boolean;
  /** Force synchronous state updates for mobile audio unlock */
  immediatePlay?: boolean;
}

export type CommitQueueFn = (
  baseTracks: Track[],
  manualIds: string[],
  options?: CommitQueueOptions
) => void;

export interface UseQueueCoreResult {
  /** Builds and commits a new queue state */
  commitQueue: CommitQueueFn;
  /** Collection tracks excluding manually queued tracks */
  filteredCollectionTracks: Track[];
  /** IDs of tracks in the auto queue */
  autoQueueIds: string[];
  /** IDs of filtered collection tracks */
  filteredCollectionIds: string[];
  /** Search results excluding manually queued tracks */
  filteredSearchResults: Track[];
  /** IDs of filtered search results */
  filteredSearchIds: string[];
}

/**
 * Core queue building logic and filtered track computations.
 *
 * This hook provides:
 * - `commitQueue`: The central function for building and applying queue state changes
 * - Memoized filtered tracks that exclude manually queued items
 * - Derived IDs for efficient comparison in sync effects
 */
export function useQueueCore({
  player,
  queue,
  collectionTracks,
  searchResults,
}: UseQueueCoreOptions): UseQueueCoreResult {
  /**
   * Central queue building and state commit function.
   * Handles queue construction, index management, and playback state updates.
   * Uses flushSync for immediate play scenarios (critical for mobile audio unlock).
   */
  const commitQueue = useCallback(
    (
      baseTracks: Track[],
      manualIds: string[],
      options?: CommitQueueOptions
    ) => {
      const result = buildQueue(baseTracks, manualIds, player.currentTrack, options);

      const updateStates = () => {
        // Use shallow array equality to detect order changes (beyond membership)
        // This ensures manual reordering actually persists after current track changes
        const hasOrderChanged =
          queue.manualTrackIds.length !== result.manualTrackIds.length ||
          queue.manualTrackIds.some((id, index) => id !== result.manualTrackIds[index]);

        if (hasOrderChanged) {
          queue.setManualTrackIds(result.manualTrackIds);
        }

        queue.setAutoQueue(result.autoQueue);
        queue.setQueue(result.combinedQueue);

        if (result.combinedQueue.length === 0) {
          player.setCurrentTrack(null);
          player.setCurrentIndex(-1);
          if (player.shouldPlay) {
            player.setShouldPlay(false);
          }
          return;
        }

        if (result.targetIndex === -1) {
          return;
        }

        const nextTrack = result.combinedQueue[result.targetIndex];
        const isSameTrack = player.currentTrack ? nextTrack.id === player.currentTrack.id : false;

        player.setCurrentTrack(nextTrack);
        player.setCurrentIndex(result.targetIndex);

        if (isSameTrack) {
          if (typeof options?.autoplay === "boolean") {
            player.setShouldPlay(options.autoplay);
          }
        } else {
          player.setShouldPlay(options?.autoplay ?? false);
        }
      };

      // Use flushSync for immediate play to ensure state updates happen synchronously
      // This keeps us in the user gesture context for mobile audio unlock
      if (options?.immediatePlay && options?.autoplay) {
        flushSync(updateStates);
      } else {
        updateStates();
      }
    },
    [player, queue]
  );

  // Filtered collection tracks (excludes manually queued)
  const filteredCollectionTracks = useMemo(() => {
    return filterTracksExcludingManual(collectionTracks, queue.manualTrackIds);
  }, [collectionTracks, queue.manualTrackIds]);

  // Auto queue track IDs for sync comparison
  const autoQueueIds = useMemo(() => {
    return queue.autoQueue.map((track) => track.id);
  }, [queue.autoQueue]);

  // Filtered collection track IDs for sync comparison
  const filteredCollectionIds = useMemo(() => {
    return filteredCollectionTracks.map((track) => track.id);
  }, [filteredCollectionTracks]);

  // Filtered search results (excludes manually queued)
  const filteredSearchResults = useMemo(() => {
    return filterTracksExcludingManual(searchResults, queue.manualTrackIds);
  }, [searchResults, queue.manualTrackIds]);

  // Filtered search result IDs for sync comparison
  const filteredSearchIds = useMemo(() => {
    return filteredSearchResults.map((track) => track.id);
  }, [filteredSearchResults]);

  return {
    commitQueue,
    filteredCollectionTracks,
    autoQueueIds,
    filteredCollectionIds,
    filteredSearchResults,
    filteredSearchIds,
  };
}
