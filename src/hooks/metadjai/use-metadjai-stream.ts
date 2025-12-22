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
 * Handle individual Vercel AI SDK stream chunk
 *
 * Supports:
 * - SSE format: "data: {json}" (AI SDK 5.x toUIMessageStreamResponse)
 * - Data stream format: "0:{json}", "e:{json}", etc. (AI SDK 4.x)
 * - Plain text streams
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
          onDelta(data.delta)
          return
        }
        if (typeof data.textDelta === 'string') {
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

      // Tool result in data stream (legacy/adapter)
      if ((data.type === 'tool-result' || data.type === 'tool_result') && onToolResult) {
        const toolName = data.toolName || data.name
        const result = data.result ?? data.toolResult ?? data.output
        if (toolName) {
          onToolResult(toolName, result)
        }
        return
      }

      // AI SDK v5 data stream format (Legacy/Adapter)
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
