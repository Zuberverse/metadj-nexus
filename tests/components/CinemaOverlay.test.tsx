/**
 * CinemaOverlay Component Tests
 *
 * These are smoke tests verifying the component can be imported.
 * Full integration tests are deferred until component decomposition
 * reduces the dependency complexity (see Strategic 3 in audit).
 *
 * The CinemaOverlay component (1389 lines) manages video playback,
 * visualizers, Dream mode, and scene selection with many internal refs.
 * It should be decomposed before comprehensive unit testing.
 *
 * Related hook tests:
 * - tests/hooks/use-cinema-controls.test.ts (14 tests)
 * - tests/hooks/audio/use-audio-analyzer.test.ts
 */
import { describe, it, expect } from 'vitest';
import { CinemaOverlay } from '@/components/cinema/CinemaOverlay';

describe('CinemaOverlay', () => {
  it('exports the component', () => {
    expect(CinemaOverlay).toBeDefined();
    expect(typeof CinemaOverlay).toBe('function');
  });

  it('has correct display name', () => {
    expect(CinemaOverlay.name).toBe('CinemaOverlay');
  });
});
