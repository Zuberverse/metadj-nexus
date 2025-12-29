/**
 * Daydream API Utility Functions Tests
 *
 * Tests for the Daydream API gateway configuration and fetch utilities.
 * Validates URL security, rate limiting, and configuration handling.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock logger to prevent actual logging during tests
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}))

// Store original env - cast to allow assignment in tests
const originalEnv = { ...process.env }

// Helper to set NODE_ENV (readonly in TypeScript but mutable at runtime)
function setNodeEnv(value: string) {
  ;(process.env as Record<string, string>).NODE_ENV = value
}

describe('getDaydreamConfig', () => {
  beforeEach(() => {
    // Reset modules to clear cached config
    vi.resetModules()
    // Reset environment
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('uses default base URL when no gateway configured', async () => {
    delete process.env.DAYDREAM_API_GATEWAY
    process.env.DAYDREAM_API_KEY = 'test-key'

    const { getDaydreamConfig } = await import('@/app/api/daydream/utils')
    const config = getDaydreamConfig()

    expect(config.base).toBe('https://api.daydream.live')
    expect(config.apiKey).toBe('test-key')
  })

  it('returns empty apiKey when not configured', async () => {
    delete process.env.DAYDREAM_API_KEY

    const { getDaydreamConfig } = await import('@/app/api/daydream/utils')
    const config = getDaydreamConfig()

    expect(config.apiKey).toBe('')
  })

  it('parses allowed WHIP hosts from comma-separated list', async () => {
    process.env.DAYDREAM_WHIP_ALLOWED_HOSTS = 'host1.com, host2.com, host3.com'

    const { getDaydreamConfig } = await import('@/app/api/daydream/utils')
    const config = getDaydreamConfig()

    expect(config.allowedHosts).toEqual(['host1.com', 'host2.com', 'host3.com'])
  })

  it('returns empty allowed hosts when not configured', async () => {
    delete process.env.DAYDREAM_WHIP_ALLOWED_HOSTS

    const { getDaydreamConfig } = await import('@/app/api/daydream/utils')
    const config = getDaydreamConfig()

    expect(config.allowedHosts).toEqual([])
  })

  it('parses allowDevWhip from environment', async () => {
    process.env.DAYDREAM_WHIP_ALLOW_DEV = 'true'

    const { getDaydreamConfig } = await import('@/app/api/daydream/utils')
    const config = getDaydreamConfig()

    expect(config.allowDevWhip).toBe(true)
  })

  it('defaults allowDevWhip to false', async () => {
    delete process.env.DAYDREAM_WHIP_ALLOW_DEV

    const { getDaydreamConfig } = await import('@/app/api/daydream/utils')
    const config = getDaydreamConfig()

    expect(config.allowDevWhip).toBe(false)
  })

  it('enables public Daydream by default outside production', async () => {
    setNodeEnv('development')
    delete process.env.DAYDREAM_PUBLIC_ENABLED

    const { getDaydreamConfig } = await import('@/app/api/daydream/utils')
    const config = getDaydreamConfig()

    expect(config.publicEnabled).toBe(true)
  })

  it('disables public Daydream by default in production', async () => {
    setNodeEnv('production')
    delete process.env.DAYDREAM_PUBLIC_ENABLED

    const { getDaydreamConfig } = await import('@/app/api/daydream/utils')
    const config = getDaydreamConfig()

    expect(config.publicEnabled).toBe(false)
  })

  it('honors DAYDREAM_PUBLIC_ENABLED=false in development', async () => {
    setNodeEnv('development')
    process.env.DAYDREAM_PUBLIC_ENABLED = 'false'

    const { getDaydreamConfig } = await import('@/app/api/daydream/utils')
    const config = getDaydreamConfig()

    expect(config.publicEnabled).toBe(false)
  })

  it('honors DAYDREAM_PUBLIC_ENABLED=true in production', async () => {
    setNodeEnv('production')
    process.env.DAYDREAM_PUBLIC_ENABLED = 'true'

    const { getDaydreamConfig } = await import('@/app/api/daydream/utils')
    const config = getDaydreamConfig()

    expect(config.publicEnabled).toBe(true)
  })
})

describe('Gateway URL Validation', () => {
  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
    // Default to development for most tests
    setNodeEnv('development')
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('trusted hostnames', () => {
    it('accepts api.daydream.live', async () => {
      process.env.DAYDREAM_API_GATEWAY = 'https://api.daydream.live'

      const { getDaydreamConfig } = await import('@/app/api/daydream/utils')
      const config = getDaydreamConfig()

      expect(config.base).toBe('https://api.daydream.live')
    })

    it('accepts daydream.live', async () => {
      process.env.DAYDREAM_API_GATEWAY = 'https://daydream.live'

      const { getDaydreamConfig } = await import('@/app/api/daydream/utils')
      const config = getDaydreamConfig()

      expect(config.base).toBe('https://daydream.live')
    })

    it('accepts sdaydream.live', async () => {
      process.env.DAYDREAM_API_GATEWAY = 'https://sdaydream.live'

      const { getDaydreamConfig } = await import('@/app/api/daydream/utils')
      const config = getDaydreamConfig()

      expect(config.base).toBe('https://sdaydream.live')
    })

    it('accepts subdomains of trusted hosts', async () => {
      process.env.DAYDREAM_API_GATEWAY = 'https://staging.api.daydream.live'

      const { getDaydreamConfig } = await import('@/app/api/daydream/utils')
      const config = getDaydreamConfig()

      expect(config.base).toBe('https://staging.api.daydream.live')
    })

    it('rejects untrusted hostnames and falls back to default', async () => {
      process.env.DAYDREAM_API_GATEWAY = 'https://evil.example.com'

      const { getDaydreamConfig } = await import('@/app/api/daydream/utils')
      const config = getDaydreamConfig()

      expect(config.base).toBe('https://api.daydream.live')
    })

    it('rejects similar-looking domain names (typosquatting)', async () => {
      process.env.DAYDREAM_API_GATEWAY = 'https://daydream.live.evil.com'

      const { getDaydreamConfig } = await import('@/app/api/daydream/utils')
      const config = getDaydreamConfig()

      expect(config.base).toBe('https://api.daydream.live')
    })

    it('rejects localhost in production', async () => {
      setNodeEnv('production')
      process.env.DAYDREAM_API_GATEWAY = 'https://localhost:3000'

      const { getDaydreamConfig } = await import('@/app/api/daydream/utils')
      const config = getDaydreamConfig()

      expect(config.base).toBe('https://api.daydream.live')
    })
  })

  describe('protocol validation', () => {
    it('requires HTTPS in production', async () => {
      setNodeEnv('production')
      process.env.DAYDREAM_API_GATEWAY = 'http://api.daydream.live'

      const { getDaydreamConfig } = await import('@/app/api/daydream/utils')
      const config = getDaydreamConfig()

      expect(config.base).toBe('https://api.daydream.live')
    })

    it('allows HTTP in development', async () => {
      setNodeEnv('development')
      process.env.DAYDREAM_API_GATEWAY = 'http://api.daydream.live'

      const { getDaydreamConfig } = await import('@/app/api/daydream/utils')
      const config = getDaydreamConfig()

      expect(config.base).toBe('http://api.daydream.live')
    })

    it('allows HTTP in test environment', async () => {
      setNodeEnv('test')
      process.env.DAYDREAM_API_GATEWAY = 'http://api.daydream.live'

      const { getDaydreamConfig } = await import('@/app/api/daydream/utils')
      const config = getDaydreamConfig()

      expect(config.base).toBe('http://api.daydream.live')
    })
  })

  describe('URL format validation', () => {
    it('strips trailing slashes', async () => {
      process.env.DAYDREAM_API_GATEWAY = 'https://api.daydream.live/'

      const { getDaydreamConfig } = await import('@/app/api/daydream/utils')
      const config = getDaydreamConfig()

      expect(config.base).toBe('https://api.daydream.live')
    })

    it('strips path components (returns origin only)', async () => {
      process.env.DAYDREAM_API_GATEWAY = 'https://api.daydream.live/v1/streams'

      const { getDaydreamConfig } = await import('@/app/api/daydream/utils')
      const config = getDaydreamConfig()

      expect(config.base).toBe('https://api.daydream.live')
    })

    it('rejects invalid URL format and falls back to default', async () => {
      process.env.DAYDREAM_API_GATEWAY = 'not-a-valid-url'

      const { getDaydreamConfig } = await import('@/app/api/daydream/utils')
      const config = getDaydreamConfig()

      expect(config.base).toBe('https://api.daydream.live')
    })

    it('rejects empty string and uses default', async () => {
      process.env.DAYDREAM_API_GATEWAY = ''

      const { getDaydreamConfig } = await import('@/app/api/daydream/utils')
      const config = getDaydreamConfig()

      expect(config.base).toBe('https://api.daydream.live')
    })
  })
})

describe('parseJson', () => {
  it('parses valid JSON', async () => {
    const { parseJson } = await import('@/app/api/daydream/utils')

    const response = new Response('{"key": "value"}')
    const result = await parseJson(response)

    expect(result).toEqual({ key: 'value' })
  })

  it('returns empty object for empty response', async () => {
    const { parseJson } = await import('@/app/api/daydream/utils')

    const response = new Response('')
    const result = await parseJson(response)

    expect(result).toEqual({})
  })

  it('returns raw text for invalid JSON', async () => {
    const { parseJson } = await import('@/app/api/daydream/utils')

    const response = new Response('not valid json')
    const result = await parseJson(response)

    expect(result).toEqual({ raw: 'not valid json' })
  })
})

describe('jsonError', () => {
  it('creates JSON error response with default status 500', async () => {
    const { jsonError } = await import('@/app/api/daydream/utils')

    const response = jsonError('Something went wrong')
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body).toEqual({ error: 'Something went wrong' })
  })

  it('creates JSON error response with custom status', async () => {
    const { jsonError } = await import('@/app/api/daydream/utils')

    const response = jsonError('Not found', 404)
    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body).toEqual({ error: 'Not found' })
  })
})
