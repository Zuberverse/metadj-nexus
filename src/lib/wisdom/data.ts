/**
 * Wisdom Data Loader
 *
 * Provides cached loading of wisdom content from the API.
 * Used by HomePageClient for preloading wisdom data.
 */

import type { ThoughtPost, Guide, Reflection } from "@/data/wisdom-content"

export interface WisdomData {
  thoughts: ThoughtPost[]
  guides: Guide[]
  reflections: Reflection[]
}

let cachedWisdomData: WisdomData | null = null
let cachedWisdomPromise: Promise<WisdomData> | null = null

/**
 * Load wisdom data from the API with caching.
 * Returns cached data if available, otherwise fetches from API.
 */
export async function loadWisdomData(): Promise<WisdomData> {
  if (cachedWisdomData) return cachedWisdomData
  if (!cachedWisdomPromise) {
    cachedWisdomPromise = fetch("/api/wisdom")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load Wisdom content")
        return res.json()
      })
      .then((json: { thoughtsPosts: ThoughtPost[]; guides: Guide[]; reflections: Reflection[] }) => ({
        thoughts: json.thoughtsPosts,
        guides: json.guides,
        reflections: json.reflections,
      }))
      .then((data) => {
        cachedWisdomData = data
        return data
      })
      .catch((error) => {
        cachedWisdomPromise = null
        throw error
      })
  }
  return cachedWisdomPromise
}

/**
 * Get cached wisdom data synchronously.
 * Returns null if data hasn't been loaded yet.
 */
export function getCachedWisdomData(): WisdomData | null {
  return cachedWisdomData
}

/**
 * Clear the wisdom data cache.
 * Useful for testing or when data needs to be refreshed.
 */
export function clearWisdomCache(): void {
  cachedWisdomData = null
  cachedWisdomPromise = null
}
