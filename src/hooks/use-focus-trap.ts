/**
 * useFocusTrap Hook
 *
 * WCAG 2.1 AA focus trap implementation for modal dialogs (WCAG 2.4.3 compliant).
 * Cycles focus within a container when Tab/Shift+Tab is pressed,
 * preventing keyboard users from tabbing outside the modal.
 *
 * **Focus Restoration (WCAG 2.4.3)**: When the trap is disabled/unmounted,
 * focus is automatically returned to the element that was focused before
 * the trap was enabled, ensuring users don't lose their place.
 *
 * Usage:
 * ```tsx
 * const dialogRef = useRef<HTMLDivElement>(null)
 * useFocusTrap(dialogRef, { enabled: isOpen })
 *
 * return <div ref={dialogRef} role="dialog" aria-modal="true">...</div>
 * ```
 *
 * @param containerRef - Ref to the modal container element
 * @param options - Optional configuration
 * @param options.enabled - Whether the focus trap is active (default: true)
 * @param options.restoreFocus - Whether to restore focus on disable (default: true)
 * @param options.autoFocus - Whether to auto-focus first element on enable (default: true)
 */
import { useEffect, useRef, type RefObject } from "react"

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

interface UseFocusTrapOptions {
  /** Whether the focus trap is active (default: true) */
  enabled?: boolean
  /** Whether to restore focus to previously focused element on disable (default: true) */
  restoreFocus?: boolean
  /** Whether to auto-focus the first focusable element on enable (default: true) */
  autoFocus?: boolean
}

export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  options: UseFocusTrapOptions = {}
): void {
  const { enabled = true, restoreFocus = true, autoFocus = true } = options
  const focusableElementsRef = useRef<HTMLElement[]>([])
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!enabled) return

    const container = containerRef.current
    if (!container) return

    // Store the currently focused element before trapping focus (WCAG 2.4.3)
    previouslyFocusedElementRef.current = document.activeElement as HTMLElement

    // Build list of focusable elements
    const updateFocusableElements = () => {
      focusableElementsRef.current = Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      )
    }

    updateFocusableElements()

    // Auto-focus the first focusable element
    if (autoFocus && focusableElementsRef.current.length > 0) {
      // Small delay to ensure DOM is ready
      requestAnimationFrame(() => {
        focusableElementsRef.current[0]?.focus()
      })
    }

    // Watch for DOM changes that might add/remove focusable elements
    const observer = new MutationObserver(updateFocusableElements)
    observer.observe(container, { childList: true, subtree: true })

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return

      event.preventDefault()

      const elements = focusableElementsRef.current
      if (elements.length === 0) return

      const firstElement = elements[0]
      const lastElement = elements[elements.length - 1]
      const activeElement = document.activeElement as HTMLElement
      const currentIndex = elements.indexOf(activeElement)

      if (event.shiftKey) {
        // Shift + Tab: Move backward
        if (currentIndex === 0 || currentIndex === -1) {
          lastElement.focus()
        } else {
          elements[currentIndex - 1]?.focus()
        }
      } else {
        // Tab: Move forward
        if (currentIndex === elements.length - 1 || currentIndex === -1) {
          firstElement.focus()
        } else {
          elements[currentIndex + 1]?.focus()
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown, true)

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true)
      observer.disconnect()

      // Restore focus to the previously focused element (WCAG 2.4.3)
      if (restoreFocus && previouslyFocusedElementRef.current) {
        // Use requestAnimationFrame to ensure this happens after React updates
        requestAnimationFrame(() => {
          const elementToFocus = previouslyFocusedElementRef.current
          if (elementToFocus && typeof elementToFocus.focus === 'function') {
            // Check if the element is still in the DOM and visible
            if (document.body.contains(elementToFocus) && elementToFocus.offsetParent !== null) {
              elementToFocus.focus()
            }
          }
        })
      }
    }
  }, [containerRef, enabled, restoreFocus, autoFocus])
}
