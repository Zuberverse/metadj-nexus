"use client"

/**
 * Recently Played Section
 *
 * Grid display of recently played tracks matching Featured Tracks layout.
 * Features:
 * - Grid layout matching Featured Tracks (up to 6 items)
 * - Quick play action
 * - Collection-aware styling
 * - Responsive grid sizing
 */

import Image from "next/image"
import { clsx } from "clsx"
import { Play, History } from "lucide-react"
import { BrandGradientIcon } from "@/components/icons/BrandGradientIcon"
import { Card, PlayingIndicator, EmptyState } from "@/components/ui"
import { getCollectionHoverStyles } from "@/lib/collection-theme"
import type { Track } from "@/types"

interface RecentlyPlayedRailProps {
  // Recently played tracks (most recent first)
  tracks: Track[]
  // Current playing track (for highlighting)
  currentTrack?: Track | null
  // Play a track
  onPlayTrack: (track: Track) => void
  // Optional: Maximum tracks to show (default 8 for 4x2 grid on desktop)
  maxTracks?: number
  // Optional className
  className?: string
}

export function RecentlyPlayedRail({
  tracks,
  currentTrack,
  onPlayTrack,
  maxTracks = 8,
  className = "",
}: RecentlyPlayedRailProps) {
  const displayTracks = tracks.slice(0, maxTracks)
  const isEmpty = displayTracks.length === 0

  return (
    <section className={clsx("relative", className)}>
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <h2 className="text-xl font-heading font-semibold flex items-center gap-2">
          <BrandGradientIcon icon={History} className="h-5 w-5" strokeWidth={2.5} />
          <span className="text-gradient-hero">Recently Played</span>
        </h2>
      </div>

      {/* Empty State */}
      {isEmpty && (
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-purple-900/25 via-indigo-900/20 to-cyan-900/15 backdrop-blur-xl">
          <EmptyState
            icon={<History className="h-full w-full" />}
            title="Your listening history will appear here"
            description="Start exploring to build your journey"
            size="md"
            iconVariant="subtle"
          />
        </div>
      )}

      {/* Grid Layout - 4 columns on desktop, responsive down to 2 columns on mobile */}
      {/* Max 2 rows (8 items), min-width ensures cards don't get too small */}
      {!isEmpty && (
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {displayTracks.map((track) => {
            const isPlaying = currentTrack?.id === track.id

            return (
              <Card
                key={track.id}
                onClick={() => onPlayTrack(track)}
                asButton
                variant="interactive"
                className={clsx(
                  "group relative flex items-center gap-3 p-2.5 pr-3 rounded-2xl bg-black/20 backdrop-blur-xl border-(--border-standard) shadow-lg transition-all duration-300 min-w-0",
                  isPlaying && "ring-2 ring-purple-500/50 bg-purple-500/10",
                  getCollectionHoverStyles(track.collection),
                )}
              >
                {/* Artwork with Play Overlay - smaller on mobile for compact fit */}
                <div className="relative h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16 rounded-lg overflow-hidden shrink-0 shadow-md border border-(--border-subtle)">
                  <Image
                    src={track.artworkUrl || "/images/default-artwork.jpg"}
                    alt={track.title}
                    fill
                    sizes="(max-width: 640px) 48px, (max-width: 1024px) 56px, 64px"
                    className="object-cover transition duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition duration-300" />

                  {/* Currently Playing Indicator */}
                  {isPlaying ? (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <PlayingIndicator isPlaying={true} size="lg" color="purple" />
                    </div>
                  ) : (
                    /* Play Button Overlay on Artwork */
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200">
                      <div className="p-2 rounded-full bg-white/90 shadow-lg shadow-purple-500/30">
                        <Play className="h-4 w-4 text-black fill-current" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Track Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-heading font-bold text-gradient-hero truncate">
                    {track.title}
                  </p>
                  {/* WCAG: text-white/70 for 4.5:1 contrast on collection names */}
                  <p className="text-[10px] text-white/70 truncate uppercase tracking-wider">
                    {track.collection}
                  </p>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </section>
  )
}
