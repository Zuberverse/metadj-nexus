/**
 * Playlist Repository Tests
 *
 * Tests for playlist CRUD operations and validation.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getPlaylists,
  savePlaylists,
  createPlaylist,
  duplicatePlaylist,
  updatePlaylist,
  deletePlaylist,
  addTrackToPlaylist,
  removeTrackFromPlaylist,
  reorderTracks,
  findPlaylistById,
  validatePlaylistName,
  getPlaylistLimitWarning,
  getTrackLimitWarning,
} from '@/lib/playlists/repository'
import { PlaylistErrors } from '@/types/playlist.types'
import type { Playlist, PlaylistStorage } from '@/types/playlist.types'

// Mock localStorage
const mockStorage: Record<string, string> = {}

vi.mock('@/lib/storage/persistence', () => ({
  isStorageAvailable: vi.fn(() => true),
  STORAGE_KEYS: { PLAYLISTS: 'metadj-playlists' },
  getRawValue: vi.fn((key: string) => mockStorage[key] || null),
  setRawValue: vi.fn((key: string, value: string) => {
    mockStorage[key] = value
  }),
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}))

// Helper to create mock playlists
function createMockPlaylist(overrides: Partial<Playlist> = {}): Playlist {
  const now = new Date().toISOString()
  return {
    id: 'playlist-1',
    name: 'Test Playlist',
    trackIds: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

// Helper to set up mock storage with playlists
function setupMockStorage(playlists: Playlist[]) {
  const storage: PlaylistStorage = {
    version: 'v1',
    playlists,
    updatedAt: new Date().toISOString(),
  }
  mockStorage['metadj-playlists'] = JSON.stringify(storage)
}

// Clear mock storage between tests
beforeEach(() => {
  Object.keys(mockStorage).forEach((key) => delete mockStorage[key])
  vi.clearAllMocks()
})

describe('getPlaylists', () => {
  it('returns empty array when no storage data', () => {
    expect(getPlaylists()).toEqual([])
  })

  it('returns playlists from storage', () => {
    const playlists = [createMockPlaylist({ id: 'p1', name: 'First' })]
    setupMockStorage(playlists)
    expect(getPlaylists()).toEqual(playlists)
  })

  it('returns empty array for version mismatch', () => {
    mockStorage['metadj-playlists'] = JSON.stringify({
      version: 'v999',
      playlists: [createMockPlaylist()],
      updatedAt: new Date().toISOString(),
    })
    expect(getPlaylists()).toEqual([])
  })

  it('returns empty array for invalid JSON', () => {
    mockStorage['metadj-playlists'] = 'not valid json'
    expect(getPlaylists()).toEqual([])
  })
})

describe('savePlaylists', () => {
  it('saves playlists to storage', () => {
    const playlists = [createMockPlaylist({ id: 'p1', name: 'Saved' })]
    savePlaylists(playlists)

    const stored = JSON.parse(mockStorage['metadj-playlists']) as PlaylistStorage
    expect(stored.version).toBe('v1')
    expect(stored.playlists).toEqual(playlists)
    expect(stored.updatedAt).toBeDefined()
  })
})

describe('validatePlaylistName', () => {
  it('throws for empty name', () => {
    expect(() => validatePlaylistName('', [])).toThrow(PlaylistErrors.NAME_EMPTY)
  })

  it('throws for whitespace-only name', () => {
    expect(() => validatePlaylistName('   ', [])).toThrow(PlaylistErrors.NAME_EMPTY)
  })

  it('throws for name too long', () => {
    const longName = 'a'.repeat(101)
    expect(() => validatePlaylistName(longName, [])).toThrow(PlaylistErrors.NAME_TOO_LONG)
  })

  it('throws for duplicate name (case-insensitive)', () => {
    const existing = [createMockPlaylist({ name: 'My Playlist' })]
    expect(() => validatePlaylistName('MY PLAYLIST', existing)).toThrow(/already have a playlist/)
  })

  it('allows valid unique name', () => {
    const existing = [createMockPlaylist({ name: 'Existing' })]
    expect(() => validatePlaylistName('New Playlist', existing)).not.toThrow()
  })

  it('allows name at max length', () => {
    const maxName = 'a'.repeat(100)
    expect(() => validatePlaylistName(maxName, [])).not.toThrow()
  })
})

describe('createPlaylist', () => {
  it('creates a new playlist', () => {
    setupMockStorage([])
    const playlist = createPlaylist('My New Playlist')

    expect(playlist.name).toBe('My New Playlist')
    expect(playlist.id).toMatch(/^[0-9a-f-]{36}$/) // UUID format
    expect(playlist.trackIds).toEqual([])
    expect(playlist.createdAt).toBeDefined()
    expect(playlist.updatedAt).toBeDefined()
  })

  it('trims playlist name', () => {
    setupMockStorage([])
    const playlist = createPlaylist('  Trimmed Name  ')
    expect(playlist.name).toBe('Trimmed Name')
  })

  it('throws when limit reached', () => {
    const maxPlaylists = Array.from({ length: 50 }, (_, i) =>
      createMockPlaylist({ id: `p${i}`, name: `Playlist ${i}` })
    )
    setupMockStorage(maxPlaylists)

    expect(() => createPlaylist('One More')).toThrow(PlaylistErrors.PLAYLIST_LIMIT_REACHED)
  })

  it('throws for duplicate name', () => {
    setupMockStorage([createMockPlaylist({ name: 'Existing' })])
    expect(() => createPlaylist('Existing')).toThrow(/already have a playlist/)
  })
})

describe('updatePlaylist', () => {
  it('updates playlist name', () => {
    const original = createMockPlaylist({ id: 'p1', name: 'Original' })
    setupMockStorage([original])

    const updated = updatePlaylist('p1', { name: 'Updated Name' })
    expect(updated.name).toBe('Updated Name')
    expect(updated.id).toBe('p1')
  })

  it('throws for non-existent playlist', () => {
    setupMockStorage([])
    expect(() => updatePlaylist('unknown', { name: 'New' })).toThrow(PlaylistErrors.PLAYLIST_NOT_FOUND)
  })

  it('validates new name against other playlists', () => {
    const p1 = createMockPlaylist({ id: 'p1', name: 'First' })
    const p2 = createMockPlaylist({ id: 'p2', name: 'Second' })
    setupMockStorage([p1, p2])

    expect(() => updatePlaylist('p1', { name: 'Second' })).toThrow(/already have a playlist/)
  })

  it('allows keeping same name', () => {
    const original = createMockPlaylist({ id: 'p1', name: 'Same' })
    setupMockStorage([original])

    // This should not throw - updating to the same name is allowed
    const updated = updatePlaylist('p1', { name: 'Same' })
    expect(updated.name).toBe('Same')
  })
})

describe('duplicatePlaylist', () => {
  it('duplicates playlist with new id and name', () => {
    const playlist = createMockPlaylist({
      id: 'p1',
      name: 'Chill Night',
      trackIds: ['a', 'b'],
      artworkUrl: '/images/chill.jpg',
    })
    setupMockStorage([playlist])

    const duplicate = duplicatePlaylist('p1')
    expect(duplicate.id).not.toBe('p1')
    expect(duplicate.name).toBe('Chill Night (Copy)')
    expect(duplicate.trackIds).toEqual(['a', 'b'])
    expect(duplicate.artworkUrl).toBe('/images/chill.jpg')

    const stored = getPlaylists()
    expect(stored).toHaveLength(2)
  })

  it('increments copy suffix when name already exists', () => {
    const original = createMockPlaylist({ id: 'p1', name: 'Focus Mix' })
    const firstCopy = createMockPlaylist({ id: 'p2', name: 'Focus Mix (Copy)' })
    setupMockStorage([original, firstCopy])

    const duplicate = duplicatePlaylist('p1')
    expect(duplicate.name).toBe('Focus Mix (Copy 2)')
  })

  it('throws when playlist limit reached', () => {
    const maxPlaylists = Array.from({ length: 50 }, (_, i) =>
      createMockPlaylist({ id: `p${i}`, name: `Playlist ${i}` })
    )
    setupMockStorage(maxPlaylists)

    expect(() => duplicatePlaylist('p1')).toThrow(PlaylistErrors.PLAYLIST_LIMIT_REACHED)
  })

  it('throws for non-existent playlist', () => {
    setupMockStorage([])
    expect(() => duplicatePlaylist('unknown')).toThrow(PlaylistErrors.PLAYLIST_NOT_FOUND)
  })
})

describe('deletePlaylist', () => {
  it('deletes existing playlist', () => {
    const p1 = createMockPlaylist({ id: 'p1', name: 'Delete Me' })
    const p2 = createMockPlaylist({ id: 'p2', name: 'Keep Me' })
    setupMockStorage([p1, p2])

    deletePlaylist('p1')

    const remaining = getPlaylists()
    expect(remaining).toHaveLength(1)
    expect(remaining[0].id).toBe('p2')
  })

  it('throws for non-existent playlist', () => {
    setupMockStorage([])
    expect(() => deletePlaylist('unknown')).toThrow(PlaylistErrors.PLAYLIST_NOT_FOUND)
  })
})

describe('addTrackToPlaylist', () => {
  it('adds track to playlist', () => {
    const playlist = createMockPlaylist({ id: 'p1', trackIds: [] })
    setupMockStorage([playlist])

    const updated = addTrackToPlaylist('p1', 'track-1')
    expect(updated.trackIds).toContain('track-1')
  })

  it('throws if track already in playlist', () => {
    const playlist = createMockPlaylist({ id: 'p1', name: 'Has Track', trackIds: ['track-1'] })
    setupMockStorage([playlist])

    expect(() => addTrackToPlaylist('p1', 'track-1')).toThrow(/already in/)
  })

  it('throws when track limit reached', () => {
    const maxTracks = Array.from({ length: 200 }, (_, i) => `track-${i}`)
    const playlist = createMockPlaylist({ id: 'p1', trackIds: maxTracks })
    setupMockStorage([playlist])

    expect(() => addTrackToPlaylist('p1', 'track-201')).toThrow(PlaylistErrors.TRACK_LIMIT_REACHED)
  })

  it('throws for non-existent playlist', () => {
    setupMockStorage([])
    expect(() => addTrackToPlaylist('unknown', 'track-1')).toThrow(PlaylistErrors.PLAYLIST_NOT_FOUND)
  })
})

describe('removeTrackFromPlaylist', () => {
  it('removes track from playlist', () => {
    const playlist = createMockPlaylist({ id: 'p1', trackIds: ['track-1', 'track-2'] })
    setupMockStorage([playlist])

    const updated = removeTrackFromPlaylist('p1', 'track-1')
    expect(updated.trackIds).toEqual(['track-2'])
  })

  it('throws for non-existent playlist', () => {
    setupMockStorage([])
    expect(() => removeTrackFromPlaylist('unknown', 'track-1')).toThrow(PlaylistErrors.PLAYLIST_NOT_FOUND)
  })

  it('silently handles non-existent track', () => {
    const playlist = createMockPlaylist({ id: 'p1', trackIds: ['track-1'] })
    setupMockStorage([playlist])

    const updated = removeTrackFromPlaylist('p1', 'non-existent')
    expect(updated.trackIds).toEqual(['track-1'])
  })
})

describe('reorderTracks', () => {
  it('moves track forward', () => {
    const playlist = createMockPlaylist({ id: 'p1', trackIds: ['a', 'b', 'c', 'd'] })
    setupMockStorage([playlist])

    const updated = reorderTracks('p1', 0, 2)
    expect(updated.trackIds).toEqual(['b', 'c', 'a', 'd'])
  })

  it('moves track backward', () => {
    const playlist = createMockPlaylist({ id: 'p1', trackIds: ['a', 'b', 'c', 'd'] })
    setupMockStorage([playlist])

    const updated = reorderTracks('p1', 3, 1)
    expect(updated.trackIds).toEqual(['a', 'd', 'b', 'c'])
  })

  it('throws for invalid fromIndex', () => {
    const playlist = createMockPlaylist({ id: 'p1', trackIds: ['a', 'b'] })
    setupMockStorage([playlist])

    expect(() => reorderTracks('p1', -1, 0)).toThrow('Invalid fromIndex')
    expect(() => reorderTracks('p1', 5, 0)).toThrow('Invalid fromIndex')
  })

  it('throws for invalid toIndex', () => {
    const playlist = createMockPlaylist({ id: 'p1', trackIds: ['a', 'b'] })
    setupMockStorage([playlist])

    expect(() => reorderTracks('p1', 0, -1)).toThrow('Invalid toIndex')
    expect(() => reorderTracks('p1', 0, 5)).toThrow('Invalid toIndex')
  })

  it('throws for non-existent playlist', () => {
    setupMockStorage([])
    expect(() => reorderTracks('unknown', 0, 1)).toThrow(PlaylistErrors.PLAYLIST_NOT_FOUND)
  })
})

describe('findPlaylistById', () => {
  it('finds existing playlist', () => {
    const playlist = createMockPlaylist({ id: 'find-me', name: 'Found' })
    setupMockStorage([playlist])

    const found = findPlaylistById('find-me')
    expect(found).not.toBeNull()
    expect(found?.name).toBe('Found')
  })

  it('returns null for non-existent playlist', () => {
    setupMockStorage([])
    expect(findPlaylistById('unknown')).toBeNull()
  })
})

describe('getPlaylistLimitWarning', () => {
  it('returns null when under threshold', () => {
    expect(getPlaylistLimitWarning(10)).toBeNull()
    expect(getPlaylistLimitWarning(39)).toBeNull()
  })

  it('returns warning when approaching limit', () => {
    expect(getPlaylistLimitWarning(40)).toMatch(/Approaching/)
    expect(getPlaylistLimitWarning(49)).toMatch(/Approaching/)
  })

  it('returns max reached when at limit', () => {
    expect(getPlaylistLimitWarning(50)).toMatch(/Maximum.*reached/)
    expect(getPlaylistLimitWarning(51)).toMatch(/Maximum.*reached/)
  })
})

describe('getTrackLimitWarning', () => {
  it('returns null when under threshold', () => {
    expect(getTrackLimitWarning(100)).toBeNull()
    expect(getTrackLimitWarning(179)).toBeNull()
  })

  it('returns warning when approaching limit', () => {
    expect(getTrackLimitWarning(180)).toMatch(/Approaching/)
    expect(getTrackLimitWarning(199)).toMatch(/Approaching/)
  })

  it('returns max reached when at limit', () => {
    expect(getTrackLimitWarning(200)).toMatch(/Maximum.*reached/)
    expect(getTrackLimitWarning(201)).toMatch(/Maximum.*reached/)
  })
})
