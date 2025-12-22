/**
 * @file use-queue-controls.ts
 * @description Orchestrating hook for queue management functionality.
 * Composes focused sub-hooks for queue core, sync, mutations, and navigation.
 *
 * This is the main export that consumers should use. It provides the same
 * public API as before the refactor, maintaining backward compatibility.
 *
 * @see use-queue-core.ts - Core queue building logic and filtered tracks
 * @see use-queue-sync.ts - Queue synchronization effects
 * @see use-queue-mutations.ts - Queue add/remove/reorder operations
 * @see use-queue-navigation.ts - Track selection and playback navigation
 */

import { useQueueCore, type CommitQueueFn } from "./use-queue-core";
import { useQueueMutations } from "./use-queue-mutations";
import { useQueueNavigation } from "./use-queue-navigation";
import { useQueueSync } from "./use-queue-sync";
import type { PlayerContextValue, QueueContextValue, Track, UIContextValue } from "@/types";

export interface UseQueueControlsOptions {
  player: PlayerContextValue;
  queue: QueueContextValue;
  ui: UIContextValue;
  collectionTracks: Track[];
  searchResults: Track[];
  allTracks: Track[];
}

export interface UseQueueControlsResult {
  /** Build and commit a new queue state */
  commitQueue: CommitQueueFn;
  /** Handle click on a track in the collection view */
  handleTrackClick: (track: Track, tracksOverride?: Track[]) => void;
  /** Handle selection of a search result */
  handleSearchResultSelect: (track: Track) => void;
  /** Add a track to the priority queue */
  handleTrackQueueAdd: (track: Track) => void;
  /** Handle selection of a track in the queue view */
  handleQueueTrackSelect: (trackId: string) => void;
  /** Reorder tracks within the queue */
  handleQueueReorder: (fromIndex: number, toIndex: number) => void;
  /** Remove a track from the queue */
  handleQueueRemove: (trackId: string) => void;
  /** Clear all tracks from the queue */
  handleQueueClear: () => void;
  /** Insert tracks at a specific position (used for undo) */
  handleQueueInsert: (tracks: Track[], index: number) => void;
  /** Skip to next track */
  handleNext: () => void;
  /** Go to previous track */
  handlePrevious: () => void;
  /** Toggle queue visibility */
  toggleQueueVisibility: () => void;
  /** Toggle shuffle mode */
  handleShuffleToggle: () => void;
  /** Cycle through repeat modes */
  handleRepeatToggle: () => void;
}

/**
 * Main queue controls hook - orchestrates all queue functionality.
 *
 * This hook composes four focused sub-hooks:
 * - `useQueueCore`: Core queue building logic and filtered track computations
 * - `useQueueSync`: Queue synchronization effects for collection/search changes
 * - `useQueueMutations`: Queue modification operations (add, remove, reorder, clear)
 * - `useQueueNavigation`: Track selection and playback navigation controls
 *
 * The public API remains unchanged from before the refactor for backward compatibility.
 */
export function useQueueControls({
  player,
  queue,
  ui,
  collectionTracks,
  searchResults,
  allTracks,
}: UseQueueControlsOptions): UseQueueControlsResult {
  // Core queue building and filtered tracks
  const {
    commitQueue,
    filteredCollectionTracks,
    autoQueueIds,
    filteredCollectionIds,
    filteredSearchResults,
    filteredSearchIds,
  } = useQueueCore({
    player,
    queue,
    collectionTracks,
    searchResults,
  });

  // Queue synchronization effects
  useQueueSync({
    player,
    queue,
    ui,
    filteredCollectionTracks,
    filteredSearchResults,
    autoQueueIds,
    filteredCollectionIds,
    filteredSearchIds,
    searchResultsLength: searchResults.length,
    commitQueue,
  });

  // Queue mutation operations
  const {
    handleTrackQueueAdd,
    handleQueueReorder,
    handleQueueRemove,
    handleQueueClear,
    handleQueueInsert,
  } = useQueueMutations({
    player,
    queue,
    commitQueue,
  });

  // Navigation and playback controls
  const {
    handleTrackClick,
    handleSearchResultSelect,
    handleQueueTrackSelect,
    handleNext,
    handlePrevious,
    toggleQueueVisibility,
    handleShuffleToggle,
    handleRepeatToggle,
  } = useQueueNavigation({
    player,
    queue,
    ui,
    collectionTracks,
    searchResults,
    allTracks,
    filteredSearchResults,
    commitQueue,
  });

  return {
    commitQueue,
    handleTrackClick,
    handleSearchResultSelect,
    handleTrackQueueAdd,
    handleQueueTrackSelect,
    handleQueueReorder,
    handleQueueRemove,
    handleQueueClear,
    handleQueueInsert,
    handleNext,
    handlePrevious,
    toggleQueueVisibility,
    handleShuffleToggle,
    handleRepeatToggle,
  };
}
