/**
 * Recently Played Hook
 *
 * Tracks and persists recently played tracks across sessions.
 * Uses localStorage for persistence with a configurable max size.
 *
 * Features:
 * - Automatic tracking when tracks change
 * - Deduplication (moves existing track to front)
 * - Configurable history size (default: 10)
 * - Session persistence via localStorage
 */

import { useCallback, useEffect, useState } from "react"
import { isStorageAvailable, STORAGE_KEYS, getRawValue, setRawValue, removeValue } from "@/lib/storage/persistence"
import type { Track } from "@/types"

const DEFAULT_MAX_ITEMS = 10

interface RecentlyPlayedEntry {
  trackId: string
  playedAt: number // Unix timestamp
}

export interface UseRecentlyPlayedOptions {
  // All available tracks (for hydrating IDs to full Track objects)
  allTracks: Track[]
  // Maximum number of items to keep
  maxItems?: number
  // Auto-track changes to this track
  currentTrack?: Track | null
}

export interface UseRecentlyPlayedResult {
  // Recently played tracks (most recent first)
  recentlyPlayed: Track[]
  // Track IDs only
  recentlyPlayedIds: string[]
  // Add a track to recently played
  addToRecentlyPlayed: (track: Track) => void
  // Clear history
  clearRecentlyPlayed: () => void
  // Whether the history has loaded
  isLoaded: boolean
}

export function useRecentlyPlayed({
  allTracks,
  maxItems = DEFAULT_MAX_ITEMS,
  currentTrack,
}: UseRecentlyPlayedOptions): UseRecentlyPlayedResult {
  const [entries, setEntries] = useState<RecentlyPlayedEntry[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    if (!isStorageAvailable()) {
      setIsLoaded(true)
      return
    }

    try {
      const stored = getRawValue(STORAGE_KEYS.RECENTLY_PLAYED)
      if (stored) {
        const parsed = JSON.parse(stored) as RecentlyPlayedEntry[]
        // Validate entries
        const valid = parsed.filter(
          (entry) => typeof entry.trackId === "string" && typeof entry.playedAt === "number"
        )
        setEntries(valid.slice(0, maxItems))
      }
    } catch {
      // Invalid stored data, start fresh
      setEntries([])
    }
    setIsLoaded(true)
  }, [maxItems])

  // Persist to localStorage when entries change
  useEffect(() => {
    if (!isLoaded || !isStorageAvailable()) return

    setRawValue(STORAGE_KEYS.RECENTLY_PLAYED, JSON.stringify(entries))
  }, [entries, isLoaded])

  // Add track to recently played
  const addToRecentlyPlayed = useCallback(
    (track: Track) => {
      setEntries((prev) => {
        // Remove existing entry for this track (will move to front)
        const filtered = prev.filter((entry) => entry.trackId !== track.id)

        // Add to front
        const newEntry: RecentlyPlayedEntry = {
          trackId: track.id,
          playedAt: Date.now(),
        }

        // Limit to maxItems
        return [newEntry, ...filtered].slice(0, maxItems)
      })
    },
    [maxItems]
  )

  // Clear history
  const clearRecentlyPlayed = useCallback(() => {
    setEntries([])
    if (isStorageAvailable()) {
      removeValue(STORAGE_KEYS.RECENTLY_PLAYED)
    }
  }, [])

  // Auto-track current track changes
  useEffect(() => {
    if (!currentTrack || !isLoaded) return

    // Add to recently played when track changes
    addToRecentlyPlayed(currentTrack)
  }, [addToRecentlyPlayed, currentTrack, isLoaded])

  // Hydrate track IDs to full Track objects
  const recentlyPlayed = entries
    .map((entry) => allTracks.find((track) => track.id === entry.trackId))
    .filter((track): track is Track => track !== undefined)

  const recentlyPlayedIds = entries.map((entry) => entry.trackId)

  return {
    recentlyPlayed,
    recentlyPlayedIds,
    addToRecentlyPlayed,
    clearRecentlyPlayed,
    isLoaded,
  }
}
