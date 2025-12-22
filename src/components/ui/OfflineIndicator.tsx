"use client"

import { memo } from "react"
import { WifiOff } from "lucide-react"
import { useOnlineStatus } from "@/hooks/use-online-status"

/**
 * Offline Indicator Component
 *
 * Displays a banner when the user loses network connectivity.
 * Uses the useOnlineStatus hook for detection.
 *
 * Features:
 * - Automatic detection via Navigator.onLine API
 * - Smooth fade in/out animation
 * - Accessible with proper ARIA attributes
 * - Non-blocking UI (positioned as overlay)
 */
function OfflineIndicatorComponent() {
  const isOnline = useOnlineStatus()

  if (isOnline) {
    return null
  }

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[200] bg-(--metadj-red)/95 backdrop-blur-sm text-white px-4 py-2 text-center animate-in fade-in slide-in-from-top duration-300 border-b border-white/10"
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-center justify-center gap-2 text-sm font-medium">
        <WifiOff className="h-4 w-4 motion-safe:animate-pulse" aria-hidden="true" />
        <span>You&apos;re offline. Some features may be unavailable.</span>
      </div>
    </div>
  )
}

export const OfflineIndicator = memo(OfflineIndicatorComponent)
