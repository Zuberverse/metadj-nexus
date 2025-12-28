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
}

const state: BodyScrollState = {
  count: 0,
  scrollY: 0,
}

const wheelOptions: AddEventListenerOptions = { passive: false }

const SCROLL_LOCK_ATTR = "data-scroll-lock"
const SCROLL_LOCK_VALUE = "true"
const STYLE_RULES = new Map<string, CSSStyleRule>()
const HTML_SCROLL_LOCK_SELECTOR = `html[${SCROLL_LOCK_ATTR}="${SCROLL_LOCK_VALUE}"]`
const BODY_SCROLL_LOCK_SELECTOR = `body[${SCROLL_LOCK_ATTR}="${SCROLL_LOCK_VALUE}"]`
const HTML_RULE_KEY = "scroll-lock-html"
const BODY_RULE_KEY = "scroll-lock-body"

const getCspNonce = () => {
  if (typeof document === "undefined") return null
  const nonce = document.documentElement.dataset.cspNonce
  if (nonce) return nonce
  const meta = document.querySelector('meta[name="csp-nonce"]') as HTMLMetaElement | null
  return meta?.content ?? null
}

const getStyleSheet = () => {
  if (typeof document === "undefined") return null
  let styleEl = document.getElementById("csp-dynamic-styles") as HTMLStyleElement | null
  if (!styleEl) {
    styleEl = document.createElement("style")
    styleEl.id = "csp-dynamic-styles"
    const nonce = getCspNonce()
    if (nonce) {
      styleEl.setAttribute("nonce", nonce)
    }
    document.head.appendChild(styleEl)
  }
  return styleEl.sheet as CSSStyleSheet | null
}

const toKebabCase = (input: string) => {
  if (input.startsWith("--")) return input
  return input.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`)
}

const serializeStyles = (styles: Record<string, string | number | null | undefined>) =>
  Object.entries(styles)
    .filter(([, value]) => value !== null && value !== undefined && value !== "")
    .map(([key, value]) => `${toKebabCase(key)}: ${value};`)
    .join(" ")

const setStyleRule = (key: string, selector: string, styles: Record<string, string | number | null | undefined>) => {
  const sheet = getStyleSheet()
  if (!sheet) return
  const serialized = serializeStyles(styles)

  let rule = STYLE_RULES.get(key)
  if (!rule || rule.selectorText !== selector) {
    if (rule) {
      const index = Array.from(sheet.cssRules).indexOf(rule)
      if (index >= 0) sheet.deleteRule(index)
    }
    const ruleIndex = sheet.insertRule(`${selector} {}`, sheet.cssRules.length)
    rule = sheet.cssRules[ruleIndex] as CSSStyleRule
    STYLE_RULES.set(key, rule)
  }

  rule.style.cssText = serialized
}

const removeStyleRule = (key: string) => {
  const sheet = getStyleSheet()
  if (!sheet) return
  const rule = STYLE_RULES.get(key)
  if (!rule) return
  const index = Array.from(sheet.cssRules).indexOf(rule)
  if (index >= 0) sheet.deleteRule(index)
  STYLE_RULES.delete(key)
}

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

    const scrollbarWidth = window.innerWidth - documentElement.clientWidth
    const paddingRight = scrollbarWidth > 0 ? `${scrollbarWidth}px` : "0px"

    documentElement.setAttribute(SCROLL_LOCK_ATTR, SCROLL_LOCK_VALUE)
    body.setAttribute(SCROLL_LOCK_ATTR, SCROLL_LOCK_VALUE)

    setStyleRule(HTML_RULE_KEY, HTML_SCROLL_LOCK_SELECTOR, {
      overflow: "hidden",
    })
    setStyleRule(BODY_RULE_KEY, BODY_SCROLL_LOCK_SELECTOR, {
      overflow: "hidden",
      position: "fixed",
      top: `-${state.scrollY}px`,
      width: "100%",
      paddingRight,
    })

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
  if (state.count > 0) {
    return
  }

  const { body, documentElement } = document
  documentElement.removeAttribute(SCROLL_LOCK_ATTR)
  body.removeAttribute(SCROLL_LOCK_ATTR)
  removeStyleRule(HTML_RULE_KEY)
  removeStyleRule(BODY_RULE_KEY)

  if (blockScrollEvents) {
    window.removeEventListener("wheel", preventDefault)
    window.removeEventListener("touchmove", preventDefault)
  }

  window.scrollTo(0, state.scrollY)
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
