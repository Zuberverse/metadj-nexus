/**
 * Wisdom Deep Link Tests
 *
 * Tests for wisdom URL path parsing and building utilities.
 */

import { describe, it, expect } from 'vitest'
import {
  isWisdomSection,
  buildWisdomDeepLinkPath,
  buildWisdomDeepLinkUrl,
  parseWisdomDeepLinkPath,
} from '@/lib/wisdom/deeplink'

describe('isWisdomSection', () => {
  it('returns true for "thoughts"', () => {
    expect(isWisdomSection('thoughts')).toBe(true)
  })

  it('returns true for "guides"', () => {
    expect(isWisdomSection('guides')).toBe(true)
  })

  it('returns true for "reflections"', () => {
    expect(isWisdomSection('reflections')).toBe(true)
  })

  it('returns false for invalid sections', () => {
    expect(isWisdomSection('invalid')).toBe(false)
    expect(isWisdomSection('')).toBe(false)
    expect(isWisdomSection('THOUGHTS')).toBe(false)
  })
})

describe('buildWisdomDeepLinkPath', () => {
  it('builds path for thoughts section', () => {
    expect(buildWisdomDeepLinkPath('thoughts', 'my-thought')).toBe('/wisdom/thoughts/my-thought')
  })

  it('builds path for guides section', () => {
    expect(buildWisdomDeepLinkPath('guides', 'getting-started')).toBe('/wisdom/guides/getting-started')
  })

  it('builds path for reflections section', () => {
    expect(buildWisdomDeepLinkPath('reflections', 'daily-reflection')).toBe('/wisdom/reflections/daily-reflection')
  })

  it('encodes special characters in slug', () => {
    expect(buildWisdomDeepLinkPath('thoughts', 'my thought')).toBe('/wisdom/thoughts/my%20thought')
  })

  it('encodes unicode characters', () => {
    expect(buildWisdomDeepLinkPath('thoughts', 'café')).toBe('/wisdom/thoughts/caf%C3%A9')
  })
})

describe('buildWisdomDeepLinkUrl', () => {
  it('builds full URL with origin', () => {
    expect(buildWisdomDeepLinkUrl('thoughts', 'my-thought', 'https://example.com')).toBe(
      'https://example.com/wisdom/thoughts/my-thought'
    )
  })

  it('handles origin with trailing slash', () => {
    expect(buildWisdomDeepLinkUrl('guides', 'intro', 'https://example.com/')).toBe(
      'https://example.com/wisdom/guides/intro'
    )
  })

  it('works with localhost origin', () => {
    expect(buildWisdomDeepLinkUrl('reflections', 'test', 'http://localhost:3000')).toBe(
      'http://localhost:3000/wisdom/reflections/test'
    )
  })
})

describe('parseWisdomDeepLinkPath', () => {
  it('parses thoughts deep link', () => {
    expect(parseWisdomDeepLinkPath('/wisdom/thoughts/my-thought')).toEqual({
      section: 'thoughts',
      slug: 'my-thought',
    })
  })

  it('parses guides deep link', () => {
    expect(parseWisdomDeepLinkPath('/wisdom/guides/getting-started')).toEqual({
      section: 'guides',
      slug: 'getting-started',
    })
  })

  it('parses reflections deep link', () => {
    expect(parseWisdomDeepLinkPath('/wisdom/reflections/daily')).toEqual({
      section: 'reflections',
      slug: 'daily',
    })
  })

  it('decodes URL-encoded slugs', () => {
    expect(parseWisdomDeepLinkPath('/wisdom/thoughts/my%20thought')).toEqual({
      section: 'thoughts',
      slug: 'my thought',
    })
  })

  it('handles slugs with slashes', () => {
    expect(parseWisdomDeepLinkPath('/wisdom/guides/category/subcategory')).toEqual({
      section: 'guides',
      slug: 'category/subcategory',
    })
  })

  it('returns null for non-wisdom paths', () => {
    expect(parseWisdomDeepLinkPath('/music')).toBeNull()
    expect(parseWisdomDeepLinkPath('/cinema')).toBeNull()
    expect(parseWisdomDeepLinkPath('/')).toBeNull()
  })

  it('returns null for incomplete wisdom paths', () => {
    expect(parseWisdomDeepLinkPath('/wisdom')).toBeNull()
    expect(parseWisdomDeepLinkPath('/wisdom/')).toBeNull()
    expect(parseWisdomDeepLinkPath('/wisdom/thoughts')).toBeNull()
    expect(parseWisdomDeepLinkPath('/wisdom/thoughts/')).toBeNull()
  })

  it('returns null for invalid sections', () => {
    expect(parseWisdomDeepLinkPath('/wisdom/invalid/slug')).toBeNull()
    expect(parseWisdomDeepLinkPath('/wisdom/THOUGHTS/slug')).toBeNull()
  })
})
