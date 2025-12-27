/**
 * MetaDjAiChat Component Tests
 *
 * These are smoke tests verifying the component can be imported.
 * Full integration tests are deferred until component decomposition
 * reduces the dependency complexity (see Strategic 3 in audit).
 *
 * The MetaDjAiChat component (1467 lines) manages complex state for
 * chat sessions, streaming, keyboard handling, and scroll behavior.
 * It should be decomposed before comprehensive unit testing.
 *
 * The underlying useMetaDjAi hook is tested separately in:
 * tests/hooks/use-metadjai.test.ts (46 tests)
 */
import { describe, it, expect } from 'vitest';
import { MetaDjAiChat } from '@/components/metadjai/MetaDjAiChat';

describe('MetaDjAiChat', () => {
  it('exports the component', () => {
    expect(MetaDjAiChat).toBeDefined();
    expect(typeof MetaDjAiChat).toBe('function');
  });

  it('has correct display name', () => {
    expect(MetaDjAiChat.name).toBe('MetaDjAiChat');
  });
});
