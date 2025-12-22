"use client"

/**
 * Screen Reader Announcer Component
 *
 * Provides ARIA live regions for announcing dynamic content changes
 * to screen reader users. Supports different priority levels (polite, assertive)
 * and announcement types (status, alert, log).
 */

import { useEffect, useRef } from 'react'
import { logger } from '@/lib/logger'

export interface AnnouncementOptions {
  /**
   * Priority of announcement
   * - polite: Wait for current speech to finish (default)
   * - assertive: Interrupt current speech
   */
  priority?: 'polite' | 'assertive'

  /**
   * Type of announcement
   * - status: General status updates (default)
   * - alert: Important alerts that require attention
   * - log: Sequential updates (like chat messages)
   */
  type?: 'status' | 'alert' | 'log'

  /**
   * Clear announcement after delay (ms)
   * Default: 1000ms for status/alert, never for log
   */
  clearAfter?: number
}

interface ScreenReaderAnnouncerProps {
  message: string
  options?: AnnouncementOptions
}

/**
 * Screen Reader Announcer - Individual announcement region
 */
export function ScreenReaderAnnouncer({ message, options = {} }: ScreenReaderAnnouncerProps) {
  const {
    priority = 'polite',
    type = 'status',
    clearAfter = type === 'log' ? undefined : 1000,
  } = options

  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!clearAfter || !message) return

    const timeout = setTimeout(() => {
      if (ref.current) {
        ref.current.textContent = ''
      }
    }, clearAfter)

    return () => clearTimeout(timeout)
  }, [message, clearAfter])

  if (!message) return null

  const role = type === 'log' ? 'log' : type === 'alert' ? 'alert' : 'status'
  const ariaLive = type === 'alert' ? 'assertive' : priority
  const ariaAtomic = type === 'log' ? 'false' : 'true'

  return (
    <div
      ref={ref}
      role={role}
      aria-live={ariaLive}
      aria-atomic={ariaAtomic}
      className="sr-only"
    >
      {message}
    </div>
  )
}

/**
 * Global Screen Reader Live Regions
 *
 * Persistent live regions for different types of announcements.
 * Place this component at the root of your application.
 */
export function GlobalScreenReaderRegions() {
  return (
    <>
      {/* Polite status announcements (general updates) */}
      <div
        id="sr-status-region"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      {/* Assertive alert announcements (critical updates) */}
      <div
        id="sr-alert-region"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      />

      {/* Log region for sequential updates (chat, queue changes) */}
      <div
        id="sr-log-region"
        role="log"
        aria-live="polite"
        aria-atomic="false"
        className="sr-only"
      />
    </>
  )
}

/**
 * Utility function to announce to screen readers
 *
 * @param message - Message to announce
 * @param options - Announcement options
 */
export function announce(message: string, options: AnnouncementOptions = {}): void {
  const { priority = 'polite', type = 'status' } = options

  let regionId = 'sr-status-region'
  if (type === 'alert') {
    regionId = 'sr-alert-region'
  } else if (type === 'log') {
    regionId = 'sr-log-region'
  }

  const region = document.getElementById(regionId)
  if (!region) {
    // Tests frequently exercise announcement paths without mounting the global regions.
    if (process.env.NODE_ENV !== 'test') {
      logger.warn(`[ScreenReader] Announcement region not found`, { regionId })
    }
    return
  }

  // For log regions, append messages
  if (type === 'log') {
    const timestamp = new Date().toLocaleTimeString()
    const entry = document.createElement('div')
    entry.textContent = `${timestamp}: ${message}`
    region.appendChild(entry)

    // Keep only last 5 log entries
    while (region.children.length > 5) {
      region.removeChild(region.firstChild!)
    }
  } else {
    // For status/alert, replace content
    region.textContent = message

    // Clear after delay (except for alerts)
    if (type === 'status') {
      setTimeout(() => {
        if (region.textContent === message) {
          region.textContent = ''
        }
      }, 1000)
    }
  }
}
