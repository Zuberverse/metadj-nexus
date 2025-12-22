/**
 * Wisdom Deep Link Parser
 *
 * Parses URL paths to extract wisdom deep link information.
 * Supports links like /wisdom/thoughts/slug or /wisdom/guides/slug
 */

export type WisdomSection = "thoughts" | "guides" | "reflections"

export interface WisdomDeepLink {
  section: WisdomSection
  slug: string
}

export function isWisdomSection(value: string): value is WisdomSection {
  return value === "thoughts" || value === "guides" || value === "reflections"
}

export function buildWisdomDeepLinkPath(section: WisdomSection, slug: string): string {
  return `/wisdom/${section}/${encodeURIComponent(slug)}`
}

export function buildWisdomDeepLinkUrl(section: WisdomSection, slug: string, origin: string): string {
  return new URL(buildWisdomDeepLinkPath(section, slug), origin).toString()
}

/**
 * Parse a URL path to extract wisdom deep link information.
 * Returns null if the path is not a valid wisdom deep link.
 *
 * @example
 * parseWisdomDeepLinkPath("/wisdom/thoughts/my-thought") // { section: "thoughts", slug: "my-thought" }
 * parseWisdomDeepLinkPath("/wisdom/guides/getting-started") // { section: "guides", slug: "getting-started" }
 * parseWisdomDeepLinkPath("/music") // null
 */
export function parseWisdomDeepLinkPath(pathname: string): WisdomDeepLink | null {
  if (!pathname.startsWith("/wisdom/")) return null

  const parts = pathname.slice(8).split("/").filter(Boolean) // Remove /wisdom/ prefix
  if (parts.length < 2) return null

  const [section, ...slugParts] = parts
  const slug = decodeURIComponent(slugParts.join("/"))

  if (isWisdomSection(section)) {
    return { section, slug }
  }

  return null
}
