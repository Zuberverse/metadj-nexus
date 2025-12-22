/**
 * useSearch Hook
 *
 * Consolidated search logic for track searching with debouncing and filtering.
 * Extracted from SearchBar component for better reusability and testability.
 *
 * PERFORMANCE OPTIMIZATION:
 * - Debounces search queries to prevent excessive filtering
 * - Memoizes search results for better performance
 * - Provides clean separation of concerns
 *
 * @example
 * ```typescript
 * const { searchResults, debouncedQuery } = useSearch({
 *   tracks: allTracks,
 *   query: searchQuery,
 *   debounceMs: 300
 * })
 * ```
 */

import { useMemo } from 'react'
import { getTracksByCollection, type Track } from '@/lib/music'
import { filterTracks } from '@/lib/music/filters'
import { useDebounce } from './use-debounce'

export interface UseSearchOptions {
  /** All tracks to search through */
  tracks: Track[]
  /** Current search query */
  query: string
  /** Debounce delay in milliseconds (default: 300) */
  debounceMs?: number
  /** Optional collection ID to filter by */
  collectionId?: string
}

export interface UseSearchResult {
  /** Filtered search results */
  searchResults: Track[]
  /** Debounced search query */
  debouncedQuery: string
  /** Whether search is active (non-empty query) */
  isSearching: boolean
  /** Number of search results */
  resultCount: number
}

/**
 * Hook for searching tracks with debouncing and filtering
 *
 * PERFORMANCE NOTE:
 * - Results are memoized and only recalculate when debounced query or tracks change
 * - Debouncing prevents excessive filtering on every keystroke
 *
 * @param options - Search configuration options
 * @returns Search state and results
 */
export function useSearch(options: UseSearchOptions): UseSearchResult {
  const { tracks, query, debounceMs = 300, collectionId } = options

  // Debounce search query to avoid excessive filtering
  const debouncedQuery = useDebounce(query, debounceMs)

  // Filter tracks based on debounced search query
  // PERFORMANCE: Memoized to prevent recalculation on every render
  const searchResults = useMemo(() => {
    const trimmedQuery = debouncedQuery.trim()
    
    // UX: Require at least 2 characters to start searching
    // This prevents broad matches like "h" returning the entire catalog
    if (!trimmedQuery || trimmedQuery.length < 2) {
      return []
    }

    return filterTracks(tracks, trimmedQuery, collectionId, getTracksByCollection)
  }, [debouncedQuery, tracks, collectionId])

  const isSearching = debouncedQuery.trim().length > 0
  const resultCount = searchResults.length

  return {
    searchResults,
    debouncedQuery,
    isSearching,
    resultCount,
  }
}
