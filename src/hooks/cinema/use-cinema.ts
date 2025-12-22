/**
 * Cinema Hook
 *
 * Main orchestrating hook for the fullscreen cinema experience.
 *
 * Composes:
 * - use-cinema-controls.ts - Controls visibility and auto-hide
 * - use-cinema-video.ts - Video sync and error handling
 * - use-cinema-analytics.ts - Analytics tracking
 *
 * Handles:
 * - Cinema toggle state
 * - Focus management for accessibility
 * - Fullscreen mode
 * - Scene selection with localStorage persistence
 * - Coordination with other UI features (Wisdom, MetaDJai)
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useBodyScrollLock } from '@/hooks/use-body-scroll-lock'
import { DREAM_PROMPT_BASE, DREAM_PROMPT_DEFAULT_PRESENTATION, useDream } from '@/hooks/use-dream'
import { logger } from '@/lib/logger'
import { STORAGE_KEYS, getBoolean, getString, setString } from '@/lib/storage/persistence'
import { useCinemaAnalytics } from './use-cinema-analytics'
import { useCinemaControls } from './use-cinema-controls'
import { useCinemaVideo } from './use-cinema-video'
import type { Track } from '@/types'
import type { DaydreamPresentation } from '@/types/daydream'

interface UseCinemaOptions {
  currentTrack: Track | null
  shouldPlay: boolean
  headerHeight: number
  wisdomEnabled?: boolean
  setWisdomEnabled?: (enabled: boolean) => void
  isQueueOpen?: boolean
  isMetaDjAiOpen?: boolean
  setMetaDjAiOpen?: (enabled: boolean) => void
}

/**
 * Custom hook for managing the fullscreen cinema experience
 *
 * Cinema Video Behavior Matrix:
 * - Cinema closed + audio paused → video paused
 * - Cinema closed + audio playing → video paused (cinema not visible)
 * - Open cinema while audio paused → video paused at 0
 * - Open cinema while audio playing → video playing from 0
 * - Cinema open + pause audio → video pauses at current position
 * - Cinema open + resume audio → video plays from paused position
 * - Cinema open + close cinema → video pauses and resets to 0
 * - Cinema open + change track (while playing) → video continues (continuous loop)
 * - Cinema open + change track (while paused) → video stays paused
 */
export function useCinema({
  currentTrack,
  shouldPlay,
  headerHeight,
  wisdomEnabled,
  setWisdomEnabled,
  isQueueOpen = false,
  isMetaDjAiOpen = false,
  setMetaDjAiOpen,
}: UseCinemaOptions) {
  // Cinema state
  const [cinemaEnabled, setCinemaEnabled] = useState(false)
  const [keepCinemaMounted, setKeepCinemaMounted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [posterOnly, setPosterOnly] = useState<boolean>(false)
  const persistedPosterOnlyRef = useRef<boolean | null>(null)

  // Refs for focus management
  const cinemaDialogRef = useRef<HTMLDivElement | null>(null)
  const cinemaFocusRestoreRef = useRef<HTMLElement | null>(null)

  // Lock body scroll when in fullscreen cinema
  useBodyScrollLock(cinemaEnabled && isFullscreen)

  // Keep the overlay mounted after first open so repeated toggles are instant.
  useEffect(() => {
    if (cinemaEnabled) {
      setKeepCinemaMounted(true)
    }
  }, [cinemaEnabled])

  // Hydrate state from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return

    const persisted = getBoolean(STORAGE_KEYS.CINEMA_POSTER_ONLY, false)
    persistedPosterOnlyRef.current = persisted
    setPosterOnly(persisted)
  }, [])

  // Compose sub-hooks
  const {
    cinemaVideoRef,
    cinemaVideoError,
    cinemaVideoReady,
    handleVideoError,
    handleVideoLoadedData,
    retryVideo,
    resetVideoState,
  } = useCinemaVideo({
    currentTrack,
    shouldPlay,
    cinemaEnabled,
    posterOnly,
  })

  const { cinemaOpenAtRef } = useCinemaAnalytics({
    cinemaEnabled,
    currentTrack,
  })

  // Handle cinema toggle
  const handleCinemaToggle = useCallback(() => {
    const nextState = !cinemaEnabled
    setCinemaEnabled(nextState)

    if (nextState) {
      // Close other features when opening Cinema
      if (wisdomEnabled && setWisdomEnabled) {
        setWisdomEnabled(false)
      }
      if (isMetaDjAiOpen && setMetaDjAiOpen) {
        setMetaDjAiOpen(false)
      }

      // Scroll to top when opening cinema
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
      setIsFullscreen(false)
    } else {
      // Reset video state when closing cinema
      resetVideoState()
      setIsFullscreen(false)
      dreamCaptureReadyRef.current = false
    }
  }, [
    cinemaEnabled,
    wisdomEnabled,
    setWisdomEnabled,
    isMetaDjAiOpen,
    setMetaDjAiOpen,
    resetVideoState,
  ])

  // Focus management for accessibility
  useEffect(() => {
    if (!cinemaEnabled) return

    const dialog = cinemaDialogRef.current
    if (!dialog) return

    // Store current focus for restoration
    cinemaFocusRestoreRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null

    const focusSelector =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    const getFocusableElements = () =>
      Array.from(dialog.querySelectorAll<HTMLElement>(focusSelector)).filter(
        (element) =>
          !element.hasAttribute('disabled') &&
          element.getAttribute('aria-hidden') !== 'true' &&
          element.tabIndex !== -1
      )

    // Focus initial element
    const initialFocusTarget =
      dialog.querySelector<HTMLElement>('[data-cinema-focus="initial"]') ??
      getFocusableElements()[0]
    initialFocusTarget?.focus()

    // Trap focus within dialog
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return

      const focusableElements = getFocusableElements()
      if (focusableElements.length === 0) {
        event.preventDefault()
        return
      }

      const activeElement = document.activeElement as HTMLElement | null
      const currentIndex = activeElement ? focusableElements.indexOf(activeElement) : -1

      let nextIndex = currentIndex
      if (event.shiftKey) {
        nextIndex = currentIndex <= 0 ? focusableElements.length - 1 : currentIndex - 1
      } else {
        nextIndex = currentIndex === focusableElements.length - 1 ? 0 : currentIndex + 1
      }

      event.preventDefault()
      focusableElements[
        (nextIndex + focusableElements.length) % focusableElements.length
      ]?.focus()
    }

    document.addEventListener('keydown', handleKeyDown, true)

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true)
      // Restore focus
      const previousFocus = cinemaFocusRestoreRef.current
      if (previousFocus && typeof previousFocus.focus === 'function') {
        previousFocus.focus()
      }
      cinemaFocusRestoreRef.current = null
    }
  }, [cinemaEnabled])

  // Daydream integration
  // Lifted here to persist across Shell swaps (Desktop/Mobile)
  const intermediateCanvasRef = useRef<HTMLCanvasElement | null>(null)
  // Tracks whether the intermediate canvas has drawn at least one real frame (webcam/video/visualizer)
  const dreamCaptureReadyRef = useRef(false)

  const [dreamPresentation, setDreamPresentation] = useState<DaydreamPresentation>(DREAM_PROMPT_DEFAULT_PRESENTATION)
  const [dreamPromptBase, setDreamPromptBase] = useState(DREAM_PROMPT_BASE)

  // Restore presentation (gender) from localStorage, but NOT the prompt.
  // Prompt always resets to default on app restart for a fresh creative start.
  useEffect(() => {
    if (typeof window === "undefined") return
    const stored = getString(STORAGE_KEYS.DREAM_PRESENTATION, DREAM_PROMPT_DEFAULT_PRESENTATION)
    if (stored === "androgynous" || stored === "female" || stored === "male") {
      setDreamPresentation(stored)
    }
    // Prompt intentionally NOT restored - resets to DREAM_PROMPT_BASE on every app load
  }, [])

  const handleDreamPresentationChange = useCallback((next: DaydreamPresentation) => {
    logger.debug("[Dream] Presentation changed", { from: dreamPresentation, to: next })
    setDreamPresentation(next)
    setString(STORAGE_KEYS.DREAM_PRESENTATION, next)
  }, [dreamPresentation])

  const handleDreamPromptBaseChange = useCallback((next: string) => {
    const trimmed = next.trim() || DREAM_PROMPT_BASE
    logger.debug("[Dream] Prompt base changed", { from: dreamPromptBase, to: trimmed })
    setDreamPromptBase(trimmed)
    // Prompt is NOT persisted - resets to default on app restart
  }, [dreamPromptBase])

  // Capture stream from the intermediate canvas
  const getDreamCaptureStream = useCallback(async () => {
    let attempts = 0
    const maxAttempts = 40

    while (attempts < maxAttempts) {
      const canvas = intermediateCanvasRef.current
      if (canvas && typeof canvas.captureStream === "function") {
        const stream = canvas.captureStream(30)
        const track = stream.getVideoTracks()[0]

        // A live track is enough to start WHIP ingest; the draw loop can "warm up" the canvas
        // with fallback frames (and then webcam frames) after the stream begins.
        if (track && track.enabled && track.readyState === "live") {
          try {
            if ("contentHint" in track) {
              track.contentHint = "motion"
            }
          } catch {
            // ignore
          }
          logger.debug("[Dream] Capture stream acquired", {
            drawLoopReady: dreamCaptureReadyRef.current,
          })
          return stream
        }

        // If track isn't usable yet, stop it before retrying
        stream.getTracks().forEach((track) => {
          try {
            track.stop()
          } catch {
            // ignore
          }
        })
      }

      await new Promise((resolve) => setTimeout(resolve, 200))
      attempts += 1
    }

    logger.error(`[Dream] Failed to capture stream after ${maxAttempts} attempts`)
    return null
  }, [])

  const composedPrompt = `${dreamPresentation} ${dreamPromptBase}`

  const {
    status: dreamStatus,
    isConfigured: dreamConfigured,
    overlayReady: dreamOverlayReady,
    startDream,
    stopDream,
    retryDream,
    forceSync: forceDreamSync,
    patchSupported: dreamPatchSupported,
  } = useDream({
    getCaptureStream: getDreamCaptureStream,
    prompt: composedPrompt,
    enabled: cinemaEnabled,
  })


  // Wrap stopDream to also reset prompt state to defaults
  // This ensures a "fresh start" every time the user stops/restarts the stream
  const handleStopDream = useCallback(async () => {
    logger.debug("[useCinema] Stopping dream and resetting prompt state")
    await stopDream()

    // Reset to defaults
    setDreamPresentation(DREAM_PROMPT_DEFAULT_PRESENTATION)
    setDreamPromptBase(DREAM_PROMPT_BASE)

    // Reset presentation persistence (prompt is not persisted)
    if (typeof window !== "undefined") {
      setString(STORAGE_KEYS.DREAM_PRESENTATION, DREAM_PROMPT_DEFAULT_PRESENTATION)
    }
  }, [stopDream])

  const {
    cinemaControlsVisible,
    resetCinemaControlsTimer,
    hideCinemaControlsImmediately,
  } = useCinemaControls({
    cinemaEnabled,
    isQueueOpen,
  })

  // If the user exits Cinema, Dream must fully shut down.
  // CinemaOverlay unmounts when Cinema closes, so cleanup has to live here.
  useEffect(() => {
    if (!cinemaEnabled && dreamStatus.status !== "idle") {
      logger.debug("[useCinema] Cinema closed, stopping Dream")
      void stopDream()
    }
  }, [cinemaEnabled, dreamStatus.status, stopDream])

  return {
    cinemaEnabled,
    keepCinemaMounted,
    cinemaControlsVisible,
    cinemaVideoError,
    cinemaVideoReady,
    cinemaVideoRef,
    cinemaDialogRef,
    cinemaFocusRestoreRef,
    cinemaOpenAtRef,
    headerHeight,
    resetCinemaControlsTimer,
    hideCinemaControlsImmediately,
    handleCinemaToggle,
    handleVideoError,
    handleVideoLoadedData,
    retryVideo,
    setCinemaEnabled,
    isFullscreen,
    setIsFullscreen,
    posterOnly,
    // Dream state
    dream: {
      status: dreamStatus,
      isConfigured: dreamConfigured,
      overlayReady: dreamOverlayReady,
      startDream,
      stopDream: handleStopDream,
      retryDream,
      forceSync: forceDreamSync,
      intermediateCanvasRef,
      captureReadyRef: dreamCaptureReadyRef,
      presentation: dreamPresentation,
      setPresentation: handleDreamPresentationChange,
      promptBase: dreamPromptBase,
      setPromptBase: handleDreamPromptBaseChange,
      // null = unknown, true = PATCH works, false = PATCH failed (restart needed for changes)
      patchSupported: dreamPatchSupported,
    }
  }
}
