import { getTracksByCollection } from "@/lib/music"
import { filterCollections, filterTracks } from "@/lib/music/filters"
import type { WisdomData, WisdomSection } from "@/lib/wisdom"
import type { Collection, Track } from "@/types"

export interface WisdomSearchEntry {
  id: string
  title: string
  excerpt: string
  section: WisdomSection
  category?: string
  topics?: string[]
}

export interface JournalSearchEntry {
  id: string
  title: string
  excerpt: string
  createdAt: string
  updatedAt: string
}

export interface SearchContentResults {
  tracks: Track[]
  collections: Collection[]
  wisdom: WisdomSearchEntry[]
  journal: JournalSearchEntry[]
  totalCount: number
}

export interface JournalEntryInput {
  id: string
  title?: string
  content?: string
  createdAt?: string
  updatedAt?: string
}

interface BuildSearchContentResultsOptions {
  query: string
  tracks: Track[]
  collections: Collection[]
  wisdom?: WisdomData | null
  journalEntries?: JournalEntryInput[] | null
}

const normalizeText = (value: string) => value.toLowerCase()

const matchesQuery = (query: string, ...values: Array<string | undefined>) => {
  return values.some((value) => {
    if (!value) return false
    return normalizeText(value).includes(query)
  })
}

const buildExcerpt = (value: string, maxLength = 140) => {
  const cleaned = value.replace(/[#_*`>[\]()]/g, " ").replace(/\s+/g, " ").trim()
  if (cleaned.length <= maxLength) return cleaned
  return `${cleaned.slice(0, Math.max(0, maxLength - 3)).trim()}...`
}

const buildWisdomSearchEntries = (data: WisdomData, query: string): WisdomSearchEntry[] => {
  const results: WisdomSearchEntry[] = []

  data.thoughts.forEach((thought) => {
    if (!matchesQuery(query, thought.title, thought.excerpt, thought.topics?.join(" "))) return
    results.push({
      id: thought.id,
      title: thought.title,
      excerpt: thought.excerpt,
      section: "thoughts",
      topics: thought.topics,
    })
  })

  data.guides.forEach((guide) => {
    if (!matchesQuery(query, guide.title, guide.excerpt, guide.category, guide.topics?.join(" "))) return
    results.push({
      id: guide.id,
      title: guide.title,
      excerpt: guide.excerpt,
      section: "guides",
      category: guide.category,
      topics: guide.topics,
    })
  })

  data.reflections.forEach((reflection) => {
    if (!matchesQuery(query, reflection.title, reflection.excerpt, reflection.topics?.join(" "))) return
    results.push({
      id: reflection.id,
      title: reflection.title,
      excerpt: reflection.excerpt,
      section: "reflections",
      topics: reflection.topics,
    })
  })

  return results
}

const buildJournalSearchEntries = (entries: JournalEntryInput[], query: string): JournalSearchEntry[] => {
  return entries
    .filter((entry) =>
      matchesQuery(query, entry.title ?? "", entry.content ?? "")
    )
    .map((entry) => {
      const title = entry.title?.trim() || "Untitled"
      const content = entry.content?.trim() || ""
      return {
        id: entry.id,
        title,
        excerpt: content ? buildExcerpt(content) : "Empty entry",
        createdAt: entry.createdAt ?? "",
        updatedAt: entry.updatedAt ?? "",
      }
    })
}

export function buildSearchContentResults({
  query,
  tracks,
  collections,
  wisdom,
  journalEntries,
}: BuildSearchContentResultsOptions): SearchContentResults {
  const trimmedQuery = query.trim()
  if (!trimmedQuery) {
    return {
      tracks: [],
      collections: [],
      wisdom: [],
      journal: [],
      totalCount: 0,
    }
  }

  const normalizedQuery = normalizeText(trimmedQuery)

  const collectionResults = collections.length
    ? filterCollections(collections, trimmedQuery)
    : []
  const trackResults = tracks.length
    ? filterTracks(tracks, trimmedQuery, undefined, getTracksByCollection)
    : []
  const wisdomResults = wisdom ? buildWisdomSearchEntries(wisdom, normalizedQuery) : []
  const journalResults = journalEntries ? buildJournalSearchEntries(journalEntries, normalizedQuery) : []

  return {
    tracks: trackResults,
    collections: collectionResults,
    wisdom: wisdomResults,
    journal: journalResults,
    totalCount:
      trackResults.length +
      collectionResults.length +
      wisdomResults.length +
      journalResults.length,
  }
}
