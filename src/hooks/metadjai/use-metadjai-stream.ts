"use client"

/**
 * MetaDJai Stream Processing
 *
 * Extracted from use-metadjai to handle Vercel AI SDK streaming:
 * - Stream buffer processing
 * - Chunk parsing (text, error, tool calls)
 * - Multiple stream format support (SSE UI Message Stream, Data Stream, Plain Text)
 */

import { logger } from '@/lib/logger'
import type { MetaDjAiMessage } from '@/types/metadjai'

export type StreamHandler = (chunk: string) => void
export type StatusHandler = (status: MetaDjAiMessage['status']) => void
export type ErrorHandler = (error: string) => void
export type ToolCallHandler = (toolName: string) => void
export type ToolResultHandler = (toolName: string, result: unknown) => void

/**
 * Process Vercel AI SDK stream buffer
 *
 * Supports multiple formats:
 * - SSE UI Message Stream (AI SDK 5.x): "data: {json}" lines
 * - Data Stream Protocol (AI SDK 4.x): "0:{json}", "e:{json}", etc.
 * - Plain text streams
 *
 * @param buffer - Accumulated stream buffer
 * @param onDelta - Handler for text content chunks
 * @param onStatus - Handler for status changes
 * @param onError - Optional handler for errors
 * @param flush - Whether to process remaining buffer content
 * @param onToolCall - Optional handler for tool calls (shows which tool is being used)
 * @returns Remaining unprocessed buffer content
 */
export function processVercelAIBuffer(
  buffer: string,
  onDelta: StreamHandler,
  onStatus: StatusHandler,
  onError?: ErrorHandler,
  flush = false,
  onToolCall?: ToolCallHandler,
  onToolResult?: ToolResultHandler
): string {
  let workingBuffer = buffer
  let newlineIndex = workingBuffer.indexOf('\n')

  // Process complete lines
  while (newlineIndex !== -1) {
    const line = workingBuffer.slice(0, newlineIndex).trim()
    workingBuffer = workingBuffer.slice(newlineIndex + 1)
    if (line) {
      handleVercelAIChunk(line, onDelta, onStatus, onError, onToolCall, onToolResult)
    }
    newlineIndex = workingBuffer.indexOf('\n')
  }

  // Process remaining content if flushing
  if (flush && workingBuffer.trim()) {
    handleVercelAIChunk(workingBuffer.trim(), onDelta, onStatus, onError, onToolCall, onToolResult)
    workingBuffer = ''
  }

  return workingBuffer
}

/**
 * Known MetaDJai tool names for filtering raw tool call output
 *
 * Some providers (notably Gemini) may output tool calls as plain JSON text
 * with format: {"action": "toolName", ...args}
 * We detect and filter these to prevent raw JSON appearing in chat.
 */
const KNOWN_TOOL_NAMES = new Set([
  'searchCatalog',
  'getPlatformHelp',
  'getWisdomContent',
  'getRecommendations',
  'getZuberantContext',
  'proposePlayback',
  'proposeQueueSet',
  'proposePlaylist',
  'proposeSurface',
  'web_search',
])

/**
 * Patterns that indicate partial tool call JSON (line-by-line streaming)
 * Gemini streams JSON objects line by line, so we need to detect each line.
 */
const TOOL_CALL_LINE_PATTERNS = [
  // Opening/closing braces (standalone or with whitespace)
  /^\s*\{\s*$/,
  /^\s*\}\s*$/,
  // "action" field with any known tool name
  /"action"\s*:\s*"(searchCatalog|getPlatformHelp|getWisdomContent|getRecommendations|getZuberantContext|proposePlayback|proposeQueueSet|proposePlaylist|proposeSurface|web_search)"/,
  // "toolName" field with any known tool name
  /"toolName"\s*:\s*"(searchCatalog|getPlatformHelp|getWisdomContent|getRecommendations|getZuberantContext|proposePlayback|proposeQueueSet|proposePlaylist|proposeSurface|web_search)"/,
  // Common tool parameter patterns (query, topic, feature, mood, etc.)
  /^\s*"(query|topic|feature|mood|energyLevel|similarTo|collection|limit|section|id|action|searchQuery|context|trackIds|trackTitles|name|queueMode|autoplay|tab|type)"\s*:/,
]

/**
 * Track tool call JSON accumulation state (for multi-line detection)
 * When we detect the start of a tool call JSON, we track it until complete.
 */
let toolCallJsonBuffer = ''
let isAccumulatingToolCall = false

/**
 * Detect if a string looks like a raw tool call that should be filtered
 *
 * Handles multiple cases:
 * 1. Complete JSON object: {"action": "toolName", ...}
 * 2. Multi-line JSON with newlines: {\n  "action": "toolName",\n  ...}
 * 3. Partial JSON lines streamed separately (Gemini behavior)
 *
 * We filter these out to prevent raw JSON appearing in the chat UI.
 */
function isRawToolCallJson(text: string): boolean {
  const trimmed = text.trim()
  if (!trimmed) return false

  // Case 1: Complete or multi-line JSON object (may contain newlines)
  // Check if it starts with { and ends with } (allowing for newlines in between)
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed)
      // Check for action field matching known tool names
      if (typeof parsed.action === 'string' && KNOWN_TOOL_NAMES.has(parsed.action)) {
        return true
      }
      // Check for toolName field (alternative format)
      if (typeof parsed.toolName === 'string' && KNOWN_TOOL_NAMES.has(parsed.toolName)) {
        return true
      }
      // Check for name field
      if (typeof parsed.name === 'string' && KNOWN_TOOL_NAMES.has(parsed.name)) {
        return true
      }
    } catch {
      // Not valid JSON, continue to line pattern check
    }
  }

  // Case 2: Multi-line string containing tool call patterns (Gemini sends full JSON with newlines)
  // Check if the text contains an "action" field with a known tool name
  for (const toolName of KNOWN_TOOL_NAMES) {
    if (trimmed.includes(`"action"`) && trimmed.includes(`"${toolName}"`)) {
      return true
    }
  }

  // Case 2: Partial JSON line patterns (Gemini streams line by line)
  for (const pattern of TOOL_CALL_LINE_PATTERNS) {
    if (pattern.test(trimmed)) {
      return true
    }
  }

  // Case 3: Track multi-line accumulation
  // If we're in the middle of accumulating a tool call JSON
  if (isAccumulatingToolCall) {
    toolCallJsonBuffer += trimmed
    // Check if we've completed the JSON
    if (trimmed === '}' || trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(toolCallJsonBuffer)
        if (parsed.action && KNOWN_TOOL_NAMES.has(parsed.action)) {
          // Reset state
          toolCallJsonBuffer = ''
          isAccumulatingToolCall = false
          return true
        }
      } catch {
        // Not complete yet or invalid
      }
    }
    return true // Still accumulating, filter this line
  }

  // Check if this line starts a tool call JSON
  if (trimmed === '{') {
    isAccumulatingToolCall = true
    toolCallJsonBuffer = '{'
    return true
  }

  return false
}

/**
 * Reset tool call accumulation state
 * Call this when a message is complete to prevent state leakage
 */
export function resetToolCallAccumulator(): void {
  toolCallJsonBuffer = ''
  isAccumulatingToolCall = false
}

/**
 * Handle individual Vercel AI SDK stream chunk
 *
 * Supports:
 * - SSE format: "data: {json}" (AI SDK 5.x toUIMessageStreamResponse)
 * - Data stream format: "0:{json}", "e:{json}", etc. (AI SDK 4.x)
 * - Plain text streams
 * - Filters raw tool call JSON (Gemini compatibility)
 *
 * @param line - Single line from the stream
 * @param onDelta - Handler for text content
 * @param onStatus - Handler for status changes
 * @param onError - Optional handler for errors
 * @param onToolCall - Optional handler for tool calls
 */
export function handleVercelAIChunk(
  line: string,
  onDelta: StreamHandler,
  onStatus: StatusHandler,
  onError?: ErrorHandler,
  onToolCall?: ToolCallHandler,
  onToolResult?: ToolResultHandler
): void {
  try {
    // ============================================
    // SSE UI Message Stream format (AI SDK 5.x)
    // Format: "data: {json}" or "data: [DONE]"
    // ============================================
    if (line.startsWith('data:')) {
      const jsonString = line.slice(5).trim() // Remove "data:" prefix

      // Handle stream completion marker
      if (jsonString === '[DONE]') {
        onStatus('complete')
        return
      }

      // Parse JSON event
      const data = JSON.parse(jsonString)

      // Handle text delta events
      if (data.type === 'text-delta') {
        if (typeof data.delta === 'string') {
          // Filter raw tool call JSON from text deltas (Gemini compatibility)
          if (isRawToolCallJson(data.delta)) {
            if (onToolCall) {
              try {
                const parsed = JSON.parse(data.delta.trim())
                const toolName = parsed.action || parsed.toolName || parsed.name
                if (toolName) {
                  onToolCall(toolName)
                }
              } catch {
                // Ignore parse errors
              }
            }
            return // Don't output raw JSON to chat
          }
          onDelta(data.delta)
          return
        }
        if (typeof data.textDelta === 'string') {
          // Filter raw tool call JSON from text deltas (Gemini compatibility)
          if (isRawToolCallJson(data.textDelta)) {
            if (onToolCall) {
              try {
                const parsed = JSON.parse(data.textDelta.trim())
                const toolName = parsed.action || parsed.toolName || parsed.name
                if (toolName) {
                  onToolCall(toolName)
                }
              } catch {
                // Ignore parse errors
              }
            }
            return // Don't output raw JSON to chat
          }
          onDelta(data.textDelta)
          return
        }
      }

      // Handle finish events
      if (data.type === 'finish') {
        onStatus('complete')
        return
      }

      // Handle error events
      if (data.type === 'error') {
        onStatus('error')
        if (onError && data.error) {
          onError(typeof data.error === 'string' ? data.error : JSON.stringify(data.error))
        }
        return
      }

      // Handle tool call events (AI SDK 5.x SSE format)
      if (data.type === 'tool-call' && onToolCall && data.toolName) {
        onToolCall(data.toolName)
        return
      }

      // Handle tool result events (AI SDK 5.x SSE format)
      if ((data.type === 'tool-result' || data.type === 'tool_result') && onToolResult) {
        const toolName = data.toolName || data.name || data.tool?.name
        const result = data.result ?? data.toolResult ?? data.output ?? data.data
        if (toolName) {
          onToolResult(toolName, result)
        }
        return
      }

      // Ignore other event types (start, start-step, finish-step, text-start, text-end)
      return
    }

    // ============================================
    // Data Stream Protocol format (AI SDK 4.x)
    // Format: "0:{json}", "e:{json}", "9:{json}", "d:{json}"
    // ============================================

    // Handle error chunks (e:{json})
    if (line.startsWith('e:')) {
      const jsonString = line.slice(2)
      const data = JSON.parse(jsonString)
      logger.warn('MetaDJai stream error chunk', { data })
      onStatus('error')
      if (onError && typeof data === 'string') {
        onError(data)
      }
      return
    }

    // Handle tool call chunks (9:{json})
    if (line.startsWith('9:')) {
      try {
        const jsonString = line.slice(2)
        const data = JSON.parse(jsonString)
        if (data.toolName) {
          onToolCall?.(data.toolName)
          if (onToolResult && data.result !== undefined) {
            onToolResult(data.toolName, data.result)
          }
        }
      } catch {
        // Ignore parse errors for tool calls/results
      }
      return
    }

    // Handle data chunks (d:{json}) - logged but not processed
    if (line.startsWith('d:')) {
      return
    }

    // Vercel AI SDK prefixes text data with "0:"
    if (line.startsWith('0:')) {
      const jsonString = line.slice(2) // Remove "0:" prefix
      const data = JSON.parse(jsonString)

      // Standard string delta (Vercel AI SDK Data Stream Protocol)
      if (typeof data === 'string') {
        onDelta(data)
        return
      }

      // Tool result in data stream (compatibility/adapter)
      if ((data.type === 'tool-result' || data.type === 'tool_result') && onToolResult) {
        const toolName = data.toolName || data.name
        const result = data.result ?? data.toolResult ?? data.output
        if (toolName) {
          onToolResult(toolName, result)
        }
        return
      }

      // AI SDK v5 data stream format (compatibility adapter)
      if (data.type === 'response.output_text.delta' && typeof data.delta === 'string') {
        onDelta(data.delta)
      }

      // Handle completion events
      if (data.type === 'response.output_text.done' || data.type === 'response.completed') {
        onStatus('complete')
      }

      // Handle errors
      if (data.type === 'response.error') {
        onStatus('error')
        if (onError && data.error) {
          onError(typeof data.error === 'string' ? data.error : JSON.stringify(data.error))
        }
      }

      // Backward compatibility with older format
      if (data.type === 'text-delta' && typeof data.textDelta === 'string') {
        onDelta(data.textDelta)
      }

      if (data.type === 'finish') {
        onStatus('complete')
      }
      return
    }

    // ============================================
    // Plain text stream (no prefix)
    // This handles toTextStreamResponse() output
    // ============================================
    // Skip empty lines (SSE uses blank lines as separators)
    if (line.length > 0) {
      // Filter out raw tool call JSON (Gemini compatibility)
      // Gemini may output tool calls as plain JSON: {"action": "toolName", ...args}
      if (isRawToolCallJson(line)) {
        // Trigger tool call handler if provided (so UI can show "thinking" indicator)
        if (onToolCall) {
          try {
            const parsed = JSON.parse(line.trim())
            const toolName = parsed.action || parsed.toolName || parsed.name
            if (toolName) {
              onToolCall(toolName)
            }
          } catch {
            // Ignore parse errors
          }
        }
        return // Don't output raw JSON to chat
      }
      onDelta(line)
    }
  } catch (error) {
    // If JSON parsing fails but we have content, treat it as plain text
    if (line.startsWith('0:') || line.startsWith('data:')) {
      logger.warn('Failed to parse MetaDJai stream chunk', {
        line,
        error: String(error),
      })
    } else if (line.length > 0) {
      // Filter out raw tool call JSON even in error handling path
      if (isRawToolCallJson(line)) {
        if (onToolCall) {
          try {
            const parsed = JSON.parse(line.trim())
            const toolName = parsed.action || parsed.toolName || parsed.name
            if (toolName) {
              onToolCall(toolName)
            }
          } catch {
            // Ignore parse errors
          }
        }
        return
      }
      // Plain text that failed to parse as JSON - just pass it through
      onDelta(line)
    }
  }
}

/**
 * Create a stream reader that processes chunks as they arrive
 *
 * @param reader - ReadableStreamDefaultReader from fetch response
 * @param onDelta - Handler for text content
 * @param onStatus - Handler for status changes
 * @param onError - Optional handler for errors
 */
export async function readStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onDelta: StreamHandler,
  onStatus: StatusHandler,
  onError?: ErrorHandler
): Promise<void> {
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { value, done } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    buffer = processVercelAIBuffer(buffer, onDelta, onStatus, onError)
  }

  // Process any remaining buffer content
  if (buffer.trim()) {
    processVercelAIBuffer(buffer, onDelta, onStatus, onError, true)
  }
}
