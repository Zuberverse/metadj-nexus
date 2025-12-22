import { describe, expect, it } from 'vitest';
import { haveSameMembers } from '@/lib/utils';

describe('utils', () => {
  it('confirms two arrays with identical members match regardless of order', () => {
    expect(haveSameMembers(['a', 'b', 'c'], ['c', 'b', 'a'])).toBe(true);
    expect(haveSameMembers(['a', 'b'], ['a', 'b', 'c'])).toBe(false);
  });
});
