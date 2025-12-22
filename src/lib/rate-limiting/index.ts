/**
 * Rate Limiting Module
 *
 * Unified rate limiting infrastructure for MetaDJ Nexus.
 * Provides shared utilities and domain-specific limiters.
 *
 * ## Architecture
 *
 * - **Shared Utilities** (`./client-identifier.ts`)
 *   - Client fingerprinting and session ID generation
 *   - Used across all rate limiting domains
 *
 * - **Domain-Specific Limiters**
 *   - MetaDJai: `@/lib/ai/rate-limiter` (chat + transcription)
 *   - Daydream: `@/lib/daydream/stream-limiter` (stream creation)
 *
 * ## Storage Backends
 *
 * - **In-Memory**: Default for single-instance deployments (Replit)
 * - **Upstash Redis**: Distributed mode for multi-instance (Vercel, AWS)
 *
 * @module lib/rate-limiting
 */

// Shared client identification utilities
export {
  getClientIdentifier,
  generateSessionId,
  isFingerprint,
  type ClientIdentifier,
} from './client-identifier'
