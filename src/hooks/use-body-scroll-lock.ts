/**
 * useBodyScrollLock - Prevents body scroll when overlays/modals are open
 *
 * Implements a reference-counting system to handle nested modals correctly.
 * When a modal opens, it locks the body scroll. When it closes, it releases
 * the lock only if no other modals are open.
 *
 * Features:
 * - Preserves scroll position when locking/unlocking
 * - Handles scrollbar width compensation to prevent layout shift
 * - Optionally blocks wheel and touch events
 * - Safe for SSR (checks for window)
 *
 * @param locked - Whether scroll should be locked
 * @param options - Optional configuration
 * @param options.blockScrollEvents - Whether to block wheel/touch events (default: true)
 *
 * @example
 * ```tsx
 * function Modal({ isOpen, children }) {
 *   useBodyScrollLock(isOpen);
 *   return isOpen ? <div className="modal">{children}</div> : null;
 * }
 * ```
 */
import { useEffect } from "react"

interface BodyScrollState {
  count: number
  scrollY: number
  original: {
    bodyOverflow: string
    bodyPosition: string
    bodyTop: string
    bodyWidth: string
    bodyPaddingRight: string
    htmlOverflow: string
  } | null
}

const state: BodyScrollState = {
  count: 0,
  scrollY: 0,
  original: null,
}

const wheelOptions: AddEventListenerOptions = { passive: false }

/**
 * Check if an element or any of its ancestors is scrollable
 */
function isScrollableElement(element: Element | null): boolean {
  while (element && element !== document.body) {
    const style = window.getComputedStyle(element)
    const overflowY = style.overflowY
    const overflowX = style.overflowX
    
    // Check if element has scrollable overflow
    if (overflowY === 'auto' || overflowY === 'scroll' || 
        overflowX === 'auto' || overflowX === 'scroll') {
      // Check if element actually has scrollable content
      if (element.scrollHeight > element.clientHeight || 
          element.scrollWidth > element.clientWidth) {
        return true
      }
    }
    
    element = element.parentElement
  }
  return false
}

function preventDefault(event: Event) {
  // Allow scrolling inside scrollable elements (modals, dropdowns, etc.)
  const target = event.target as Element | null
  if (target && isScrollableElement(target)) {
    return
  }
  event.preventDefault()
}

function applyLock(blockScrollEvents: boolean) {
  if (typeof window === "undefined") return
  const { body, documentElement } = document

  if (state.count === 0) {
    state.scrollY = window.scrollY
    state.original = {
      bodyOverflow: body.style.overflow,
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyWidth: body.style.width,
      bodyPaddingRight: body.style.paddingRight,
      htmlOverflow: documentElement.style.overflow,
    }

    const scrollbarWidth = window.innerWidth - documentElement.clientWidth
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`
    }

    documentElement.style.overflow = "hidden"
    body.style.overflow = "hidden"
    body.style.position = "fixed"
    body.style.top = `-${state.scrollY}px`
    body.style.width = "100%"

    if (blockScrollEvents) {
      window.addEventListener("wheel", preventDefault, wheelOptions)
      window.addEventListener("touchmove", preventDefault, wheelOptions)
    }
  }

  state.count += 1
}

function releaseLock(blockScrollEvents: boolean) {
  if (typeof window === "undefined") return

  state.count = Math.max(0, state.count - 1)
  if (state.count > 0 || !state.original) {
    return
  }

  const { body, documentElement } = document
  const original = state.original

  documentElement.style.overflow = original.htmlOverflow
  body.style.overflow = original.bodyOverflow
  body.style.position = original.bodyPosition
  body.style.top = original.bodyTop
  body.style.width = original.bodyWidth
  body.style.paddingRight = original.bodyPaddingRight

  if (blockScrollEvents) {
    window.removeEventListener("wheel", preventDefault)
    window.removeEventListener("touchmove", preventDefault)
  }

  window.scrollTo(0, state.scrollY)
  state.original = null
}

interface UseBodyScrollLockOptions {
  blockScrollEvents?: boolean
}

export function useBodyScrollLock(locked: boolean, options?: UseBodyScrollLockOptions) {
  const blockScrollEvents = options?.blockScrollEvents ?? true

  useEffect(() => {
    if (!locked) return undefined

    applyLock(blockScrollEvents)
    return () => releaseLock(blockScrollEvents)
  }, [locked, blockScrollEvents])
}
