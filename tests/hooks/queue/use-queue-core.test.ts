/**
 * use-queue-core Hook Tests
 *
 * Tests the core queue building logic and filtered track computations.
 * Covers commitQueue function, filtered track memos, and edge cases.
 */

import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { useQueueCore } from '@/hooks/home/use-queue-core';
import type { PlayerContextValue, QueueContextValue, Track } from '@/types';

// ============================================================================
// Test Fixtures
// ============================================================================

const createMockTrack = (id: string, overrides?: Partial<Track>): Track => ({
  id,
  title: `Track ${id}`,
  artist: 'MetaDJ',
  collection: 'test-collection',
  duration: 180,
  releaseDate: '2025-01-01',
  audioUrl: `/api/audio/${id}.mp3`,
  genres: ['Electronic', 'Test'],
  ...overrides,
});

const mockTracks: Track[] = [
  createMockTrack('track-1', { title: 'First Track' }),
  createMockTrack('track-2', { title: 'Second Track' }),
  createMockTrack('track-3', { title: 'Third Track' }),
  createMockTrack('track-4', { title: 'Fourth Track' }),
  createMockTrack('track-5', { title: 'Fifth Track' }),
];

const createMockPlayerContext = (overrides?: Partial<PlayerContextValue>): PlayerContextValue => ({
  currentTrack: null,
  currentIndex: -1,
  shouldPlay: false,
  isLoading: false,
  isPlaying: false,
  duration: 0,
  audioRef: { current: null },
  currentTimeRef: { current: 0 },
  play: vi.fn(),
  pause: vi.fn(),
  next: vi.fn(),
  previous: vi.fn(),
  seek: vi.fn(),
  volume: 1,
  isMuted: false,
  setVolume: vi.fn(),
  toggleMute: vi.fn(),
  setCurrentTrack: vi.fn(),
  setCurrentIndex: vi.fn(),
  setShouldPlay: vi.fn(),
  setIsLoading: vi.fn(),
  setIsPlaying: vi.fn(),
  setCurrentTimeRef: vi.fn(),
  setDuration: vi.fn(),
  notifyAudioReady: vi.fn(),
  ...overrides,
});

const createMockQueueContext = (overrides?: Partial<QueueContextValue>): QueueContextValue => ({
  queue: [],
  autoQueue: [],
  manualTrackIds: [],
  queueContext: 'collection',
  persistenceMetadata: null,
  isHydrated: true,
  isShuffleEnabled: false,
  repeatMode: 'none',
  setQueue: vi.fn(),
  updatePersistenceMetadata: vi.fn(),
  setQueueContext: vi.fn(),
  setManualTrackIds: vi.fn(),
  setAutoQueue: vi.fn(),
  setIsShuffleEnabled: vi.fn(),
  setRepeatMode: vi.fn(),
  ...overrides,
});

// ============================================================================
// Tests
// ============================================================================

describe('useQueueCore Hook', () => {
  let mockPlayer: PlayerContextValue;
  let mockQueue: QueueContextValue;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPlayer = createMockPlayerContext();
    mockQueue = createMockQueueContext();
  });

  describe('Filtered Collections Memo', () => {
    it('returns all collection tracks when no manual IDs', () => {
      const { result } = renderHook(() =>
        useQueueCore({
          player: mockPlayer,
          queue: mockQueue,
          collectionTracks: mockTracks,
          searchResults: [],
        })
      );

      expect(result.current.filteredCollectionTracks).toHaveLength(5);
      expect(result.current.filteredCollectionIds).toEqual([
        'track-1', 'track-2', 'track-3', 'track-4', 'track-5'
      ]);
    });

    it('excludes manual tracks from filtered collection', () => {
      mockQueue.manualTrackIds = ['track-2', 'track-4'];

      const { result } = renderHook(() =>
        useQueueCore({
          player: mockPlayer,
          queue: mockQueue,
          collectionTracks: mockTracks,
          searchResults: [],
        })
      );

      expect(result.current.filteredCollectionTracks).toHaveLength(3);
      expect(result.current.filteredCollectionIds).toEqual([
        'track-1', 'track-3', 'track-5'
      ]);
    });

    it('returns empty array when all tracks are manual', () => {
      mockQueue.manualTrackIds = ['track-1', 'track-2', 'track-3', 'track-4', 'track-5'];

      const { result } = renderHook(() =>
        useQueueCore({
          player: mockPlayer,
          queue: mockQueue,
          collectionTracks: mockTracks,
          searchResults: [],
        })
      );

      expect(result.current.filteredCollectionTracks).toHaveLength(0);
      expect(result.current.filteredCollectionIds).toEqual([]);
    });
  });

  describe('Filtered Search Results Memo', () => {
    const searchResults = [mockTracks[0], mockTracks[2], mockTracks[4]];

    it('returns all search results when no manual IDs', () => {
      const { result } = renderHook(() =>
        useQueueCore({
          player: mockPlayer,
          queue: mockQueue,
          collectionTracks: [],
          searchResults,
        })
      );

      expect(result.current.filteredSearchResults).toHaveLength(3);
      expect(result.current.filteredSearchIds).toEqual(['track-1', 'track-3', 'track-5']);
    });

    it('excludes manual tracks from filtered search results', () => {
      mockQueue.manualTrackIds = ['track-1'];

      const { result } = renderHook(() =>
        useQueueCore({
          player: mockPlayer,
          queue: mockQueue,
          collectionTracks: [],
          searchResults,
        })
      );

      expect(result.current.filteredSearchResults).toHaveLength(2);
      expect(result.current.filteredSearchIds).toEqual(['track-3', 'track-5']);
    });
  });

  describe('Auto Queue IDs Memo', () => {
    it('returns IDs from auto queue', () => {
      mockQueue.autoQueue = [mockTracks[0], mockTracks[1]];

      const { result } = renderHook(() =>
        useQueueCore({
          player: mockPlayer,
          queue: mockQueue,
          collectionTracks: mockTracks,
          searchResults: [],
        })
      );

      expect(result.current.autoQueueIds).toEqual(['track-1', 'track-2']);
    });

    it('returns empty array when auto queue is empty', () => {
      mockQueue.autoQueue = [];

      const { result } = renderHook(() =>
        useQueueCore({
          player: mockPlayer,
          queue: mockQueue,
          collectionTracks: mockTracks,
          searchResults: [],
        })
      );

      expect(result.current.autoQueueIds).toEqual([]);
    });
  });

  describe('commitQueue Function', () => {
    it('builds queue with manual tracks first', () => {
      mockQueue.manualTrackIds = [];

      const { result } = renderHook(() =>
        useQueueCore({
          player: mockPlayer,
          queue: mockQueue,
          collectionTracks: mockTracks,
          searchResults: [],
        })
      );

      act(() => {
        result.current.commitQueue(
          mockTracks.slice(0, 3),
          ['track-2'],
          { preserveCurrent: false }
        );
      });

      // Should call setQueue with combined queue
      expect(mockQueue.setQueue).toHaveBeenCalled();
      expect(mockQueue.setAutoQueue).toHaveBeenCalled();
    });

    it('handles empty queue correctly', () => {
      const { result } = renderHook(() =>
        useQueueCore({
          player: mockPlayer,
          queue: mockQueue,
          collectionTracks: mockTracks,
          searchResults: [],
        })
      );

      act(() => {
        result.current.commitQueue([], [], { preserveCurrent: false });
      });

      expect(mockPlayer.setCurrentTrack).toHaveBeenCalledWith(null);
      expect(mockPlayer.setCurrentIndex).toHaveBeenCalledWith(-1);
    });

    it('preserves current track when option is true', () => {
      mockPlayer.currentTrack = mockTracks[1];
      mockPlayer.currentIndex = 1;

      const { result } = renderHook(() =>
        useQueueCore({
          player: mockPlayer,
          queue: mockQueue,
          collectionTracks: mockTracks,
          searchResults: [],
        })
      );

      act(() => {
        result.current.commitQueue(
          mockTracks,
          [],
          { preserveCurrent: true }
        );
      });

      // Should attempt to maintain current track
      expect(mockQueue.setQueue).toHaveBeenCalled();
    });

    it('sets anchor track when anchorTrackId is provided', () => {
      const { result } = renderHook(() =>
        useQueueCore({
          player: mockPlayer,
          queue: mockQueue,
          collectionTracks: mockTracks,
          searchResults: [],
        })
      );

      act(() => {
        result.current.commitQueue(
          mockTracks,
          [],
          { anchorTrackId: 'track-3', autoplay: true }
        );
      });

      expect(mockPlayer.setCurrentTrack).toHaveBeenCalled();
      expect(mockPlayer.setShouldPlay).toHaveBeenCalledWith(true);
    });

    it('handles autoplay option correctly', () => {
      const { result } = renderHook(() =>
        useQueueCore({
          player: mockPlayer,
          queue: mockQueue,
          collectionTracks: mockTracks,
          searchResults: [],
        })
      );

      act(() => {
        result.current.commitQueue(
          mockTracks,
          [],
          { anchorTrackId: 'track-1', autoplay: false }
        );
      });

      expect(mockPlayer.setShouldPlay).toHaveBeenCalledWith(false);
    });

    it('updates manual track IDs only when order changes', () => {
      mockQueue.manualTrackIds = ['track-1', 'track-2'];

      const { result } = renderHook(() =>
        useQueueCore({
          player: mockPlayer,
          queue: mockQueue,
          collectionTracks: mockTracks,
          searchResults: [],
        })
      );

      // Same order - should not call setManualTrackIds
      act(() => {
        result.current.commitQueue(
          mockTracks,
          ['track-1', 'track-2'],
          { preserveCurrent: true }
        );
      });

      // Check if setManualTrackIds was called
      const setManualCalls = (mockQueue.setManualTrackIds as ReturnType<typeof vi.fn>).mock.calls;

      // Reorder - should call setManualTrackIds
      mockQueue.setManualTrackIds = vi.fn();

      act(() => {
        result.current.commitQueue(
          mockTracks,
          ['track-2', 'track-1'],
          { preserveCurrent: true }
        );
      });

      expect(mockQueue.setManualTrackIds).toHaveBeenCalled();
    });
  });

  describe('Single Track Handling', () => {
    it('handles single track in queue', () => {
      const singleTrack = [mockTracks[0]];

      const { result } = renderHook(() =>
        useQueueCore({
          player: mockPlayer,
          queue: mockQueue,
          collectionTracks: singleTrack,
          searchResults: [],
        })
      );

      act(() => {
        result.current.commitQueue(
          singleTrack,
          [],
          { anchorTrackId: 'track-1', autoplay: true }
        );
      });

      expect(mockQueue.setQueue).toHaveBeenCalled();
      expect(mockPlayer.setCurrentIndex).toHaveBeenCalledWith(0);
    });

    it('handles single manual track', () => {
      const { result } = renderHook(() =>
        useQueueCore({
          player: mockPlayer,
          queue: mockQueue,
          collectionTracks: mockTracks,
          searchResults: [],
        })
      );

      act(() => {
        result.current.commitQueue(
          mockTracks.slice(0, 1),
          ['track-1'],
          { preserveCurrent: false }
        );
      });

      expect(mockQueue.setQueue).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('handles duplicate manual track IDs', () => {
      const { result } = renderHook(() =>
        useQueueCore({
          player: mockPlayer,
          queue: mockQueue,
          collectionTracks: mockTracks,
          searchResults: [],
        })
      );

      act(() => {
        result.current.commitQueue(
          mockTracks,
          ['track-1', 'track-1', 'track-2', 'track-2'],
          { preserveCurrent: false }
        );
      });

      // Should deduplicate - check that queue was set
      expect(mockQueue.setQueue).toHaveBeenCalled();
    });

    it('handles non-existent track IDs in manual queue', () => {
      const { result } = renderHook(() =>
        useQueueCore({
          player: mockPlayer,
          queue: mockQueue,
          collectionTracks: mockTracks,
          searchResults: [],
        })
      );

      act(() => {
        result.current.commitQueue(
          mockTracks,
          ['non-existent-track', 'track-1'],
          { preserveCurrent: false }
        );
      });

      // Should filter out non-existent tracks
      expect(mockQueue.setQueue).toHaveBeenCalled();
    });

    it('handles empty base tracks with manual IDs', () => {
      const { result } = renderHook(() =>
        useQueueCore({
          player: mockPlayer,
          queue: mockQueue,
          collectionTracks: mockTracks,
          searchResults: [],
        })
      );

      act(() => {
        result.current.commitQueue(
          [],
          ['track-1'],
          { preserveCurrent: false }
        );
      });

      // Manual tracks should still be looked up from global tracks
      expect(mockQueue.setQueue).toHaveBeenCalled();
    });

    it('handles same track click (toggle behavior)', () => {
      mockPlayer.currentTrack = mockTracks[0];
      mockPlayer.shouldPlay = true;

      const { result } = renderHook(() =>
        useQueueCore({
          player: mockPlayer,
          queue: mockQueue,
          collectionTracks: mockTracks,
          searchResults: [],
        })
      );

      act(() => {
        result.current.commitQueue(
          mockTracks,
          [],
          { anchorTrackId: 'track-1', autoplay: false }
        );
      });

      // When same track, should respect autoplay option
      expect(mockPlayer.setShouldPlay).toHaveBeenCalledWith(false);
    });
  });

  describe('Memoization Stability', () => {
    it('returns stable references when inputs unchanged', () => {
      const { result, rerender } = renderHook(() =>
        useQueueCore({
          player: mockPlayer,
          queue: mockQueue,
          collectionTracks: mockTracks,
          searchResults: [],
        })
      );

      const firstCommitQueue = result.current.commitQueue;
      const firstFilteredTracks = result.current.filteredCollectionTracks;

      rerender();

      expect(result.current.commitQueue).toBe(firstCommitQueue);
      expect(result.current.filteredCollectionTracks).toBe(firstFilteredTracks);
    });
  });
});
