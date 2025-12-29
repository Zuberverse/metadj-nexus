'use client'

import { useMemo } from "react"
import Image from "next/image"
import { Check } from "lucide-react"
import { COLLECTION_NARRATIVES } from "@/data/collection-narratives"
import { getCollectionGradient } from "@/lib/collection-theme"

interface CollectionHeaderProps {
  selectedCollection: string
  onCollectionChange: (collectionId: string) => void
  collections: Array<{ id: string; title: string; artworkUrl?: string; trackCount?: number }>
}

const DEFAULT_ARTWORK = "/images/default-collection.svg"

export function CollectionHeader({
  selectedCollection,
  onCollectionChange,
  collections,
}: CollectionHeaderProps) {
  const collectionsWithMeta = useMemo(() => {
    return collections.map((collection) => ({
      id: collection.id,
      title: collection.title,
      subtitle: COLLECTION_NARRATIVES[collection.id]?.subtitle,
      artworkUrl: collection.artworkUrl || DEFAULT_ARTWORK,
      trackCount: collection.trackCount,
    }))
  }, [collections])

  return (
    <div className="mt-3">
      {/* Horizontal scrollable on mobile, grid on larger screens */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0">
        {collectionsWithMeta.map((collection) => {
          const isActive = collection.id === selectedCollection

          return (
            <button
              key={collection.id}
              type="button"
              onClick={() => onCollectionChange(collection.id)}
              className={`
                group relative flex-shrink-0 w-[200px] sm:w-auto
                flex items-center gap-3 rounded-2xl border p-3
                text-left transition-all duration-300 focus-ring backdrop-blur-md
                ${isActive
                  ? "border-white/30 shadow-[0_0_30px_rgba(124,58,237,0.4)] ring-1 ring-white/20"
                  : "border-white/15 hover:border-white/25"
                }
              `}
            >
              {/* Collection gradient background - always visible, glow only on active */}
              <div
                aria-hidden
                className={`
                  absolute inset-0 rounded-2xl ${getCollectionGradient(collection.id)}
                  transition-opacity duration-300
                  ${isActive ? "opacity-50" : "opacity-30 group-hover:opacity-40"}
                `}
              />

              {/* Artwork thumbnail */}
              <div className={`
                relative h-12 w-12 shrink-0 overflow-hidden rounded-xl
                shadow-md transition-all duration-300
                ${isActive ? "ring-2 ring-white/40" : "ring-1 ring-white/10 group-hover:ring-white/20 group-hover:scale-105"}
              `}>
                <Image
                  src={collection.artworkUrl}
                  alt={collection.title}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </div>

              {/* Content */}
              <div className="relative z-10 min-w-0 flex-1">
                <p className={`
                  font-heading text-sm font-bold truncate text-heading-solid transition-opacity
                  ${isActive ? "opacity-100" : "opacity-80 group-hover:opacity-100"}
                `}>
                  {collection.title}
                </p>
                {collection.trackCount && (
                  <p className={`
                    text-xs truncate transition-colors
                    ${isActive ? "text-white/70" : "text-white/55 group-hover:text-white/65"}
                  `}>
                    {collection.trackCount} tracks
                  </p>
                )}
              </div>

              {/* Active indicator */}
              {isActive && (
                <div className="relative z-10 flex h-5 w-5 items-center justify-center rounded-full bg-white/25 shadow-[0_0_12px_rgba(255,255,255,0.5)]">
                  <Check className="h-3 w-3 text-white" strokeWidth={3} />
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
