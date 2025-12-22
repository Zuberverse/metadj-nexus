/**
 * Daydream Utility Functions Tests
 *
 * Tests for pure utility functions extracted from use-dream.ts
 */

import { describe, it, expect } from 'vitest'
import {
  getErrorMessage,
  getWhipErrorStatus,
  isRetryableWhipError,
  WHIP_RETRY_CONFIG,
  PATCH_CONFIG,
  STARTUP_CONFIG,
} from '@/lib/daydream/utils'

describe('getErrorMessage', () => {
  it('returns string body directly', () => {
    expect(getErrorMessage('Error occurred')).toBe('Error occurred')
  })

  it('extracts error property from object', () => {
    expect(getErrorMessage({ error: 'Something went wrong' })).toBe('Something went wrong')
  })

  it('extracts message property from object', () => {
    expect(getErrorMessage({ message: 'Connection failed' })).toBe('Connection failed')
  })

  it('extracts detail property from object', () => {
    expect(getErrorMessage({ detail: 'Stream not ready' })).toBe('Stream not ready')
  })

  it('extracts details string from object', () => {
    expect(getErrorMessage({ details: 'Timeout exceeded' })).toBe('Timeout exceeded')
  })

  it('extracts nested error from details object', () => {
    expect(getErrorMessage({ details: { error: 'Nested error' } })).toBe('Nested error')
  })

  it('extracts nested message from details object', () => {
    expect(getErrorMessage({ details: { message: 'Nested message' } })).toBe('Nested message')
  })

  it('extracts nested detail from details object', () => {
    expect(getErrorMessage({ details: { detail: 'Nested detail' } })).toBe('Nested detail')
  })

  it('returns null for null input', () => {
    expect(getErrorMessage(null)).toBeNull()
  })

  it('returns null for undefined input', () => {
    expect(getErrorMessage(undefined)).toBeNull()
  })

  it('returns null for empty object', () => {
    expect(getErrorMessage({})).toBeNull()
  })

  it('returns null for object without error properties', () => {
    expect(getErrorMessage({ foo: 'bar', status: 500 })).toBeNull()
  })

  it('prioritizes error over message', () => {
    expect(getErrorMessage({ error: 'Error', message: 'Message' })).toBe('Error')
  })
})

describe('getWhipErrorStatus', () => {
  it('extracts status code from WHIP error message', () => {
    expect(getWhipErrorStatus('WHIP offer failed: 409')).toBe(409)
  })

  it('handles case-insensitive matching', () => {
    expect(getWhipErrorStatus('whip OFFER FAILED: 500')).toBe(500)
  })

  it('extracts 404 status', () => {
    expect(getWhipErrorStatus('WHIP offer failed: 404')).toBe(404)
  })

  it('extracts 429 status', () => {
    expect(getWhipErrorStatus('WHIP offer failed: 429')).toBe(429)
  })

  it('returns null for undefined message', () => {
    expect(getWhipErrorStatus(undefined)).toBeNull()
  })

  it('returns null for empty message', () => {
    expect(getWhipErrorStatus('')).toBeNull()
  })

  it('returns null for message without status code', () => {
    expect(getWhipErrorStatus('Connection failed')).toBeNull()
  })

  it('returns null for non-numeric status', () => {
    expect(getWhipErrorStatus('WHIP offer failed: abc')).toBeNull()
  })
})

describe('isRetryableWhipError', () => {
  describe('status code based retries', () => {
    it('returns true for 404 status', () => {
      expect(isRetryableWhipError('WHIP offer failed: 404')).toBe(true)
    })

    it('returns true for 409 status', () => {
      expect(isRetryableWhipError('WHIP offer failed: 409')).toBe(true)
    })

    it('returns true for 429 status', () => {
      expect(isRetryableWhipError('WHIP offer failed: 429')).toBe(true)
    })

    it('returns true for 500 status', () => {
      expect(isRetryableWhipError('WHIP offer failed: 500')).toBe(true)
    })

    it('returns true for 502 status', () => {
      expect(isRetryableWhipError('WHIP offer failed: 502')).toBe(true)
    })

    it('returns true for 503 status', () => {
      expect(isRetryableWhipError('WHIP offer failed: 503')).toBe(true)
    })

    it('returns false for 400 status', () => {
      expect(isRetryableWhipError('WHIP offer failed: 400')).toBe(false)
    })

    it('returns false for 401 status', () => {
      expect(isRetryableWhipError('WHIP offer failed: 401')).toBe(false)
    })

    it('returns false for 403 status', () => {
      expect(isRetryableWhipError('WHIP offer failed: 403')).toBe(false)
    })
  })

  describe('message content based retries', () => {
    it('returns true for "not ready" message', () => {
      expect(isRetryableWhipError('Stream not ready yet')).toBe(true)
    })

    it('returns true for "not found" message', () => {
      expect(isRetryableWhipError('Resource not found')).toBe(true)
    })

    it('returns true for case-insensitive "NOT READY"', () => {
      expect(isRetryableWhipError('NOT READY')).toBe(true)
    })

    it('returns false for undefined message', () => {
      expect(isRetryableWhipError(undefined)).toBe(false)
    })

    it('returns false for empty message', () => {
      expect(isRetryableWhipError('')).toBe(false)
    })

    it('returns false for generic error message', () => {
      expect(isRetryableWhipError('Authentication failed')).toBe(false)
    })
  })
})

describe('Configuration constants', () => {
  describe('WHIP_RETRY_CONFIG', () => {
    it('has MAX_ATTEMPTS of 6', () => {
      expect(WHIP_RETRY_CONFIG.MAX_ATTEMPTS).toBe(6)
    })

    it('has BASE_DELAY_MS of 750', () => {
      expect(WHIP_RETRY_CONFIG.BASE_DELAY_MS).toBe(750)
    })

    it('has MAX_DELAY_MS of 5000', () => {
      expect(WHIP_RETRY_CONFIG.MAX_DELAY_MS).toBe(5000)
    })
  })

  describe('PATCH_CONFIG', () => {
    it('has TIMEOUT_MS of 12000', () => {
      expect(PATCH_CONFIG.TIMEOUT_MS).toBe(12000)
    })

    it('has WARMUP_GRACE_MS of 60000', () => {
      expect(PATCH_CONFIG.WARMUP_GRACE_MS).toBe(60000)
    })

    it('has MAX_FAILURES of 5', () => {
      expect(PATCH_CONFIG.MAX_FAILURES).toBe(5)
    })
  })

  describe('STARTUP_CONFIG', () => {
    it('has ERROR_GRACE_MS of 3000', () => {
      expect(STARTUP_CONFIG.ERROR_GRACE_MS).toBe(3000)
    })
  })
})
