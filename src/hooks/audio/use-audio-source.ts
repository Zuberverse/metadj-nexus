/**
 * Audio Source Hook
 *
 * Extracted from use-audio-playback to manage audio source resolution:
 * - Resolves cached blob URLs vs direct URLs
 * - Handles cache bypass for first play (mobile gesture context)
 * - Tracks audio unlock state
 */

import { useEffect, useRef, useState } from 'react'
import { getCachedUrl } from './use-audio-preloader'
import type { Track } from '@/types'

interface UseAudioSourceOptions {
  track: Track | null
  /** Callback when track ID changes to reset external state */
  onTrackChange?: (newTrackId: string) => void
}

interface UseAudioSourceReturn {
  /** Resolved audio source URL (cached blob or direct) */
  audioSrc: string | undefined
  /** Whether audio has been unlocked in this session */
  audioUnlockedRef: React.MutableRefObject<boolean>
  /** Mark audio as unlocked after successful play */
  markAudioUnlocked: () => void
}

/**
 * Hook for resolving and managing audio source URLs
 *
 * On mobile, preloaded blob URLs may not preserve user gesture context.
 * This hook handles bypassing cache on first play to ensure audio unlock works.
 * After audio is unlocked, it uses cached blob URLs for better performance.
 */
export function useAudioSource({
  track,
  onTrackChange,
}: UseAudioSourceOptions): UseAudioSourceReturn {
  const [audioSrc, setAudioSrc] = useState<string | undefined>(undefined)
  const audioUnlockedRef = useRef(false)
  const previousTrackIdRef = useRef<string | null>(null)

  // Mark audio as unlocked (called after successful play)
  const markAudioUnlocked = () => {
    audioUnlockedRef.current = true
  }

  // Resolve audio source when track changes
  useEffect(() => {
    let cancelled = false

    if (!track) {
      setAudioSrc(undefined)
      previousTrackIdRef.current = null
      return
    }

    // Only notify parent when track ID actually changes (not just object reference)
    const isNewTrack = previousTrackIdRef.current !== track.id
    if (isNewTrack) {
      previousTrackIdRef.current = track.id
      onTrackChange?.(track.id)
    }

    const trackId = track.id
    const trackUrl = track.audioUrl

    // On mobile, preloaded blob URLs may not preserve user gesture context
    // Skip cache on first play to ensure audio unlock works properly
    const shouldBypassCache = !audioUnlockedRef.current

    if (shouldBypassCache) {
      // Use original URL for first play to maintain user gesture context
      setAudioSrc(trackUrl)
    } else {
      // Check if already cached - use immediately if so
      const cachedUrl = getCachedUrl(trackId)
      if (cachedUrl) {
        setAudioSrc(cachedUrl)
      } else {
        // Use original URL immediately for fast playback start
        // Cache preload happens in background via useAudioPreloader
        setAudioSrc(trackUrl)
      }
    }

    return () => {
      cancelled = true
    }
  }, [track, onTrackChange])

  return {
    audioSrc,
    audioUnlockedRef,
    markAudioUnlocked,
  }
}
