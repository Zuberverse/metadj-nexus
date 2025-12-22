"use client"

/**
 * MetaDJai Rate Limit Hook
 *
 * Extracted from use-metadjai to manage client-side rate limiting:
 * - Rate limit window tracking
 * - Session storage persistence
 * - Rate limit state calculation
 * - Window expiration handling
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { metadjAiSessionStorage } from '@/lib/storage/metadjai-session-storage'
import type { MetaDjAiRateLimitState } from '@/types/metadjai'

/** Rate limit window duration (5 minutes) */
export const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000
/** Maximum messages allowed per window */
export const MAX_MESSAGES_PER_WINDOW = 20

interface RateLimitWindow {
  startedAt: number
  count: number
}

interface UseMetaDjAiRateLimitReturn {
  /** Current rate limit state */
  rateLimit: MetaDjAiRateLimitState
  /** Whether sending is currently allowed */
  canSend: boolean
  /** Record a message send (increments counter) */
  recordSend: () => RateLimitWindow
  /** Current window info (for debugging) */
  sendWindow: RateLimitWindow | null
}

/**
 * Hook for managing MetaDJai client-side rate limiting
 *
 * Implements a sliding window rate limiter:
 * - Tracks message count within a 5-minute window
 * - Persists window state to session storage
 * - Auto-resets when window expires
 * - Provides real-time rate limit status
 */
export function useMetaDjAiRateLimit(): UseMetaDjAiRateLimitReturn {
  const [sendWindow, setSendWindow] = useState<RateLimitWindow | null>(null)
  const [nowTs, setNowTs] = useState(() => Date.now())

  // Load rate limit window from session storage on mount
  useEffect(() => {
    const storedWindow = metadjAiSessionStorage.loadRateLimitWindow()
    if (storedWindow) {
      setSendWindow(storedWindow)
    }
  }, [])

  // Update timestamp every second for real-time rate limit display
  // Only run interval when there's an active rate limit window to optimize performance
  useEffect(() => {
    if (!sendWindow) return

    const interval = setInterval(() => {
      setNowTs(Date.now())
    }, 1000)

    return () => {
      clearInterval(interval)
    }
  }, [sendWindow])

  // Clear expired window
  useEffect(() => {
    if (!sendWindow) return
    if (nowTs - sendWindow.startedAt >= RATE_LIMIT_WINDOW_MS) {
      setSendWindow(null)
      metadjAiSessionStorage.clearRateLimitWindow()
    }
  }, [nowTs, sendWindow])

  // Record a message send
  const recordSend = useCallback((): RateLimitWindow => {
    const now = Date.now()
    let windowInfo = sendWindow

    // Start new window if none exists or current expired
    if (!windowInfo || now - windowInfo.startedAt >= RATE_LIMIT_WINDOW_MS) {
      windowInfo = { startedAt: now, count: 0 }
    }

    const nextWindow = { startedAt: windowInfo.startedAt, count: windowInfo.count + 1 }
    setSendWindow(nextWindow)
    metadjAiSessionStorage.saveRateLimitWindow(nextWindow)

    return nextWindow
  }, [sendWindow])

  // Calculate rate limit state
  const rateLimit: MetaDjAiRateLimitState = useMemo(() => {
    const windowCount = sendWindow?.count ?? 0
    const windowEndsAt = sendWindow ? sendWindow.startedAt + RATE_LIMIT_WINDOW_MS : null

    if (!sendWindow) {
      return {
        isLimited: false,
        remainingMs: 0,
        nextAvailableAt: null,
        windowCount: 0,
        windowMax: MAX_MESSAGES_PER_WINDOW,
        windowMs: RATE_LIMIT_WINDOW_MS,
        windowEndsAt: null,
      }
    }

    const windowRemainingMs = Math.max(0, (windowEndsAt ?? 0) - nowTs)
    const expired = windowEndsAt === null || nowTs >= windowEndsAt

    if (expired) {
      return {
        isLimited: false,
        remainingMs: 0,
        nextAvailableAt: null,
        windowCount: 0,
        windowMax: MAX_MESSAGES_PER_WINDOW,
        windowMs: RATE_LIMIT_WINDOW_MS,
        windowEndsAt: null,
      }
    }

    const isLimited = windowCount >= MAX_MESSAGES_PER_WINDOW
    return {
      isLimited,
      remainingMs: isLimited ? windowRemainingMs : 0,
      nextAvailableAt: isLimited ? windowEndsAt : null,
      remainingCooldown: isLimited ? Math.ceil(windowRemainingMs / 1000) : undefined,
      windowCount,
      windowMax: MAX_MESSAGES_PER_WINDOW,
      windowMs: RATE_LIMIT_WINDOW_MS,
      windowEndsAt,
    }
  }, [nowTs, sendWindow])

  // Check if sending is allowed (derived from rateLimit state)
  const canSend = !rateLimit.isLimited

  return {
    rateLimit,
    canSend,
    recordSend,
    sendWindow,
  }
}
