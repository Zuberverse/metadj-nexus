/**
 * MetaDJai Hooks Domain
 *
 * Hooks for AI companion integration, messaging, rate limiting, and streaming.
 */

export { useMetaDjAi } from "./use-metadjai"
export { useMetaDjAiMessages, createMessageId } from "./use-metadjai-messages"
export { useMetaDjAiRateLimit } from "./use-metadjai-rate-limit"
// Stream utilities (not hooks) - import directly if needed:
// processVercelAIBuffer, handleVercelAIChunk, readStream from "./use-metadjai-stream"
