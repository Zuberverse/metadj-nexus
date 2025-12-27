/**
 * CSP Nonce Utility Tests
 *
 * Tests for cryptographically secure nonce generation.
 */

import { describe, it, expect } from 'vitest'
import { generateNonce } from '@/lib/nonce'

describe('generateNonce', () => {
  it('generates a non-empty string', () => {
    const nonce = generateNonce()
    expect(nonce).toBeTruthy()
    expect(typeof nonce).toBe('string')
  })

  it('generates unique nonces on each call', () => {
    const nonces = new Set<string>()
    for (let i = 0; i < 100; i++) {
      nonces.add(generateNonce())
    }
    // All 100 nonces should be unique
    expect(nonces.size).toBe(100)
  })

  it('generates nonces of consistent length', () => {
    const nonces = Array.from({ length: 10 }, () => generateNonce())
    const lengths = new Set(nonces.map(n => n.length))
    // All nonces should have the same length
    expect(lengths.size).toBe(1)
  })

  it('generates base64-compatible output', () => {
    const nonce = generateNonce()
    // Base64 characters: A-Z, a-z, 0-9, +, /, and = for padding
    expect(nonce).toMatch(/^[A-Za-z0-9+/=]+$/)
  })

  it('generates nonces suitable for CSP headers', () => {
    const nonce = generateNonce()
    // Nonce should be long enough to be secure (at least 16 chars for base64 of 16 bytes)
    expect(nonce.length).toBeGreaterThanOrEqual(16)
  })
})
