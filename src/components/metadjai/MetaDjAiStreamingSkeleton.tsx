"use client"

import { memo } from "react"
import clsx from "clsx"

interface MetaDjAiStreamingSkeletonProps {
  /** Optional tool label to display (e.g., "Searching catalog...") */
  toolLabel?: string
  /** Optional tool icon component */
  toolIcon?: React.ComponentType<{ className?: string }>
  /** Additional CSS classes */
  className?: string
}

/**
 * MetaDjAiStreamingSkeleton - Loading skeleton for AI response streams
 *
 * Displays animated placeholder lines that simulate incoming text content.
 * Used when a message is sent but the AI response hasn't started streaming yet,
 * or during the initial setup phase of streaming.
 *
 * Features:
 * - 3 lines of varying widths for visual interest
 * - Shimmer animation effect for perceived activity
 * - Optional tool indicator when a specific tool is being invoked
 * - Respects prefers-reduced-motion for accessibility
 */
export const MetaDjAiStreamingSkeleton = memo(function MetaDjAiStreamingSkeleton({
  toolLabel,
  toolIcon: ToolIcon,
  className,
}: MetaDjAiStreamingSkeletonProps) {
  // If a tool is active, show the tool indicator instead of skeleton lines
  if (toolLabel && ToolIcon) {
    return (
      <div
        className={clsx("flex items-center gap-2", className)}
        role="status"
        aria-label={toolLabel}
      >
        <ToolIcon className="h-3.5 w-3.5 animate-pulse text-cyan-400" />
        <span className="text-sm text-white/70 animate-pulse">{toolLabel}</span>
      </div>
    )
  }

  return (
    <div
      className={clsx("space-y-2.5", className)}
      role="status"
      aria-label="MetaDJai is composing a response"
    >
      <span className="sr-only">Loading response...</span>

      {/* Line 1 - Full width */}
      <div
        className="h-3.5 rounded-md bg-gradient-to-r from-white/8 via-white/15 to-white/8 animate-shimmer"
        style={{
          width: "92%",
          backgroundSize: "200% 100%",
        }}
        aria-hidden="true"
      />

      {/* Line 2 - Shorter */}
      <div
        className="h-3.5 rounded-md bg-gradient-to-r from-white/8 via-white/15 to-white/8 animate-shimmer"
        style={{
          width: "78%",
          backgroundSize: "200% 100%",
          animationDelay: "150ms",
        }}
        aria-hidden="true"
      />

      {/* Line 3 - Shortest */}
      <div
        className="h-3.5 rounded-md bg-gradient-to-r from-white/8 via-white/15 to-white/8 animate-shimmer"
        style={{
          width: "45%",
          backgroundSize: "200% 100%",
          animationDelay: "300ms",
        }}
        aria-hidden="true"
      />
    </div>
  )
})
