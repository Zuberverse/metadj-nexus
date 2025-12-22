/**
 * useEscapeKey Hook
 *
 * WCAG 2.1 AA compliant Escape key handler for dismissible overlays and modals.
 * Provides consistent Escape key behavior across all overlay components.
 *
 * Usage:
 * ```tsx
 * useEscapeKey(handleClose, { enabled: isOpen })
 * ```
 *
 * @param onEscape - Callback function to execute when Escape is pressed
 * @param options - Optional configuration
 * @param options.enabled - Whether the handler is active (default: true)
 */
import { useEffect, useCallback } from 'react'

interface UseEscapeKeyOptions {
  /** Whether the escape key handler is active (default: true) */
  enabled?: boolean
}

export function useEscapeKey(
  onEscape: () => void,
  options: UseEscapeKeyOptions = {}
): void {
  const { enabled = true } = options

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        // Blur active element to prevent focus ring on trigger button
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur()
        }
        onEscape()
      }
    },
    [onEscape]
  )

  useEffect(() => {
    if (!enabled) return

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [enabled, handleKeyDown])
}
