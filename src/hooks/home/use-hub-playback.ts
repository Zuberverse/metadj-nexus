import { useCallback, useState } from "react"
import { getTracksByCollection } from "@/lib/music"
import { normalizeCollectionSlug } from "@/lib/music/utils"
import type { Collection, Track } from "@/types"

interface UseHubPlaybackOptions {
  tracks: Track[]
  collections: Collection[]
  setSelectedCollection: (collectionId: string, source?: 'default' | 'hydrate' | 'user' | 'system') => void
  handleTrackClick: (track: Track, tracksOverride?: Track[]) => void
  handleTrackQueueAdd: (track: Track) => void
  showToast: (options: { message: string }) => void
  shouldUseSidePanels: boolean
  panels: { left: { isOpen: boolean } }
  openLeftPanel: () => void
}

interface UseHubPlaybackReturn {
  activeMoodChannelId: string | null
  setActiveMoodChannelId: (id: string | null) => void
  syncCollectionSelection: (track: Track) => void
  handleHubTrackPlay: (track: Track) => void
  handleHubTrackQueueAdd: (track: Track) => void
  handlePlayMoodChannel: (trackIds: string[], moodChannelId?: string) => void
}

/**
 * Manages hub-specific playback handlers
 * Includes track play, queue add, mood channel play, and collection sync
 */
export function useHubPlayback({
  tracks,
  collections,
  setSelectedCollection,
  handleTrackClick,
  handleTrackQueueAdd,
  showToast,
  shouldUseSidePanels,
  panels,
  openLeftPanel,
}: UseHubPlaybackOptions): UseHubPlaybackReturn {
  // Mood channel state for left panel synchronization
  const [activeMoodChannelId, setActiveMoodChannelId] = useState<string | null>(null)

  const syncCollectionSelection = useCallback(
    (track: Track) => {
      const trackSlug = normalizeCollectionSlug(track.collection)
      const match = collections.find((collection) => {
        const collectionSlug = normalizeCollectionSlug(collection.id)
        const collectionTitleSlug = normalizeCollectionSlug(collection.title)
        return (
          collectionSlug === trackSlug ||
          collectionTitleSlug === trackSlug
        )
      })
      if (match) {
        setSelectedCollection(match.id, 'user')
      }
    },
    [collections, setSelectedCollection],
  )

  const handleHubTrackPlay = useCallback(
    (track: Track) => {
      syncCollectionSelection(track)
      
      // Get the tracks for this track's collection to avoid race condition
      // This ensures the queue is built from the correct collection immediately
      const collectionTracksForQueue = getTracksByCollection(track.collection, tracks)
      handleTrackClick(track, collectionTracksForQueue)
      
      // Auto-open the left panel when playing from Hub
      const panelWasClosed = !panels.left.isOpen
      if (shouldUseSidePanels && panelWasClosed) {
        openLeftPanel()
      } else if (!shouldUseSidePanels) {
        // On mobile, dispatch event to open music panel overlay with track context
        window.dispatchEvent(new CustomEvent("metadj:openMusicPanel", {
          detail: { trackId: track.id, collectionTitle: track.collection }
        }))
      }
      
      // Dispatch scroll-to-track event for both mobile and desktop
      // Delay if panel was closed to allow it to mount and register listeners
      const dispatchScrollEvent = () => {
        window.dispatchEvent(new CustomEvent("metadj:scrollToTrack", {
          detail: { trackId: track.id, collectionTitle: track.collection }
        }))
      }
      
      if (panelWasClosed || !shouldUseSidePanels) {
        // Panel needs time to mount - delay the event
        setTimeout(dispatchScrollEvent, 100)
      } else {
        // Panel already open, dispatch immediately
        dispatchScrollEvent()
      }
    },
    [handleTrackClick, syncCollectionSelection, tracks, shouldUseSidePanels, panels.left.isOpen, openLeftPanel],
  )

  const handleHubTrackQueueAdd = useCallback(
    (track: Track) => {
      syncCollectionSelection(track)
      handleTrackQueueAdd(track)
      
      // Auto-open the left panel when adding to queue from Hub
      const panelWasClosed = !panels.left.isOpen
      if (shouldUseSidePanels && panelWasClosed) {
        openLeftPanel()
      } else if (!shouldUseSidePanels) {
        // On mobile, dispatch event to open music panel overlay with track context
        window.dispatchEvent(new CustomEvent("metadj:openMusicPanel", {
          detail: { trackId: track.id, collectionTitle: track.collection }
        }))
      }
      
      // Dispatch scroll-to-track event for both mobile and desktop
      // Delay if panel was closed to allow it to mount and register listeners
      const dispatchScrollEvent = () => {
        window.dispatchEvent(new CustomEvent("metadj:scrollToTrack", {
          detail: { trackId: track.id, collectionTitle: track.collection }
        }))
      }
      
      if (panelWasClosed || !shouldUseSidePanels) {
        setTimeout(dispatchScrollEvent, 100)
      } else {
        dispatchScrollEvent()
      }
    },
    [handleTrackQueueAdd, syncCollectionSelection, shouldUseSidePanels, panels.left.isOpen, openLeftPanel],
  )

  const handlePlayMoodChannel = useCallback(
    (trackIds: string[], moodChannelId?: string) => {
      if (trackIds.length === 0) {
        showToast({ message: "No tracks match this mood" })
        return
      }

      // Convert track IDs to Track objects
      const channelTracks = trackIds
        .map((id) => tracks.find((t) => t.id === id))
        .filter((t): t is Track => t !== undefined)

      if (channelTracks.length === 0) {
        showToast({ message: "Unable to load mood channel" })
        return
      }

      // Play the first track and queue the rest
      const firstTrack = channelTracks[0]
      if (firstTrack) {
        syncCollectionSelection(firstTrack)
        // Build queue from mood channel tracks so playback context matches the channel
        handleTrackClick(firstTrack, channelTracks)

        showToast({ message: `Playing mood channel (${channelTracks.length} tracks)` })

        // Set active mood channel to sync with left panel
        if (moodChannelId) {
          setActiveMoodChannelId(moodChannelId)
        }

        // Auto-open the left panel to show the mood channel
        if (shouldUseSidePanels && !panels.left.isOpen) {
          openLeftPanel()
        } else if (!shouldUseSidePanels) {
          // On mobile, dispatch event to open music panel overlay
          window.dispatchEvent(new CustomEvent("metadj:openMusicPanel"))
        }
      }
    },
    [tracks, syncCollectionSelection, handleTrackClick, showToast, shouldUseSidePanels, panels.left.isOpen, openLeftPanel],
  )

  return {
    activeMoodChannelId,
    setActiveMoodChannelId,
    syncCollectionSelection,
    handleHubTrackPlay,
    handleHubTrackQueueAdd,
    handlePlayMoodChannel,
  }
}
