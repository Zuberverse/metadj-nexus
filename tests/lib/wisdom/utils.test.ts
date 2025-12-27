/**
 * Wisdom Utility Functions Tests
 *
 * Tests for read time estimation and content formatting utilities.
 */

import { describe, it, expect } from 'vitest'
import {
  estimateReadTime,
  estimateSectionedReadTime,
  formatReadTime,
  stripSignoffParagraphs,
} from '@/lib/wisdom/utils'

describe('estimateReadTime', () => {
  it('returns 1 minute for empty paragraphs', () => {
    expect(estimateReadTime([])).toBe(1)
  })

  it('returns 1 minute for very short content', () => {
    expect(estimateReadTime(['Hello world.'])).toBe(1)
  })

  it('calculates read time based on word count', () => {
    // 200 words = 1 minute at 200 WPM
    const twoHundredWords = Array(200).fill('word').join(' ')
    expect(estimateReadTime([twoHundredWords])).toBe(1)
  })

  it('rounds up to next minute', () => {
    // 201 words should be 2 minutes (ceil)
    const words = Array(201).fill('word').join(' ')
    expect(estimateReadTime([words])).toBe(2)
  })

  it('handles multiple paragraphs', () => {
    const paragraphs = [
      Array(100).fill('word').join(' '),
      Array(100).fill('word').join(' '),
    ]
    expect(estimateReadTime(paragraphs)).toBe(1)
  })

  it('handles paragraphs with varying word counts', () => {
    const paragraphs = [
      'Short paragraph.',
      Array(400).fill('word').join(' '),
    ]
    expect(estimateReadTime(paragraphs)).toBe(3) // ~402 words = 3 minutes
  })
})

describe('estimateSectionedReadTime', () => {
  it('returns 1 minute for empty sections', () => {
    expect(estimateSectionedReadTime([])).toBe(1)
  })

  it('aggregates paragraphs across sections', () => {
    const sections = [
      { heading: 'Section 1', paragraphs: [Array(100).fill('word').join(' ')] },
      { heading: 'Section 2', paragraphs: [Array(100).fill('word').join(' ')] },
    ]
    expect(estimateSectionedReadTime(sections)).toBe(1)
  })

  it('handles sections with multiple paragraphs', () => {
    const sections = [
      {
        heading: 'Section 1',
        paragraphs: [
          Array(150).fill('word').join(' '),
          Array(150).fill('word').join(' '),
        ],
      },
    ]
    expect(estimateSectionedReadTime(sections)).toBe(2) // 300 words
  })
})

describe('formatReadTime', () => {
  it('formats 1 minute', () => {
    expect(formatReadTime(1)).toBe('1 min read')
  })

  it('formats multiple minutes', () => {
    expect(formatReadTime(5)).toBe('5 min read')
  })

  it('formats large read times', () => {
    expect(formatReadTime(30)).toBe('30 min read')
  })
})

describe('stripSignoffParagraphs', () => {
  it('returns paragraphs unchanged when no signoff', () => {
    const paragraphs = ['Hello world.', 'Another paragraph.']
    expect(stripSignoffParagraphs(paragraphs)).toEqual(paragraphs)
  })

  it('removes MetaDJ signoff paragraph', () => {
    const paragraphs = ['Hello world.', '— MetaDJ']
    expect(stripSignoffParagraphs(paragraphs)).toEqual(['Hello world.'])
  })

  it('removes signoff with varied spacing', () => {
    const paragraphs = ['Content.', '—  metadj']
    expect(stripSignoffParagraphs(paragraphs)).toEqual(['Content.'])
  })

  it('is case insensitive', () => {
    const paragraphs = ['Content.', '— METADJ']
    expect(stripSignoffParagraphs(paragraphs)).toEqual(['Content.'])
  })

  it('preserves non-signoff dashes', () => {
    const paragraphs = ['— This is a quote', 'Content.']
    expect(stripSignoffParagraphs(paragraphs)).toEqual(['— This is a quote', 'Content.'])
  })

  it('handles empty paragraphs array', () => {
    expect(stripSignoffParagraphs([])).toEqual([])
  })

  it('removes signoff with leading/trailing whitespace', () => {
    const paragraphs = ['Content.', '  — metadj  ']
    expect(stripSignoffParagraphs(paragraphs)).toEqual(['Content.'])
  })
})
