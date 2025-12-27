/**
 * Motion Utilities Tests
 *
 * Tests for motion preference utilities (Tailwind CSS helpers).
 */

import { describe, it, expect } from 'vitest'
import { motionSafe, motion } from '@/lib/motion-utils'

describe('motionSafe', () => {
  it('wraps animation class with motion-safe prefix', () => {
    expect(motionSafe('animate-fade-in')).toBe('motion-safe:animate-fade-in')
  })

  it('handles spin animation', () => {
    expect(motionSafe('animate-spin')).toBe('motion-safe:animate-spin')
  })

  it('handles pulse animation', () => {
    expect(motionSafe('animate-pulse')).toBe('motion-safe:animate-pulse')
  })

  it('handles bounce animation', () => {
    expect(motionSafe('animate-bounce')).toBe('motion-safe:animate-bounce')
  })

  it('handles custom animation class', () => {
    expect(motionSafe('animate-custom-glow')).toBe('motion-safe:animate-custom-glow')
  })

  it('handles empty string', () => {
    expect(motionSafe('')).toBe('motion-safe:')
  })
})

describe('motion', () => {
  it('returns motion-safe class for full motion only', () => {
    const result = motion('animate-spin')
    expect(result).toBe('motion-safe:animate-spin')
  })

  it('includes both motion-safe and motion-reduce classes', () => {
    const result = motion('animate-spin', 'animate-none')
    expect(result).toContain('motion-safe:animate-spin')
    expect(result).toContain('motion-reduce:animate-none')
  })

  it('separates classes with space', () => {
    const result = motion('animate-spin', 'animate-none')
    expect(result).toBe('motion-safe:animate-spin motion-reduce:animate-none')
  })

  it('handles empty reduced motion class', () => {
    const result = motion('animate-fade-in', '')
    expect(result).toBe('motion-safe:animate-fade-in')
    expect(result).not.toContain('motion-reduce')
  })

  it('handles transition classes', () => {
    const result = motion('transition-opacity', 'transition-none')
    expect(result).toBe('motion-safe:transition-opacity motion-reduce:transition-none')
  })

  it('handles duration classes', () => {
    const result = motion('duration-300', 'duration-0')
    expect(result).toBe('motion-safe:duration-300 motion-reduce:duration-0')
  })
})
