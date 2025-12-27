/**
 * Mobile Keyboard Detection Hook
 *
 * Detects virtual keyboard presence on mobile devices by monitoring
 * viewport changes. Uses visualViewport API when available with
 * fallback to window.innerHeight delta tracking.
 *
 * @module hooks/use-mobile-keyboard
 */

import { useEffect, useRef, useState } from 'react'

interface UseMobileKeyboardOptions {
  /** Whether keyboard detection is enabled */
  enabled?: boolean
}

interface UseMobileKeyboardResult {
  /** Current keyboard height in pixels (0 when hidden) */
  keyboardHeight: number
  /** Whether the keyboard is currently visible */
  isKeyboardVisible: boolean
}

/**
 * Detect mobile virtual keyboard visibility and height
 *
 * Uses the Visual Viewport API when available for accurate detection.
 * Falls back to tracking window.innerHeight changes on older browsers.
 *
 * @param options - Configuration options
 * @returns Object with keyboardHeight and isKeyboardVisible
 *
 * @example
 * ```tsx
 * function ChatInput() {
 *   const { keyboardHeight, isKeyboardVisible } = useMobileKeyboard({ enabled: isMobile })
 *
 *   return (
 *     <div style={{ paddingBottom: keyboardHeight }}>
 *       <textarea />
 *     </div>
 *   )
 * }
 * ```
 */
export function useMobileKeyboard(
  options: UseMobileKeyboardOptions = {}
): UseMobileKeyboardResult {
  const { enabled = true } = options
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const baselineHeightRef = useRef<number | null>(null)

  useEffect(() => {
    if (!enabled) {
      setKeyboardHeight(0)
      baselineHeightRef.current = null
      return
    }

    if (typeof window === 'undefined') {
      return
    }

    const viewport = window.visualViewport

    const updateKeyboardState = () => {
      if (viewport) {
        // Visual Viewport API (modern browsers)
        const windowHeight = window.innerHeight
        const visibleHeight = viewport.height + viewport.offsetTop
        const calculatedHeight = Math.max(0, windowHeight - visibleHeight)
        setKeyboardHeight(calculatedHeight)
        return
      }

      // Fallback: infer keyboard from innerHeight deltas
      if (baselineHeightRef.current === null) {
        baselineHeightRef.current = window.innerHeight
      }

      const baselineHeight = baselineHeightRef.current
      const currentHeight = window.innerHeight
      const diff = baselineHeight - currentHeight
      const calculatedHeight = diff > 0 ? diff : 0
      setKeyboardHeight(calculatedHeight)

      // If height grows again (rotation/chrome UI changes), refresh baseline
      if (diff <= 0) {
        baselineHeightRef.current = currentHeight
      }
    }

    // Initial calculation
    updateKeyboardState()

    // Listen for viewport changes
    viewport?.addEventListener('resize', updateKeyboardState)
    viewport?.addEventListener('scroll', updateKeyboardState)
    window.addEventListener('resize', updateKeyboardState)
    window.addEventListener('orientationchange', updateKeyboardState)

    return () => {
      viewport?.removeEventListener('resize', updateKeyboardState)
      viewport?.removeEventListener('scroll', updateKeyboardState)
      window.removeEventListener('resize', updateKeyboardState)
      window.removeEventListener('orientationchange', updateKeyboardState)
      setKeyboardHeight(0)
      baselineHeightRef.current = null
    }
  }, [enabled])

  return {
    keyboardHeight,
    isKeyboardVisible: keyboardHeight > 0,
  }
}
