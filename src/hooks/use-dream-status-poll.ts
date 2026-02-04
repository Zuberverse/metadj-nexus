"use client"

/**
 * Daydream Stream Status Polling Hook
 *
 * Wrapper around the canonical dream status poller to avoid duplicate logic.
 *
 * @module hooks/use-dream-status-poll
 */

import { useStatusPoll } from "@/hooks/dream"

interface UseDreamStatusPollOptions {
  /** Reference to stream start time for warmup grace period */
  getStreamStartTime: () => number | null
}

/**
 * Hook for polling Daydream stream status.
 */
export function useDreamStatusPoll({ getStreamStartTime }: UseDreamStatusPollOptions) {
  const streamStartAt = getStreamStartTime()
  return useStatusPoll({ streamStartAt })
}
