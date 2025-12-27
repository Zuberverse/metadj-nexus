/**
 * Network Utility Tests
 *
 * Tests for client identification helpers used in rate limiting.
 */

import { NextRequest } from 'next/server'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { resolveClientAddress } from '@/lib/network'

// Mock NextRequest
function createMockRequest(headers: Record<string, string> = {}): NextRequest {
  const headerMap = new Map(Object.entries(headers))
  return {
    headers: {
      get: (key: string) => headerMap.get(key) ?? null,
    },
  } as unknown as NextRequest
}

describe('resolveClientAddress', () => {
  it('extracts IP from x-real-ip header', () => {
    const request = createMockRequest({ 'x-real-ip': '192.168.1.100' })
    const result = resolveClientAddress(request)

    expect(result.ip).toBe('192.168.1.100')
  })

  it('extracts IP from x-forwarded-for header when x-real-ip is missing', () => {
    const request = createMockRequest({ 'x-forwarded-for': '10.0.0.1, 10.0.0.2' })
    const result = resolveClientAddress(request)

    expect(result.ip).toBe('10.0.0.1')
  })

  it('prefers x-real-ip over x-forwarded-for', () => {
    const request = createMockRequest({
      'x-real-ip': '192.168.1.100',
      'x-forwarded-for': '10.0.0.1',
    })
    const result = resolveClientAddress(request)

    expect(result.ip).toBe('192.168.1.100')
  })

  it('returns "unknown" when no IP headers present', () => {
    const request = createMockRequest({})
    const result = resolveClientAddress(request)

    expect(result.ip).toBe('unknown')
  })

  it('returns "unknown" for empty x-real-ip', () => {
    const request = createMockRequest({ 'x-real-ip': '' })
    const result = resolveClientAddress(request)

    expect(result.ip).toBe('unknown')
  })

  it('trims whitespace from IP addresses', () => {
    const request = createMockRequest({ 'x-real-ip': '  192.168.1.100  ' })
    const result = resolveClientAddress(request)

    expect(result.ip).toBe('192.168.1.100')
  })

  it('generates a fingerprint hash', () => {
    const request = createMockRequest({ 'x-real-ip': '192.168.1.100' })
    const result = resolveClientAddress(request)

    expect(result.fingerprint).toBeTruthy()
    expect(result.fingerprint).toMatch(/^[a-f0-9]{64}$/) // SHA-256 hex
  })

  it('generates consistent fingerprint for same IP', () => {
    const request1 = createMockRequest({ 'x-real-ip': '192.168.1.100' })
    const request2 = createMockRequest({ 'x-real-ip': '192.168.1.100' })

    expect(resolveClientAddress(request1).fingerprint).toBe(
      resolveClientAddress(request2).fingerprint
    )
  })

  it('generates different fingerprints for different IPs', () => {
    const request1 = createMockRequest({ 'x-real-ip': '192.168.1.100' })
    const request2 = createMockRequest({ 'x-real-ip': '192.168.1.101' })

    expect(resolveClientAddress(request1).fingerprint).not.toBe(
      resolveClientAddress(request2).fingerprint
    )
  })

  it('handles IPv6 addresses', () => {
    const request = createMockRequest({ 'x-real-ip': '::1' })
    const result = resolveClientAddress(request)

    expect(result.ip).toBe('::1')
    expect(result.fingerprint).toBeTruthy()
  })

  it('handles full IPv6 addresses', () => {
    const request = createMockRequest({
      'x-real-ip': '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
    })
    const result = resolveClientAddress(request)

    expect(result.ip).toBe('2001:0db8:85a3:0000:0000:8a2e:0370:7334')
  })
})
