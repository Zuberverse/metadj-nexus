"use client"

import { useEffect, useRef } from "react"
import type { PlayerContextValue, QueueContextValue, UIContextValue } from "@/types"

interface UseHomeQueueLifecycleOptions {
  queue: QueueContextValue
  ui: UIContextValue
  player: PlayerContextValue
  setSelectedCollection: (collectionId: string, source?: 'default' | 'hydrate' | 'user' | 'system') => void
}

/**
 * Centralizes queue lifecycle logic that previously lived inline inside HomePageClient.
 *
 * Notes:
 * - View switching is state-driven (no route pushes for tabs); Wisdom items support optional deep links for sharing.
 * - Startup is intentionally a "null playback" state (no track selected).
 */
export function useHomeQueueLifecycle({
  queue,
  ui,
  player,
  setSelectedCollection,
}: UseHomeQueueLifecycleOptions) {
  const appliedStoredUiStateRef = useRef(false)
  const appliedPersistedQueueRef = useRef(false)

  // Apply stored UI state (selected collection + search query)
  useEffect(() => {
    if (!queue.isHydrated) return
    if (appliedStoredUiStateRef.current) return

    const metadata = queue.persistenceMetadata
    if (metadata?.selectedCollection && metadata.selectedCollection !== ui.selectedCollection) {
      setSelectedCollection(metadata.selectedCollection, 'hydrate')
    }
    if (metadata?.searchQuery && metadata.searchQuery !== ui.searchQuery) {
      ui.setSearchQuery(metadata.searchQuery)
    }

    appliedStoredUiStateRef.current = true
  }, [
    queue.isHydrated,
    queue.persistenceMetadata,
    ui,
    ui.selectedCollection,
    ui.searchQuery,
    setSelectedCollection,
  ])

  // Keep persisted metadata in sync with current UI + player state
  useEffect(() => {
    if (!queue.isHydrated) return

    const hasPersistedQueue = queue.persistenceMetadata?.currentTrackId !== undefined
    if (hasPersistedQueue && !appliedPersistedQueueRef.current && !player.currentTrack) {
      return
    }

    const current = queue.persistenceMetadata ?? {}
    const normalizedSearch = ui.searchQuery.trim() || undefined
    const currentTrackId = player.currentTrack?.id
    const currentIndex = player.currentIndex >= 0 ? player.currentIndex : undefined
    const wasPlaying = player.shouldPlay

    if (
      current.selectedCollection === ui.selectedCollection &&
      (current.searchQuery ?? undefined) === normalizedSearch &&
      current.currentTrackId === currentTrackId &&
      current.currentIndex === currentIndex &&
      current.wasPlaying === wasPlaying
    ) {
      return
    }

    queue.updatePersistenceMetadata({
      selectedCollection: ui.selectedCollection,
      searchQuery: normalizedSearch,
      currentTrackId,
      currentIndex,
      wasPlaying,
    })
  }, [
    queue,
    queue.isHydrated,
    queue.persistenceMetadata,
    queue.updatePersistenceMetadata,
    ui.selectedCollection,
    ui.searchQuery,
    player.currentTrack,
    player.currentIndex,
    player.shouldPlay,
  ])

  // Normalize startup playback state: no current track selected.
  useEffect(() => {
    if (!queue.isHydrated) return
    if (appliedPersistedQueueRef.current) return
    if (player.currentTrack) return

    const metadata = queue.persistenceMetadata

    if (
      metadata?.currentTrackId ||
      metadata?.currentIndex !== undefined ||
      metadata?.wasPlaying !== undefined
    ) {
      queue.updatePersistenceMetadata({
        currentTrackId: undefined,
        currentIndex: undefined,
        wasPlaying: undefined,
      })
    }

    if (player.shouldPlay) {
      player.setShouldPlay(false)
    }
    if (player.currentIndex !== -1) {
      player.setCurrentIndex(-1)
    }

    appliedPersistedQueueRef.current = true
  }, [
    player,
    queue,
    queue.isHydrated,
    queue.persistenceMetadata,
    queue.updatePersistenceMetadata,
    player.currentTrack,
    player.shouldPlay,
    player.setShouldPlay,
    player.currentIndex,
    player.setCurrentIndex,
  ])
}
