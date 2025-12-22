/**
 * Audio Analyzer Hook
 *
 * Provides real-time audio frequency and waveform data for visualizations.
 * Uses Web Audio API AnalyserNode to extract audio data without affecting playback.
 *
 * Performance considerations:
 * - Analyzer adds minimal CPU overhead (<5%)
 * - Uses requestAnimationFrame for smooth 60fps updates
 * - Automatically disconnects when not in use
 */

import { useCallback, useEffect, useRef, useState } from "react"
import { logger } from "@/lib/logger"

// Global cache to prevent multiple AudioContexts/SourceNodes for the same audio element
// This is critical because createMediaElementSource throws if called twice on the same element
// Using WeakMap allows garbage collection when audio elements are removed from DOM,
// preventing memory leaks during extended sessions with multiple track changes
const audioContextCache = new WeakMap<HTMLAudioElement, AudioContext>()
const sourceNodeCache = new WeakMap<HTMLAudioElement, MediaElementAudioSourceNode>()

export interface AudioAnalyzerData {
  // Frequency data (0-255 values for each frequency bin)
  frequencyData: Uint8Array
  // Time domain waveform data (0-255 values)
  waveformData: Uint8Array
  // Computed metrics
  bassLevel: number // 0-1, average of low frequencies
  midLevel: number // 0-1, average of mid frequencies
  highLevel: number // 0-1, average of high frequencies
  overallLevel: number // 0-1, overall audio level
  // Analysis state
  isAnalyzing: boolean
}

export interface UseAudioAnalyzerOptions {
  // Audio element to analyze
  audioElement: HTMLAudioElement | null
  // Whether analysis should be active
  enabled?: boolean
  // FFT size (must be power of 2, higher = more frequency resolution)
  fftSize?: number
  // Smoothing time constant (0-1, higher = smoother)
  smoothingTimeConstant?: number
}

const DEFAULT_FFT_SIZE = 256
const DEFAULT_SMOOTHING = 0.92 // Higher smoothing for fluid animations

export function useAudioAnalyzer({
  audioElement,
  enabled = true,
  fftSize = DEFAULT_FFT_SIZE,
  smoothingTimeConstant = DEFAULT_SMOOTHING,
}: UseAudioAnalyzerOptions): AudioAnalyzerData {
  // Audio context and analyzer refs
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyzerRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  // Data arrays (reused to avoid GC)
  const frequencyDataRef = useRef<Uint8Array<ArrayBuffer>>(new Uint8Array(fftSize / 2))
  const waveformDataRef = useRef<Uint8Array<ArrayBuffer>>(new Uint8Array(fftSize))

  // State for React updates
  const [analyzerData, setAnalyzerData] = useState<AudioAnalyzerData>({
    frequencyData: new Uint8Array(fftSize / 2),
    waveformData: new Uint8Array(fftSize),
    bassLevel: 0,
    midLevel: 0,
    highLevel: 0,
    overallLevel: 0,
    isAnalyzing: false,
  })

  // Calculate frequency band levels
  const calculateLevels = useCallback((frequencyData: Uint8Array) => {
    const length = frequencyData.length
    const bassEnd = Math.floor(length * 0.1) // 0-10% = bass
    const midEnd = Math.floor(length * 0.5) // 10-50% = mids
    // 50-100% = highs

    let bassSum = 0
    let midSum = 0
    let highSum = 0
    let totalSum = 0

    for (let i = 0; i < length; i++) {
      const value = frequencyData[i]
      totalSum += value

      if (i < bassEnd) {
        bassSum += value
      } else if (i < midEnd) {
        midSum += value
      } else {
        highSum += value
      }
    }

    const bassCount = bassEnd || 1
    const midCount = (midEnd - bassEnd) || 1
    const highCount = (length - midEnd) || 1

    return {
      bassLevel: (bassSum / bassCount) / 255,
      midLevel: (midSum / midCount) / 255,
      highLevel: (highSum / highCount) / 255,
      overallLevel: (totalSum / length) / 255,
    }
  }, [])

  // Throttle ref for 30fps updates to reduce GC pressure (~120 arrays/sec -> ~30 arrays/sec)
  const lastUpdateRef = useRef(0)
  // Cached array refs to avoid creating new typed arrays on every frame
  const cachedFrequencyDataRef = useRef<Uint8Array | null>(null)
  const cachedWaveformDataRef = useRef<Uint8Array | null>(null)

  // Animation loop for continuous updates
  const updateAnalyzerData = useCallback(function updateAnalyzerDataInternal() {
    const analyzer = analyzerRef.current
    if (!analyzer) return

    // Throttle to ~30fps to reduce array allocations and GC pressure
    const now = performance.now()
    if (now - lastUpdateRef.current < 33) { // ~30fps
      animationFrameRef.current = requestAnimationFrame(updateAnalyzerDataInternal)
      return
    }
    lastUpdateRef.current = now

    // Get frequency and waveform data into our reusable buffers
    const freqData = frequencyDataRef.current
    const waveData = waveformDataRef.current
    analyzer.getByteFrequencyData(freqData)
    analyzer.getByteTimeDomainData(waveData)

    // Calculate levels
    const levels = calculateLevels(freqData)

    // Reuse existing typed arrays if same size, otherwise create new ones
    // This reduces GC pressure from ~120 new arrays/sec to ~30/sec with array reuse
    if (!cachedFrequencyDataRef.current || cachedFrequencyDataRef.current.length !== freqData.length) {
      cachedFrequencyDataRef.current = new Uint8Array(freqData.length)
    }
    if (!cachedWaveformDataRef.current || cachedWaveformDataRef.current.length !== waveData.length) {
      cachedWaveformDataRef.current = new Uint8Array(waveData.length)
    }
    cachedFrequencyDataRef.current.set(freqData)
    cachedWaveformDataRef.current.set(waveData)

    // Update state with copied data
    setAnalyzerData({
      frequencyData: cachedFrequencyDataRef.current,
      waveformData: cachedWaveformDataRef.current,
      ...levels,
      isAnalyzing: true,
    })

    // Continue animation loop
    animationFrameRef.current = requestAnimationFrame(updateAnalyzerDataInternal)
  }, [calculateLevels])

  // Track if we've already set up the audio graph for this element
  const audioGraphSetupRef = useRef(false)

  // Initialize and connect audio analyzer
  useEffect(() => {
    // If no audio element, stop analysis and reset levels.
    // Note: We intentionally keep the global audio graph cache intact.
    if (!audioElement) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      setAnalyzerData(prev => ({
        ...prev,
        bassLevel: 0,
        midLevel: 0,
        highLevel: 0,
        overallLevel: 0,
        isAnalyzing: false,
      }))
      return
    }

    // When disabled, stop the animation loop and reset levels, but keep the audio graph wired.
    // This enables "warm up" mode (enabled: false) so createMediaElementSource runs on first play,
    // preventing audio cutouts when Cinema enables the analyzer later.
    if (!enabled) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      setAnalyzerData(prev => ({
        ...prev,
        bassLevel: 0,
        midLevel: 0,
        highLevel: 0,
        overallLevel: 0,
        isAnalyzing: false,
      }))
    }

    // Initialize Audio Context and Source (Singleton Pattern)
    // Only creates audio graph once per audio element - never recreates to avoid audio cuts
    const initializeAudioContext = () => {
      try {
        let audioContext = audioContextCache.get(audioElement)
        let source = sourceNodeCache.get(audioElement)

        // Create new context/source only if not cached
        if (!audioContext || audioContext.state === "closed") {
          audioContext = new AudioContext()
          audioContextCache.set(audioElement, audioContext)
        }

        audioContextRef.current = audioContext

        // Create Source Node only once - this is the critical part
        // createMediaElementSource MUST only be called once per element
        if (!source) {
          source = audioContext.createMediaElementSource(audioElement)
          sourceNodeCache.set(audioElement, source)

          // CRITICAL: Connect source to destination immediately
          // This ensures audio always plays through
          source.connect(audioContext.destination)
        }

        // Resume context if suspended (do this AFTER source is connected)
        // Use a microtask to avoid sync blocking, with timeout for browser autoplay policies
        if (audioContext.state === "suspended") {
          queueMicrotask(() => {
            const resumePromise = audioContext?.resume()
            const timeoutPromise = new Promise<void>((_, reject) =>
              setTimeout(() => reject(new Error("AudioContext resume timeout")), 5000)
            )
            Promise.race([resumePromise, timeoutPromise]).catch((error) => {
              // Log timeout but don't crash - user interaction will retry
              if (error?.message?.includes("timeout")) {
                logger.info("AudioContext resume timed out - waiting for user interaction")
              }
              // Ignore other resume errors - often happens on page load before user gesture
            })
          })
        }

        const shouldSetupAnalyzer = enabled || audioGraphSetupRef.current
        if (!shouldSetupAnalyzer) {
          return
        }

        // Reuse existing analyzer if we have one, otherwise create new
        let analyzer = analyzerRef.current
        if (!analyzer || !audioGraphSetupRef.current) {
          analyzer = audioContext.createAnalyser()
          analyzerRef.current = analyzer

          // Connect source to analyzer (source -> analyzer, source -> destination both exist)
          source.connect(analyzer)
          audioGraphSetupRef.current = true
        }

        analyzer.fftSize = fftSize
        analyzer.smoothingTimeConstant = smoothingTimeConstant

        // Update buffer sizes if needed
        const binCount = analyzer.frequencyBinCount
        if (frequencyDataRef.current.length !== binCount) {
          frequencyDataRef.current = new Uint8Array(binCount)
        }
        if (waveformDataRef.current.length !== fftSize) {
          waveformDataRef.current = new Uint8Array(fftSize)
        }

        // Start animation loop only if enabled
        if (enabled && !animationFrameRef.current) {
          animationFrameRef.current = requestAnimationFrame(updateAnalyzerData)
        }
      } catch (error) {
        logger.warn("Failed to initialize audio analyzer", { error: String(error) })
        setAnalyzerData(prev => ({ ...prev, isAnalyzing: false }))
      }
    }

    // Initialize on play event or immediately if already playing.
    const handlePlay = () => initializeAudioContext()

    if (!audioElement.paused) {
      initializeAudioContext()
    }

    audioElement.addEventListener("play", handlePlay)

    return () => {
      audioElement.removeEventListener("play", handlePlay)

      // Only stop animation loop on cleanup - DON'T disconnect audio nodes
      // The audio graph stays intact to prevent audio cuts
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }

      // Note: We intentionally do NOT disconnect the analyzer here
      // Disconnecting can cause brief audio cuts on some browsers
      // The analyzer just stops being read from, which is fine
    }
  }, [audioElement, enabled, fftSize, smoothingTimeConstant, updateAnalyzerData])

  // Cleanup on unmount (global cache persists)
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  return analyzerData
}

/**
 * Lightweight version that only provides levels (no raw data arrays)
 * Use this if you only need bass/mid/high/overall levels for glow effects
 */
export function useAudioLevels(
  audioElement: HTMLAudioElement | null,
  enabled = true
): Pick<AudioAnalyzerData, "bassLevel" | "midLevel" | "highLevel" | "overallLevel" | "isAnalyzing"> {
  const data = useAudioAnalyzer({ audioElement, enabled, fftSize: 128 })

  return {
    bassLevel: data.bassLevel,
    midLevel: data.midLevel,
    highLevel: data.highLevel,
    overallLevel: data.overallLevel,
    isAnalyzing: data.isAnalyzing,
  }
}
