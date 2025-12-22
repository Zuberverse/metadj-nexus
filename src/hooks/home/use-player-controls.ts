import { useCallback } from "react"
import type { PlayerContextValue, QueueContextValue, UIContextValue, Track } from "@/types"

interface UsePlayerControlsOptions {
  player: PlayerContextValue
  queue: QueueContextValue
  ui: UIContextValue
  showToast: (options: { message: string }) => void
  toggleQueueVisibility: () => void
  openDetails: (track: Track) => void
}

interface UsePlayerControlsReturn {
  handleQueueToggle: () => void
  handleVolumeUp: () => void
  handleVolumeDown: () => void
  handleMute: () => void
  togglePlayPause: () => void
  handleFocusSearch: () => void
  handleShowTrackDetails: () => void
  handleCollectionDetailsClose: () => void
}

/**
 * Manages player-related control handlers
 * Includes volume, playback, queue visibility, and track details
 */
export function usePlayerControls({
  player,
  queue,
  ui,
  showToast,
  toggleQueueVisibility,
  openDetails,
}: UsePlayerControlsOptions): UsePlayerControlsReturn {
  const handleQueueToggle = useCallback(() => {
    if (queue.queue.length === 0) {
      showToast({ message: "Add tracks to start your queue" })
      return
    }
    toggleQueueVisibility()
  }, [queue.queue.length, toggleQueueVisibility, showToast])

  const handleVolumeUp = useCallback(() => {
    player.setVolume(Math.min(player.volume + 0.1, 1.0))
  }, [player])

  const handleVolumeDown = useCallback(() => {
    player.setVolume(Math.max(player.volume - 0.1, 0))
  }, [player])

  const handleMute = useCallback(() => {
    player.toggleMute()
  }, [player])

  const togglePlayPause = useCallback(() => {
    if (!player.currentTrack) {
      ui.setLeftPanelTab("browse")
      ui.openLeftPanel()
      window.dispatchEvent(new CustomEvent("metadj:openMusicPanel"))
      showToast({ message: "Choose a track to start listening" })
      return
    }
    player.setShouldPlay(!player.shouldPlay)
  }, [player, showToast, ui])

  const handleFocusSearch = useCallback(() => {
    const searchInput = document.getElementById('metadj-search-input') as HTMLInputElement | null
    if (searchInput) {
      searchInput.focus()
      return
    }
    window.dispatchEvent(new CustomEvent("metadj:openSearch"))
  }, [])

  const handleShowTrackDetails = useCallback(() => {
    if (player.currentTrack) {
      openDetails(player.currentTrack)
    }
  }, [player.currentTrack, openDetails])

  const handleCollectionDetailsClose = useCallback(() => {
    ui.setCollectionDetails(null)
    ui.setCollectionDetailsOpen(false)
  }, [ui])

  return {
    handleQueueToggle,
    handleVolumeUp,
    handleVolumeDown,
    handleMute,
    togglePlayPause,
    handleFocusSearch,
    handleShowTrackDetails,
    handleCollectionDetailsClose,
  }
}
