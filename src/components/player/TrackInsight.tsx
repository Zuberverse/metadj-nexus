"use client"

import { CollectionArtwork } from "./CollectionArtwork"
import type { Track } from "@/types"

interface TrackInsightProps {
    track: Track
}

export function TrackInsight({ track }: TrackInsightProps) {
    return (
        <div className="relative flex-1 min-h-[260px] overflow-hidden rounded-[18px] border border-(--border-subtle) bg-[rgba(10,12,34,0.92)] shadow-[0_18px_44px_rgba(6,8,28,0.55)] gradient-media animate-in fade-in zoom-in-95 duration-300">
            <div className="pointer-events-none absolute inset-0 gradient-media-bloom opacity-90" />
            <div className="pointer-events-none absolute inset-0 rounded-[inherit] bg-linear-to-b from-white/18 via-transparent to-transparent opacity-45 mix-blend-screen" />
            <div className="relative p-4 sm:p-5 space-y-4">
                <div className="flex items-start gap-3 sm:gap-4">
                    <CollectionArtwork
                        src={track.artworkUrl}
                        alt={track.title || "Track artwork"}
                        size="medium"
                        showLoading={true}
                    />
                    <div className="min-w-0 space-y-1.5">
                        <p className="text-[0.72rem] uppercase tracking-[0.3em] text-white/70">Track insight</p>
                        <p className="truncate text-xl sm:text-2xl font-heading font-semibold text-white drop-shadow-[0_6px_32px_rgba(10,10,30,0.45)]">
                            {track.title}
                        </p>
                        <p className="truncate text-sm text-white/80">{track.artist}</p>
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                            {track.collection && (
                                <span className="inline-flex items-center rounded-full px-3.5 py-1.5 text-xs font-heading font-semibold text-white shadow-[0_10px_22px_rgba(6,8,28,0.4)] border border-white/20 bg-white/8">
                                    {track.collection}
                                </span>
                            )}
                            {track.genres?.slice(0, 3).map((genre) => (
                                <span
                                    key={genre}
                                    className="inline-flex items-center rounded-full px-3 py-1 text-xs font-heading font-semibold text-white/85 border border-white/15 bg-white/6"
                                >
                                    {genre}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
                {track.description && (
                    <p className="text-sm text-white/75 leading-relaxed">{track.description}</p>
                )}
            </div>
        </div>
    )
}
