/**
 * use-queue-mutations Hook Tests
 *
 * Tests queue mutation operations: add, remove, reorder, clear, insert.
 * Covers all modifications to the queue structure including edge cases.
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { useQueueMutations } from '@/hooks/home/use-queue-mutations';
import type { CommitQueueFn } from '@/hooks/home/use-queue-core';
import type { PlayerContextValue, QueueContextValue, Track } from '@/types';

// ============================================================================
// Mock Toast Context
// ============================================================================

const mockShowToast = vi.fn();

vi.mock('@/contexts/ToastContext', () => ({
  useToast: () => ({
    toasts: [],
    showToast: mockShowToast,
    dismissToast: vi.fn(),
  }),
}));

// ============================================================================
// Mock Analytics
// ============================================================================

vi.mock('@/lib/analytics', () => ({
  trackQueueAction: vi.fn(),
}));

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

describe('useQueueMutations Hook', () => {
  let mockPlayer: PlayerContextValue;
  let mockQueue: QueueContextValue;
  let mockCommitQueue: CommitQueueFn;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPlayer = createMockPlayerContext();
    mockQueue = createMockQueueContext({
      queue: mockTracks.slice(0, 3),
      autoQueue: mockTracks.slice(0, 3),
    });
    mockCommitQueue = vi.fn();
  });

  describe('handleTrackQueueAdd', () => {
    it('adds track to priority queue', () => {
      const { result } = renderHook(() =>
        useQueueMutations({
          player: mockPlayer,
          queue: mockQueue,
          commitQueue: mockCommitQueue,
        })
      );

      act(() => {
        result.current.handleTrackQueueAdd(mockTracks[3]);
      });

      expect(mockCommitQueue).toHaveBeenCalledWith(
        expect.any(Array),
        expect.arrayContaining(['track-4']),
        expect.objectContaining({ preserveCurrent: true })
      );
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('Added') })
      );
    });

    it('shows toast when track is already in queue', () => {
      mockQueue.manualTrackIds = ['track-1'];

      const { result } = renderHook(() =>
        useQueueMutations({
          player: mockPlayer,
          queue: mockQueue,
          commitQueue: mockCommitQueue,
        })
      );

      act(() => {
        result.current.handleTrackQueueAdd(mockTracks[0]);
      });

      expect(mockCommitQueue).not.toHaveBeenCalled();
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('already in your queue') })
      );
    });

    it('adds track to end of manual queue (FIFO)', () => {
      mockQueue.manualTrackIds = ['track-1', 'track-2'];

      const { result } = renderHook(() =>
        useQueueMutations({
          player: mockPlayer,
          queue: mockQueue,
          commitQueue: mockCommitQueue,
        })
      );

      act(() => {
        result.current.handleTrackQueueAdd(mockTracks[2]);
      });

      expect(mockCommitQueue).toHaveBeenCalledWith(
        expect.any(Array),
        ['track-1', 'track-2', 'track-3'],
        expect.any(Object)
      );
    });

    it('includes track in base tracks if not already present', () => {
      mockQueue.autoQueue = [mockTracks[0], mockTracks[1]];

      const { result } = renderHook(() =>
        useQueueMutations({
          player: mockPlayer,
          queue: mockQueue,
          commitQueue: mockCommitQueue,
        })
      );

      act(() => {
        result.current.handleTrackQueueAdd(mockTracks[4]);
      });

      const baseTracks = (mockCommitQueue as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(baseTracks).toContainEqual(expect.objectContaining({ id: 'track-5' }));
    });
  });

  describe('handleQueueReorder', () => {
    it('does nothing when indices are the same', () => {
      const { result } = renderHook(() =>
        useQueueMutations({
          player: mockPlayer,
          queue: mockQueue,
          commitQueue: mockCommitQueue,
        })
      );

      act(() => {
        result.current.handleQueueReorder(1, 1);
      });

      expect(mockCommitQueue).not.toHaveBeenCalled();
    });

    it('reorders within manual queue', () => {
      mockQueue.manualTrackIds = ['track-1', 'track-2', 'track-3'];
      mockQueue.queue = mockTracks.slice(0, 3);

      const { result } = renderHook(() =>
        useQueueMutations({
          player: mockPlayer,
          queue: mockQueue,
          commitQueue: mockCommitQueue,
        })
      );

      act(() => {
        result.current.handleQueueReorder(0, 2);
      });

      expect(mockCommitQueue).toHaveBeenCalledWith(
        expect.any(Array),
        ['track-2', 'track-3', 'track-1'],
        expect.objectContaining({ preserveCurrent: true })
      );
    });

    it('reorders within auto queue', () => {
      mockQueue.manualTrackIds = [];
      mockQueue.autoQueue = mockTracks.slice(0, 3);
      mockQueue.queue = mockTracks.slice(0, 3);

      const { result } = renderHook(() =>
        useQueueMutations({
          player: mockPlayer,
          queue: mockQueue,
          commitQueue: mockCommitQueue,
        })
      );

      act(() => {
        result.current.handleQueueReorder(0, 2);
      });

      expect(mockCommitQueue).toHaveBeenCalled();
      const autoQueue = (mockCommitQueue as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(autoQueue[0].id).toBe('track-2');
      expect(autoQueue[2].id).toBe('track-1');
    });

    it('handles boundary conditions in auto queue reorder', () => {
      mockQueue.manualTrackIds = [];
      mockQueue.autoQueue = mockTracks.slice(0, 3);
      mockQueue.queue = mockTracks.slice(0, 3);

      const { result } = renderHook(() =>
        useQueueMutations({
          player: mockPlayer,
          queue: mockQueue,
          commitQueue: mockCommitQueue,
        })
      );

      // Invalid indices
      act(() => {
        result.current.handleQueueReorder(-1, 2);
      });

      expect(mockCommitQueue).not.toHaveBeenCalled();
    });

    it('does not allow reorder across manual/auto boundary', () => {
      mockQueue.manualTrackIds = ['track-1'];
      mockQueue.autoQueue = mockTracks.slice(1, 3);
      mockQueue.queue = mockTracks.slice(0, 3);

      const { result } = renderHook(() =>
        useQueueMutations({
          player: mockPlayer,
          queue: mockQueue,
          commitQueue: mockCommitQueue,
        })
      );

      // Try to move from manual (index 0) to auto (index 2)
      act(() => {
        result.current.handleQueueReorder(0, 2);
      });

      // Should not commit - cross-boundary reorder not supported
      expect(mockCommitQueue).not.toHaveBeenCalled();
    });
  });

  describe('handleQueueRemove', () => {
    it('removes manual track permanently', () => {
      mockQueue.manualTrackIds = ['track-1', 'track-2'];
      mockQueue.autoQueue = mockTracks.slice(2, 4);
      mockQueue.queue = mockTracks.slice(0, 4);

      const { result } = renderHook(() =>
        useQueueMutations({
          player: mockPlayer,
          queue: mockQueue,
          commitQueue: mockCommitQueue,
        })
      );

      act(() => {
        result.current.handleQueueRemove('track-1');
      });

      expect(mockCommitQueue).toHaveBeenCalledWith(
        expect.any(Array),
        ['track-2'],
        expect.objectContaining({ preserveCurrent: true })
      );
    });

    it('removes auto track temporarily', () => {
      mockQueue.manualTrackIds = [];
      mockQueue.autoQueue = mockTracks.slice(0, 3);
      mockQueue.queue = mockTracks.slice(0, 3);

      const { result } = renderHook(() =>
        useQueueMutations({
          player: mockPlayer,
          queue: mockQueue,
          commitQueue: mockCommitQueue,
        })
      );

      act(() => {
        result.current.handleQueueRemove('track-2');
      });

      const autoQueue = (mockCommitQueue as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(autoQueue).not.toContainEqual(expect.objectContaining({ id: 'track-2' }));
    });

    it('handles removing currently playing track', () => {
      mockPlayer.currentTrack = mockTracks[0];
      mockQueue.manualTrackIds = ['track-1'];
      mockQueue.autoQueue = mockTracks.slice(1, 3);
      mockQueue.queue = mockTracks.slice(0, 3);

      const { result } = renderHook(() =>
        useQueueMutations({
          player: mockPlayer,
          queue: mockQueue,
          commitQueue: mockCommitQueue,
        })
      );

      act(() => {
        result.current.handleQueueRemove('track-1');
      });

      expect(mockPlayer.setCurrentTrack).toHaveBeenCalledWith(null);
      expect(mockPlayer.setCurrentIndex).toHaveBeenCalledWith(-1);
      expect(mockCommitQueue).toHaveBeenCalledWith(
        expect.any(Array),
        expect.any(Array),
        expect.objectContaining({ preserveCurrent: false, autoplay: true })
      );
    });

    it('removes auto track that is currently playing', () => {
      mockPlayer.currentTrack = mockTracks[1];
      mockQueue.manualTrackIds = [];
      mockQueue.autoQueue = mockTracks.slice(0, 3);
      mockQueue.queue = mockTracks.slice(0, 3);

      const { result } = renderHook(() =>
        useQueueMutations({
          player: mockPlayer,
          queue: mockQueue,
          commitQueue: mockCommitQueue,
        })
      );

      act(() => {
        result.current.handleQueueRemove('track-2');
      });

      expect(mockPlayer.setCurrentTrack).toHaveBeenCalledWith(null);
      expect(mockCommitQueue).toHaveBeenCalledWith(
        expect.any(Array),
        expect.any(Array),
        expect.objectContaining({ preserveCurrent: false, autoplay: true })
      );
    });
  });

  describe('handleQueueClear', () => {
    it('clears entire queue', () => {
      mockQueue.queue = mockTracks.slice(0, 3);
      mockQueue.manualTrackIds = ['track-1'];

      const { result } = renderHook(() =>
        useQueueMutations({
          player: mockPlayer,
          queue: mockQueue,
          commitQueue: mockCommitQueue,
        })
      );

      act(() => {
        result.current.handleQueueClear();
      });

      expect(mockCommitQueue).toHaveBeenCalledWith(
        [],
        [],
        expect.objectContaining({ preserveCurrent: false, autoplay: false })
      );
      expect(mockQueue.setQueueContext).toHaveBeenCalledWith('collection');
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Queue cleared' })
      );
    });

    it('does nothing when queue is already empty', () => {
      mockQueue.queue = [];
      mockQueue.manualTrackIds = [];

      const { result } = renderHook(() =>
        useQueueMutations({
          player: mockPlayer,
          queue: mockQueue,
          commitQueue: mockCommitQueue,
        })
      );

      act(() => {
        result.current.handleQueueClear();
      });

      expect(mockCommitQueue).not.toHaveBeenCalled();
    });
  });

  describe('handleQueueInsert', () => {
    it('inserts tracks at specified position', () => {
      mockQueue.autoQueue = mockTracks.slice(0, 2);
      mockQueue.manualTrackIds = [];

      const { result } = renderHook(() =>
        useQueueMutations({
          player: mockPlayer,
          queue: mockQueue,
          commitQueue: mockCommitQueue,
        })
      );

      act(() => {
        result.current.handleQueueInsert([mockTracks[3]], 1);
      });

      expect(mockCommitQueue).toHaveBeenCalledWith(
        expect.any(Array),
        expect.any(Array),
        expect.objectContaining({ preserveCurrent: true })
      );
    });

    it('does nothing when tracks array is empty', () => {
      const { result } = renderHook(() =>
        useQueueMutations({
          player: mockPlayer,
          queue: mockQueue,
          commitQueue: mockCommitQueue,
        })
      );

      act(() => {
        result.current.handleQueueInsert([], 0);
      });

      expect(mockCommitQueue).not.toHaveBeenCalled();
    });

    it('restores manual tracks to manual queue', () => {
      mockQueue.manualTrackIds = ['track-1'];
      mockQueue.autoQueue = mockTracks.slice(1, 3);

      const { result } = renderHook(() =>
        useQueueMutations({
          player: mockPlayer,
          queue: mockQueue,
          commitQueue: mockCommitQueue,
        })
      );

      act(() => {
        result.current.handleQueueInsert([mockTracks[0]], 0);
      });

      // Should restore to manual queue since track-1 is in manualTrackIds
      expect(mockCommitQueue).toHaveBeenCalled();
    });

    it('handles insert at boundary positions', () => {
      mockQueue.autoQueue = mockTracks.slice(0, 3);

      const { result } = renderHook(() =>
        useQueueMutations({
          player: mockPlayer,
          queue: mockQueue,
          commitQueue: mockCommitQueue,
        })
      );

      // Insert at end
      act(() => {
        result.current.handleQueueInsert([mockTracks[4]], 100);
      });

      expect(mockCommitQueue).toHaveBeenCalled();

      vi.clearAllMocks();

      // Insert at negative index (should clamp to 0)
      act(() => {
        result.current.handleQueueInsert([mockTracks[4]], -5);
      });

      expect(mockCommitQueue).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('handles adding track when auto queue does not contain it', () => {
      mockQueue.autoQueue = mockTracks.slice(0, 2);
      mockQueue.manualTrackIds = [];

      const { result } = renderHook(() =>
        useQueueMutations({
          player: mockPlayer,
          queue: mockQueue,
          commitQueue: mockCommitQueue,
        })
      );

      act(() => {
        result.current.handleTrackQueueAdd(mockTracks[4]);
      });

      const baseTracks = (mockCommitQueue as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(baseTracks.some((t: Track) => t.id === 'track-5')).toBe(true);
    });

    it('handles removing non-existent track gracefully', () => {
      mockQueue.manualTrackIds = [];
      mockQueue.autoQueue = mockTracks.slice(0, 2);
      mockQueue.queue = mockTracks.slice(0, 2);

      const { result } = renderHook(() =>
        useQueueMutations({
          player: mockPlayer,
          queue: mockQueue,
          commitQueue: mockCommitQueue,
        })
      );

      act(() => {
        result.current.handleQueueRemove('non-existent-track');
      });

      // Should still call commitQueue with filtered auto queue
      expect(mockCommitQueue).toHaveBeenCalled();
    });

    it('handles reorder with out-of-bounds indices', () => {
      mockQueue.manualTrackIds = [];
      mockQueue.autoQueue = mockTracks.slice(0, 3);
      mockQueue.queue = mockTracks.slice(0, 3);

      const { result } = renderHook(() =>
        useQueueMutations({
          player: mockPlayer,
          queue: mockQueue,
          commitQueue: mockCommitQueue,
        })
      );

      act(() => {
        result.current.handleQueueReorder(0, 100);
      });

      // Should not call commitQueue for invalid index
      expect(mockCommitQueue).not.toHaveBeenCalled();
    });
  });
});
