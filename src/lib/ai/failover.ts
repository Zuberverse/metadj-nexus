/**
 * AI Provider Failover System
 *
 * Implements automatic failover between AI providers using priority order (GPT -> Gemini -> Claude -> Grok -> Kimi).
 * Integrates with circuit breaker for intelligent provider selection.
 *
 * Features:
 * - Automatic failover on provider errors
 * - Circuit breaker integration for fast failure detection
 * - Configurable retry behavior
 * - Detailed logging for debugging and monitoring
 *
 * @module lib/ai/failover
 */

import { logger } from '@/lib/logger'
import {
  isCircuitOpen,
  isProviderError,
  recordFailure,
  recordSuccess,
} from './circuit-breaker'

/**
 * Options for failover execution
 */
export interface FailoverOptions {
  /** Maximum retries on the fallback provider (default: 1) */
  maxRetries?: number
  /** Timeout in ms for each attempt (default: 30000) */
  timeout?: number
  /** Whether failover is enabled (default: true) */
  enabled?: boolean
}

/**
 * Result of a failover execution
 */
export interface FailoverResult<T> {
  /** The result data if successful */
  result: T
  /** Which provider succeeded */
  provider: 'primary' | 'fallback'
  /** Whether failover was triggered */
  usedFallback: boolean
  /** Duration in ms */
  durationMs: number
}

/**
 * Check if failover is enabled via environment
 *
 * @returns true if failover should be attempted
 */
export function isFailoverEnabled(): boolean {
  const env = process.env.AI_FAILOVER_ENABLED
  // Default to true if not explicitly disabled
  return env !== 'false' && env !== '0'
}

/**
 * Execute a function with automatic failover
 *
 * Attempts the primary function first. If it fails with a provider error,
 * automatically falls back to the fallback function.
 *
 * @param primaryFn - Primary provider function
 * @param fallbackFn - Fallback provider function
 * @param primaryProvider - Primary provider name for logging
 * @param fallbackProvider - Fallback provider name for logging
 * @param options - Failover options
 * @returns Result with metadata about which provider was used
 *
 * @example
 * ```typescript
 * const result = await executeWithFailover(
 *   () => streamWithOpenAI(messages),
 *   () => streamWithAnthropic(messages),
 *   'openai',
 *   'anthropic'
 * );
 * ```
 */
export async function executeWithFailover<T>(
  primaryFn: () => Promise<T>,
  fallbackFn: () => Promise<T>,
  primaryProvider: string = 'openai',
  fallbackProvider: string = 'anthropic',
  options: FailoverOptions = {}
): Promise<FailoverResult<T>> {
  const { maxRetries = 1, enabled = isFailoverEnabled() } = options
  const startTime = Date.now()

  // Check if primary circuit is open
  const primaryCircuitOpen = isCircuitOpen(primaryProvider)

  // If failover disabled or primary circuit open, go straight to fallback
  if (primaryCircuitOpen && enabled) {
    logger.info(`Primary provider ${primaryProvider} circuit open, using fallback`, {
      primaryProvider,
      fallbackProvider,
    })

    return executeWithRetry(
      fallbackFn,
      fallbackProvider,
      maxRetries,
      startTime,
      true
    )
  }

  // Try primary first
  try {
    const result = await primaryFn()
    recordSuccess(primaryProvider)

    return {
      result,
      provider: 'primary',
      usedFallback: false,
      durationMs: Date.now() - startTime,
    }
  } catch (primaryError) {
    const errorMessage = primaryError instanceof Error ? primaryError.message : String(primaryError)
    const isPrimaryProviderError = isProviderError(primaryError)

    // Log the primary failure
    logger.warn(`Primary provider ${primaryProvider} failed`, {
      provider: primaryProvider,
      error: errorMessage,
      isProviderError: isPrimaryProviderError,
      failoverEnabled: enabled,
    })

    // Record failure if it's a provider error
    if (isPrimaryProviderError) {
      recordFailure(primaryProvider, errorMessage)
    }

    // If failover is disabled, throw the original error
    if (!enabled) {
      throw primaryError
    }

    // If it's not a provider error (e.g., validation error), don't retry
    if (!isPrimaryProviderError) {
      throw primaryError
    }

    // Check if fallback is available
    const fallbackCircuitOpen = isCircuitOpen(fallbackProvider)
    if (fallbackCircuitOpen) {
      logger.error('Both providers have open circuits', {
        primaryProvider,
        fallbackProvider,
      })
      throw new Error('All AI providers are currently unavailable. Please try again later.')
    }

    // Try fallback
    logger.info(`Attempting failover to ${fallbackProvider}`, {
      primaryProvider,
      fallbackProvider,
      primaryError: errorMessage,
    })

    return executeWithRetry(
      fallbackFn,
      fallbackProvider,
      maxRetries,
      startTime,
      true
    )
  }
}

/**
 * Execute a function with retry logic
 *
 * @param fn - Function to execute
 * @param provider - Provider name for logging/circuit breaker
 * @param maxRetries - Maximum retry attempts
 * @param startTime - Original start time for duration calculation
 * @param usedFallback - Whether this is a fallback execution
 */
async function executeWithRetry<T>(
  fn: () => Promise<T>,
  provider: string,
  maxRetries: number,
  startTime: number,
  usedFallback: boolean
): Promise<FailoverResult<T>> {
  let lastError: unknown

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn()
      recordSuccess(provider)

      return {
        result,
        provider: usedFallback ? 'fallback' : 'primary',
        usedFallback,
        durationMs: Date.now() - startTime,
      }
    } catch (error) {
      lastError = error
      const errorMessage = error instanceof Error ? error.message : String(error)

      if (isProviderError(error)) {
        recordFailure(provider, errorMessage)
      }

      if (attempt < maxRetries) {
        logger.info(`Retry attempt ${attempt + 1}/${maxRetries} for ${provider}`, {
          provider,
          attempt: attempt + 1,
          maxRetries,
          error: errorMessage,
        })
        // Exponential backoff: 1s, 2s, 4s...
        await sleep(Math.pow(2, attempt) * 1000)
      }
    }
  }

  // All retries exhausted
  throw lastError
}

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Determine which provider to use based on circuit states
 *
 * Returns the healthiest available provider based on fallback priority.
 *
 * @param preferredProvider - Preferred provider if healthy
 * @returns Provider to use ('openai' | 'anthropic' | 'google' | 'xai') or null if unhealthy
 */
type AIProvider = 'openai' | 'anthropic' | 'google' | 'xai' | 'moonshotai'

export function selectHealthyProvider(
  preferredProvider: AIProvider = 'openai'
): AIProvider | null {
  const preferredOpen = isCircuitOpen(preferredProvider)
  const priority: AIProvider[] = ['openai', 'google', 'anthropic', 'xai', 'moonshotai']

  // Preferred is healthy
  if (!preferredOpen) {
    return preferredProvider
  }

  // Fallback to next healthy provider in priority order
  for (const candidate of priority) {
    if (candidate === preferredProvider) continue
    if (!isCircuitOpen(candidate)) {
      logger.info(`Using ${candidate} as fallback (${preferredProvider} circuit open)`)
      return candidate
    }
  }

  // Both unhealthy
  return null
}
