"use client"

import { useEffect, useCallback, useRef } from "react"
import { useBodyScrollLock } from "@/hooks/use-body-scroll-lock"
import { useFocusTrap } from "@/hooks/use-focus-trap"

interface KeyboardShortcutsModalProps {
  onClose: () => void
}

interface Shortcut {
  key: string;
  action: string;
  category: "playback" | "navigation" | "queue" | "accessibility";
}

const isMac = typeof navigator !== 'undefined' && navigator.platform.toLowerCase().includes('mac')
const mod = isMac ? '⌘' : 'Ctrl'

const shortcuts: Shortcut[] = [
  // Playback (require modifier)
  { key: `${mod} + Space`, action: "Play / Pause", category: "playback" },
  { key: `${mod} + ←`, action: "Seek backward / Previous track", category: "playback" },
  { key: `${mod} + →`, action: "Seek forward / Next track", category: "playback" },
  { key: `${mod} + ↑`, action: "Volume up (+10%)", category: "playback" },
  { key: `${mod} + ↓`, action: "Volume down (-10%)", category: "playback" },
  { key: `${mod} + M`, action: "Toggle mute", category: "playback" },

  // Queue & Navigation (require modifier)
  { key: `${mod} + N`, action: "Next track in queue", category: "queue" },
  { key: `${mod} + P`, action: "Previous track (or restart)", category: "queue" },
  { key: `${mod} + S`, action: "Toggle shuffle", category: "queue" },
  { key: `${mod} + R`, action: "Cycle repeat mode", category: "queue" },

  // Navigation
  { key: `${mod} + /`, action: "Focus search", category: "navigation" },
  { key: "Esc", action: "Close modals / Exit fullscreen", category: "navigation" },
  { key: "Tab", action: "Navigate interactive elements", category: "navigation" },

  // Accessibility
  { key: "?", action: "Show this help", category: "accessibility" },
]

const categoryLabels: Record<Shortcut["category"], string> = {
  playback: "Playback Controls",
  queue: "Queue Management",
  navigation: "Navigation",
  accessibility: "Accessibility",
}

export function KeyboardShortcutsModal({ onClose }: KeyboardShortcutsModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  // WCAG 2.1 AA: Focus trap to keep keyboard navigation within modal
  useFocusTrap(dialogRef)

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  useBodyScrollLock(true)

  // Manage focus
  useEffect(() => {
    previousFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null

    closeButtonRef.current?.focus()

    return () => {
      previousFocusRef.current?.focus()
    }
  }, [])

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // Blur active element to prevent focus ring on trigger button
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur()
        }
        handleClose()
      }
    }
    window.addEventListener("keydown", handleEsc)
    return () => window.removeEventListener("keydown", handleEsc)
  }, [handleClose])

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-heading"
    >
      <div className="pointer-events-none absolute inset-0 bg-black/85 backdrop-blur-xl" />

      {/* Modal container */}
      <div
        ref={dialogRef}
        className="relative w-full max-w-lg mx-4 rounded-2xl p-[1.5px] gradient-2-border overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-full rounded-[calc(1rem_-_1.5px)] p-6 sm:p-8 bg-black/90 backdrop-blur-xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2
              id="shortcuts-heading"
              className="text-2xl sm:text-3xl font-heading font-bold text-gradient-hero"
            >
              Keyboard Shortcuts
            </h2>
            <button
              ref={closeButtonRef}
              onClick={handleClose}
              className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close keyboard shortcuts"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Shortcuts list organized by category */}
          <div className="space-y-5 max-h-[60vh] overflow-y-auto">
            {(["playback", "queue", "navigation", "accessibility"] as const).map((category) => {
              const categoryShortcuts = shortcuts.filter(s => s.category === category)
              if (categoryShortcuts.length === 0) return null

              return (
                <div key={category}>
                  {/* WCAG: text-white/70 for 4.5:1 contrast on category labels */}
                  <h3 className="text-xs font-heading font-bold uppercase tracking-wider text-white/70 mb-2">
                    {categoryLabels[category]}
                  </h3>
                  <div className="space-y-2">
                    {categoryShortcuts.map((shortcut, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                      >
                        <span className="text-sm sm:text-base text-white/90">
                          {shortcut.action}
                        </span>
                        <kbd className="px-3 py-1.5 text-xs sm:text-sm font-mono font-semibold text-white bg-linear-to-br from-purple-500/20 to-blue-500/20 border border-white/20 rounded-lg shadow-xs">
                          {shortcut.key}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer note */}
          <div className="mt-6 space-y-2 text-center">
            {/* WCAG: text-white/70 for 4.5:1 contrast on informational text */}
            <p className="text-xs sm:text-sm text-white/70">
              Most shortcuts require <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/80">{mod}</kbd> modifier (WCAG 2.1.4 compliant)
            </p>
            {/* Secondary note - decorative/supplementary, 3:1 minimum met */}
            <p className="text-xs text-white/60">
              Shortcuts disabled when typing in search or input fields
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
