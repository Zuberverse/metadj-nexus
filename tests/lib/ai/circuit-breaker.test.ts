/**
 * Circuit Breaker Tests
 *
 * Tests the circuit breaker pattern implementation for AI provider health management.
 * Validates state machine transitions: closed → open → half-open → closed
 *
 * @module tests/lib/ai/circuit-breaker
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
  getCircuitState,
  getProviderHealth,
  isCircuitOpen,
  isProviderError,
  recordFailure,
  recordSuccess,
  resetAllCircuits,
} from '@/lib/ai/circuit-breaker'

describe('Circuit Breaker', () => {
  beforeEach(() => {
    // Reset all circuits before each test
    resetAllCircuits()
    vi.clearAllMocks()
  })

  afterEach(() => {
    resetAllCircuits()
  })

  describe('isCircuitOpen', () => {
    it('returns false for unknown providers (no state)', () => {
      expect(isCircuitOpen('unknown-provider')).toBe(false)
    })

    it('returns false when circuit is closed (healthy)', () => {
      recordSuccess('openai')
      expect(isCircuitOpen('openai')).toBe(false)
    })

    it('returns true when circuit is open (unhealthy)', () => {
      // Record enough failures to open the circuit (threshold is 3)
      recordFailure('openai', 'error 1')
      recordFailure('openai', 'error 2')
      recordFailure('openai', 'error 3')

      expect(isCircuitOpen('openai')).toBe(true)
    })

    it('transitions to half-open after recovery time', async () => {
      // Open the circuit
      recordFailure('anthropic')
      recordFailure('anthropic')
      recordFailure('anthropic')
      expect(isCircuitOpen('anthropic')).toBe(true)

      // Mock Date.now to simulate time passing (recovery time is 60s)
      const originalNow = Date.now
      const futureTime = originalNow() + 61_000 // 61 seconds later
      vi.spyOn(Date, 'now').mockReturnValue(futureTime)

      // Should now be half-open (allows requests through)
      expect(isCircuitOpen('anthropic')).toBe(false)

      // Verify state is half-open
      const state = getCircuitState('anthropic')
      expect(state?.state).toBe('half-open')

      // Restore Date.now
      vi.spyOn(Date, 'now').mockRestore()
    })
  })

  describe('recordFailure', () => {
    it('increments failure count', () => {
      recordFailure('google', 'test error')

      const state = getCircuitState('google')
      expect(state?.failures).toBe(1)
      expect(state?.totalFailures).toBe(1)
      expect(state?.state).toBe('closed')
    })

    it('opens circuit after reaching threshold (3 failures)', () => {
      recordFailure('xai')
      recordFailure('xai')

      let state = getCircuitState('xai')
      expect(state?.state).toBe('closed')
      expect(state?.failures).toBe(2)

      recordFailure('xai') // Third failure triggers opening

      state = getCircuitState('xai')
      expect(state?.state).toBe('open')
      expect(state?.failures).toBe(3)
      expect(state?.isOpen).toBe(true)
    })

    it('re-opens circuit when half-open state fails', async () => {
      // Open the circuit
      recordFailure('openai')
      recordFailure('openai')
      recordFailure('openai')

      // Simulate time passing to get to half-open
      const originalNow = Date.now
      vi.spyOn(Date, 'now').mockReturnValue(originalNow() + 61_000)

      // Trigger half-open by checking
      isCircuitOpen('openai') // Transitions to half-open

      // Now record a failure during half-open
      recordFailure('openai', 'recovery test failed')

      const state = getCircuitState('openai')
      expect(state?.state).toBe('open')

      vi.spyOn(Date, 'now').mockRestore()
    })
  })

  describe('recordSuccess', () => {
    it('closes circuit after success', () => {
      // First create some failures
      recordFailure('anthropic')
      recordFailure('anthropic')

      // Then record success
      recordSuccess('anthropic')

      const state = getCircuitState('anthropic')
      expect(state?.state).toBe('closed')
      expect(state?.failures).toBe(0)
      expect(state?.isOpen).toBe(false)
    })

    it('tracks lastSuccess timestamp', () => {
      const beforeTime = Date.now()
      recordSuccess('google')
      const afterTime = Date.now()

      const state = getCircuitState('google')
      expect(state?.lastSuccess).toBeGreaterThanOrEqual(beforeTime)
      expect(state?.lastSuccess).toBeLessThanOrEqual(afterTime)
    })

    it('resets from open state to closed on success', () => {
      // Open the circuit
      recordFailure('xai')
      recordFailure('xai')
      recordFailure('xai')

      expect(getCircuitState('xai')?.state).toBe('open')

      // Success should close it
      recordSuccess('xai')

      expect(getCircuitState('xai')?.state).toBe('closed')
      expect(getCircuitState('xai')?.failures).toBe(0)
    })
  })

  describe('getProviderHealth', () => {
    it('returns health status for all providers', () => {
      const health = getProviderHealth()

      expect(health).toHaveProperty('openai')
      expect(health).toHaveProperty('anthropic')
      expect(health).toHaveProperty('google')
      expect(health).toHaveProperty('xai')
    })

    it('shows healthy status for providers with no state', () => {
      const health = getProviderHealth()

      expect(health.openai.healthy).toBe(true)
      expect(health.openai.state).toBe('closed')
      expect(health.openai.failures).toBe(0)
    })

    it('shows unhealthy status for providers with open circuit', () => {
      recordFailure('openai')
      recordFailure('openai')
      recordFailure('openai')

      const health = getProviderHealth()

      expect(health.openai.healthy).toBe(false)
      expect(health.openai.state).toBe('open')
      expect(health.openai.failures).toBe(3)
    })

    it('tracks totalFailures across resets', () => {
      recordFailure('anthropic')
      recordSuccess('anthropic')
      recordFailure('anthropic')
      recordSuccess('anthropic')

      const health = getProviderHealth()

      // totalFailures persists even after success resets
      expect(health.anthropic.totalFailures).toBe(2)
      expect(health.anthropic.failures).toBe(0)
    })
  })

  describe('isProviderError', () => {
    it('identifies network errors', () => {
      expect(isProviderError(new Error('Network request failed'))).toBe(true)
      expect(isProviderError(new Error('ECONNREFUSED'))).toBe(true)
      expect(isProviderError(new Error('ETIMEDOUT'))).toBe(true)
      expect(isProviderError(new Error('socket hang up'))).toBe(true)
    })

    it('identifies rate limit errors', () => {
      expect(isProviderError(new Error('Rate limit exceeded'))).toBe(true)
      expect(isProviderError(new Error('429 Too Many Requests'))).toBe(true)
    })

    it('identifies service unavailable errors', () => {
      expect(isProviderError(new Error('503 Service Unavailable'))).toBe(true)
      expect(isProviderError(new Error('502 Bad Gateway'))).toBe(true)
      expect(isProviderError(new Error('Service overloaded'))).toBe(true)
    })

    it('identifies model errors', () => {
      expect(isProviderError(new Error('Model not found'))).toBe(true)
      expect(isProviderError(new Error('Unknown model gpt-5'))).toBe(true)
      expect(isProviderError(new Error('Invalid model specified'))).toBe(true)
    })

    it('does not flag client errors as provider errors', () => {
      // These should NOT trigger circuit breaker
      expect(isProviderError(new Error('Invalid API key'))).toBe(false)
      expect(isProviderError(new Error('Bad request'))).toBe(false)
      expect(isProviderError(new Error('Content policy violation'))).toBe(false)
    })

    it('handles non-Error inputs', () => {
      expect(isProviderError('timeout error')).toBe(true)
      expect(isProviderError('some random error')).toBe(false)
      expect(isProviderError(null)).toBe(false)
    })
  })

  describe('resetAllCircuits', () => {
    it('clears all circuit states', () => {
      recordFailure('openai')
      recordFailure('anthropic')
      recordFailure('google')

      resetAllCircuits()

      expect(getCircuitState('openai')).toBeUndefined()
      expect(getCircuitState('anthropic')).toBeUndefined()
      expect(getCircuitState('google')).toBeUndefined()
    })
  })
})
