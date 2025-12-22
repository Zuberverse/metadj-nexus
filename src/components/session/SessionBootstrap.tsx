"use client"

import { useEffect, useRef } from "react"
import {
  trackSessionStarted,
  getDeviceType,
  isReturningVisitor,
  trackSearchPerformed,
  trackSearchZeroResults,
} from "@/lib/analytics"
import type { Track } from "@/types"

interface SessionBootstrapProps {
  searchQuery: string
  searchResults: Track[]
}

/**
 * SessionBootstrap - Analytics and session initialization
 *
 * Handles all analytics tracking for:
 * - Session start events
 * - Search performance tracking
 * - Zero results tracking
 * - Audio route warmup (pre-compiles Next.js API route)
 *
 * This is a pure side-effects component with no UI rendering.
 */
export function SessionBootstrap({ searchQuery, searchResults }: SessionBootstrapProps) {
  const lastTrackedQueryRef = useRef<string>("")
  const hasWarmedUpRef = useRef(false)

  // Audio route warmup - pre-compiles the API route to eliminate first-play delay
  useEffect(() => {
    if (hasWarmedUpRef.current) return
    hasWarmedUpRef.current = true

    fetch("/api/audio/warmup", { method: "HEAD" }).catch(() => {
      // Ignore errors - warmup is best-effort
    })
  }, [])

  // Session start analytics (once per page load)
  useEffect(() => {
    try {
      trackSessionStarted({
        isReturningVisitor: isReturningVisitor(),
        deviceType: getDeviceType(),
      })
    } catch {
      // Never throw from analytics
    }
  }, [])

  // Search analytics: fire once per query value after results update
  useEffect(() => {
    const q = searchQuery.trim()
    if (!q) return
    if (lastTrackedQueryRef.current === q) return
    lastTrackedQueryRef.current = q

    try {
      trackSearchPerformed({
        query: q,
        resultsCount: searchResults.length,
        hasResults: searchResults.length > 0,
      })

      if (searchResults.length === 0) {
        trackSearchZeroResults({ query: q })
      }
    } catch {
      // Never throw from analytics
    }
  }, [searchQuery, searchResults])

  // No UI rendering - pure side effects
  return null
}
