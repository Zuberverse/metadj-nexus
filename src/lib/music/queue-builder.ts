/**
 * Queue Builder Utility
 *
 * Pure functions for building and managing playback queues.
 * Extracted from page.tsx for better testability and reusability.
 *
 * PERFORMANCE OPTIMIZATION:
 * - Pure functions enable better memoization in consuming components
 * - Separated concerns improve code maintainability
 * - Easier to unit test queue logic independently
 */

import { trackList as allTracks } from './data'
import { shuffleTracks } from './utils'
import type { Track } from "@/types"

/**
 * Queue building options
 */
export interface QueueBuildOptions {
  /** Track ID to anchor the queue around (will be the current track) */
  anchorTrackId?: string
  /** Whether playback should start automatically */
  autoplay?: boolean
  /** Whether to preserve the current track if it exists in the new queue */
  preserveCurrent?: boolean
}

/**
 * Result of building a queue
 */
export interface QueueBuildResult {
  /** The complete queue with manual tracks first, then auto tracks */
  combinedQueue: Track[]
  /** Sanitized manual track IDs (deduplicated and validated) */
  manualTrackIds: string[]
  /** Filtered base tracks (excluding manual tracks) */
  autoQueue: Track[]
  /** Index of the track that should be current */
  targetIndex: number
  /** Whether playback should start */
  shouldPlay: boolean
}

/**
 * Build a queue from base tracks and manual track IDs
 *
 * @param baseTracks - Base tracks to include in the queue (will be filtered to exclude manual tracks)
 * @param manualIds - Array of track IDs to prioritize at the front of the queue
 * @param currentTrack - Currently playing track (if any)
 * @param options - Queue building options
 * @returns QueueBuildResult with combined queue and metadata
 *
 * @example
 * ```typescript
 * const result = buildQueue(
 *   featuredTracks,
 *   ['track-1', 'track-2'],
 *   currentTrack,
 *   { anchorTrackId: 'track-1', autoplay: true }
 * )
 * ```
 */
export function buildQueue(
  baseTracks: Track[],
  manualIds: string[],
  currentTrack: Track | null,
  options?: QueueBuildOptions
): QueueBuildResult {
  // Sanitize manual track IDs - deduplicate and validate
  const manualTracks: Track[] = []
  const sanitizedManualIds: string[] = []
  const seenManual = new Set<string>()

  for (const id of manualIds) {
    if (seenManual.has(id)) continue
    const track = allTracks.find((candidate: Track) => candidate?.id === id)
    if (track) {
      manualTracks.push(track)
      sanitizedManualIds.push(track.id)
      seenManual.add(track.id)
    }
  }

  // Filter base tracks to exclude manual tracks
  const manualSet = new Set(sanitizedManualIds)
  const filteredBase = baseTracks.filter((track) => !manualSet.has(track.id))

  // Combine manual and auto tracks
  const combined = [...manualTracks, ...filteredBase]

  // Empty queue handling
  if (combined.length === 0) {
    return {
      combinedQueue: [],
      manualTrackIds: [],
      autoQueue: [],
      targetIndex: -1,
      shouldPlay: false,
    }
  }

  // Determine target track
  const preserveCurrent = options?.preserveCurrent ?? true
  let targetTrackId = options?.anchorTrackId ?? null

  if (!targetTrackId && preserveCurrent && currentTrack) {
    targetTrackId = currentTrack.id
  }

  // If no target track and no current track (initial load), don't auto-select
  let targetIndex = -1
  if (targetTrackId || currentTrack) {
    targetIndex = targetTrackId
      ? combined.findIndex((track) => track.id === targetTrackId)
      : -1

    if (targetIndex === -1) {
      targetIndex = 0
    }
  }

  // Determine shouldPlay state
  let shouldPlay = false
  if (targetIndex !== -1) {
    const isSameTrack = currentTrack ? combined[targetIndex].id === currentTrack.id : false

    if (isSameTrack) {
      // If same track, only change play state if explicitly requested
      shouldPlay = options?.autoplay ?? false
    } else {
      // New track - use provided autoplay option (defaults to false)
      shouldPlay = options?.autoplay ?? false
    }
  }

  return {
    combinedQueue: combined,
    manualTrackIds: sanitizedManualIds,
    autoQueue: filteredBase,
    targetIndex,
    shouldPlay,
  }
}

/**
 * Filter tracks to exclude manual queue tracks
 *
 * @param tracks - Tracks to filter
 * @param manualTrackIds - IDs of tracks in the manual queue
 * @returns Filtered tracks excluding manual queue tracks
 *
 * PERFORMANCE NOTE: This is a pure function suitable for useMemo
 */
export function filterTracksExcludingManual(
  tracks: Track[],
  manualTrackIds: string[]
): Track[] {
  const manualSet = new Set(manualTrackIds)
  return tracks.filter((track) => !manualSet.has(track.id))
}

/**
 * Build a shuffled queue from base tracks
 *
 * @param tracks - Tracks to shuffle
 * @param anchorTrackId - Optional track ID to keep at the front
 * @param manualTrackIds - Manual track IDs to exclude from auto queue
 * @returns Shuffled tracks with anchor track first (if provided)
 */
export function buildShuffledQueue(
  tracks: Track[],
  anchorTrackId?: string,
  manualTrackIds: string[] = []
): Track[] {
  const filtered = filterTracksExcludingManual(tracks, manualTrackIds)
  return shuffleTracks(filtered, anchorTrackId)
}
