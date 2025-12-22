/**
 * Audio Volume Hook Tests
 *
 * Tests for use-audio-volume.ts - volume state management
 */

import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useAudioVolume } from '@/hooks/audio/use-audio-volume'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
    get length() {
      return Object.keys(store).length
    },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  }
})()

// Mock isLocalStorageAvailable to return true
vi.mock('@/lib/utils', () => ({
  isLocalStorageAvailable: vi.fn(() => true),
}))

describe('useAudioVolume', () => {
  let mockAudioElement: HTMLAudioElement

  beforeEach(() => {
    // Setup mock audio element
    mockAudioElement = {
      volume: 1,
      muted: false,
    } as HTMLAudioElement

    // Setup localStorage mock
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    })
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Initial State', () => {
    it('starts with default volume of 1.0 when no stored value', () => {
      const audioRef = { current: mockAudioElement }
      const { result } = renderHook(() => useAudioVolume({ audioRef }))

      expect(result.current.volume).toBe(1.0)
      expect(result.current.isMuted).toBe(false)
    })

    it('loads volume from localStorage if available', () => {
      localStorageMock.setItem('metadj-volume', '0.5')
      const audioRef = { current: mockAudioElement }
      const { result } = renderHook(() => useAudioVolume({ audioRef }))

      expect(result.current.volume).toBe(0.5)
    })

    it('uses external volume when provided', () => {
      const audioRef = { current: mockAudioElement }
      const { result } = renderHook(() =>
        useAudioVolume({
          audioRef,
          externalVolume: 0.7,
        })
      )

      expect(result.current.volume).toBe(0.7)
    })

    it('uses external mute state when provided', () => {
      const audioRef = { current: mockAudioElement }
      const { result } = renderHook(() =>
        useAudioVolume({
          audioRef,
          externalIsMuted: true,
        })
      )

      expect(result.current.isMuted).toBe(true)
    })
  })

  describe('Volume Control', () => {
    it('allows setting volume within valid range', () => {
      const audioRef = { current: mockAudioElement }
      const { result } = renderHook(() => useAudioVolume({ audioRef }))

      act(() => {
        result.current.setVolume(0.5)
      })

      expect(result.current.volume).toBe(0.5)
    })

    it('clamps volume to minimum 0', () => {
      const audioRef = { current: mockAudioElement }
      const { result } = renderHook(() => useAudioVolume({ audioRef }))

      act(() => {
        result.current.setVolume(-0.5)
      })

      expect(result.current.volume).toBe(0)
    })

    it('clamps volume to maximum 1', () => {
      const audioRef = { current: mockAudioElement }
      const { result } = renderHook(() => useAudioVolume({ audioRef }))

      act(() => {
        result.current.setVolume(1.5)
      })

      expect(result.current.volume).toBe(1)
    })

    it('applies volume to audio element', () => {
      const audioRef = { current: mockAudioElement }
      renderHook(() => useAudioVolume({ audioRef }))

      expect(mockAudioElement.volume).toBe(1)
    })

    it('calls onVolumeChange callback when in controlled mode', () => {
      const onVolumeChange = vi.fn()
      const audioRef = { current: mockAudioElement }
      const { result } = renderHook(() =>
        useAudioVolume({
          audioRef,
          externalVolume: 0.5,
          onVolumeChange,
        })
      )

      act(() => {
        result.current.setVolume(0.8)
      })

      expect(onVolumeChange).toHaveBeenCalledWith(0.8)
    })

    it('auto-unmutes when setting volume above 0 while muted', () => {
      const audioRef = { current: mockAudioElement }
      const { result } = renderHook(() => useAudioVolume({ audioRef }))

      // First mute
      act(() => {
        result.current.setIsMuted(true)
      })

      expect(result.current.isMuted).toBe(true)

      // Then set volume > 0 - should auto-unmute
      act(() => {
        result.current.setVolume(0.5)
      })

      expect(result.current.isMuted).toBe(false)
    })
  })

  describe('Mute Control', () => {
    it('allows toggling mute state', () => {
      const audioRef = { current: mockAudioElement }
      const { result } = renderHook(() => useAudioVolume({ audioRef }))

      expect(result.current.isMuted).toBe(false)

      act(() => {
        result.current.toggleMute()
      })

      expect(result.current.isMuted).toBe(true)

      act(() => {
        result.current.toggleMute()
      })

      expect(result.current.isMuted).toBe(false)
    })

    it('allows setting mute state directly', () => {
      const audioRef = { current: mockAudioElement }
      const { result } = renderHook(() => useAudioVolume({ audioRef }))

      act(() => {
        result.current.setIsMuted(true)
      })

      expect(result.current.isMuted).toBe(true)
    })

    it('applies mute state to audio element', () => {
      const audioRef = { current: mockAudioElement }
      const { result } = renderHook(() => useAudioVolume({ audioRef }))

      act(() => {
        result.current.setIsMuted(true)
      })

      expect(mockAudioElement.muted).toBe(true)
    })

    it('calls onMuteChange callback when in controlled mode', () => {
      const onMuteChange = vi.fn()
      const audioRef = { current: mockAudioElement }
      const { result } = renderHook(() =>
        useAudioVolume({
          audioRef,
          externalIsMuted: false,
          onMuteChange,
        })
      )

      act(() => {
        result.current.toggleMute()
      })

      expect(onMuteChange).toHaveBeenCalledWith(true)
    })
  })

  describe('localStorage Persistence', () => {
    it('saves volume to localStorage when changed', () => {
      const audioRef = { current: mockAudioElement }
      const { result } = renderHook(() => useAudioVolume({ audioRef }))

      act(() => {
        result.current.setVolume(0.3)
      })

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'metadj-volume',
        '0.3'
      )
    })
  })

  describe('Null Audio Element', () => {
    it('handles null audio ref gracefully', () => {
      const audioRef = { current: null }
      const { result } = renderHook(() => useAudioVolume({ audioRef }))

      // Should not throw
      act(() => {
        result.current.setVolume(0.5)
        result.current.toggleMute()
      })

      expect(result.current.volume).toBe(0.5)
      expect(result.current.isMuted).toBe(true)
    })
  })

  describe('External State Sync', () => {
    it('reflects external volume changes', () => {
      const audioRef = { current: mockAudioElement }
      const { result, rerender } = renderHook(
        ({ externalVolume }) =>
          useAudioVolume({
            audioRef,
            externalVolume,
          }),
        { initialProps: { externalVolume: 0.5 } }
      )

      expect(result.current.volume).toBe(0.5)

      rerender({ externalVolume: 0.8 })

      expect(result.current.volume).toBe(0.8)
    })

    it('reflects external mute state changes', () => {
      const audioRef = { current: mockAudioElement }
      const { result, rerender } = renderHook(
        ({ externalIsMuted }) =>
          useAudioVolume({
            audioRef,
            externalIsMuted,
          }),
        { initialProps: { externalIsMuted: false } }
      )

      expect(result.current.isMuted).toBe(false)

      rerender({ externalIsMuted: true })

      expect(result.current.isMuted).toBe(true)
    })
  })
})
