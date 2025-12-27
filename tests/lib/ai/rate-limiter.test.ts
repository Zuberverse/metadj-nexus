/**
 * Rate Limiter Tests
 *
 * Tests for AI rate limiting including in-memory mode and fail-closed behavior.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  checkRateLimit,
  clearAllRateLimits,
  sanitizeMessages,
  buildRateLimitResponse,
  isUpstashConfigured,
  isFailClosedEnabled,
  MAX_HISTORY,
  MAX_CONTENT_LENGTH,
} from '@/lib/ai/rate-limiter'

describe('checkRateLimit (in-memory)', () => {
  beforeEach(() => {
    clearAllRateLimits()
  })

  it('allows first request', () => {
    const result = checkRateLimit('test-user-1', false)
    expect(result.allowed).toBe(true)
  })

  it('allows multiple requests within limit', () => {
    for (let i = 0; i < 5; i++) {
      // Skip burst check by using fingerprint mode
      const result = checkRateLimit('test-user-2', true)
      expect(result.allowed).toBe(true)
    }
  })

  it('blocks requests exceeding window limit', () => {
    // Max is 20 per window
    for (let i = 0; i < 20; i++) {
      checkRateLimit('test-user-3', true)
    }
    const result = checkRateLimit('test-user-3', true)
    expect(result.allowed).toBe(false)
    expect(result.remainingMs).toBeGreaterThan(0)
  })

  it('tracks different identifiers separately', () => {
    for (let i = 0; i < 20; i++) {
      checkRateLimit('user-a', true)
    }
    const resultA = checkRateLimit('user-a', true)
    const resultB = checkRateLimit('user-b', true)

    expect(resultA.allowed).toBe(false)
    expect(resultB.allowed).toBe(true)
  })
})

describe('sanitizeMessages', () => {
  it('limits message history', () => {
    const messages = Array.from({ length: 100 }, (_, i) => ({
      role: 'user' as const,
      content: `Message ${i}`,
    }))

    const sanitized = sanitizeMessages(messages)
    expect(sanitized.length).toBeLessThanOrEqual(MAX_HISTORY)
  })

  it('truncates long content', () => {
    const longContent = 'x'.repeat(MAX_CONTENT_LENGTH + 1000)
    const messages = [{ role: 'user' as const, content: longContent }]

    const sanitized = sanitizeMessages(messages)
    expect(sanitized[0].content.length).toBe(MAX_CONTENT_LENGTH)
  })

  it('strips HTML tags', () => {
    const messages = [
      { role: 'user' as const, content: '<script>alert("xss")</script>Hello' },
    ]

    const sanitized = sanitizeMessages(messages)
    expect(sanitized[0].content).toBe('alert("xss")Hello')
  })

  it('normalizes roles', () => {
    const messages = [
      { role: 'system' as unknown as 'user', content: 'System message' },
      { role: 'assistant' as const, content: 'Assistant message' },
      { role: 'user' as const, content: 'User message' },
    ]

    const sanitized = sanitizeMessages(messages)
    expect(sanitized[0].role).toBe('user') // system normalized to user
    expect(sanitized[1].role).toBe('assistant')
    expect(sanitized[2].role).toBe('user')
  })
})

describe('buildRateLimitResponse', () => {
  it('calculates retry-after in seconds', () => {
    const response = buildRateLimitResponse(5000)
    expect(response.retryAfter).toBe(5)
  })

  it('rounds up partial seconds', () => {
    const response = buildRateLimitResponse(1100)
    expect(response.retryAfter).toBe(2)
  })

  it('includes error message', () => {
    const response = buildRateLimitResponse(1000)
    expect(response.error).toContain('Rate limit exceeded')
  })
})

describe('configuration exports', () => {
  it('exports isUpstashConfigured boolean', () => {
    expect(typeof isUpstashConfigured).toBe('boolean')
  })

  it('exports isFailClosedEnabled boolean', () => {
    expect(typeof isFailClosedEnabled).toBe('boolean')
  })

  it('exports MAX_HISTORY constant', () => {
    expect(typeof MAX_HISTORY).toBe('number')
    expect(MAX_HISTORY).toBeGreaterThan(0)
  })

  it('exports MAX_CONTENT_LENGTH constant', () => {
    expect(typeof MAX_CONTENT_LENGTH).toBe('number')
    expect(MAX_CONTENT_LENGTH).toBeGreaterThan(0)
  })
})
