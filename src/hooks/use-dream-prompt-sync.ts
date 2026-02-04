"use client"

/**
 * Daydream Prompt Synchronization Hook
 *
 * Manages runtime prompt updates to Daydream streams via PATCH requests.
 * This wrapper delegates to the canonical dream hook to avoid duplicate logic.
 *
 * @module hooks/use-dream-prompt-sync
 */

import { useCallback } from "react"
import { usePromptSync } from "@/hooks/dream"
import type { DaydreamStatus } from "@/types/daydream.types"

interface UseDreamPromptSyncOptions {
  /** Current resolved prompt to sync */
  resolvedPrompt: string
  /** Current stream status */
  status: DaydreamStatus
  /** Whether the overlay countdown is ready (countdown <= 0) */
  overlayReady: boolean
  /** Whether the stream is actively receiving data */
  streamActive: boolean
  /** Reference to stream start time for warmup grace period */
  getStreamStartTime: () => number | null
  /** Current model ID for the stream */
  getModelId: () => string
  /** Whether the hook is in stopping state */
  isStopping: () => boolean
}

interface UseDreamPromptSyncReturn {
  /** Synchronize prompt to current stream */
  syncPrompt: (streamId: string, force?: boolean) => Promise<void>
  /** Force sync the current prompt (bypasses equality check) */
  forceSync: () => void
  /** Clear all pending sync operations */
  clearPromptSync: () => void
  /** Whether PATCH is supported (null = unknown, true = works, false = disabled) */
  patchSupported: boolean | null
  /** Last successfully applied prompt */
  appliedPrompt: string | null
  /** Set the applied prompt (for stream creation) */
  setAppliedPrompt: (prompt: string | null) => void
  /** Reset patch support detection for new stream */
  resetPatchSupport: () => void
}

/**
 * Hook for synchronizing prompts to Daydream streams.
 *
 * @returns Object containing sync functions and state
 */
export function useDreamPromptSync({
  resolvedPrompt,
  status,
  overlayReady: _overlayReady,
  streamActive,
  getStreamStartTime,
  getModelId,
  isStopping,
}: UseDreamPromptSyncOptions): UseDreamPromptSyncReturn {
  const streamStartAt = getStreamStartTime()
  const modelId = getModelId()

  const {
    patchSupported,
    appliedPrompt,
    syncPrompt,
    forceSync,
    clearPromptSync,
    resetAppliedPrompt,
    setPatchSupported,
  } = usePromptSync({
    resolvedPrompt,
    status,
    streamStartAt,
    modelId,
    streamActive,
    isStopping,
  })

  const setAppliedPrompt = useCallback(
    (prompt: string | null) => {
      resetAppliedPrompt(prompt)
    },
    [resetAppliedPrompt],
  )

  const resetPatchSupport = useCallback(() => {
    setPatchSupported(null)
  }, [setPatchSupported])

  return {
    syncPrompt,
    forceSync,
    clearPromptSync,
    patchSupported,
    appliedPrompt,
    setAppliedPrompt,
    resetPatchSupport,
  }
}
