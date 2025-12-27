/**
 * HomePageClient Component Tests
 *
 * These are smoke tests verifying the component can be imported.
 * Full integration tests are deferred until component decomposition
 * reduces the dependency complexity (see Strategic 3 in audit).
 *
 * The HomePageClient component (928 lines) orchestrates many hooks
 * and child components, making isolated unit testing impractical.
 * E2E tests provide better coverage for this integration layer.
 */
import { describe, it, expect } from 'vitest';
import { HomePageClient } from '@/components/home/HomePageClient';

describe('HomePageClient', () => {
  it('exports the component', () => {
    expect(HomePageClient).toBeDefined();
    expect(typeof HomePageClient).toBe('function');
  });

  it('has correct display name', () => {
    // Function components get their name from the function declaration
    expect(HomePageClient.name).toBe('HomePageClient');
  });
});
