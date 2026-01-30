/**
 * Auth Token Utilities
 *
 * Generates and hashes one-time tokens for email verification and password resets.
 */

import 'server-only';
import { createHash, randomBytes } from 'crypto';

export function generateToken(byteLength = 32): string {
  return randomBytes(byteLength).toString('base64url');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
