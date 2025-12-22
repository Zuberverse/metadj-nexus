import { NextRequest, NextResponse } from "next/server"
import wisdomData from "@/data/wisdom-content.json"

export const revalidate = 3600

// ============================================================================
// Simple Rate Limiting for Static Content
// ============================================================================

/**
 * Rate limiting configuration for wisdom endpoint
 * - More permissive than MetaDJai since this serves static, cached content
 * - 60 requests per minute per client (1 per second average)
 */
const WISDOM_RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minute
const WISDOM_MAX_REQUESTS_PER_WINDOW = 60

interface RateLimitRecord {
  count: number
  resetAt: number
}

// In-memory rate limiting (acceptable for static content endpoint)
const rateLimitMap = new Map<string, RateLimitRecord>()

/**
 * Get client identifier from request headers
 * Uses IP-based identification for anonymous static content requests
 */
function getClientId(request: NextRequest): string {
  // Try standard proxy headers first
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return `wisdom-${forwarded.split(',')[0].trim()}`
  }

  // Fall back to real IP header
  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return `wisdom-${realIp}`
  }

  // Last resort: use a hash of user-agent + accept-language
  const ua = request.headers.get('user-agent') || 'unknown'
  const lang = request.headers.get('accept-language') || 'unknown'
  return `wisdom-anon-${Buffer.from(`${ua}|${lang}`).toString('base64').slice(0, 16)}`
}

/**
 * Check if client is rate limited
 */
function isRateLimited(clientId: string): { limited: boolean; retryAfter?: number } {
  const now = Date.now()
  let record = rateLimitMap.get(clientId)

  // Clean up expired records periodically
  if (rateLimitMap.size > 1000) {
    for (const [key, rec] of rateLimitMap.entries()) {
      if (rec.resetAt <= now) {
        rateLimitMap.delete(key)
      }
    }
  }

  // Initialize or reset if expired
  if (!record || now >= record.resetAt) {
    rateLimitMap.set(clientId, { count: 1, resetAt: now + WISDOM_RATE_LIMIT_WINDOW_MS })
    return { limited: false }
  }

  // Check limit
  if (record.count >= WISDOM_MAX_REQUESTS_PER_WINDOW) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000)
    return { limited: true, retryAfter }
  }

  // Increment counter
  record.count++
  return { limited: false }
}

// ============================================================================
// Route Handler
// ============================================================================

/**
 * Returns wisdom content data with appropriate caching headers and rate limiting.
 *
 * Rate Limiting:
 * - 60 requests per minute per client
 * - Returns 429 Too Many Requests when exceeded
 *
 * Caching Strategy:
 * - max-age=3600: Content cached for 1 hour
 * - stale-while-revalidate=86400: Serve stale content for up to 24 hours while revalidating
 *
 * This reduces server load for static wisdom content while ensuring freshness
 * and protecting against potential abuse.
 *
 * @route GET /api/wisdom
 * @returns Wisdom content JSON
 * @throws {429} Rate limit exceeded
 */
/**
 * Standard CORS headers for wisdom endpoint
 * Allows cross-origin requests from any origin (public static content)
 */
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
  'Access-Control-Max-Age': '86400', // Cache preflight for 24 hours
}

/**
 * Handle CORS preflight requests
 * Required for browsers making cross-origin requests
 *
 * @route OPTIONS /api/wisdom
 * @returns 204 No Content with CORS headers
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  })
}

export async function GET(request: NextRequest) {
  // Rate limiting check
  const clientId = getClientId(request)
  const { limited, retryAfter } = isRateLimited(clientId)

  if (limited) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again later.' },
      {
        status: 429,
        headers: {
          ...CORS_HEADERS,
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(WISDOM_MAX_REQUESTS_PER_WINDOW),
          'X-RateLimit-Reset': String(retryAfter),
        },
      }
    )
  }

  return NextResponse.json(wisdomData, {
    headers: {
      ...CORS_HEADERS,
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      'Content-Type': 'application/json',
    },
  })
}

