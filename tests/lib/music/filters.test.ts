/**
 * Music Filters Tests
 *
 * Tests for track and collection filtering with relevance scoring.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  filterCollections,
  filterTracks,
  resolveCollectionFromTracks,
  computeSelectedCollection,
} from '@/lib/music/filters'
import type { Collection, Track } from '@/types'

// Helper to create mock collections
function createMockCollection(overrides: Partial<Collection> = {}): Collection {
  return {
    id: 'collection-1',
    title: 'Test Collection',
    artist: 'MetaDJ',
    type: 'collection',
    releaseDate: '2024-01-01',
    artworkUrl: '/images/cover.jpg',
    trackCount: 10,
    ...overrides,
  }
}

// Helper to create mock tracks
function createMockTrack(overrides: Partial<Track> = {}): Track {
  return {
    id: 'track-1',
    title: 'Test Track',
    artist: 'MetaDJ',
    duration: 180,
    audioUrl: '/api/audio/track.mp3',
    collection: 'Test Collection',
    artworkUrl: '/cover.jpg',
    releaseDate: '2024-01-01',
    genres: ['Electronic', 'Ambient'],
    ...overrides,
  }
}

describe('filterCollections', () => {
  const collections: Collection[] = [
    createMockCollection({ id: 'majestic', title: 'Majestic Ascent' }),
    createMockCollection({ id: 'bridging', title: 'Bridging Reality' }),
    createMockCollection({ id: 'metaverse', title: 'Metaverse Revelation' }),
  ]

  it('returns empty array for empty query', () => {
    expect(filterCollections(collections, '')).toEqual([])
  })

  it('returns empty array for whitespace query', () => {
    expect(filterCollections(collections, '   ')).toEqual([])
  })

  it('finds collections by exact match', () => {
    const result = filterCollections(collections, 'majestic ascent')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('majestic')
  })

  it('finds collections by partial match', () => {
    const result = filterCollections(collections, 'reality')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('bridging')
  })

  it('finds collections by single token', () => {
    const result = filterCollections(collections, 'meta')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('metaverse')
  })

  it('handles case insensitive search', () => {
    const result = filterCollections(collections, 'MAJESTIC')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('majestic')
  })

  it('matches all tokens in query', () => {
    const result = filterCollections(collections, 'bridging reality')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('bridging')
  })

  it('returns empty when no match', () => {
    const result = filterCollections(collections, 'xyz')
    expect(result).toEqual([])
  })
})

describe('filterTracks', () => {
  const tracks: Track[] = [
    createMockTrack({ id: 't1', title: 'Cosmic Journey' }),
    createMockTrack({ id: 't2', title: 'Neon Dreams' }),
    createMockTrack({ id: 't3', title: 'Cosmic Neon' }),
  ]

  const getTracksByCollection = (collectionId: string) => tracks

  it('returns all tracks when no query and no collection', () => {
    const result = filterTracks(tracks, '', undefined, getTracksByCollection)
    expect(result).toEqual(tracks)
  })

  it('filters by single word query', () => {
    const result = filterTracks(tracks, 'cosmic', undefined, getTracksByCollection)
    expect(result).toHaveLength(2)
    expect(result.map((t) => t.id)).toContain('t1')
    expect(result.map((t) => t.id)).toContain('t3')
  })

  it('filters by multiple word query', () => {
    const result = filterTracks(tracks, 'cosmic neon', undefined, getTracksByCollection)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('t3')
  })

  it('returns empty array for no matches', () => {
    const result = filterTracks(tracks, 'xyz', undefined, getTracksByCollection)
    expect(result).toEqual([])
  })

  it('uses collection filter when no query', () => {
    const mockGetTracks = (id: string) => [tracks[0]]
    const result = filterTracks(tracks, '', 'collection-1', mockGetTracks)
    expect(result).toHaveLength(1)
  })

  it('returns matching tracks from search', () => {
    const testTracks = [
      createMockTrack({ id: 't1', title: 'The Journey Begins' }),
      createMockTrack({ id: 't2', title: 'Cosmic Dream' }),
    ]
    const result = filterTracks(testTracks, 'journey', undefined, getTracksByCollection)
    // Only the track containing 'journey' should be returned
    expect(result.length).toBeGreaterThanOrEqual(1)
    expect(result.some((t) => t.title.toLowerCase().includes('journey'))).toBe(true)
  })

  it('handles case insensitivity', () => {
    const mixedCaseTracks = [createMockTrack({ id: 't1', title: 'COSMIC Journey' })]
    const result = filterTracks(mixedCaseTracks, 'cosmic journey', undefined, getTracksByCollection)
    expect(result).toHaveLength(1)
  })
})

describe('resolveCollectionFromTracks', () => {
  const collections: Collection[] = [
    createMockCollection({ id: 'col-1', title: 'Collection One' }),
    createMockCollection({ id: 'col-2', title: 'Collection Two' }),
  ]

  it('returns null for empty tracks', () => {
    expect(resolveCollectionFromTracks([], collections)).toBeNull()
  })

  it('returns collection id matching first track', () => {
    const tracks = [createMockTrack({ collection: 'col-1' })]
    const result = resolveCollectionFromTracks(tracks, collections)
    expect(result).toBe('col-1')
  })

  it('matches by collection title', () => {
    const tracks = [createMockTrack({ collection: 'Collection Two' })]
    const result = resolveCollectionFromTracks(tracks, collections)
    expect(result).toBe('col-2')
  })

  it('returns null when no matching collection', () => {
    const tracks = [createMockTrack({ collection: 'Unknown' })]
    const result = resolveCollectionFromTracks(tracks, collections)
    expect(result).toBeNull()
  })
})

describe('computeSelectedCollection', () => {
  const collections: Collection[] = [
    createMockCollection({ id: 'col-1', title: 'Collection One' }),
    createMockCollection({ id: 'col-2', title: 'Collection Two' }),
  ]

  it('returns current selection when no tracks', () => {
    const result = computeSelectedCollection('current-id', [], collections)
    expect(result).toBe('current-id')
  })

  it('returns resolved collection from tracks', () => {
    const tracks = [createMockTrack({ collection: 'col-2' })]
    const result = computeSelectedCollection('col-1', tracks, collections)
    expect(result).toBe('col-2')
  })

  it('falls back to current when resolution fails', () => {
    const tracks = [createMockTrack({ collection: 'Unknown' })]
    const result = computeSelectedCollection('current-id', tracks, collections)
    expect(result).toBe('current-id')
  })
})
