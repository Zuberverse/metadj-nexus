/**
 * Collection Theme Tests
 *
 * Tests for collection-specific visual theming utilities.
 */

import { describe, it, expect } from 'vitest'
import {
  getCollectionGradient,
  getCollectionGradientRaw,
  getCollectionHoverStyles,
} from '@/lib/collection-theme'

describe('getCollectionGradient', () => {
  it('returns gradient for featured collection', () => {
    const result = getCollectionGradient('featured')
    expect(result).toContain('bg-linear-to-r')
    expect(result).toContain('from-')
    expect(result).toContain('to-')
  })

  it('returns gradient for majestic-ascent', () => {
    const result = getCollectionGradient('majestic-ascent')
    expect(result).toContain('#A250FF')
  })

  it('returns gradient for bridging-reality', () => {
    const result = getCollectionGradient('bridging-reality')
    expect(result).toContain('#1D4ED8')
  })

  it('returns gradient for metaverse-revelation', () => {
    const result = getCollectionGradient('metaverse-revelation')
    expect(result).toContain('#0C9CCF')
  })

  it('returns gradient for transformer', () => {
    const result = getCollectionGradient('transformer')
    expect(result).toContain('#11CFA7')
  })

  it('returns default gradient for unknown collection', () => {
    const result = getCollectionGradient('unknown-collection')
    expect(result).toContain('bg-linear-to-r')
    expect(result).toContain('#5F6CFF')
  })

  it('normalizes collection title to slug', () => {
    const result = getCollectionGradient('Majestic Ascent')
    expect(result).toContain('#A250FF')
  })
})

describe('getCollectionGradientRaw', () => {
  it('returns raw gradient without prefix for featured', () => {
    const result = getCollectionGradientRaw('featured')
    expect(result).not.toContain('bg-linear-to-r')
    expect(result).toContain('from-')
    expect(result).toContain('via-')
    expect(result).toContain('to-')
  })

  it('returns raw gradient for known collection', () => {
    const result = getCollectionGradientRaw('transformer')
    expect(result).toContain('#11CFA7')
    expect(result).not.toContain('bg-linear')
  })

  it('returns default raw gradient for unknown', () => {
    const result = getCollectionGradientRaw('non-existent')
    expect(result).toContain('#5F6CFF')
  })
})

describe('getCollectionHoverStyles', () => {
  it('returns majestic hover styles for majestic collections', () => {
    const result = getCollectionHoverStyles('majestic-ascent')
    expect(result).toContain('hover:border')
    expect(result).toContain('shadow-glow-purple')
  })

  it('returns brand hover styles for featured', () => {
    const result = getCollectionHoverStyles('featured')
    expect(result).toContain('shadow-glow-brand')
  })

  it('returns brand hover styles for bridging', () => {
    const result = getCollectionHoverStyles('bridging-reality')
    expect(result).toContain('shadow-glow-brand')
  })

  it('returns cyan hover styles for metaverse', () => {
    const result = getCollectionHoverStyles('metaverse-revelation')
    expect(result).toContain('shadow-glow-cyan')
  })

  it('returns emerald hover styles for transformer', () => {
    const result = getCollectionHoverStyles('transformer')
    expect(result).toContain('shadow-glow-emerald')
  })

  it('returns default purple glow for unknown collection', () => {
    const result = getCollectionHoverStyles('unknown-collection')
    expect(result).toContain('shadow-glow-purple')
  })

  it('normalizes collection titles to match', () => {
    const result = getCollectionHoverStyles('Metaverse Revelation')
    expect(result).toContain('shadow-glow-cyan')
  })
})
