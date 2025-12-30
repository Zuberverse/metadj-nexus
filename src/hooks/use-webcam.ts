/**
 * Webcam Management Hook
 *
 * Handles webcam acquisition, stream lifecycle, and error states for Dream mode.
 * Automatically acquires webcam when enabled and releases when disabled.
 *
 * @module hooks/use-webcam
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { logger } from '@/lib/logger'

// ============================================================================
// Types
// ============================================================================

export interface UseWebcamOptions {
  /** Whether webcam should be active */
  enabled: boolean
  /** Video constraints for getUserMedia */
  constraints?: MediaStreamConstraints['video']
}

export interface UseWebcamReturn {
  /** Ref to attach to a video element for preview */
  videoRef: React.RefObject<HTMLVideoElement | null>
  /** Whether the webcam stream is ready and playing */
  isReady: boolean
  /** Error message if webcam acquisition failed */
  error: string | null
  /** Manually stop the webcam stream */
  stop: () => void
  /** Current MediaStream (for direct access) */
  stream: MediaStream | null
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_CONSTRAINTS: MediaStreamConstraints['video'] = {
  width: { ideal: 640 },
  height: { ideal: 480 },
  frameRate: { ideal: 30, max: 30 },
  facingMode: 'user',
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for managing webcam access and lifecycle
 *
 * Automatically acquires webcam when enabled and releases when disabled.
 * Handles permission errors, device not found, and camera in use scenarios.
 *
 * @param options - Configuration options
 * @returns Webcam state and controls
 *
 * @example
 * ```tsx
 * const { videoRef, isReady, error, stop } = useWebcam({ enabled: isDreamActive })
 *
 * return (
 *   <>
 *     <video ref={videoRef} autoPlay playsInline muted />
 *     {error && <div>{error}</div>}
 *   </>
 * )
 * ```
 */
export function useWebcam({
  enabled,
  constraints = DEFAULT_CONSTRAINTS,
}: UseWebcamOptions): UseWebcamReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Stop the webcam stream and clean up resources
   */
  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.srcObject = null
    }
    setIsReady(false)
    setError(null)
  }, [])

  /**
   * Acquire webcam when enabled, release when disabled
   */
  useEffect(() => {
    // Release webcam when disabled to avoid leaving camera running
    if (!enabled) {
      if (streamRef.current) stop()
      return
    }

    // Already have stream
    if (streamRef.current) return

    // Use AbortController to handle race conditions during async acquisition
    const controller = new AbortController()

    const acquireWebcam = async () => {
      logger.debug('[Webcam] Acquiring webcam...')
      setError(null)

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: constraints,
          audio: false,
        })

        // Check if aborted during async acquisition
        if (controller.signal.aborted) {
          stream.getTracks().forEach(t => t.stop())
          return
        }

        logger.debug('[Webcam] Webcam acquired')
        streamRef.current = stream

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          setIsReady(true)
          logger.debug('[Webcam] Stream attached to video element')

          try {
            await videoRef.current.play()

            // Check abort again after play() completes
            if (controller.signal.aborted) {
              stream.getTracks().forEach(t => t.stop())
              return
            }

            const videoSettings = stream.getVideoTracks()[0]?.getSettings()
            logger.debug('[Webcam] Video playing', {
              readyState: videoRef.current.readyState,
              videoWidth: videoRef.current.videoWidth,
              videoHeight: videoRef.current.videoHeight,
              trackSettings: videoSettings,
            })
          } catch (e) {
            const errorName = e instanceof Error ? e.name : String(e)
            if (controller.signal.aborted || errorName === 'AbortError') {
              logger.debug('[Webcam] Video play aborted')
            } else {
              logger.warn('[Webcam] Video play error', { error: e })
              setError('Camera preview failed')
            }
          }
        }
      } catch (err: unknown) {
        if (controller.signal.aborted) return

        const errorName = err instanceof Error ? err.name : String(err)
        const errorMessage = err instanceof Error ? err.message : String(err)
        logger.error('[Webcam] Acquisition failed', { name: errorName, message: errorMessage })

        // Map error types to user-friendly messages
        if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
          setError('Camera access denied')
        } else if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError') {
          setError('No camera found')
        } else if (errorName === 'NotReadableError' || errorName === 'TrackStartError') {
          setError('Camera in use')
        } else {
          setError('Camera error')
        }
      }
    }

    void acquireWebcam()

    return () => {
      controller.abort()
      stop()
    }
  }, [enabled, constraints, stop])

  return {
    videoRef,
    isReady,
    error,
    stop,
    stream: streamRef.current,
  }
}
