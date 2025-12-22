"use client"

import { memo } from "react"

interface HomePageToastProps {
  message?: string | null
}

/**
 * Simple toast notification display
 * Positioned at bottom center of viewport
 */
function HomePageToastComponent({ message }: HomePageToastProps) {
  if (!message) return null

  return (
    <div className="fixed bottom-28 left-1/2 z-110 -translate-x-1/2 px-4">
      <div
        className="rounded-full border border-white/20 bg-black/80 px-4 py-2 text-sm text-white shadow-[0_12px_30px_rgba(18,15,45,0.45)]"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {message}
      </div>
    </div>
  )
}

export const HomePageToast = memo(HomePageToastComponent)
