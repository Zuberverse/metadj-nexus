/**
 * Audio Source Hook Tests
 *
 * Tests for use-audio-source.ts - audio source URL resolution
 */

import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAudioSource } from '@/hooks/audio/use-audio-source'
import type { Track } from '@/lib/music'

// Mock the audio preloader cache
vi.mock('@/hooks/audio/use-audio-preloader', () => ({
  getCachedUrl: vi.fn(() => null),
}))

const mockTrack: Track = {
  id: 'track-1',
  title: 'Test Track',
  artist: 'MetaDJ',
  collection: 'Test Collection',
  audioUrl: '/api/audio/collection/test-track.mp3',
  duration: 180,
  releaseDate: '2024-01-01',
  genres: ['Electronic', 'Ambient'],
  artworkUrl: '/images/artwork.jpg',
}

const mockTrack2: Track = {
  id: 'track-2',
  title: 'Second Track',
  artist: 'MetaDJ',
  collection: 'Test Collection',
  audioUrl: '/api/audio/collection/second-track.mp3',
  duration: 240,
  releaseDate: '2024-01-01',
  genres: ['Orchestral', 'Epic'],
  artworkUrl: '/images/artwork2.jpg',
}

describe('useAudioSource', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Initial State', () => {
    it('returns undefined audioSrc when no track is provided', () => {
      const { result } = renderHook(() =>
        useAudioSource({ track: null })
      )

      expect(result.current.audioSrc).toBeUndefined()
    })

    it('returns track URL when track is provided', () => {
      const { result } = renderHook(() =>
        useAudioSource({ track: mockTrack })
      )

      expect(result.current.audioSrc).toBe(mockTrack.audioUrl)
    })

    it('starts with audioUnlockedRef as false', () => {
      const { result } = renderHook(() =>
        useAudioSource({ track: mockTrack })
      )

      expect(result.current.audioUnlockedRef.current).toBe(false)
    })
  })

  describe('markAudioUnlocked', () => {
    it('sets audioUnlockedRef to true when called', () => {
      const { result } = renderHook(() =>
        useAudioSource({ track: mockTrack })
      )

      expect(result.current.audioUnlockedRef.current).toBe(false)

      act(() => {
        result.current.markAudioUnlocked()
      })

      expect(result.current.audioUnlockedRef.current).toBe(true)
    })
  })

  describe('Track Changes', () => {
    it('calls onTrackChange when track ID changes', () => {
      const onTrackChange = vi.fn()
      const { rerender } = renderHook(
        ({ track }) =>
          useAudioSource({ track, onTrackChange }),
        { initialProps: { track: mockTrack } }
      )

      expect(onTrackChange).toHaveBeenCalledWith(mockTrack.id)
      onTrackChange.mockClear()

      rerender({ track: mockTrack2 })

      expect(onTrackChange).toHaveBeenCalledWith(mockTrack2.id)
    })

    it('does not call onTrackChange when track object changes but ID stays the same', () => {
      const onTrackChange = vi.fn()
      const { rerender } = renderHook(
        ({ track }) =>
          useAudioSource({ track, onTrackChange }),
        { initialProps: { track: mockTrack } }
      )

      expect(onTrackChange).toHaveBeenCalledTimes(1)

      // Create a new object with same ID
      const sameIdTrack = { ...mockTrack, title: 'Updated Title' }
      rerender({ track: sameIdTrack })

      // Should not call again since ID is the same
      expect(onTrackChange).toHaveBeenCalledTimes(1)
    })

    it('updates audioSrc when track changes', () => {
      const { result, rerender } = renderHook(
        ({ track }) => useAudioSource({ track }),
        { initialProps: { track: mockTrack } }
      )

      expect(result.current.audioSrc).toBe(mockTrack.audioUrl)

      rerender({ track: mockTrack2 })

      expect(result.current.audioSrc).toBe(mockTrack2.audioUrl)
    })

    it('clears audioSrc when track becomes null', () => {
      const { result, rerender } = renderHook(
        ({ track }) => useAudioSource({ track }),
        { initialProps: { track: mockTrack as Track | null } }
      )

      expect(result.current.audioSrc).toBe(mockTrack.audioUrl)

      rerender({ track: null })

      expect(result.current.audioSrc).toBeUndefined()
    })
  })

  describe('Cache Bypass on First Play', () => {
    it('uses original URL when audio not yet unlocked', () => {
      const { result } = renderHook(() =>
        useAudioSource({ track: mockTrack })
      )

      // Before unlock, should use original URL (bypass cache)
      expect(result.current.audioSrc).toBe(mockTrack.audioUrl)
      expect(result.current.audioUnlockedRef.current).toBe(false)
    })

    it('uses original URL even after unlock if no cache exists', async () => {
      const getCachedUrl = await import('@/hooks/audio/use-audio-preloader').then(
        (m) => m.getCachedUrl
      )
      const mockedGetCachedUrl = getCachedUrl as ReturnType<typeof vi.fn>
      mockedGetCachedUrl.mockReturnValue(null)

      const { result, rerender } = renderHook(
        ({ track }) => useAudioSource({ track }),
        { initialProps: { track: mockTrack } }
      )

      // Unlock audio
      act(() => {
        result.current.markAudioUnlocked()
      })

      // Force re-evaluation with new track
      rerender({ track: mockTrack2 })

      // Should still use original URL since no cache
      expect(result.current.audioSrc).toBe(mockTrack2.audioUrl)
    })

    it('uses cached URL after unlock when cache exists', async () => {
      const getCachedUrl = await import('@/hooks/audio/use-audio-preloader').then(
        (m) => m.getCachedUrl
      )
      const mockedGetCachedUrl = getCachedUrl as ReturnType<typeof vi.fn>
      const cachedBlobUrl = 'blob:http://localhost:3000/cached-url'
      mockedGetCachedUrl.mockReturnValue(cachedBlobUrl)

      const { result, rerender } = renderHook(
        ({ track }) => useAudioSource({ track }),
        { initialProps: { track: mockTrack } }
      )

      // Unlock audio
      act(() => {
        result.current.markAudioUnlocked()
      })

      // Force re-evaluation with new track
      rerender({ track: mockTrack2 })

      // Should use cached blob URL
      expect(result.current.audioSrc).toBe(cachedBlobUrl)
    })
  })

  describe('Stability', () => {
    it('audioUnlockedRef is stable across renders', () => {
      const { result, rerender } = renderHook(
        ({ track }) => useAudioSource({ track }),
        { initialProps: { track: mockTrack } }
      )

      const firstRef = result.current.audioUnlockedRef

      rerender({ track: mockTrack2 })

      // Ref should be the same object
      expect(result.current.audioUnlockedRef).toBe(firstRef)
    })

    it('audioUnlockedRef persists unlocked state across track changes', () => {
      const { result, rerender } = renderHook(
        ({ track }) => useAudioSource({ track }),
        { initialProps: { track: mockTrack } }
      )

      // Unlock audio
      act(() => {
        result.current.markAudioUnlocked()
      })

      expect(result.current.audioUnlockedRef.current).toBe(true)

      // Change track
      rerender({ track: mockTrack2 })

      // Unlocked state should persist
      expect(result.current.audioUnlockedRef.current).toBe(true)
    })
  })
})
