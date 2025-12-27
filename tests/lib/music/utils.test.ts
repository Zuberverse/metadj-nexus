/**
 * Music Utility Functions Tests
 *
 * Tests for track shuffling and reordering utilities.
 */

import { describe, it, expect } from 'vitest'
import { shuffleTracks, reorderTracksFromAnchor } from '@/lib/music/utils'
import type { Track } from '@/types'

// Helper to create mock tracks
function createMockTracks(count: number): Track[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `track-${i + 1}`,
    title: `Track ${i + 1}`,
    artist: 'Test Artist',
    duration: 180,
    audioUrl: `/audio/track-${i + 1}.mp3`,
    collection: 'test-collection',
    artworkUrl: '/cover.jpg',
    releaseDate: '2024-01-01',
    genres: ['Electronic', 'Ambient'],
  }))
}

describe('shuffleTracks', () => {
  it('returns empty array for empty input', () => {
    expect(shuffleTracks([])).toEqual([])
  })

  it('returns single track unchanged', () => {
    const tracks = createMockTracks(1)
    expect(shuffleTracks(tracks)).toEqual(tracks)
  })

  it('returns array with same tracks', () => {
    const tracks = createMockTracks(5)
    const shuffled = shuffleTracks(tracks)

    expect(shuffled).toHaveLength(5)
    tracks.forEach((track) => {
      expect(shuffled.find((t) => t.id === track.id)).toBeDefined()
    })
  })

  it('does not mutate original array', () => {
    const tracks = createMockTracks(5)
    const originalIds = tracks.map((t) => t.id)
    shuffleTracks(tracks)

    expect(tracks.map((t) => t.id)).toEqual(originalIds)
  })

  it('places anchor track first when specified', () => {
    const tracks = createMockTracks(5)
    const anchorId = 'track-3'

    const shuffled = shuffleTracks(tracks, anchorId)

    expect(shuffled[0].id).toBe(anchorId)
  })

  it('keeps all tracks when using anchor', () => {
    const tracks = createMockTracks(10)
    const shuffled = shuffleTracks(tracks, 'track-5')

    expect(shuffled).toHaveLength(10)
    tracks.forEach((track) => {
      expect(shuffled.find((t) => t.id === track.id)).toBeDefined()
    })
  })

  it('handles anchor that does not exist', () => {
    const tracks = createMockTracks(5)
    const shuffled = shuffleTracks(tracks, 'non-existent')

    expect(shuffled).toHaveLength(5)
  })

  it('handles null anchor', () => {
    const tracks = createMockTracks(5)
    const shuffled = shuffleTracks(tracks, null)

    expect(shuffled).toHaveLength(5)
  })

  it('eventually produces different orderings (randomness check)', () => {
    const tracks = createMockTracks(10)
    const orderings = new Set<string>()

    // Run shuffle multiple times and collect orderings
    for (let i = 0; i < 50; i++) {
      const shuffled = shuffleTracks(tracks)
      orderings.add(shuffled.map((t) => t.id).join(','))
    }

    // Should have more than 1 unique ordering (very high probability)
    expect(orderings.size).toBeGreaterThan(1)
  })
})

describe('reorderTracksFromAnchor', () => {
  it('returns empty array for empty input', () => {
    expect(reorderTracksFromAnchor([], 'any')).toEqual([])
  })

  it('returns single track unchanged', () => {
    const tracks = createMockTracks(1)
    expect(reorderTracksFromAnchor(tracks, 'track-1')).toEqual(tracks)
  })

  it('reorders tracks with anchor at start', () => {
    const tracks = createMockTracks(5)
    const result = reorderTracksFromAnchor(tracks, 'track-3')

    expect(result.map((t) => t.id)).toEqual([
      'track-3',
      'track-4',
      'track-5',
      'track-1',
      'track-2',
    ])
  })

  it('keeps order when anchor is first', () => {
    const tracks = createMockTracks(5)
    const result = reorderTracksFromAnchor(tracks, 'track-1')

    expect(result.map((t) => t.id)).toEqual([
      'track-1',
      'track-2',
      'track-3',
      'track-4',
      'track-5',
    ])
  })

  it('handles anchor at last position', () => {
    const tracks = createMockTracks(5)
    const result = reorderTracksFromAnchor(tracks, 'track-5')

    expect(result.map((t) => t.id)).toEqual([
      'track-5',
      'track-1',
      'track-2',
      'track-3',
      'track-4',
    ])
  })

  it('returns copy when anchor not found', () => {
    const tracks = createMockTracks(5)
    const result = reorderTracksFromAnchor(tracks, 'non-existent')

    expect(result).toEqual(tracks)
    expect(result).not.toBe(tracks) // Should be a copy
  })

  it('does not mutate original array', () => {
    const tracks = createMockTracks(5)
    const originalIds = tracks.map((t) => t.id)
    reorderTracksFromAnchor(tracks, 'track-3')

    expect(tracks.map((t) => t.id)).toEqual(originalIds)
  })

  it('preserves all tracks', () => {
    const tracks = createMockTracks(10)
    const result = reorderTracksFromAnchor(tracks, 'track-5')

    expect(result).toHaveLength(10)
    tracks.forEach((track) => {
      expect(result.find((t) => t.id === track.id)).toBeDefined()
    })
  })
})
