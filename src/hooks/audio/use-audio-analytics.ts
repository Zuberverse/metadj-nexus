/**
 * Audio Analytics Hook
 *
 * Extracted from use-audio-playback to manage analytics tracking for:
 * - Track played events
 * - Track completed events
 * - Track skipped events
 * - Playback control events (play, pause, seek, volume)
 */

import { useCallback, useEffect, useRef } from 'react'
import {
  trackTrackPlayed,
  trackTrackCompleted,
  trackTrackSkipped,
  trackPlaybackControl,
  calculatePercentagePlayed,
} from '@/lib/analytics'
import { logger } from '@/lib/logger'
import type { Track } from '@/types'

interface UseAudioAnalyticsOptions {
  track: Track | null
  currentTime: number
  duration: number
}

interface UseAudioAnalyticsReturn {
  trackPlayedRef: React.MutableRefObject<boolean>
  trackCompletedRef: React.MutableRefObject<boolean>
  playbackStartTimeRef: React.MutableRefObject<number>
  onTrackPlay: () => void
  onTrackComplete: () => void
  onPlaybackControl: (action: 'play' | 'pause' | 'seek' | 'volume', value?: number) => void
  resetTrackingRefs: () => void
}

/**
 * Hook for managing audio playback analytics
 *
 * Handles tracking of:
 * - First play event per track
 * - Track completion (listened to end)
 * - Track skip (changed before completion)
 * - Playback controls (play, pause, seek, volume)
 */
export function useAudioAnalytics({
  track,
  currentTime,
  duration,
}: UseAudioAnalyticsOptions): UseAudioAnalyticsReturn {
  // Analytics tracking refs
  const trackPlayedRef = useRef(false)
  const trackCompletedRef = useRef(false)
  const previousTrackRef = useRef<Track | null>(null)
  const playbackStartTimeRef = useRef<number>(0)
  const volumeDebounceRef = useRef<NodeJS.Timeout | null>(null)

  // Reset tracking refs when track changes
  const resetTrackingRefs = useCallback(() => {
    trackPlayedRef.current = false
    trackCompletedRef.current = false
    playbackStartTimeRef.current = 0
  }, [])

  // Track skip when user changes tracks before completion
  useEffect(() => {
    if (previousTrackRef.current && track && previousTrackRef.current.id !== track.id) {
      const prevTrack = previousTrackRef.current
      const playedSeconds = currentTime
      const totalDuration = duration

      // Only track as "skipped" if user didn't listen to most of the track
      if (totalDuration > 0 && playedSeconds < totalDuration - 5 && !trackCompletedRef.current) {
        try {
          trackTrackSkipped({
            trackId: prevTrack.id,
            trackTitle: prevTrack.title,
            playedSeconds: Math.floor(playedSeconds),
            totalDuration: Math.floor(totalDuration),
            percentagePlayed: calculatePercentagePlayed(playedSeconds, totalDuration),
          })
        } catch (error) {
          logger.warn('Analytics: Failed to track skip event', { error: String(error) })
        }
      }
    }

    previousTrackRef.current = track
  }, [track, currentTime, duration])

  // Cleanup volume debounce timer on unmount
  useEffect(() => {
    return () => {
      if (volumeDebounceRef.current) {
        clearTimeout(volumeDebounceRef.current)
      }
    }
  }, [])

  // Track first play event for current track
  // Using synchronous ref check-and-set to prevent double-fire race conditions
  const onTrackPlay = useCallback(() => {
    if (!track) return
    
    // Atomically check and set to prevent race conditions from rapid play events
    if (trackPlayedRef.current) return
    trackPlayedRef.current = true
    
    try {
      trackTrackPlayed({
        trackId: track.id,
        trackTitle: track.title,
        collection: track.collection,
        source: 'queue',
      })
      playbackStartTimeRef.current = 0
    } catch (error) {
      logger.warn('Analytics: Failed to track play event', { error: String(error) })
    }
  }, [track])

  // Track completion event
  const onTrackComplete = useCallback(() => {
    if (!trackCompletedRef.current && track) {
      try {
        trackTrackCompleted({
          trackId: track.id,
          trackTitle: track.title,
          duration: duration,
          listenedToEnd: true,
        })
        trackCompletedRef.current = true
      } catch (error) {
        logger.warn('Analytics: Failed to track completion event', { error: String(error) })
      }
    }
  }, [track, duration])

  // Track playback control events (debounced for volume)
  const onPlaybackControl = useCallback(
    (action: 'play' | 'pause' | 'seek' | 'volume', value?: number) => {
      if (!track) return

      if (action === 'volume') {
        // Debounce volume tracking
        if (volumeDebounceRef.current) {
          clearTimeout(volumeDebounceRef.current)
        }

        volumeDebounceRef.current = setTimeout(() => {
          try {
            trackPlaybackControl({
              action,
              trackId: track.id,
              value,
            })
          } catch (error) {
            logger.warn('Analytics: Failed to track volume control', { error: String(error) })
          }
        }, 500)
      } else {
        try {
          trackPlaybackControl({
            action,
            trackId: track.id,
            value,
          })
        } catch (error) {
          logger.warn(`Analytics: Failed to track ${action} control`, { error: String(error) })
        }
      }
    },
    [track]
  )

  return {
    trackPlayedRef,
    trackCompletedRef,
    playbackStartTimeRef,
    onTrackPlay,
    onTrackComplete,
    onPlaybackControl,
    resetTrackingRefs,
  }
}
