/**
 * Recently Played Hook
 *
 * Tracks and persists recently played tracks across sessions.
 * Uses database sync for authenticated users, localStorage for guests.
 *
 * Features:
 * - Cross-device sync for logged-in users
 * - Automatic tracking when tracks change
 * - Deduplication (moves existing track to front)
 * - Configurable history size (default: 10)
 * - LocalStorage fallback for guests
 */

import { useCallback, useEffect, useState, useRef } from "react"
import { isStorageAvailable, STORAGE_KEYS, getRawValue, setRawValue, removeValue } from "@/lib/storage/persistence"
import { useAuth } from "@/contexts/AuthContext"
import type { Track } from "@/types"

const DEFAULT_MAX_ITEMS = 10

interface RecentlyPlayedEntry {
  trackId: string
  playedAt: number
}

export interface UseRecentlyPlayedOptions {
  allTracks: Track[]
  maxItems?: number
  currentTrack?: Track | null
}

export interface UseRecentlyPlayedResult {
  recentlyPlayed: Track[]
  recentlyPlayedIds: string[]
  addToRecentlyPlayed: (track: Track) => void
  clearRecentlyPlayed: () => void
  isLoaded: boolean
}

async function fetchRecentlyPlayedFromAPI(): Promise<RecentlyPlayedEntry[] | null> {
  try {
    const response = await fetch('/api/auth/recently-played')
    if (!response.ok) return null
    const data = await response.json()
    if (data.success && Array.isArray(data.entries)) {
      return data.entries
    }
    return null
  } catch {
    return null
  }
}

async function addToRecentlyPlayedAPI(trackId: string): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/recently-played', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trackId }),
    })
    return response.ok
  } catch {
    return false
  }
}

async function clearRecentlyPlayedAPI(): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/recently-played', {
      method: 'DELETE',
    })
    return response.ok
  } catch {
    return false
  }
}

export function useRecentlyPlayed({
  allTracks,
  maxItems = DEFAULT_MAX_ITEMS,
  currentTrack,
}: UseRecentlyPlayedOptions): UseRecentlyPlayedResult {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [entries, setEntries] = useState<RecentlyPlayedEntry[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const lastTrackedIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (authLoading) return

    const loadData = async () => {
      if (isAuthenticated) {
        const apiEntries = await fetchRecentlyPlayedFromAPI()
        if (apiEntries) {
          setEntries(apiEntries.slice(0, maxItems))
          setIsLoaded(true)
          return
        }
      }

      if (!isStorageAvailable()) {
        setIsLoaded(true)
        return
      }

      try {
        const stored = getRawValue(STORAGE_KEYS.RECENTLY_PLAYED)
        if (stored) {
          const parsed = JSON.parse(stored) as RecentlyPlayedEntry[]
          const valid = parsed.filter(
            (entry) => typeof entry.trackId === "string" && typeof entry.playedAt === "number"
          )
          setEntries(valid.slice(0, maxItems))
        }
      } catch {
        setEntries([])
      }
      setIsLoaded(true)
    }

    loadData()
  }, [authLoading, isAuthenticated, maxItems])

  useEffect(() => {
    if (!isLoaded || !isStorageAvailable()) return
    setRawValue(STORAGE_KEYS.RECENTLY_PLAYED, JSON.stringify(entries))
  }, [entries, isLoaded])

  const addToRecentlyPlayed = useCallback(
    (track: Track) => {
      setEntries((prev) => {
        const filtered = prev.filter((entry) => entry.trackId !== track.id)
        const newEntry: RecentlyPlayedEntry = {
          trackId: track.id,
          playedAt: Date.now(),
        }
        return [newEntry, ...filtered].slice(0, maxItems)
      })

      if (isAuthenticated) {
        addToRecentlyPlayedAPI(track.id)
      }
    },
    [maxItems, isAuthenticated]
  )

  const clearRecentlyPlayed = useCallback(() => {
    setEntries([])
    if (isStorageAvailable()) {
      removeValue(STORAGE_KEYS.RECENTLY_PLAYED)
    }
    if (isAuthenticated) {
      clearRecentlyPlayedAPI()
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (!currentTrack || !isLoaded) return
    if (lastTrackedIdRef.current === currentTrack.id) return

    lastTrackedIdRef.current = currentTrack.id
    addToRecentlyPlayed(currentTrack)
  }, [addToRecentlyPlayed, currentTrack, isLoaded])

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
