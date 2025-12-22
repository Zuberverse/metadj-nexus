/**
 * Audio Volume Hook
 *
 * Extracted from use-audio-playback to manage volume state:
 * - Volume level (0-1)
 * - Mute state
 * - localStorage persistence
 * - External state integration
 */

import { useCallback, useEffect, useState } from 'react'
import { isStorageAvailable, STORAGE_KEYS, getNumber, setNumber } from '@/lib/storage/persistence'

const DEFAULT_VOLUME = 1.0

interface UseAudioVolumeOptions {
  /** External volume value (controlled mode) */
  externalVolume?: number
  /** External mute state (controlled mode) */
  externalIsMuted?: boolean
  /** Callback when volume changes (controlled mode) */
  onVolumeChange?: (volume: number) => void
  /** Callback when mute state changes (controlled mode) */
  onMuteChange?: (muted: boolean) => void
  /** Audio element ref to apply volume changes */
  audioRef: React.RefObject<HTMLAudioElement | null>
}

interface UseAudioVolumeReturn {
  /** Current volume (0-1) */
  volume: number
  /** Whether audio is muted */
  isMuted: boolean
  /** Update volume level */
  setVolume: (volume: number) => void
  /** Update mute state */
  setIsMuted: (muted: boolean) => void
  /** Toggle mute on/off */
  toggleMute: () => void
}

/**
 * Load initial volume from localStorage
 */
function loadStoredVolume(): number {
  if (!isStorageAvailable()) return DEFAULT_VOLUME

  const volume = getNumber(STORAGE_KEYS.VOLUME, DEFAULT_VOLUME)
  return volume >= 0 && volume <= 1 ? volume : DEFAULT_VOLUME
}

/**
 * Save volume to localStorage
 */
function saveStoredVolume(volume: number): void {
  if (!isStorageAvailable()) return

  setNumber(STORAGE_KEYS.VOLUME, volume)
}

/**
 * Hook for managing audio volume state
 *
 * Supports both controlled mode (with external state) and uncontrolled mode
 * (with internal state and localStorage persistence)
 */
export function useAudioVolume({
  externalVolume,
  externalIsMuted,
  onVolumeChange,
  onMuteChange,
  audioRef,
}: UseAudioVolumeOptions): UseAudioVolumeReturn {
  // Internal state (used when external state not provided)
  const [internalVolume, setInternalVolume] = useState(loadStoredVolume)
  const [internalIsMuted, setInternalIsMuted] = useState(false)

  // Resolve to external or internal state
  const volume = externalVolume ?? internalVolume
  const isMuted = externalIsMuted ?? internalIsMuted
  const setVolumeState = onVolumeChange ?? setInternalVolume
  const setMuteState = onMuteChange ?? setInternalIsMuted

  // Apply volume to audio element
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = volume

    // Persist to localStorage
    saveStoredVolume(volume)
  }, [volume, audioRef])

  // Apply mute state to audio element
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.muted = isMuted
  }, [isMuted, audioRef])

  // Set volume with auto-unmute when volume > 0
  const setVolume = useCallback(
    (newVolume: number) => {
      const clamped = Math.max(0, Math.min(1, newVolume))
      setVolumeState(clamped)

      // Auto-unmute when setting volume above 0
      if (clamped > 0 && isMuted) {
        setMuteState(false)
      }
    },
    [setVolumeState, setMuteState, isMuted]
  )

  // Toggle mute state
  const toggleMute = useCallback(() => {
    setMuteState(!isMuted)
  }, [setMuteState, isMuted])

  return {
    volume,
    isMuted,
    setVolume,
    setIsMuted: setMuteState,
    toggleMute,
  }
}
