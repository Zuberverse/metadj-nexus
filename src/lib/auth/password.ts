/**
 * Password Utilities
 *
 * Argon2id password hashing with backward compatibility for PBKDF2.
 *
 * Migration Strategy:
 * -------------------
 * 1. New passwords are hashed with Argon2id (prefixed with "$argon2id$")
 * 2. Existing PBKDF2 hashes (format: "salt:hash") are still verified
 * 3. On successful login with PBKDF2 hash, call needsRehash() to check
 *    if migration is needed, then rehash with hashPassword()
 * 4. Store the new Argon2id hash to complete the migration
 *
 * Argon2id Parameters (OWASP recommendations):
 * - Memory: 64 MiB (65536 KiB)
 * - Iterations: 3
 * - Parallelism: 4
 *
 * @see https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
 */

import { hash, verify } from '@node-rs/argon2';
import { timingSafeEqual } from 'crypto';

// =============================================================================
// Argon2id Configuration (Modern - Primary)
// =============================================================================

/**
 * Argon2id parameters following OWASP recommendations
 * @see https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
 *
 * Algorithm values: 0 = Argon2d, 1 = Argon2i, 2 = Argon2id
 * Using numeric value to avoid isolatedModules enum access issue
 */
const ARGON2_OPTIONS = {
  algorithm: 2 as const, // Argon2id
  memoryCost: 65536, // 64 MiB in KiB
  timeCost: 3, // iterations
  parallelism: 4,
  outputLen: 32, // 256-bit output
} as const;

// =============================================================================
// Legacy PBKDF2 Configuration (For Migration)
// =============================================================================

const PBKDF2_SALT_LENGTH = 16;
const PBKDF2_ITERATIONS = 100000;
const PBKDF2_KEY_LENGTH = 32;

// =============================================================================
// Hash Format Detection
// =============================================================================

/**
 * Check if a hash is in Argon2 format (starts with $argon2)
 */
function isArgon2Hash(storedHash: string): boolean {
  return storedHash.startsWith('$argon2');
}

/**
 * Check if a hash is in legacy PBKDF2 format (saltHex:hashHex)
 */
function isPbkdf2Hash(storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [saltHex, hashHex] = parts;
  // PBKDF2 format: 32 hex chars (16 bytes salt) : 64 hex chars (32 bytes hash)
  return (
    saltHex.length === 32 &&
    hashHex.length === 64 &&
    /^[0-9a-f]+$/.test(saltHex) &&
    /^[0-9a-f]+$/.test(hashHex)
  );
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Hash a password using Argon2id
 *
 * Always use this for new passwords. The output format is the standard
 * PHC string format: $argon2id$v=19$m=65536,t=3,p=4$salt$hash
 */
export async function hashPassword(password: string): Promise<string> {
  return hash(password, ARGON2_OPTIONS);
}

/**
 * Verify a password against a stored hash
 *
 * Supports both Argon2id (modern) and PBKDF2 (legacy) hash formats.
 * Use needsRehash() after successful verification to check if the
 * hash should be upgraded to Argon2id.
 */
export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  // Argon2 hash format
  if (isArgon2Hash(storedHash)) {
    try {
      return await verify(storedHash, password);
    } catch {
      return false;
    }
  }

  // Legacy PBKDF2 format (saltHex:hashHex)
  if (isPbkdf2Hash(storedHash)) {
    return verifyPbkdf2Password(password, storedHash);
  }

  // Unknown format
  return false;
}

/**
 * Check if a hash needs to be rehashed (migrated to Argon2id)
 *
 * Call this after successful password verification. If it returns true,
 * rehash the password with hashPassword() and update the stored hash.
 *
 * Example usage in login flow:
 * ```ts
 * const valid = await verifyPassword(password, user.passwordHash);
 * if (valid && needsRehash(user.passwordHash)) {
 *   const newHash = await hashPassword(password);
 *   await updateUserPasswordHash(user.id, newHash);
 * }
 * ```
 */
export function needsRehash(storedHash: string): boolean {
  // Legacy PBKDF2 hashes need migration
  if (isPbkdf2Hash(storedHash)) {
    return true;
  }

  // Argon2 hashes are current
  if (isArgon2Hash(storedHash)) {
    return false;
  }

  // Unknown format - shouldn't happen but flag for investigation
  return true;
}

/**
 * Get the hash algorithm used for a stored hash
 *
 * Useful for logging/monitoring migration progress.
 */
export function getHashAlgorithm(storedHash: string): 'argon2id' | 'pbkdf2' | 'unknown' {
  if (isArgon2Hash(storedHash)) {
    return 'argon2id';
  }
  if (isPbkdf2Hash(storedHash)) {
    return 'pbkdf2';
  }
  return 'unknown';
}

// =============================================================================
// Legacy PBKDF2 Support (Read-Only)
// =============================================================================

function hexToBytes(hex: string): Uint8Array | null {
  if (hex.length % 2 !== 0) return null;
  const matches = hex.match(/.{2}/g);
  if (!matches) return null;
  const bytes = matches.map((byte) => Number.parseInt(byte, 16));
  if (bytes.some(Number.isNaN)) return null;
  return new Uint8Array(bytes);
}

/**
 * Verify a password against a legacy PBKDF2 hash
 *
 * This is only used for backward compatibility during migration.
 * New passwords should always use Argon2id via hashPassword().
 */
async function verifyPbkdf2Password(
  password: string,
  storedHash: string
): Promise<boolean> {
  const [saltHex, hashHex] = storedHash.split(':');
  if (!saltHex || !hashHex) return false;

  const encoder = new TextEncoder();
  const salt = hexToBytes(saltHex);
  const storedBytes = hexToBytes(hashHex);
  if (!salt || !storedBytes) return false;

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
      salt: salt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    PBKDF2_KEY_LENGTH * 8
  );

  const computedBytes = new Uint8Array(derivedBits);

  if (storedBytes.length !== computedBytes.length) return false;

  return timingSafeEqual(
    Buffer.from(storedBytes),
    Buffer.from(computedBytes)
  );
}
