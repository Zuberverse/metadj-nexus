export type SeedInput = string | number | null | undefined

/**
 * Deterministic 32-bit hash for seeded visual variation.
 *
 * Uses a djb2-style mix (fast, reasonably distributed) and returns an unsigned
 * 32-bit integer suitable for downstream PRNG seeding.
 */
export function hashSeed(input: string): number {
  let hash = 5381
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i)
    hash = ((hash << 5) + hash) ^ char
  }
  return hash >>> 0
}

/**
 * Combines multiple seed parts into a single unsigned 32-bit integer.
 * Undefined/null parts are ignored.
 */
export function combineSeeds(...parts: SeedInput[]): number {
  const normalized = parts
    .filter((part): part is Exclude<SeedInput, null | undefined> => part !== null && part !== undefined)
    .map(part => String(part))
    .join("|")

  return hashSeed(normalized)
}

