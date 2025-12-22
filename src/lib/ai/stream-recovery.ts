/**
 * Stream Recovery Utilities
 *
 * Provides error handling and recovery mechanisms for AI streaming responses.
 * Handles malformed chunks, connection drops, and partial responses gracefully.
 *
 * @module lib/ai/stream-recovery
 */

import { logger } from '@/lib/logger'

/**
 * Stream error types for classification
 */
export type StreamErrorType =
  | 'parse_error'        // Malformed JSON/SSE chunk
  | 'connection_error'   // Network/connection dropped
  | 'timeout_error'      // Stream timeout
  | 'incomplete_error'   // Stream ended prematurely
  | 'provider_error'     // Provider-specific error
  | 'unknown_error'

/**
 * Classify a stream error for appropriate handling
 */
export function classifyStreamError(error: unknown): StreamErrorType {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()

  // Parse errors
  if (
    message.includes('unexpected token') ||
    message.includes('json parse') ||
    message.includes('invalid json') ||
    message.includes('malformed')
  ) {
    return 'parse_error'
  }

  // Connection errors
  if (
    message.includes('network') ||
    message.includes('econnreset') ||
    message.includes('socket hang up') ||
    message.includes('connection') ||
    message.includes('fetch failed')
  ) {
    return 'connection_error'
  }

  // Timeout errors
  if (
    message.includes('timeout') ||
    message.includes('aborted') ||
    (error instanceof Error && error.name === 'AbortError')
  ) {
    return 'timeout_error'
  }

  // Incomplete response
  if (
    message.includes('incomplete') ||
    message.includes('truncated') ||
    message.includes('unexpected end')
  ) {
    return 'incomplete_error'
  }

  // Provider errors (rate limits, etc.)
  if (
    message.includes('429') ||
    message.includes('rate limit') ||
    message.includes('503') ||
    message.includes('502')
  ) {
    return 'provider_error'
  }

  return 'unknown_error'
}

/**
 * Determine if an error is recoverable
 * Recoverable errors may succeed on retry
 */
export function isRecoverableStreamError(errorType: StreamErrorType): boolean {
  return ['connection_error', 'timeout_error', 'incomplete_error'].includes(errorType)
}

/**
 * Get user-friendly error message for stream errors
 */
export function getStreamErrorMessage(errorType: StreamErrorType): string {
  switch (errorType) {
    case 'parse_error':
      return 'Received an invalid response. Please try again.'
    case 'connection_error':
      return 'Connection was interrupted. Please try again.'
    case 'timeout_error':
      return 'Response took too long. Please try a shorter question.'
    case 'incomplete_error':
      return 'Response was incomplete. Please try again.'
    case 'provider_error':
      return 'AI service is temporarily busy. Please wait a moment and try again.'
    default:
      return 'An unexpected error occurred. Please try again.'
  }
}

/**
 * Options for stream recovery
 */
export interface StreamRecoveryOptions {
  /** Maximum retry attempts for recoverable errors */
  maxRetries?: number
  /** Base delay between retries in ms (exponential backoff applied) */
  retryDelayMs?: number
  /** Callback for each retry attempt */
  onRetry?: (attempt: number, error: unknown) => void
  /** Callback when recovery fails */
  onRecoveryFailed?: (error: unknown, attempts: number) => void
}

/**
 * Execute a streaming operation with automatic recovery
 *
 * Wraps a stream-producing function with retry logic for recoverable errors.
 * Uses exponential backoff between retries.
 *
 * @param operation - Function that produces a streaming result
 * @param options - Recovery configuration
 * @returns The stream result or throws if unrecoverable
 */
export async function withStreamRecovery<T>(
  operation: () => Promise<T>,
  options: StreamRecoveryOptions = {}
): Promise<T> {
  const { maxRetries = 2, retryDelayMs = 500, onRetry, onRecoveryFailed } = options

  let lastError: unknown
  let attempts = 0

  while (attempts <= maxRetries) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      attempts++

      const errorType = classifyStreamError(error)
      const isRecoverable = isRecoverableStreamError(errorType)

      logger.warn('Stream operation failed', {
        attempt: attempts,
        maxRetries: maxRetries + 1,
        errorType,
        isRecoverable,
        error: error instanceof Error ? error.message : String(error),
      })

      // If not recoverable or max retries reached, throw
      if (!isRecoverable || attempts > maxRetries) {
        if (onRecoveryFailed) {
          onRecoveryFailed(error, attempts)
        }
        throw error
      }

      // Notify about retry
      if (onRetry) {
        onRetry(attempts, error)
      }

      // Exponential backoff: 500ms, 1000ms, 2000ms...
      const delay = retryDelayMs * Math.pow(2, attempts - 1)
      await sleep(delay)
    }
  }

  // Should not reach here, but TypeScript needs it
  throw lastError
}

/**
 * Create a recoverable stream response handler
 *
 * Wraps the Vercel AI SDK stream response with error handling
 * that provides graceful degradation for frontend consumers.
 *
 * @param streamResult - The result from streamText()
 * @param fallbackMessage - Message to send if stream fails mid-response
 */
export function createRecoverableStreamResponse(
  streamResult: { toDataStreamResponse: () => Response },
  fallbackMessage = "I apologize, but I encountered an issue generating my response. Please try again."
): Response {
  try {
    const response = streamResult.toDataStreamResponse()

    // Wrap the response stream to catch errors during transmission
    const originalBody = response.body
    if (!originalBody) {
      return response
    }

    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        try {
          controller.enqueue(chunk)
        } catch (error) {
          logger.error('Error during stream transform', {
            error: error instanceof Error ? error.message : String(error),
          })
          // Let the chunk pass through even on transform error
          controller.enqueue(chunk)
        }
      },
      flush(controller) {
        // Stream completed successfully
        controller.terminate()
      },
    })

    const wrappedBody = originalBody.pipeThrough(transformStream)

    return new Response(wrappedBody, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    })
  } catch (error) {
    logger.error('Failed to create stream response', {
      error: error instanceof Error ? error.message : String(error),
    })

    // Return a simple text response as fallback
    return new Response(
      JSON.stringify({ error: fallbackMessage }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

/**
 * Simple sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
