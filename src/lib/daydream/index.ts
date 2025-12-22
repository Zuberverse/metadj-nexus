/**
 * Daydream Library Barrel Export
 *
 * Centralized exports for Daydream StreamDiffusion utilities.
 * Import from '@/lib/daydream' for cleaner imports.
 */

// Config - Prompt and timing configuration
export {
  DREAM_PROMPT_BASE,
  DREAM_PROMPT_DEFAULT_PRESENTATION,
  DREAM_PROMPT_DEFAULT,
  DREAM_NEGATIVE_PROMPT,
  DREAM_COUNTDOWN_SECONDS,
  DREAM_STATUS_POLL_INTERVAL_MS,
  DREAM_STATUS_POLL_MAX_ATTEMPTS,
  DEFAULT_CONTROLNETS,
  DEFAULT_STREAM_PAYLOAD,
  createStreamPayload,
  createPromptUpdatePayload,
  type DynamicStreamParams,
} from './config';

// Schemas - Validation schemas and utilities
export {
  CreateStreamSchema,
  type CreateStreamPayload,
  parseCreateStreamPayload,
  safeParseCreateStreamPayload,
} from './schemas';

// Re-export formatZodError from centralized location (via schemas re-export)
export { formatZodError } from './schemas';

// Stream Limiter - Rate limiting and session management
export {
  DAYDREAM_SESSION_COOKIE_NAME,
  DAYDREAM_SESSION_COOKIE_MAX_AGE,
  getClientIdentifier,
  generateSessionId,
  checkStreamCreation,
  registerStream,
  endStream,
  getActiveStream,
  buildStreamLimitResponse,
  clearAllStreams,
} from './stream-limiter';

// Utilities - Pure helper functions for error handling and WHIP
export {
  getErrorMessage,
  getWhipErrorStatus,
  isRetryableWhipError,
  WHIP_RETRY_CONFIG,
  PATCH_CONFIG,
  STARTUP_CONFIG,
} from './utils';
