/**
 * AI Response Cache Tests
 *
 * Tests the semantic response caching implementation for AI responses.
 * Validates cache key generation, LRU eviction, TTL expiration, and statistics.
 *
 * @module tests/lib/ai/cache
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
// Mock the logger before importing the module
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))
import {
  clearCache,
  createCacheKey,
  getCachedResponse,
  getCacheStats,
  invalidatePattern,
  isCacheEnabled,
  setCachedResponse,
} from '@/lib/ai/cache'

describe('AI Response Cache', () => {
  beforeEach(() => {
    // Clear cache before each test
    clearCache()
    vi.clearAllMocks()

    // Enable cache for testing
    vi.stubEnv('AI_CACHE_ENABLED', 'true')
  })

  afterEach(() => {
    clearCache()
    vi.unstubAllEnvs()
  })

  describe('isCacheEnabled', () => {
    it('returns true when explicitly enabled', () => {
      vi.stubEnv('AI_CACHE_ENABLED', 'true')
      expect(isCacheEnabled()).toBe(true)

      vi.stubEnv('AI_CACHE_ENABLED', '1')
      expect(isCacheEnabled()).toBe(true)
    })

    it('returns false when explicitly disabled', () => {
      vi.stubEnv('AI_CACHE_ENABLED', 'false')
      expect(isCacheEnabled()).toBe(false)

      vi.stubEnv('AI_CACHE_ENABLED', '0')
      expect(isCacheEnabled()).toBe(false)
    })

    it('defaults to enabled in production', () => {
      vi.stubEnv('AI_CACHE_ENABLED', '')
      vi.stubEnv('NODE_ENV', 'production')
      expect(isCacheEnabled()).toBe(true)
    })

    it('defaults to disabled in development', () => {
      vi.stubEnv('AI_CACHE_ENABLED', '')
      vi.stubEnv('NODE_ENV', 'development')
      expect(isCacheEnabled()).toBe(false)
    })
  })

  describe('createCacheKey', () => {
    it('creates deterministic keys for identical messages', () => {
      const messages = [{ role: 'user', content: 'What is the meaning of life?' }]
      const key1 = createCacheKey(messages, 'adaptive')
      const key2 = createCacheKey(messages, 'adaptive')

      expect(key1).toBe(key2)
      expect(key1).toMatch(/^ai:adaptive:/)
    })

    it('creates different keys for different messages', () => {
      const messages1 = [{ role: 'user', content: 'Hello, how are you today?' }]
      const messages2 = [{ role: 'user', content: 'What is your purpose here?' }]

      const key1 = createCacheKey(messages1, 'adaptive')
      const key2 = createCacheKey(messages2, 'adaptive')

      expect(key1).not.toBe(key2)
    })

    it('creates different keys for different modes', () => {
      const messages = [{ role: 'user', content: 'Tell me about yourself please' }]

      const key1 = createCacheKey(messages, 'adaptive')
      const key2 = createCacheKey(messages, 'creative')

      expect(key1).not.toBe(key2)
    })

    it('returns empty string for very short messages', () => {
      const messages = [{ role: 'user', content: 'Hi' }] // Less than 10 chars

      const key = createCacheKey(messages, 'adaptive')
      expect(key).toBe('')
    })

    it('normalizes messages for better cache hits', () => {
      const messages1 = [{ role: 'user', content: 'HELLO WORLD  today' }]
      const messages2 = [{ role: 'user', content: 'hello world today' }]

      const key1 = createCacheKey(messages1, 'adaptive')
      const key2 = createCacheKey(messages2, 'adaptive')

      expect(key1).toBe(key2)
    })

    it('finds the last user message in conversation', () => {
      const messages = [
        { role: 'system', content: 'You are helpful.' },
        { role: 'user', content: 'First question here' },
        { role: 'assistant', content: 'Answer to first.' },
        { role: 'user', content: 'Second question here' },
      ]

      const key = createCacheKey(messages, 'adaptive')
      // Key should be based on "Second question here"
      expect(key).toMatch(/^ai:adaptive:/)
    })

    it('includes context signature when provided', () => {
      const messages = [{ role: 'user', content: 'What is the weather like?' }]

      const key1 = createCacheKey(messages, 'adaptive', '')
      const key2 = createCacheKey(messages, 'adaptive', 'weather-context')

      expect(key1).not.toBe(key2)
    })
  })

  describe('setCachedResponse / getCachedResponse', () => {
    it('stores and retrieves cached responses', async () => {
      const key = 'ai:test:12345'
      const response = 'This is a test response that is long enough to be cached.'

      await setCachedResponse(key, response, 'gpt-4o')
      const cached = await getCachedResponse(key)

      expect(cached).toBe(response)
    })

    it('returns null for non-existent keys', async () => {
      const result = await getCachedResponse('ai:nonexistent:key')
      expect(result).toBeNull()
    })

    it('returns null for empty keys', async () => {
      const result = await getCachedResponse('')
      expect(result).toBeNull()
    })

    it('skips caching very short responses', async () => {
      const key = 'ai:test:short'
      const shortResponse = 'Too short' // Less than 50 chars

      await setCachedResponse(key, shortResponse, 'gpt-4o')
      const cached = await getCachedResponse(key)

      expect(cached).toBeNull()
    })

    it('does not cache when disabled', async () => {
      process.env.AI_CACHE_ENABLED = 'false'

      const key = 'ai:test:disabled'
      const response = 'This response should not be cached because caching is disabled.'

      await setCachedResponse(key, response, 'gpt-4o')
      const cached = await getCachedResponse(key)

      expect(cached).toBeNull()
    })

    it('expires entries after TTL', async () => {
      const key = 'ai:test:expiring'
      const response = 'This response will expire quickly because we set a short TTL.'

      // Set with a 100ms TTL
      await setCachedResponse(key, response, 'gpt-4o', 100)

      // Should be available immediately
      let cached = await getCachedResponse(key)
      expect(cached).toBe(response)

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 150))

      // Should be expired now
      cached = await getCachedResponse(key)
      expect(cached).toBeNull()
    })

    it('increments hit count on cache access', async () => {
      const key = 'ai:test:hits'
      const response = 'This response will be accessed multiple times to count hits.'

      await setCachedResponse(key, response, 'gpt-4o')

      // Access multiple times
      await getCachedResponse(key)
      await getCachedResponse(key)
      await getCachedResponse(key)

      const stats = getCacheStats()
      const entry = stats.entries.find((e) => e.key.includes('hits'))

      expect(entry?.hits).toBe(3)
    })
  })

  describe('LRU eviction', () => {
    it('evicts oldest entries when at capacity', async () => {
      // Fill cache to capacity (MAX_CACHE_SIZE is 100)
      for (let i = 0; i < 100; i++) {
        const key = `ai:test:entry${i.toString().padStart(3, '0')}`
        const response = `Response ${i} - This is a sufficiently long response for caching.`
        await setCachedResponse(key, response, 'gpt-4o')
      }

      const statsBefore = getCacheStats()
      expect(statsBefore.size).toBe(100)

      // Add one more - should trigger eviction
      await setCachedResponse(
        'ai:test:overflow',
        'This entry should trigger eviction of oldest entries.',
        'gpt-4o'
      )

      const statsAfter = getCacheStats()
      // Should have evicted 20% (20 entries) + added 1 = 81 entries
      expect(statsAfter.size).toBeLessThanOrEqual(81)
    })
  })

  describe('clearCache', () => {
    it('removes all cached entries', async () => {
      // Responses must be at least 50 chars to be cached
      await setCachedResponse(
        'ai:test:clear1',
        'First response to be cleared from the cache - this needs to be longer than fifty characters.',
        'gpt-4o'
      )
      await setCachedResponse(
        'ai:test:clear2',
        'Second response to be cleared from the cache - also needs to be longer than fifty characters.',
        'gpt-4o'
      )

      const statsBefore = getCacheStats()
      expect(statsBefore.size).toBeGreaterThan(0)

      clearCache()

      const statsAfter = getCacheStats()
      expect(statsAfter.size).toBe(0)
    })
  })

  describe('invalidatePattern', () => {
    it('removes entries matching pattern', async () => {
      // Responses must be at least 50 chars to be cached
      await setCachedResponse(
        'ai:weather:key1',
        'Weather response one that should be invalidated - this is a sufficiently long response.',
        'gpt-4o'
      )
      await setCachedResponse(
        'ai:weather:key2',
        'Weather response two that should be invalidated - this is also sufficiently long.',
        'gpt-4o'
      )
      await setCachedResponse(
        'ai:music:key1',
        'Music response that should NOT be invalidated - this needs to be fifty chars or more.',
        'gpt-4o'
      )

      const removed = invalidatePattern('weather')

      expect(removed).toBe(2)

      // Weather entries should be gone
      const weatherCache = await getCachedResponse('ai:weather:key1')
      expect(weatherCache).toBeNull()

      // Music entry should still exist
      const musicCache = await getCachedResponse('ai:music:key1')
      expect(musicCache).toBe('Music response that should NOT be invalidated - this needs to be fifty chars or more.')
    })

    it('returns 0 when no entries match', () => {
      const removed = invalidatePattern('nonexistent-pattern')
      expect(removed).toBe(0)
    })
  })

  describe('getCacheStats', () => {
    it('returns correct statistics', async () => {
      // Responses must be at least 50 chars to be cached
      await setCachedResponse(
        'ai:stats:test1',
        'Response for statistics test - this needs to be sufficiently long to actually cache.',
        'gpt-4o'
      )
      await setCachedResponse(
        'ai:stats:test2',
        'Another response for statistics testing purposes - also needs to be over fifty characters.',
        'claude-3-opus'
      )

      const stats = getCacheStats()

      expect(stats.enabled).toBe(true)
      expect(stats.size).toBe(2)
      expect(stats.maxSize).toBe(100)
      expect(stats.entries).toHaveLength(2)

      // Check entry structure
      const entry = stats.entries[0]
      expect(entry).toHaveProperty('key')
      expect(entry).toHaveProperty('age')
      expect(entry).toHaveProperty('hits')
      expect(entry).toHaveProperty('model')
    })

    it('sorts entries by hits (descending)', async () => {
      // Responses must be at least 50 chars to be cached
      await setCachedResponse(
        'ai:sort:low',
        'Low hit response - this entry is accessed only once for testing purposes in this test.',
        'gpt-4o'
      )
      await setCachedResponse(
        'ai:sort:high',
        'High hit response - this entry is accessed multiple times for testing sorting logic.',
        'gpt-4o'
      )

      // Access high-hit entry multiple times
      await getCachedResponse('ai:sort:high')
      await getCachedResponse('ai:sort:high')
      await getCachedResponse('ai:sort:high')

      const stats = getCacheStats()

      // Should have 2 entries
      expect(stats.entries.length).toBe(2)
      // High-hit entry should be first
      expect(stats.entries[0].hits).toBeGreaterThan(stats.entries[1].hits)
    })

    it('limits entries to top 10', async () => {
      // Add 15 entries - each must be at least 50 chars
      for (let i = 0; i < 15; i++) {
        await setCachedResponse(
          `ai:limit:entry${i.toString().padStart(2, '0')}`,
          `Response number ${i} for limit test - this content is sufficiently long to be cached.`,
          'gpt-4o'
        )
      }

      const stats = getCacheStats()

      expect(stats.size).toBe(15)
      expect(stats.entries.length).toBeLessThanOrEqual(10)
    })
  })
})
