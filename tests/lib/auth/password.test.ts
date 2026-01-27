/**
 * Password hashing tests
 *
 * Tests Argon2id hashing (primary) and PBKDF2 verification (legacy migration).
 */

import { webcrypto } from 'node:crypto';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  needsRehash,
  getHashAlgorithm,
} from '@/lib/auth/password';

beforeAll(() => {
  if (!globalThis.crypto?.subtle) {
    globalThis.crypto = webcrypto as unknown as Crypto;
  }
});

describe('hashPassword (Argon2id)', () => {
  it('returns an Argon2id hash in PHC format', async () => {
    const hash = await hashPassword('super-secret');

    // PHC format: $argon2id$v=19$m=65536,t=3,p=4$salt$hash
    expect(hash).toMatch(/^\$argon2id\$v=\d+\$m=\d+,t=\d+,p=\d+\$/);
  });

  it('generates different hashes for the same password', async () => {
    const first = await hashPassword('super-secret');
    const second = await hashPassword('super-secret');

    expect(first).not.toEqual(second);
  });

  it('uses correct parameters (64MB memory, 3 iterations, 4 parallelism)', async () => {
    const hash = await hashPassword('test');

    // Check parameters in the hash string
    expect(hash).toContain('m=65536'); // 64 MiB in KiB
    expect(hash).toContain('t=3'); // 3 iterations
    expect(hash).toContain('p=4'); // parallelism 4
  });
});

describe('verifyPassword', () => {
  describe('Argon2id hashes', () => {
    it('verifies a matching password', async () => {
      const hash = await hashPassword('super-secret');
      const valid = await verifyPassword('super-secret', hash);

      expect(valid).toBe(true);
    });

    it('rejects a non-matching password', async () => {
      const hash = await hashPassword('super-secret');
      const valid = await verifyPassword('wrong-password', hash);

      expect(valid).toBe(false);
    });

    it('returns false for malformed argon2 hashes', async () => {
      const valid = await verifyPassword('super-secret', '$argon2id$invalid');

      expect(valid).toBe(false);
    });
  });

  describe('Legacy PBKDF2 hashes (migration support)', () => {
    // Pre-computed PBKDF2 hash for "test-password" with known salt
    // Format: saltHex:hashHex (32:64 hex chars)
    // This simulates an existing hash from before the migration

    it('verifies a matching password against legacy PBKDF2 hash', async () => {
      // Generate a legacy-format hash for testing
      // We need to create one using the PBKDF2 algorithm
      const legacyHash = await createLegacyPbkdf2Hash('legacy-password');

      const valid = await verifyPassword('legacy-password', legacyHash);
      expect(valid).toBe(true);
    });

    it('rejects a non-matching password against legacy PBKDF2 hash', async () => {
      const legacyHash = await createLegacyPbkdf2Hash('legacy-password');

      const valid = await verifyPassword('wrong-password', legacyHash);
      expect(valid).toBe(false);
    });
  });

  describe('unknown formats', () => {
    it('returns false for completely invalid hashes', async () => {
      const valid = await verifyPassword('super-secret', 'not-a-hash');

      expect(valid).toBe(false);
    });

    it('returns false for empty string', async () => {
      const valid = await verifyPassword('super-secret', '');

      expect(valid).toBe(false);
    });
  });
});

describe('needsRehash', () => {
  it('returns false for Argon2id hashes', async () => {
    const hash = await hashPassword('test');

    expect(needsRehash(hash)).toBe(false);
  });

  it('returns true for legacy PBKDF2 hashes', async () => {
    const legacyHash = await createLegacyPbkdf2Hash('test');

    expect(needsRehash(legacyHash)).toBe(true);
  });

  it('returns true for unknown hash formats', () => {
    expect(needsRehash('some-unknown-format')).toBe(true);
  });
});

describe('getHashAlgorithm', () => {
  it('identifies Argon2id hashes', async () => {
    const hash = await hashPassword('test');

    expect(getHashAlgorithm(hash)).toBe('argon2id');
  });

  it('identifies legacy PBKDF2 hashes', async () => {
    const legacyHash = await createLegacyPbkdf2Hash('test');

    expect(getHashAlgorithm(legacyHash)).toBe('pbkdf2');
  });

  it('returns unknown for unrecognized formats', () => {
    expect(getHashAlgorithm('random-string')).toBe('unknown');
  });
});

// =============================================================================
// Test Helpers
// =============================================================================

/**
 * Create a legacy PBKDF2 hash for testing migration
 *
 * This replicates the old hashing logic to generate test data.
 */
async function createLegacyPbkdf2Hash(password: string): Promise<string> {
  const SALT_LENGTH = 16;
  const ITERATIONS = 100000;
  const KEY_LENGTH = 32;

  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    KEY_LENGTH * 8
  );

  const hashArray = new Uint8Array(derivedBits);
  const saltHex = Array.from(salt)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const hashHex = Array.from(hashArray)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return `${saltHex}:${hashHex}`;
}
