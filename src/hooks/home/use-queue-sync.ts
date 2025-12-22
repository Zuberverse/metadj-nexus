/**
 * @file use-queue-sync.ts
 * @description Queue synchronization effects that keep the queue in sync
 * with collection changes, search results, and context switches.
 */

import { useEffect } from "react";
import { buildShuffledQueue } from "@/lib/music/queue-builder";
import { haveSameMembers } from "@/lib/utils";
import type { CommitQueueFn } from "./use-queue-core";
import type { PlayerContextValue, QueueContextValue, Track, UIContextValue } from "@/types";

export interface UseQueueSyncOptions {
  player: PlayerContextValue;
  queue: QueueContextValue;
  ui: UIContextValue;
  /** Filtered collection tracks (excluding manual) */
  filteredCollectionTracks: Track[];
  /** Filtered search results (excluding manual) */
  filteredSearchResults: Track[];
  /** IDs of tracks in the auto queue */
  autoQueueIds: string[];
  /** IDs of filtered collection tracks */
  filteredCollectionIds: string[];
  /** IDs of filtered search results */
  filteredSearchIds: string[];
  /** Search results count for dependency tracking */
  searchResultsLength: number;
  /** Function to commit queue changes */
  commitQueue: CommitQueueFn;
}

/**
 * Handles queue synchronization effects.
 *
 * This hook manages:
 * - Collection queue synchronization when source tracks change
 * - Search queue synchronization when search results change
 * - Context switching when search query clears or results empty
 * - Auto-closing queue modal when queue becomes empty
 */
export function useQueueSync({
  player,
  queue,
  ui,
  filteredCollectionTracks,
  filteredSearchResults,
  autoQueueIds,
  filteredCollectionIds,
  filteredSearchIds,
  searchResultsLength,
  commitQueue,
}: UseQueueSyncOptions): void {
  // Sync collection queue when source tracks change
  useEffect(() => {
    if (queue.queueContext !== "collection") return;
    
    // Never sync when there's a current track - this prevents the queue from
    // changing unexpectedly when pausing or when viewing a different collection tab
    if (player.currentTrack) return;
    // If we have a persisted current track but the player hasn't been restored yet,
    // defer sync to avoid overriding the restored queue on initial load.
    if (queue.persistenceMetadata?.currentTrackId && !player.currentTrack) return;

    if (!haveSameMembers(autoQueueIds, filteredCollectionIds)) {
      const base = queue.isShuffleEnabled
        ? buildShuffledQueue(filteredCollectionTracks, undefined, queue.manualTrackIds)
        : filteredCollectionTracks;
      commitQueue(base, queue.manualTrackIds, { preserveCurrent: true });
    }
  }, [
    queue.queueContext,
    autoQueueIds,
    filteredCollectionIds,
    filteredCollectionTracks,
	    queue.isShuffleEnabled,
	    player.currentTrack,
	    queue.persistenceMetadata?.currentTrackId,
	    commitQueue,
	    queue.manualTrackIds,
	  ]);

  // Auto-close queue modal when queue becomes genuinely empty
  useEffect(() => {
    // Only close queue if it's genuinely empty (no current track playing)
    // This prevents closing during transient empty states when commitQueue rebuilds the queue
    if (queue.queue.length === 0 && ui.modals.isQueueOpen && !player.currentTrack) {
      ui.setQueueOpen(false);
    }
  }, [queue.queue.length, ui, player.currentTrack]);

  // Sync search queue when search results change
  useEffect(() => {
    if (queue.queueContext !== "search") return;
    if (searchResultsLength === 0) return;
    // Defer initial sync until persisted player state has restored.
    if (queue.persistenceMetadata?.currentTrackId && !player.currentTrack) return;

    if (!haveSameMembers(autoQueueIds, filteredSearchIds)) {
      const base = queue.isShuffleEnabled
        ? buildShuffledQueue(filteredSearchResults, player.currentTrack?.id, queue.manualTrackIds)
        : filteredSearchResults;
      commitQueue(base, queue.manualTrackIds, { preserveCurrent: true });
    }
  }, [
    queue.queueContext,
    searchResultsLength,
    autoQueueIds,
    filteredSearchIds,
    filteredSearchResults,
	    queue.isShuffleEnabled,
	    player.currentTrack,
	    queue.persistenceMetadata?.currentTrackId,
	    commitQueue,
	    queue.manualTrackIds,
	  ]);

  // Switch to collection context when search query clears
  useEffect(() => {
    if (!ui.searchQuery && queue.queueContext === "search") {
      queue.setQueueContext("collection");
    }
  }, [ui.searchQuery, queue]);

  // Switch to collection context when search results become empty
  useEffect(() => {
    if (queue.queueContext === "search" && searchResultsLength === 0) {
      queue.setQueueContext("collection");
    }
  }, [queue, searchResultsLength]);
}
