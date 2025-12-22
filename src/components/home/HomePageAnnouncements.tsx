"use client"

import { memo, useEffect, useState, useRef } from "react"
import { useToast } from "@/contexts/ToastContext"
import type { Track } from "@/types"

interface HomePageAnnouncementsProps {
  currentTrack: Track | null
  isPlaying: boolean
}

/**
 * Accessibility announcements for screen readers
 * Lives in a visually hidden region but announced by assistive tech
 *
 * Uses a technique of toggling announcement text to force re-announcement
 * when the track changes, even if transitioning between tracks with same name.
 */
function HomePageAnnouncementsComponent({
  currentTrack,
  isPlaying,
}: HomePageAnnouncementsProps) {
  const { toasts } = useToast()
  const [trackAnnouncement, setTrackAnnouncement] = useState('')
  const [playStateAnnouncement, setPlayStateAnnouncement] = useState('')
  const prevTrackIdRef = useRef<string | null>(null)
  const prevIsPlayingRef = useRef<boolean>(false)
  const isInitialMount = useRef(true)

  // Get the latest toast message for screen reader announcement
  const latestToastMessage = toasts.length > 0 ? toasts[toasts.length - 1].message : null

  // Announce track changes
  useEffect(() => {
    const trackId = currentTrack?.id ?? null

    // Skip initial mount to avoid announcing on page load
    if (isInitialMount.current) {
      isInitialMount.current = false
      prevTrackIdRef.current = trackId
      prevIsPlayingRef.current = isPlaying
      return
    }

    // Track changed
    if (trackId !== prevTrackIdRef.current && currentTrack) {
      // Clear first to ensure re-announcement
      setTrackAnnouncement('')
      // Use setTimeout to ensure the clear registers before setting new value
      setTimeout(() => {
        setTrackAnnouncement(`Now playing: ${currentTrack.title} by ${currentTrack.artist}`)
      }, 50)
    }

    prevTrackIdRef.current = trackId
  }, [currentTrack, isPlaying])

  // Announce play/pause state changes (separate from track changes)
  useEffect(() => {
    if (isInitialMount.current) return

    if (isPlaying !== prevIsPlayingRef.current && currentTrack) {
      // Only announce pause, not play (track change announcement handles play)
      if (!isPlaying) {
        setPlayStateAnnouncement('')
        setTimeout(() => {
          setPlayStateAnnouncement('Playback paused')
        }, 50)
      }
    }

    prevIsPlayingRef.current = isPlaying
  }, [isPlaying, currentTrack])

  return (
    <>
      {/* Toast announcements */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {latestToastMessage ?? ''}
      </div>
      {/* Track change announcements */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {trackAnnouncement}
      </div>
      {/* Play state announcements */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {playStateAnnouncement}
      </div>
    </>
  )
}

export const HomePageAnnouncements = memo(HomePageAnnouncementsComponent)
