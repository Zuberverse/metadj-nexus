/**
 * Rate Limiter Tests
 *
 * Tests for AI rate limiting including in-memory mode and fail-closed behavior.
 */

import { NextRequest } from 'next/server'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  checkRateLimit,
  checkTranscribeRateLimit,
  clearAllRateLimits,
  clearRateLimit,
  sanitizeMessages,
  buildRateLimitResponse,
  isUpstashConfigured,
  isFailClosedEnabled,
  getRateLimitMode,
  getClientIdentifier,
  generateSessionId,
  MAX_HISTORY,
  MAX_CONTENT_LENGTH,
  MAX_TRANSCRIPTIONS_PER_WINDOW,
  SESSION_COOKIE_NAME,
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

  it('exports MAX_TRANSCRIPTIONS_PER_WINDOW constant', () => {
    expect(typeof MAX_TRANSCRIPTIONS_PER_WINDOW).toBe('number')
    expect(MAX_TRANSCRIPTIONS_PER_WINDOW).toBeGreaterThan(0)
  })

  it('exports SESSION_COOKIE_NAME constant', () => {
    expect(typeof SESSION_COOKIE_NAME).toBe('string')
    expect(SESSION_COOKIE_NAME.length).toBeGreaterThan(0)
  })
})

describe('getRateLimitMode', () => {
  it('returns in-memory when Upstash is not configured', () => {
    // In test environment, Upstash is typically not configured
    const mode = getRateLimitMode()
    expect(['distributed', 'in-memory']).toContain(mode)
  })

  it('mode matches isUpstashConfigured flag', () => {
    const mode = getRateLimitMode()
    if (isUpstashConfigured) {
      expect(mode).toBe('distributed')
    } else {
      expect(mode).toBe('in-memory')
    }
  })
})

describe('checkTranscribeRateLimit (in-memory)', () => {
  beforeEach(() => {
    clearAllRateLimits()
  })

  it('allows first transcription request', () => {
    const result = checkTranscribeRateLimit('transcribe-user-1', false)
    expect(result.allowed).toBe(true)
  })

  it('allows multiple requests within limit', () => {
    for (let i = 0; i < MAX_TRANSCRIPTIONS_PER_WINDOW - 1; i++) {
      // Skip burst check by using fingerprint mode
      const result = checkTranscribeRateLimit('transcribe-user-2', true)
      expect(result.allowed).toBe(true)
    }
  })

  it('blocks requests exceeding transcription limit', () => {
    // Exhaust the limit
    for (let i = 0; i < MAX_TRANSCRIPTIONS_PER_WINDOW; i++) {
      checkTranscribeRateLimit('transcribe-user-3', true)
    }
    const result = checkTranscribeRateLimit('transcribe-user-3', true)
    expect(result.allowed).toBe(false)
    expect(result.remainingMs).toBeGreaterThan(0)
  })

  it('tracks transcription separately from chat', () => {
    // Exhaust chat limit
    for (let i = 0; i < 20; i++) {
      checkRateLimit('combined-user', true)
    }
    // Transcription should still be allowed
    const result = checkTranscribeRateLimit('combined-user', true)
    expect(result.allowed).toBe(true)
  })
})

describe('clearRateLimit', () => {
  beforeEach(() => {
    clearAllRateLimits()
  })

  it('removes rate limit for specific identifier', () => {
    // Exhaust the limit
    for (let i = 0; i < 20; i++) {
      checkRateLimit('clear-test-user', true)
    }
    expect(checkRateLimit('clear-test-user', true).allowed).toBe(false)

    // Clear the rate limit
    const cleared = clearRateLimit('clear-test-user')
    expect(cleared).toBe(true)

    // Should be allowed again
    expect(checkRateLimit('clear-test-user', true).allowed).toBe(true)
  })

  it('returns false when identifier does not exist', () => {
    const cleared = clearRateLimit('non-existent-user')
    expect(cleared).toBe(false)
  })
})

describe('generateSessionId', () => {
  it('generates unique session IDs', () => {
    const id1 = generateSessionId()
    const id2 = generateSessionId()
    expect(id1).not.toBe(id2)
  })

  it('generates string session IDs', () => {
    const id = generateSessionId()
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(0)
  })

  it('generates session IDs with expected prefix', () => {
    const id = generateSessionId()
    expect(id.startsWith('session-')).toBe(true)
  })
})

describe('getClientIdentifier', () => {
  it('returns fingerprint-based identifier when no session cookie', () => {
    const request = new NextRequest('https://example.com/api/metadjai', {
      headers: {
        'user-agent': 'test-agent',
        'accept-language': 'en-US',
      },
    })
    const identifier = getClientIdentifier(request)
    expect(identifier.isFingerprint).toBe(true)
    expect(identifier.id.startsWith('fp-')).toBe(true)
  })

  it('returns session-based identifier when session cookie present', () => {
    const request = new NextRequest('https://example.com/api/metadjai', {
      headers: {
        cookie: `${SESSION_COOKIE_NAME}=test-session-id`,
      },
    })
    const identifier = getClientIdentifier(request)
    expect(identifier.isFingerprint).toBe(false)
    expect(identifier.id).toBe('test-session-id')
  })
})
