/**
 * Hooks Domain - Barrel Export
 *
 * Consolidated exports for custom React hooks.
 * Organized by feature domain with subdirectory-based grouping.
 */

// Home domain hooks (queue, playback, view management)
export * from "./home"

// Audio domain hooks (playback, analysis, preloading, volume)
export * from "./audio"

// Cinema domain hooks (visuals, video, controls)
export * from "./cinema"

// MetaDJai domain hooks (AI companion, messaging, streaming)
export * from "./metadjai"

// Wisdom domain hooks
export * from "./wisdom"

// Onboarding domain hooks
export * from "./onboarding"

// Dream hooks
export { useDream } from "./use-dream"

// UI utility hooks
export { useDebounce } from "./use-debounce"
export { useBodyScrollLock } from "./use-body-scroll-lock"
export { useEscapeKey } from "./use-escape-key"
export { useClickAway } from "./use-click-away"
export { useFocusTrap } from "./use-focus-trap"
export { useKeyboardShortcuts } from "./use-keyboard-shortcuts"
export { useOnlineStatus } from "./use-online-status"
export { usePanelPosition } from "./use-panel-position"
export { useResponsivePanels } from "./use-responsive-panels"
export { useSwipeGesture } from "./use-swipe-gesture"

// Feature hooks
export { useSearch } from "./use-search"
export { useRecentlyPlayed } from "./use-recently-played"
export { useTrackDetails } from "./use-track-details"

// Mobile/responsive hooks
export { useMobileKeyboard } from "./use-mobile-keyboard"
