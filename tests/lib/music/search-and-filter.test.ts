import { describe, expect, it } from 'vitest';
import { tracks, getTracksByCollection } from '@/lib/music';
import { filterTracks } from '@/lib/music/filters';

// Helper function to simulate search
function searchTracks(allTracks: typeof tracks, query: string) {
  return filterTracks(allTracks, query, undefined, getTracksByCollection);
}

describe('Search and Filter', () => {
  describe('Track Search', () => {
    it('finds tracks by title (case insensitive) using token-based matching', () => {
      const sample = tracks.find(track => track.title.length >= 4);
      expect(sample).toBeDefined();
      const query = sample ? sample.title.slice(0, 4) : '';
      const results = searchTracks(tracks, query.toLowerCase());
      expect(results.length).toBeGreaterThan(0);
      // Token-based search uses normalized text (special chars replaced, lowercased)
      const normalizeForSearch = (text: string) =>
        text.normalize("NFKD").replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
      results.forEach(track => {
        const haystack = normalizeForSearch(track.title);
        const normalizedQuery = normalizeForSearch(query);
        expect(haystack.includes(normalizedQuery)).toBe(true);
      });
    });

    it('searches only track titles (not collection names)', () => {
      // Search for a collection name should not return results
      const results = searchTracks(tracks, 'bridging reality');
      // Should only match if track title contains these words
      results.forEach(track => {
        const normalizedTitle = track.title.toLowerCase();
        expect(normalizedTitle.includes('bridging') || normalizedTitle.includes('reality')).toBe(true);
      });
    });

    it('matches tracks with multi-word queries (all tokens must match)', () => {
      const results = searchTracks(tracks, 'metaverse odyssey');
      // Token-based search checks only the track title
      const normalizeForSearch = (text: string) =>
        text.normalize("NFKD").replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
      
      results.forEach(track => {
        const haystack = normalizeForSearch(track.title);
        const tokens = ['metaverse', 'odyssey'];
        // All tokens must be present in the title
        tokens.forEach(token => {
          expect(haystack.includes(token)).toBe(true);
        });
      });
    });

    it('returns empty array when no tokens match', () => {
      const results = searchTracks(tracks, 'xyz nonexistent');
      expect(results).toEqual([]);
    });

    it('returns empty array for no matches', () => {
      const results = searchTracks(tracks, 'xyz-nonexistent-query-123');
      expect(results).toEqual([]);
    });

    it('handles empty search query', () => {
      const results = searchTracks(tracks, '');
      // Empty query returns all tracks (no filter applied)
      expect(results.length).toBe(tracks.length);
    });

    it('handles whitespace-only query', () => {
      const results = searchTracks(tracks, '   ');
      // Whitespace-only query returns all tracks (trimmed to empty)
      expect(results.length).toBe(tracks.length);
    });

    it('handles special characters in query', () => {
      const results = searchTracks(tracks, 'test & query');
      // Should not crash, returns empty or matches if any contain '&'
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('Search Relevance', () => {
    it('finds exact title matches', () => {
      const exactTitle = tracks[0].title;
      const results = searchTracks(tracks, exactTitle);
      expect(results.length).toBeGreaterThan(0);
      const normalizeForSearch = (text: string) =>
        text.normalize("NFKD").replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
      const normalizedQuery = normalizeForSearch(exactTitle);
      results.forEach(track => {
        const haystack = normalizeForSearch(track.title);
        const tokens = normalizedQuery.split(' ').filter(Boolean);
        tokens.forEach(token => {
          expect(haystack.includes(token)).toBe(true);
        });
      });
    });

    it('finds partial word matches within titles', () => {
      const firstTrack = tracks.find(t => t.title.split(' ').length > 1);
      if (firstTrack) {
        const partialTitle = firstTrack.title.split(' ')[0];
        const results = searchTracks(tracks, partialTitle);
        expect(results.length).toBeGreaterThan(0);
        const normalizeForSearch = (text: string) =>
          text.normalize("NFKD").replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
        results.forEach(track => {
          const haystack = normalizeForSearch(`${track.title} ${track.collection || ''}`);
          const normalizedQuery = normalizeForSearch(partialTitle);
          expect(haystack.includes(normalizedQuery)).toBe(true);
        });
      }
    });

    it('matches tracks containing the search keyword anywhere', () => {
      const results = searchTracks(tracks, 'metaverse');
      expect(Array.isArray(results)).toBe(true);
      if (results.length > 0) {
        results.forEach(track => {
          const haystack = `${track.title} ${track.collection || ''}`.toLowerCase();
          expect(haystack.includes('metaverse')).toBe(true);
        });
      }
    });
  });

  describe('Search Performance', () => {
    it('handles large result sets efficiently', () => {
      const startTime = performance.now();
      searchTracks(tracks, 'a'); // Common letter, many results
      const endTime = performance.now();

      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(100); // Should complete in < 100ms
    });

    it('handles search across all tracks quickly', () => {
      const startTime = performance.now();
      // Search that might match many tracks
      const results = searchTracks(tracks, 'metadj');
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(50); // < 50ms for full search
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('handles numeric queries', () => {
      const results = searchTracks(tracks, '2025');
      expect(Array.isArray(results)).toBe(true);
    });

    it('handles single character queries', () => {
      const results = searchTracks(tracks, 'a');
      expect(Array.isArray(results)).toBe(true);
    });

    it('handles very long queries', () => {
      const longQuery = 'a'.repeat(500);
      const results = searchTracks(tracks, longQuery);
      expect(results).toEqual([]);
    });

    it('handles queries with multiple spaces', () => {
      const results = searchTracks(tracks, 'metadj    radio');
      expect(Array.isArray(results)).toBe(true);
    });

    it('handles emoji in search query', () => {
      const results = searchTracks(tracks, '🎵');
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('Search Consistency', () => {
    it('returns same results for repeated identical queries', () => {
      const query = 'odyssey';
      const results1 = searchTracks(tracks, query);
      const results2 = searchTracks(tracks, query);

      expect(results1.length).toBe(results2.length);
      expect(results1.map(t => t.id)).toEqual(results2.map(t => t.id));
    });

    it('case insensitivity works consistently', () => {
      const lowerResults = searchTracks(tracks, 'metadj');
      const upperResults = searchTracks(tracks, 'METADJ');
      const mixedResults = searchTracks(tracks, 'MetaDJ');

      expect(lowerResults.length).toBe(upperResults.length);
      expect(lowerResults.length).toBe(mixedResults.length);
    });
  });
});
