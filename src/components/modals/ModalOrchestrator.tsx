"use client"

import { useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Loader2 } from "lucide-react"
import { TrackDetailsModalErrorBoundary } from "./TrackDetailsModalErrorBoundary"
import type { Track, Collection } from "@/types"

// Preload function for TrackDetailsModal
const preloadTrackDetailsModal = () => {
  return import('@/components/modals/TrackDetailsModal')
}

function ModalLoadingOverlay({ label }: { label: string }) {
  return (
    <div className="fixed inset-0 z-150 flex items-center justify-center">
      <div className="absolute inset-0 bg-(--bg-overlay)/90 backdrop-blur-2xl" />
      <div className="relative flex items-center gap-3 rounded-2xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white/80 shadow-2xl backdrop-blur-xl">
        <Loader2 className="h-5 w-5 animate-spin text-purple-300" />
        <span className="font-medium">{label}</span>
      </div>
    </div>
  )
}

// Fallback component for TrackDetailsModal errors
function TrackDetailsModalFallback({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-150 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-(--bg-modal) border border-white/20 p-6 rounded-2xl text-center max-w-sm mx-4 shadow-2xl">
        <p className="mb-4 text-white/90">Unable to load track details</p>
        <p className="mb-4 text-sm text-(--text-muted)">Please try again or close this dialog.</p>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 transition-colors focus-ring-glow"
        >
          Close
        </button>
      </div>
    </div>
  )
}

// Dynamic imports for performance with error handling
const TrackDetailsModal = dynamic(
  async () => {
    try {
      const mod = await import('@/components/modals/TrackDetailsModal')
      return mod.TrackDetailsModal
    } catch (err) {
      // Retry once after a delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      try {
        const mod = await import('@/components/modals/TrackDetailsModal')
        return mod.TrackDetailsModal
      } catch (retryErr) {
        // Return a component that indicates we need to show fallback
        const TrackDetailsModalErrorPlaceholder = ({ onClose }: { onClose: () => void }) => (
          <TrackDetailsModalFallback onClose={onClose} />
        )
        TrackDetailsModalErrorPlaceholder.displayName = 'TrackDetailsModalErrorPlaceholder'
        return TrackDetailsModalErrorPlaceholder
      }
    }
  },
  {
    ssr: false,
    loading: () => <ModalLoadingOverlay label="Loading track details..." />
  }
)

const UserGuideOverlay = dynamic(
  () => import('@/components/guide/UserGuideOverlay').then(mod => mod.UserGuideOverlay),
  {
    ssr: false,
    // Loading placeholder matches actual UserGuideOverlay backdrop to prevent visual "snap"
    loading: () => (
      <div className="fixed inset-0 z-100 flex items-center justify-center overflow-hidden">
        <div className="pointer-events-none absolute inset-0 gradient-1 opacity-95" />
        <div className="pointer-events-none absolute inset-0 bg-(--bg-overlay)/92 backdrop-blur-3xl" />
        <Loader2 className="relative z-10 h-12 w-12 animate-spin text-purple-400" />
      </div>
    )
  }
)

const KeyboardShortcutsModal = dynamic(
  () => import('@/components/modals/KeyboardShortcutsModal').then(mod => mod.KeyboardShortcutsModal),
  { ssr: false, loading: () => <ModalLoadingOverlay label="Loading shortcuts..." /> }
)

const CollectionDetailsModal = dynamic(
  () => import('@/components/modals/CollectionDetailsModal').then(mod => mod.CollectionDetailsModal),
  { ssr: false, loading: () => <ModalLoadingOverlay label="Loading collection..." /> }
)

interface ModalOrchestratorProps {
  // User Guide modal
  isInfoOpen: boolean
  onInfoClose: () => void

  // Track details modal
  isTrackDetailsOpen: boolean
  trackDetailsTrack: Track | null
  onTrackDetailsClose: () => void

  // Collection details modal
  isCollectionDetailsOpen: boolean
  collectionDetails: Collection | null
  collectionTracks: Track[]
  onCollectionDetailsClose: () => void

  // Keyboard shortcuts modal
  isKeyboardShortcutsOpen: boolean
  onKeyboardShortcutsClose: () => void
}

/**
 * ModalOrchestrator - Centralized modal management
 *
 * Manages all modal overlays:
 * - User Guide overlay (platform guide)
 * - Track details modal
 * - Keyboard shortcuts modal
 *
 * Benefits:
 * - Single source of truth for modal state
 * - Consistent z-index layering
 * - Easy to add new modals
 * - Performance optimization via dynamic imports
 */
export function ModalOrchestrator({
  isInfoOpen,
  onInfoClose,
  isTrackDetailsOpen,
  trackDetailsTrack,
  onTrackDetailsClose,
  isCollectionDetailsOpen,
  collectionDetails,
  collectionTracks,
  onCollectionDetailsClose,
  isKeyboardShortcutsOpen,
  onKeyboardShortcutsClose,
}: ModalOrchestratorProps) {
  // Preload TrackDetailsModal when component mounts or when we have a track
  useEffect(() => {
    // Preload after a short delay to avoid blocking initial render
    const timer = setTimeout(() => {
      preloadTrackDetailsModal().catch(() => {
        // Silently fail preload - will be handled by error boundary if needed
      })
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  // Eagerly preload when we have a track (user might open details)
  useEffect(() => {
    if (trackDetailsTrack) {
      preloadTrackDetailsModal().catch(() => {
        // Silently fail preload
      })
    }
  }, [trackDetailsTrack])

  return (
    <>
      {/* User Guide Overlay - Full platform guide accessed via the header (ⓘ) button */}
      {isInfoOpen && <UserGuideOverlay onClose={onInfoClose} />}

      {/* Track Details Modal with Error Boundary */}
      {isTrackDetailsOpen && trackDetailsTrack && (
        <TrackDetailsModalErrorBoundary onClose={onTrackDetailsClose}>
          <TrackDetailsModal track={trackDetailsTrack} onClose={onTrackDetailsClose} />
        </TrackDetailsModalErrorBoundary>
      )}

      {/* Collection Details Modal */}
      {isCollectionDetailsOpen && collectionDetails && (
        <CollectionDetailsModal collection={collectionDetails} tracks={collectionTracks} onClose={onCollectionDetailsClose} />
      )}

      {/* Keyboard Shortcuts Modal - Accessed via '?' key */}
      {isKeyboardShortcutsOpen && <KeyboardShortcutsModal onClose={onKeyboardShortcutsClose} />}
    </>
  )
}
