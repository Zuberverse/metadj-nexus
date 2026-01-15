/**
 * Password hashing tests
 */

import { webcrypto } from 'node:crypto';
import { beforeAll, describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '@/lib/auth/password';

beforeAll(() => {
  if (!globalThis.crypto?.subtle) {
    globalThis.crypto = webcrypto as unknown as Crypto;
  }
});

describe('hashPassword', () => {
  it('returns a salt:hash pair with hex encoding', async () => {
    const hash = await hashPassword('super-secret');
    const [saltHex, hashHex] = hash.split(':');

    expect(saltHex).toMatch(/^[0-9a-f]+$/);
    expect(hashHex).toMatch(/^[0-9a-f]+$/);
    expect(saltHex).toHaveLength(32);
    expect(hashHex).toHaveLength(64);
  });

  it('generates different hashes for the same password', async () => {
    const first = await hashPassword('super-secret');
    const second = await hashPassword('super-secret');

    expect(first).not.toEqual(second);
  });
});

describe('verifyPassword', () => {
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

  it('returns false for malformed hashes', async () => {
    const valid = await verifyPassword('super-secret', 'not-a-hash');

    expect(valid).toBe(false);
  });
});
