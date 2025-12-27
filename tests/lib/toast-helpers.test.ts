/**
 * Toast Helper Tests
 *
 * Tests for toast message configuration utilities.
 */

import { describe, it, expect } from 'vitest'
import { toasts } from '@/lib/toast-helpers'

describe('toasts.trackAddedToQueue', () => {
  it('returns success variant', () => {
    const config = toasts.trackAddedToQueue('Test Track')
    expect(config.variant).toBe('success')
  })

  it('includes track title in message', () => {
    const config = toasts.trackAddedToQueue('My Song')
    expect(config.message).toContain('My Song')
  })

  it('has collapse key for queue additions', () => {
    const config = toasts.trackAddedToQueue('Test')
    expect(config.collapseKey).toBe('queue-add')
  })

  it('has short duration', () => {
    const config = toasts.trackAddedToQueue('Test')
    expect(config.duration).toBe(2500)
  })
})

describe('toasts.trackRemovedFromQueue', () => {
  it('returns info variant', () => {
    const config = toasts.trackRemovedFromQueue('Test Track')
    expect(config.variant).toBe('info')
  })

  it('includes undo action when provided', () => {
    const onUndo = () => {}
    const config = toasts.trackRemovedFromQueue('Test', onUndo)
    expect(config.action).toBeDefined()
    expect(config.action?.label).toBe('Undo')
  })

  it('has no action when undo not provided', () => {
    const config = toasts.trackRemovedFromQueue('Test')
    expect(config.action).toBeUndefined()
  })
})

describe('toasts.queueCleared', () => {
  it('returns info variant', () => {
    expect(toasts.queueCleared().variant).toBe('info')
  })

  it('has fixed message', () => {
    expect(toasts.queueCleared().message).toBe('Queue cleared')
  })
})

describe('toasts.playlistCreated', () => {
  it('returns success variant', () => {
    const config = toasts.playlistCreated('My Playlist')
    expect(config.variant).toBe('success')
  })

  it('includes playlist name in message', () => {
    const config = toasts.playlistCreated('My Awesome Playlist')
    expect(config.message).toContain('My Awesome Playlist')
  })

  it('includes view action when callback provided', () => {
    const onView = () => {}
    const config = toasts.playlistCreated('Test', onView)
    expect(config.action?.label).toBe('View Playlist')
  })
})

describe('toasts.playlistDeleted', () => {
  it('returns info variant', () => {
    expect(toasts.playlistDeleted('Test').variant).toBe('info')
  })

  it('includes playlist name in message', () => {
    const config = toasts.playlistDeleted('Old Playlist')
    expect(config.message).toContain('Old Playlist')
  })
})

describe('toasts.trackAddedToPlaylist', () => {
  it('returns success variant', () => {
    const config = toasts.trackAddedToPlaylist('Track', 'Playlist')
    expect(config.variant).toBe('success')
  })

  it('includes track and playlist names', () => {
    const config = toasts.trackAddedToPlaylist('My Song', 'My Playlist')
    expect(config.message).toContain('My Song')
    expect(config.message).toContain('My Playlist')
  })

  it('has collapse key when no undo action', () => {
    const config = toasts.trackAddedToPlaylist('Track', 'Playlist')
    expect(config.collapseKey).toBe('playlist-add-Playlist')
  })

  it('has no collapse key with undo action', () => {
    const config = toasts.trackAddedToPlaylist('Track', 'Playlist', () => {})
    expect(config.collapseKey).toBeUndefined()
  })
})

describe('toasts.shuffleToggled', () => {
  it('shows enabled message when true', () => {
    const config = toasts.shuffleToggled(true)
    expect(config.message).toBe('Shuffle enabled')
  })

  it('shows disabled message when false', () => {
    const config = toasts.shuffleToggled(false)
    expect(config.message).toBe('Shuffle disabled')
  })
})

describe('toasts.repeatModeChanged', () => {
  it('shows off message for none', () => {
    const config = toasts.repeatModeChanged('none')
    expect(config.message).toBe('Repeat off')
  })

  it('shows track message for track', () => {
    const config = toasts.repeatModeChanged('track')
    expect(config.message).toBe('Repeat track')
  })

  it('shows queue message for queue', () => {
    const config = toasts.repeatModeChanged('queue')
    expect(config.message).toBe('Repeat queue')
  })
})

describe('toasts.volumeChanged', () => {
  it('includes volume percentage', () => {
    const config = toasts.volumeChanged(75)
    expect(config.message).toBe('Volume set to 75%')
  })

  it('handles zero volume', () => {
    const config = toasts.volumeChanged(0)
    expect(config.message).toBe('Volume set to 0%')
  })

  it('handles max volume', () => {
    const config = toasts.volumeChanged(100)
    expect(config.message).toBe('Volume set to 100%')
  })
})

describe('toasts.muteToggled', () => {
  it('shows muted message when true', () => {
    const config = toasts.muteToggled(true)
    expect(config.message).toBe('Audio muted')
  })

  it('shows unmuted message when false', () => {
    const config = toasts.muteToggled(false)
    expect(config.message).toBe('Audio unmuted')
  })
})

describe('toasts.error', () => {
  it('returns error variant', () => {
    const config = toasts.error('Something failed')
    expect(config.variant).toBe('error')
  })

  it('has longer duration', () => {
    const config = toasts.error('Test')
    expect(config.duration).toBe(5000)
  })
})

describe('toasts.networkError', () => {
  it('returns error variant', () => {
    expect(toasts.networkError().variant).toBe('error')
  })

  it('has network error message', () => {
    expect(toasts.networkError().message).toContain('Network error')
  })
})

describe('toasts.rateLimitWarning', () => {
  it('returns warning variant', () => {
    const config = toasts.rateLimitWarning(30)
    expect(config.variant).toBe('warning')
  })

  it('includes remaining seconds', () => {
    const config = toasts.rateLimitWarning(45)
    expect(config.message).toContain('45s')
  })
})

describe('generic toasts', () => {
  it('success returns success variant', () => {
    expect(toasts.success('Done').variant).toBe('success')
  })

  it('info returns info variant', () => {
    expect(toasts.info('FYI').variant).toBe('info')
  })

  it('warning returns warning variant', () => {
    expect(toasts.warning('Careful').variant).toBe('warning')
  })
})
