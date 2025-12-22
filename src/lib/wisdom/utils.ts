/**
 * Wisdom Content Utilities
 *
 * Helper functions for wisdom content display including
 * read time estimation and section navigation.
 */

// Average reading speed (words per minute)
const WORDS_PER_MINUTE = 200

const SIGNOFF_REGEX = /^—\s*metadj\s*$/i

/**
 * Estimates read time for an array of paragraphs
 * @param paragraphs - Array of paragraph strings
 * @returns Estimated read time in minutes (minimum 1)
 */
export function estimateReadTime(paragraphs: string[]): number {
  const totalWords = paragraphs.reduce((count, paragraph) => {
    return count + paragraph.split(/\s+/).length
  }, 0)

  const minutes = Math.ceil(totalWords / WORDS_PER_MINUTE)
  return Math.max(1, minutes)
}

/**
 * Estimates read time for sectioned content (Guides, Reflections)
 * @param sections - Array of sections with heading and paragraphs
 * @returns Estimated read time in minutes (minimum 1)
 */
export function estimateSectionedReadTime(
  sections: { heading: string; paragraphs: string[] }[]
): number {
  const allParagraphs = sections.flatMap(section => section.paragraphs)
  return estimateReadTime(allParagraphs)
}

/**
 * Formats read time for display
 * @param minutes - Read time in minutes
 * @returns Formatted string (e.g., "3 min read")
 */
export function formatReadTime(minutes: number): string {
  return `${minutes} min read`
}

/**
 * Removes simple signature paragraphs (e.g., "— MetaDJ") from rendered output.
 * Content can still include sign-offs for exports/other surfaces.
 */
export function stripSignoffParagraphs(paragraphs: string[]): string[] {
  return paragraphs.filter((paragraph) => !SIGNOFF_REGEX.test(paragraph.trim()))
}
