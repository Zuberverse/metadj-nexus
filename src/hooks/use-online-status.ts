import { useSyncExternalStore } from "react"

/**
 * Subscribe to online/offline events
 */
function subscribeToOnlineStatus(callback: () => void): () => void {
  window.addEventListener("online", callback)
  window.addEventListener("offline", callback)

  return () => {
    window.removeEventListener("online", callback)
    window.removeEventListener("offline", callback)
  }
}

/**
 * Get current online status (client snapshot)
 */
function getOnlineSnapshot(): boolean {
  return navigator.onLine
}

/**
 * Get server snapshot (assume online during SSR)
 */
function getServerSnapshot(): boolean {
  return true
}

/**
 * Hook to detect online/offline status
 *
 * Uses the Navigator.onLine API with proper React 18+ integration
 * via useSyncExternalStore for hydration-safe updates.
 *
 * @returns true if the browser is online, false if offline
 *
 * @example
 * const isOnline = useOnlineStatus()
 *
 * if (!isOnline) {
 *   return <OfflineBanner />
 * }
 */
export function useOnlineStatus(): boolean {
  return useSyncExternalStore(
    subscribeToOnlineStatus,
    getOnlineSnapshot,
    getServerSnapshot
  )
}
