import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { APP_VERSION } from '@/lib/app-version';
import {
  saveQueueState,
  loadQueueState,
  clearQueueState,
} from '@/lib/queue-persistence';
import type { Track } from '@/lib/music';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('Queue Persistence', () => {
  const mockTracks: Track[] = [
    {
      id: 'track-1',
      title: 'Test Track 1',
      artist: 'MetaDJ',
      collection: 'test-collection',
      duration: 180,
      releaseDate: '2025-01-01',
      audioUrl: '/api/audio/test-1.mp3',
      genres: ['Electronic', 'Test'],
    },
    {
      id: 'track-2',
      title: 'Test Track 2',
      artist: 'MetaDJ',
      collection: 'test-collection',
      duration: 240,
      releaseDate: '2025-01-02',
      audioUrl: '/api/audio/test-2.mp3',
      genres: ['Ambient', 'Test'],
    },
  ];

  beforeEach(() => {
    localStorageMock.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Save Queue', () => {
    it('saves queue to localStorage with correct structure', () => {
      saveQueueState(mockTracks, ['track-1'], 'collection', 'featured', '');

      const saved = localStorageMock.getItem('metadj_queue_state');
      expect(saved).toBeTruthy();

      const parsed = JSON.parse(saved!);
      expect(parsed.version).toBe(APP_VERSION);
      expect(parsed.queue).toHaveLength(2);
      expect(parsed.manualTrackIds).toEqual(['track-1']);
      expect(parsed.selectedCollection).toBe('featured');
      expect(parsed.autoQueue).toHaveLength(1);
      expect(parsed.autoQueue[0].id).toBe('track-2');
    });

    it('saves search query with queue metadata', () => {
      saveQueueState(mockTracks, [], 'search', 'bridging-reality', 'metaverse');

      const saved = JSON.parse(localStorageMock.getItem('metadj_queue_state')!);
      expect(saved.searchQuery).toBe('metaverse');
      expect(saved.queueContext).toBe('search');
    });

    it('handles empty queue gracefully', () => {
      saveQueueState([], [], 'collection', 'featured', '');

      const saved = JSON.parse(localStorageMock.getItem('metadj_queue_state')!);
      expect(saved.queue).toEqual([]);
    });

    it('includes timestamp when saving', () => {
      const beforeSave = Date.now();
      saveQueueState(mockTracks, [], 'collection', 'featured', '');
      const afterSave = Date.now();

      const saved = JSON.parse(localStorageMock.getItem('metadj_queue_state')!);
      expect(saved.timestamp).toBeGreaterThanOrEqual(beforeSave);
      expect(saved.timestamp).toBeLessThanOrEqual(afterSave);
    });
  });

  describe('Load Queue', () => {
    it('loads queue from localStorage correctly', () => {
      const queueData = {
        version: APP_VERSION,
        queue: mockTracks,
        manualTrackIds: ['track-2'],
        autoQueue: [mockTracks[0]],
        queueContext: 'collection' as const,
        selectedCollection: 'majestic-ascent',
        searchQuery: 'epic',
        timestamp: Date.now(),
      };

      localStorageMock.setItem('metadj_queue_state', JSON.stringify(queueData));

      const loaded = loadQueueState();
      expect(loaded).toBeDefined();
      expect(loaded?.queue).toHaveLength(2);
      expect(loaded?.manualTrackIds).toEqual(['track-2']);
      expect(loaded?.selectedCollection).toBe('majestic-ascent');
      expect(loaded?.searchQuery).toBe('epic');
      expect(loaded?.autoQueue?.[0].id).toBe('track-1');
    });

    it('returns null when no queue is saved', () => {
      const loaded = loadQueueState();
      expect(loaded).toBeNull();
    });

    it('returns null for invalid JSON', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      localStorageMock.setItem('metadj_queue_state', 'invalid-json');
      const loaded = loadQueueState();
      expect(loaded).toBeNull();
      consoleSpy.mockRestore();
    });

    it('returns null for mismatched version', () => {
      const oldVersion = {
        version: '0.79',
        queue: mockTracks,
        manualTrackIds: [],
        queueContext: 'collection' as const,
        selectedCollection: 'featured',
        searchQuery: '',
        timestamp: Date.now(),
      };

      localStorageMock.setItem('metadj_queue_state', JSON.stringify(oldVersion));
      const loaded = loadQueueState();
      expect(loaded).toBeNull();
    });

    it('handles missing optional fields gracefully', () => {
      const minimalQueue = {
        version: APP_VERSION,
        queue: mockTracks,
        manualTrackIds: [],
        queueContext: 'collection' as const,
        timestamp: Date.now(),
      };

      localStorageMock.setItem('metadj_queue_state', JSON.stringify(minimalQueue));
      const loaded = loadQueueState();
      expect(loaded).toBeDefined();
      expect(loaded?.queue).toHaveLength(2);
      expect(loaded?.autoQueue).toHaveLength(2);
    });
  });

  describe('Clear Queue', () => {
    it('removes queue from localStorage', () => {
      saveQueueState(mockTracks, [], 'collection', 'featured', '');

      expect(localStorageMock.getItem('metadj_queue_state')).toBeTruthy();

      clearQueueState();
      expect(localStorageMock.getItem('metadj_queue_state')).toBeNull();
    });

    it('handles clearing when no queue exists', () => {
      expect(() => clearQueueState()).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('handles very long queue (100+ tracks)', () => {
      const longQueue = Array.from({ length: 150 }, (_, i) => ({
        ...mockTracks[0],
        id: `track-${i}`,
        title: `Track ${i}`,
      }));

      saveQueueState(longQueue, [], 'collection', 'featured', '');

      const loaded = loadQueueState();
      expect(loaded?.queue).toHaveLength(150);
    });

    it('preserves track order across save/load cycle', () => {
      const orderedTracks = [mockTracks[1], mockTracks[0]];

      saveQueueState(orderedTracks, [], 'collection', 'featured', '');

      const loaded = loadQueueState();
      expect(loaded?.queue[0].id).toBe('track-2');
      expect(loaded?.queue[1].id).toBe('track-1');
    });

    it('handles special characters in search query', () => {
      const specialQuery = 'test & query "with" special <characters>';

      saveQueueState(mockTracks, [], 'search', 'featured', specialQuery);

      const loaded = loadQueueState();
      expect(loaded?.searchQuery).toBe(specialQuery);
    });
  });
});
