/**
 * Structured Data (JSON-LD) Tests
 *
 * Tests for Schema.org structured data generation for SEO.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  generateArtistSchema,
  generateCollectionSchema,
  generateTrackSchema,
  generateWebsiteSchema,
  generateFeaturedPlaylistSchema,
  combineSchemas,
} from '@/lib/structured-data'
import type { Track } from '@/types'

// Mock getAppBaseUrl
vi.mock('@/lib/app-url', () => ({
  getAppBaseUrl: () => 'https://metadj.ai',
}))

// Helper to create mock tracks
function createMockTrack(overrides: Partial<Track> = {}): Track {
  return {
    id: 'track-1',
    title: 'Test Track',
    artist: 'MetaDJ',
    duration: 240,
    audioUrl: '/audio/track-1.mp3',
    collection: 'Test Collection',
    artworkUrl: '/images/cover.jpg',
    releaseDate: '2024-01-01',
    genres: ['Electronic', 'Ambient'],
    ...overrides,
  }
}

describe('generateArtistSchema', () => {
  it('returns MusicGroup schema', () => {
    const result = generateArtistSchema()
    expect(result['@type']).toBe('MusicGroup')
    expect(result['@context']).toBe('https://schema.org')
  })

  it('includes artist name', () => {
    const result = generateArtistSchema()
    expect(result.name).toBe('MetaDJ')
  })

  it('includes URL and image', () => {
    const result = generateArtistSchema()
    expect(result.url).toBe('https://metadj.ai')
    expect(result.image).toContain('metadj-logo')
  })

  it('includes genre array', () => {
    const result = generateArtistSchema()
    expect(result.genre).toContain('Electronic')
    expect(result.genre).toContain('Techno')
  })
})

describe('generateTrackSchema', () => {
  it('returns MusicRecording schema', () => {
    const track = createMockTrack()
    const result = generateTrackSchema(track)
    expect(result['@type']).toBe('MusicRecording')
  })

  it('includes track name and description', () => {
    const track = createMockTrack({ description: 'A test track description' })
    const result = generateTrackSchema(track)
    expect(result.name).toBe('Test Track')
    expect(result.description).toBe('A test track description')
  })

  it('formats duration as ISO 8601', () => {
    const track = createMockTrack({ duration: 185 }) // 3:05
    const result = generateTrackSchema(track)
    expect(result.duration).toBe('PT3M5S')
  })

  it('includes genres array', () => {
    const track = createMockTrack({ genres: ['Techno', 'House'] })
    const result = generateTrackSchema(track)
    expect(result.genre).toEqual(['Techno', 'House'])
  })

  it('includes position when provided', () => {
    const track = createMockTrack()
    const result = generateTrackSchema(track, 5)
    expect(result.position).toBe(5)
  })

  it('includes inAlbum reference for collection', () => {
    const track = createMockTrack({ collection: 'Majestic Ascent' })
    const result = generateTrackSchema(track)
    expect(result.inAlbum?.['@type']).toBe('MusicAlbum')
    expect(result.inAlbum?.name).toBe('Majestic Ascent')
  })

  it('includes BPM when available', () => {
    const track = createMockTrack({ bpm: 128 })
    const result = generateTrackSchema(track)
    expect(result.tempo).toBe(128)
  })

  it('includes key when available', () => {
    const track = createMockTrack({ key: 'Am' })
    const result = generateTrackSchema(track)
    expect(result.musicalKey).toBe('Am')
  })
})

describe('generateCollectionSchema', () => {
  it('returns MusicAlbum schema', () => {
    const collection = { id: 'col-1', title: 'Test Collection', type: 'collection' as const }
    const tracks = [createMockTrack()]
    const result = generateCollectionSchema(collection, tracks)
    expect(result['@type']).toBe('MusicAlbum')
  })

  it('includes collection name and description', () => {
    const collection = {
      id: 'col-1',
      title: 'Majestic Ascent',
      type: 'collection' as const,
      description: 'A grand journey',
    }
    const result = generateCollectionSchema(collection, [])
    expect(result.name).toBe('Majestic Ascent')
    expect(result.description).toBe('A grand journey')
  })

  it('uses default description when not provided', () => {
    const collection = { id: 'col-1', title: 'Test', type: 'collection' as const }
    const result = generateCollectionSchema(collection, [])
    expect(result.description).toBe('Test by MetaDJ')
  })

  it('includes track count', () => {
    const collection = { id: 'col-1', title: 'Test', type: 'collection' as const, trackCount: 10 }
    const result = generateCollectionSchema(collection, [])
    expect(result.numTracks).toBe(10)
  })

  it('includes embedded track schemas', () => {
    const collection = { id: 'col-1', title: 'Test', type: 'collection' as const }
    const tracks = [createMockTrack({ id: 'track-1' }), createMockTrack({ id: 'track-2' })]
    const result = generateCollectionSchema(collection, tracks)
    expect(result.track).toHaveLength(2)
    expect(result.track[0].position).toBe(1)
    expect(result.track[1].position).toBe(2)
  })
})

describe('generateWebsiteSchema', () => {
  it('returns WebSite schema', () => {
    const result = generateWebsiteSchema()
    expect(result['@type']).toBe('WebSite')
    expect(result['@context']).toBe('https://schema.org')
  })

  it('includes site name and description', () => {
    const result = generateWebsiteSchema()
    expect(result.name).toBe('MetaDJ Nexus')
    expect(result.description).toContain('MetaDJ')
  })

  it('includes search action', () => {
    const result = generateWebsiteSchema()
    expect(result.potentialAction['@type']).toBe('SearchAction')
    expect(result.potentialAction.target.urlTemplate).toContain('{search_term_string}')
  })

  it('includes publisher organization', () => {
    const result = generateWebsiteSchema()
    expect(result.publisher['@type']).toBe('Organization')
    expect(result.publisher.name).toBe('Zuberant')
  })
})

describe('generateFeaturedPlaylistSchema', () => {
  it('returns MusicPlaylist schema', () => {
    const tracks = [createMockTrack()]
    const result = generateFeaturedPlaylistSchema(tracks)
    expect(result['@type']).toBe('MusicPlaylist')
  })

  it('includes track count', () => {
    const tracks = [createMockTrack(), createMockTrack(), createMockTrack()]
    const result = generateFeaturedPlaylistSchema(tracks)
    expect(result.numTracks).toBe(3)
  })

  it('includes positioned tracks', () => {
    const tracks = [createMockTrack({ id: 't1' }), createMockTrack({ id: 't2' })]
    const result = generateFeaturedPlaylistSchema(tracks)
    expect(result.track[0].position).toBe(1)
    expect(result.track[1].position).toBe(2)
  })
})

describe('combineSchemas', () => {
  it('wraps schemas in @graph', () => {
    const schema1 = { '@type': 'Thing', name: 'One' }
    const schema2 = { '@type': 'Thing', name: 'Two' }
    const result = combineSchemas(schema1, schema2)
    expect(result['@graph']).toHaveLength(2)
  })

  it('includes context', () => {
    const result = combineSchemas({})
    expect(result['@context']).toBe('https://schema.org')
  })

  it('handles single schema', () => {
    const schema = { '@type': 'Thing' }
    const result = combineSchemas(schema)
    expect(result['@graph']).toHaveLength(1)
  })

  it('handles empty input', () => {
    const result = combineSchemas()
    expect(result['@graph']).toEqual([])
  })
})
