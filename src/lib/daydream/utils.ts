/**
 * Daydream Utility Functions
 *
 * Pure utility functions for error handling and WHIP status parsing.
 * Extracted from use-dream.ts for reusability and testability.
 *
 * @module lib/daydream/utils
 */

/**
 * Extract an error message from various API response formats.
 *
 * Handles multiple response shapes from Daydream/Livepeer APIs:
 * - String responses
 * - { error: string }
 * - { message: string }
 * - { detail: string }
 * - { details: { error/message/detail: string } }
 *
 * @param body - Response body (unknown shape)
 * @returns Extracted error message or null if not found
 */
export function getErrorMessage(body: unknown): string | null {
  if (typeof body === "string") return body
  if (!body || typeof body !== "object") return null
  const record = body as Record<string, unknown>

  if (typeof record.error === "string") return record.error
  if (typeof record.message === "string") return record.message
  if (typeof record.detail === "string") return record.detail

  const details = record.details
  if (typeof details === "string") return details
  if (details && typeof details === "object") {
    const detailsRecord = details as Record<string, unknown>
    if (typeof detailsRecord.error === "string") return detailsRecord.error
    if (typeof detailsRecord.message === "string") return detailsRecord.message
    if (typeof detailsRecord.detail === "string") return detailsRecord.detail
  }

  return null
}

/**
 * Extract HTTP status code from WHIP error message.
 *
 * Parses error messages like "WHIP offer failed: 409" to extract status codes.
 *
 * @param message - Error message string
 * @returns HTTP status code or null if not found
 */
export function getWhipErrorStatus(message?: string): number | null {
  if (!message) return null
  const match = message.match(/WHIP offer failed:\s*(\d{3})/i)
  if (match) {
    const status = Number(match[1])
    if (!Number.isNaN(status)) return status
  }
  return null
}

/**
 * Determine if a WHIP error is retryable.
 *
 * Retryable errors include:
 * - 404: Stream not ready yet
 * - 409: Conflict (stream being created)
 * - 429: Rate limited
 * - 5xx: Server errors
 * - Messages containing "not ready" or "not found"
 *
 * @param message - Error message to check
 * @returns true if the error is retryable
 */
export function isRetryableWhipError(message?: string): boolean {
  const status = getWhipErrorStatus(message)
  if (status) {
    if (status === 404 || status === 409 || status === 429) return true
    if (status >= 500 && status < 600) return true
  }
  const normalized = message?.toLowerCase() || ""
  if (normalized.includes("not ready")) return true
  if (normalized.includes("not found")) return true
  return false
}

/**
 * WHIP retry configuration constants
 */
export const WHIP_RETRY_CONFIG = {
  MAX_ATTEMPTS: 6,
  BASE_DELAY_MS: 750,
  MAX_DELAY_MS: 5000,
} as const

/**
 * PATCH configuration constants
 */
export const PATCH_CONFIG = {
  TIMEOUT_MS: 12000,
  WARMUP_GRACE_MS: 60000,
  MAX_FAILURES: 5,
} as const

/**
 * Startup configuration constants
 */
export const STARTUP_CONFIG = {
  ERROR_GRACE_MS: 3000,
} as const
