/**
 * Client Identifier Utility
 *
 * Shared utility for generating consistent client identifiers across rate limiting domains.
 * Used by both MetaDJai rate limiting and Daydream stream limiting.
 *
 * @module lib/rate-limiting/client-identifier
 */

import { createHash } from 'crypto'
import type { NextRequest } from 'next/server'

/**
 * Client Identifier Result
 */
export interface ClientIdentifier {
  id: string
  isFingerprint: boolean
}

/**
 * High-entropy header sources for fingerprinting
 * Ordered by reliability and cross-browser availability
 */
const FINGERPRINT_HEADERS = [
  // Core headers (standard across browsers)
  'user-agent',
  'accept-language',
  'accept-encoding',
  'accept',
  // Client Hints (Chrome/Edge - higher entropy)
  'sec-ch-ua',
  'sec-ch-ua-platform',
  'sec-ch-ua-mobile',
  'sec-ch-ua-arch',
  'sec-ch-ua-model',
  // Connection/network hints
  'connection',
  'dnt',
  'upgrade-insecure-requests',
] as const

/**
 * Get client identifier from request
 *
 * Priority:
 * 1. Session cookie (ensures per-device isolation)
 * 2. High-entropy fingerprint from request headers (for first-time users)
 *
 * Uses SHA-256 hashing for better entropy distribution and collision resistance.
 * Fingerprint includes 12+ header sources for improved uniqueness.
 *
 * @param request - NextRequest object
 * @param cookieName - Name of the session cookie to check
 * @param fingerprintPrefix - Prefix for fingerprint-based IDs (default: 'fp')
 * @returns Client identifier with fingerprint flag
 */
export function getClientIdentifier(
  request: NextRequest,
  cookieName: string,
  fingerprintPrefix = 'fp'
): ClientIdentifier {
  // Priority 1: Check for session cookie
  const sessionId = request.cookies.get(cookieName)?.value
  if (sessionId) {
    return { id: sessionId, isFingerprint: false }
  }

  // Priority 2: Generate high-entropy fingerprint from request headers
  const headerValues = FINGERPRINT_HEADERS.map(
    (header) => request.headers.get(header) || ''
  )

  const fingerprint = headerValues.join('|')

  // Use SHA-256 for proper hashing (better collision resistance than base64)
  const hash = createHash('sha256').update(fingerprint).digest('hex').slice(0, 32)

  return { id: `${fingerprintPrefix}-${hash}`, isFingerprint: true }
}

/**
 * Generate a new session ID with a given prefix
 *
 * @param prefix - Prefix for the session ID (e.g., 'session', 'daydream')
 * @returns Unique session ID string
 */
export function generateSessionId(prefix = 'session'): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? `${prefix}-${crypto.randomUUID()}`
    : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

/**
 * Check if an identifier is fingerprint-based
 *
 * @param identifier - The identifier to check
 * @param prefix - Expected fingerprint prefix (default: 'fp')
 * @returns true if the identifier is fingerprint-based
 */
export function isFingerprint(identifier: string, prefix = 'fp'): boolean {
  return identifier.startsWith(`${prefix}-`)
}
