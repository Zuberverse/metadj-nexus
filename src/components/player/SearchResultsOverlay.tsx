"use client"

import { X, Play, ListPlus } from "lucide-react"
import { cn } from "@/lib/utils"
import { CollectionArtwork } from "./CollectionArtwork"
import type { Track } from "@/types"

interface SearchResultsOverlayProps {
    results: Track[]
    currentTrackId?: string
    onClose: () => void
    onTrackSelect: (track: Track) => void
    onQueueAdd: (track: Track) => void
}

export function SearchResultsOverlay({
    results,
    currentTrackId,
    onClose,
    onTrackSelect,
    onQueueAdd,
}: SearchResultsOverlayProps) {
    if (results.length === 0) return null

    return (
        <div className="absolute inset-x-5 top-[88px] bottom-5 z-20 rounded-[18px] border border-white/20 bg-[rgba(6,8,28,0.95)] shadow-[0_25px_65px_rgba(5,4,18,0.75)] backdrop-blur-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="pointer-events-none absolute inset-0 gradient-media-bloom opacity-50" />
            <div className="pointer-events-none absolute inset-0 rounded-[inherit] bg-linear-to-b from-white/18 via-transparent to-transparent opacity-60" />

            <div className="relative z-10 flex h-full flex-col">
                {/* Search Results Header */}
                <div className="shrink-0 flex items-center justify-between gap-3 border-b border-white/20 px-4 py-3 sm:px-5 sm:py-4 backdrop-blur-xl bg-white/2">
                    <div>
                        <p className="text-[0.6rem] uppercase tracking-[0.4em] text-white/70">Search Results</p>
                        <p className="text-gradient-hero font-heading text-lg font-semibold">
                            Across the catalog
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-white/70">
                            {results.length} {results.length === 1 ? "result" : "results"}
                        </span>
                        <button
                            onClick={onClose}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white/70 transition hover:border-white/40 hover:text-white focus-ring-glow"
                            aria-label="Close search results"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Search Results List */}
                <div className="relative flex-1 overflow-y-auto overscroll-contain touch-pan-y px-3 py-3 sm:px-4 sm:py-4 space-y-2" style={{ WebkitOverflowScrolling: 'touch' }}>
                    {results.map((resultTrack) => {
                        const isActive = currentTrackId === resultTrack.id
                        return (
                            <div
                                key={resultTrack.id}
                                className={cn(
                                    "group relative overflow-hidden flex items-center gap-2.5 rounded-xl border px-3 py-2.5 shadow-[0_12px_26px_rgba(6,8,28,0.4)] transition",
                                    isActive
                                        ? "border-white/30 bg-white/12"
                                        : "border-white/10 bg-[rgba(14,16,40,0.88)] hover:border-white/20 hover:bg-white/8"
                                )}
                            >
                                <div className="pointer-events-none absolute inset-0 opacity-60 mix-blend-screen bg-linear-to-r from-white/10 via-white/6 to-transparent" />

                                {/* Track artwork */}
                                <CollectionArtwork
                                    src={resultTrack.artworkUrl}
                                    alt={resultTrack.title}
                                    size={48}
                                    showLoading={true}
                                />

                                <button
                                    type="button"
                                    onClick={() => onTrackSelect(resultTrack)}
                                    className="flex-1 min-w-0 text-left"
                                >
                                    <p className="truncate text-sm font-heading font-semibold text-white">{resultTrack.title}</p>
                                    <p className="truncate text-xs text-white/65">{resultTrack.artist} · {resultTrack.collection}</p>
                                </button>

                                {/* Play button */}
                                <button
                                    type="button"
                                    onClick={() => onTrackSelect(resultTrack)}
                                    className={cn(
                                        "shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-full border transition",
                                        isActive
                                            ? "bg-white text-black border-white/50 shadow-[0_0_25px_rgba(255,255,255,0.35)]"
                                            : "border-white/20 text-white/80 hover:border-white/40 hover:text-white"
                                    )}
                                    aria-label={`Play ${resultTrack.title}`}
                                >
                                    <Play className="h-4 w-4" fill="currentColor" />
                                </button>

                                {/* Add to queue button */}
                                <button
                                    type="button"
                                    onClick={() => onQueueAdd(resultTrack)}
                                    className="shrink-0 inline-flex items-center justify-center gap-1 rounded-full border border-(--border-elevated) bg-white/5 px-3 py-2 text-xs font-heading font-semibold uppercase tracking-[0.16em] text-white/80 transition hover:border-(--border-active) hover:text-white focus-ring-glow"
                                    aria-label={`Add ${resultTrack.title} to queue`}
                                >
                                    <ListPlus className="h-3.5 w-3.5" />
                                    <span className="hidden sm:inline">Queue</span>
                                </button>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
