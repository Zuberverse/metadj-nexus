/**
 * Collection Utilities
 *
 * Shared helpers for collection slug normalization and alias handling.
 * Used by music repository and collection routing.
 */

/**
 * Normalize a string into a URL-friendly slug
 *
 * Converts input to lowercase, removes special characters, and replaces
 * spaces with hyphens. Collapses multiple hyphens into single hyphen.
 *
 * @param input - String to convert to slug
 * @returns URL-friendly slug
 * @example
 * toCollectionSlug("Metaverse Revelation") // "metaverse-revelation"
 * toCollectionSlug("Hello World!") // "hello-world"
 */
export function toCollectionSlug(input: string): string {
  const slug = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  return slug;
}

/**
 * Collection slug aliases for common variants.
 * Maps alternate/misspelled IDs to canonical slugs.
 */
const COLLECTION_SLUG_ALIASES: Record<string, string> = {
  "metaverse-revalation": "metaverse-revelation",
};

/**
 * Normalize collection slug with alias support
 *
 * First normalizes the input to a slug, then checks aliases
 * to ensure canonical slugs for existing URLs.
 *
 * @param input - Raw collection identifier or slug
 * @returns Canonical collection slug
 * @example
 * normalizeCollectionSlug("metaverse-revalation") // "metaverse-revelation"
 * normalizeCollectionSlug("Ethereal AI") // "ethereal-ai"
 */
export function normalizeCollectionSlug(input: string): string {
  const slug = toCollectionSlug(input);
  return COLLECTION_SLUG_ALIASES[slug] ?? slug;
}
