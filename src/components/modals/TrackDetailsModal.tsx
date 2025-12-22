"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import { X } from "lucide-react"
import { ShareButton } from "@/components/ui"
import { useFocusTrap } from "@/hooks/use-focus-trap"
import {
  trackTrackInfoOpened,
  trackTrackInfoClosed,
} from "@/lib/analytics"
import { logger } from "@/lib/logger"
import { normalizeCollectionSlug } from "@/lib/music/utils"
import { formatDuration } from "@/lib/utils"
import type { Track } from "@/types"

interface TrackDetailsModalProps {
  track: Track
  onClose: () => void
  trigger?: 'artwork' | 'info_button' | 'keyboard'
  source?: 'featured' | 'collection' | 'search'
}

// Collection-specific gradients (matching tab gradients)
const getCollectionGradient = (collection: string): string => {
  const slug = normalizeCollectionSlug(collection)
  if (slug === "majestic-ascent") {
    return "from-purple-500 via-violet-500 to-pink-400"
  }
  if (slug === "bridging-reality") {
    return "from-cyan-400 via-blue-500 to-indigo-500"
  }
  if (slug === "transformer") {
    return "from-orange-500 via-amber-500 to-red-500"
  }
  if (slug === "metaverse-revelation") {
    return "from-emerald-500 via-teal-500 to-cyan-400"
  }
  return "from-purple-500 via-blue-500 to-cyan-400"
}

// Collection narrative context
const getCollectionContext = (collection: string): string => {
  const slug = normalizeCollectionSlug(collection)
  if (slug === "majestic-ascent") {
    return "From my Majestic Ascent collection, where I blend retro-futuristic soundscapes with epic techno journeys. Each track fuses synthetic and orchestral elements to amplify your creative momentum."
  }
  if (slug === "bridging-reality") {
    return "From my Bridging Reality collection, where I explore human creativity with AI-driven execution. These tracks embody my Metaverse vision—where identity is fluid and creation knows no bounds."
  }
  if (slug === "transformer") {
    return "From my Transformer collection, a powerful journey through transformation and energy, exploring the evolution of sound and digital consciousness."
  }
  if (slug === "metaverse-revelation") {
    return "From my Metaverse Revelation collection, a movement celebrating creative empowerment and bold transformation across the dancefloor and the Metaverse."
  }
  return "A MetaDJ original I crafted to amplify your experience through the fusion of technology and artistic expression."
}

export function TrackDetailsModal({
  track,
  onClose,
  trigger = 'info_button',
  source = 'collection'
}: TrackDetailsModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const [openedAt] = useState(() => Date.now())

  // WCAG 2.1 AA: Focus trap to keep keyboard navigation within modal
  useFocusTrap(modalRef)

  // Track modal opened event on mount
  useEffect(() => {
    try {
      trackTrackInfoOpened({
        trackId: track.id,
        trackTitle: track.title,
        collection: track.collection,
        source,
        trigger,
      })
    } catch (error) {
      // Analytics failures should not affect user experience
    }
  }, [track.id, track.title, track.collection, source, trigger])

  // Track modal closed event on unmount
  useEffect(() => {
    return () => {
      try {
        const timeSpentMs = Date.now() - openedAt
        trackTrackInfoClosed({
          trackId: track.id,
          trackTitle: track.title,
          collection: track.collection,
          timeSpentMs,
        })
      } catch (error) {
        logger.warn('[Analytics] Failed to track modal closed', { error: String(error) })
      }
    }
  }, [track.id, track.title, track.collection, openedAt])

  // Handle Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // Blur active element to prevent focus ring on trigger button
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur()
        }
        onClose()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onClose])

  const collectionGradient = getCollectionGradient(track.collection)
  const collectionContext = getCollectionContext(track.collection)
  const sourceLabel =
    source === "featured"
      ? "Featured spotlight"
      : source === "search"
        ? "search results"
        : "collection browser"
  const triggerLabel =
    trigger === "artwork"
      ? "artwork tap"
      : trigger === "keyboard"
        ? "keyboard shortcut"
        : "info button"
  
  // Handle overlay click (closes modal when clicking on background)
  const handleOverlayClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    // Only close if clicking directly on the overlay, not on the modal itself
    if (event.target === event.currentTarget) {
      onClose()
    }
  }, [onClose])


  return (
    <>
      {/* Full-screen overlay to block interactions with underlying elements */}
      <div
        className="fixed inset-0 z-149 bg-black/20 pointer-events-auto"
        onClick={handleOverlayClick}
        aria-hidden="true"
      />
      
      {/* Modal panel */}
      {/* Mobile: Full page with bottom action bar clearance (72px) */}
      {/* Desktop (>=1100px): Centered modal with curved corners */}
      <div
        className="pointer-events-none fixed z-150 flex justify-center
          inset-x-0 top-0 bottom-[72px] px-0
          min-[1100px]:inset-x-0 min-[1100px]:top-auto min-[1100px]:bottom-[calc(10.5rem+env(safe-area-inset-bottom))] min-[1100px]:px-5"
        role="dialog"
        aria-modal="true"
        aria-labelledby="track-details-title"
      >
        <div
          ref={modalRef}
          className="pointer-events-auto radiant-panel relative overflow-hidden border border-white/12 bg-(--bg-modal) w-full shadow-[0_35px_80px_rgba(3,5,20,0.75)]
            rounded-none
            min-[1100px]:rounded-[28px] min-[1100px]:max-w-3xl"
        >
        <div className="pointer-events-none absolute inset-0 gradient-media-bloom opacity-40" />
        <div className="pointer-events-none absolute inset-0 rounded-[inherit] bg-linear-to-b from-white/15 via-transparent to-transparent opacity-60" />
        
        {/* Top-right controls */}
        <div className="absolute right-4 top-4 sm:right-6 sm:top-4 z-20 flex items-center gap-2">
          <ShareButton
            track={track}
            variant="button"
            size="xxs"
          />
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-white/20 text-white/70 transition hover:bg-white/10 hover:text-white focus-ring-glow"
            aria-label="Close track details"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative z-10 h-full overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-5 min-[1100px]:max-h-[calc(100vh-14rem)] min-[1100px]:h-auto">
          {/* Header with thumbnail artwork */}
          <div className="flex items-start gap-3 pr-24 sm:pr-32">
            {track.artworkUrl && (
              <div className="relative h-14 w-14 sm:h-16 sm:w-16 shrink-0 overflow-hidden rounded-xl border border-white/20 bg-black/40 shadow-[0_12px_28px_rgba(6,4,24,0.55)]">
                <Image
                  src={track.artworkUrl}
                  alt={track.title}
                  fill
                  sizes="(max-width: 640px) 56px, 64px"
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 pointer-events-none bg-linear-to-tr from-black/20 via-transparent to-white/10 opacity-40" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[0.6rem] uppercase tracking-[0.45em] text-white/55">
                Track insight
              </p>
              <h2
                id="track-details-title"
                className="text-xl sm:text-2xl font-heading font-semibold text-white drop-shadow-[0_8px_30px_rgba(6,8,24,0.55)] truncate"
              >
                {track.title}
              </h2>
              <p className="text-sm sm:text-base text-white/70 truncate">{track.artist}</p>
            </div>
          </div>

          {/* Metadata and content */}
          <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <span
                  className={`inline-flex items-center rounded-full border border-white/20 bg-linear-to-r ${collectionGradient} px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.28em] text-white shadow-[0_8px_24px_rgba(12,10,45,0.55)]`}
                >
                  {track.collection}
                </span>

                {track.genres?.slice(0, 2).map((genre) => (
                  <span
                    key={genre}
                    className="inline-flex items-center rounded-full border border-white/12 bg-white/5 px-3 py-1 text-xs font-medium text-white/80"
                  >
                    {genre}
                  </span>
                ))}

                {track.duration && (
                  <span className="inline-flex items-center rounded-full border border-white/12 bg-white/5 px-3 py-1 text-xs font-medium text-white/80">
                    Duration&nbsp;{formatDuration(track.duration)}
                  </span>
                )}
              </div>

              {/* Production Details Card */}
              {(track.bpm || track.key) && (
                <div className="rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-br from-purple-900/20 via-indigo-900/10 to-cyan-900/20 px-4 py-3">
                  <p className="text-[0.6rem] uppercase tracking-[0.35em] text-white/55 mb-2">
                    Production details
                  </p>
                  <div className="flex flex-wrap gap-4">
                    {track.bpm && (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/20 border border-purple-400/30">
                          <span className="text-xs font-bold text-purple-300">♪</span>
                        </span>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-white/50">BPM</p>
                          <p className="text-sm font-semibold text-white">{track.bpm}</p>
                        </div>
                      </div>
                    )}
                    {track.key && (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/20 border border-cyan-400/30">
                          <span className="text-xs font-bold text-cyan-300">♯</span>
                        </span>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-white/50">Key</p>
                          <p className="text-sm font-semibold text-white">{track.key}</p>
                        </div>
                      </div>
                    )}
                    {track.releaseDate && (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20 border border-amber-400/30">
                          <span className="text-xs font-bold text-amber-300">◉</span>
                        </span>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-white/50">Released</p>
                          <p className="text-sm font-semibold text-white">
                            {new Date(track.releaseDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl overflow-hidden border border-white/10 bg-white/5 px-4 py-4 space-y-2">
                  <p className="text-[0.6rem] uppercase tracking-[0.35em] text-white/55">
                    About this track
                  </p>
                  <p className="text-sm text-white/80 leading-relaxed">
                    {track.description ?? "I’ll add full notes for this record soon—right now it’s here so you can feel it before the story is published."}
                  </p>
                </div>
                <div className="rounded-3xl overflow-hidden border border-white/10 bg-white/5 px-4 py-4 space-y-2">
                  <p className="text-[0.6rem] uppercase tracking-[0.35em] text-white/55">
                    Creator log
                  </p>
                  <p className="text-sm text-white/80 leading-relaxed">
                    {collectionContext}
                  </p>
                </div>
              </div>

            <div className="rounded-3xl overflow-hidden border border-white/10 bg-white/5 px-4 py-3 space-y-2 text-sm text-white/80">
              <p className="text-[0.6rem] uppercase tracking-[0.35em] text-white/70">
                Session signal
              </p>
              <p>
                Surfaced from the {sourceLabel} via {triggerLabel}. Keep playback controls, queue, and MetaDJai open—this insight layer stays light so you can keep creating.
              </p>
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  )
}
