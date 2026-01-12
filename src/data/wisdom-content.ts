/**
 * Wisdom Content - Blog, Guides, and Biography
 *
 * PERFORMANCE OPTIMIZATION:
 * Content is stored in wisdom-content.json and loaded dynamically to reduce bundle size.
 * This file provides type definitions and re-exports for wisdom content.
 *
 * Sections:
 * - Blog (displays as "Thoughts"): Blog-style dispatches and essays
 * - Guides (displays as "Guides"): How-to and educational content
 * - Reflections (displays as "Reflections"): Personal narratives, origin stories, and journey notes
 */

// Import JSON data - this will be tree-shaken if not used
import wisdomData from './wisdom-content.json'

export interface ThoughtPost {
  id: string
  title: string
  date: string
  excerpt: string
  topics?: string[]
  content: string[]
}

export interface Guide {
  id: string
  title: string
  category: string
  excerpt: string
  topics?: string[]
  sections: {
    heading: string
    paragraphs: string[]
  }[]
}

export interface Reflection {
  id: string
  title: string
  excerpt: string
  /** Optional author signature shown in the footer. Defaults to MetaDJ. */
  signedBy?: "MetaDJ"
  topics?: string[]
  sections: {
    heading: string
    paragraphs: string[]
  }[]
}

// Re-export content from JSON
// The actual content is in wisdom-content.json to reduce initial bundle size
export const THOUGHTS_POSTS: ThoughtPost[] = wisdomData.thoughtsPosts

export const GUIDES: Guide[] = wisdomData.guides

export const REFLECTIONS: Reflection[] = wisdomData.reflections as Reflection[]

// Export all content
export const WISDOM_CONTENT = {
  thoughtsPosts: THOUGHTS_POSTS,
  guides: GUIDES,
  reflections: REFLECTIONS
}
