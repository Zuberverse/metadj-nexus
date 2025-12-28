/**
 * MetaDJai request and history limits.
 *
 * Centralized to keep validation, rate limiting, and sanitization aligned.
 */

/** Maximum number of messages allowed per request */
export const MAX_MESSAGES_PER_REQUEST = 50;

/** Maximum content length per message (characters) */
export const MAX_MESSAGE_CONTENT_LENGTH = 8000;

/** Maximum number of messages retained in history */
export const MAX_MESSAGE_HISTORY = 12;
