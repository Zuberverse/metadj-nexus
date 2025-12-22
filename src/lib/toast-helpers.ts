/**
 * Toast Helper Utilities
 *
 * Centralized toast message patterns for consistent user feedback across the app.
 * Usage: import { toasts } from '@/lib/toast-helpers' and call showToast(toasts.xxx())
 *
 * Toast Collapsing:
 * Some toasts support collapsing for rapid similar actions. When multiple toasts
 * with the same collapseKey fire within 2 seconds, they merge into one with a count badge.
 * This prevents toast spam when adding multiple tracks to queue/playlist quickly.
 */

import type { ToastAction } from '@/contexts/ToastContext'
import type { ToastVariant, RepeatMode } from '@/types'

interface ToastConfig {
  message: string
  variant?: ToastVariant
  duration?: number
  action?: ToastAction
  /** Key for collapsing similar toasts within 2s window */
  collapseKey?: string
}

/**
 * Pre-configured toast messages for common scenarios.
 * Ensures consistent messaging and reduces duplication across components.
 */
export const toasts = {
  // Queue operations (with collapse support for rapid adds)
  trackAddedToQueue: (trackTitle: string): ToastConfig => ({
    message: `Added "${trackTitle}" to queue`,
    variant: 'success',
    duration: 2500,
    collapseKey: 'queue-add', // Collapses rapid queue additions
  }),

  trackRemovedFromQueue: (trackTitle: string, onUndo?: () => void): ToastConfig => ({
    message: `Removed "${trackTitle}" from queue`,
    variant: 'info',
    duration: 3000,
    action: onUndo ? { label: 'Undo', onClick: onUndo } : undefined,
    // No collapseKey - undo actions should not collapse
  }),

  queueCleared: (): ToastConfig => ({
    message: 'Queue cleared',
    variant: 'info',
    duration: 2000,
  }),

  // Playlist operations (with collapse support for rapid adds)
  playlistCreated: (name: string, onView?: () => void): ToastConfig => ({
    message: `Playlist "${name}" created`,
    variant: 'success',
    action: onView ? { label: 'View Playlist', onClick: onView } : undefined,
  }),

  playlistDeleted: (name: string): ToastConfig => ({
    message: `Playlist "${name}" deleted`,
    variant: 'info',
  }),

  trackAddedToPlaylist: (trackTitle: string, playlistName: string, onUndo?: () => void): ToastConfig => ({
    message: `Added "${trackTitle}" to "${playlistName}"`,
    variant: 'success',
    action: onUndo ? { label: 'Undo', onClick: onUndo } : undefined,
    collapseKey: onUndo ? undefined : `playlist-add-${playlistName}`, // Collapse only when no undo action
  }),

  trackRemovedFromPlaylist: (trackTitle: string, playlistName: string, onUndo?: () => void): ToastConfig => ({
    message: `Removed "${trackTitle}" from "${playlistName}"`,
    variant: 'info',
    action: onUndo ? { label: 'Undo', onClick: onUndo } : undefined,
    // No collapseKey - undo actions should not collapse
  }),

  // Playback operations
  shuffleToggled: (enabled: boolean): ToastConfig => ({
    message: enabled ? 'Shuffle enabled' : 'Shuffle disabled',
    variant: 'success',
    duration: 2000,
  }),

  repeatModeChanged: (mode: RepeatMode): ToastConfig => ({
    message: mode === 'none' ? 'Repeat off' : mode === 'track' ? 'Repeat track' : 'Repeat queue',
    variant: 'success',
    duration: 2000,
  }),

  volumeChanged: (volumePercent: number): ToastConfig => ({
    message: `Volume set to ${volumePercent}%`,
    variant: 'info',
    duration: 2000,
  }),

  muteToggled: (muted: boolean): ToastConfig => ({
    message: muted ? 'Audio muted' : 'Audio unmuted',
    variant: 'info',
    duration: 2000,
  }),

  // Error states
  error: (message: string): ToastConfig => ({
    message,
    variant: 'error',
    duration: 5000,
  }),

  networkError: (): ToastConfig => ({
    message: 'Network error. Please check your connection.',
    variant: 'error',
    duration: 5000,
  }),

  // Rate limiting
  rateLimitWarning: (remainingSeconds: number): ToastConfig => ({
    message: `Rate limit reached. Try again in ${remainingSeconds}s`,
    variant: 'warning',
    duration: 4000,
  }),

  // Generic success/info
  success: (message: string): ToastConfig => ({
    message,
    variant: 'success',
  }),

  info: (message: string): ToastConfig => ({
    message,
    variant: 'info',
  }),

  warning: (message: string): ToastConfig => ({
    message,
    variant: 'warning',
  }),
}
