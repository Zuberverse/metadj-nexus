import { describe, expect, it } from "vitest"
import { buildSearchContentResults } from "@/lib/search/search-results"
import type { WisdomData } from "@/lib/wisdom"
import type { Collection, Track } from "@/types"

const tracks: Track[] = [
  {
    id: "track-1",
    title: "Flow State",
    artist: "MetaDJ",
    collection: "Flow Collection",
    duration: 180,
    releaseDate: "2025-01-01",
    audioUrl: "/api/audio/flow-state.mp3",
    genres: ["Ambient", "Electronic"],
  },
]

const collections: Collection[] = [
  {
    id: "flow-collection",
    title: "Flow Collection",
    artist: "MetaDJ",
    type: "collection",
    releaseDate: "2025-01-01",
    trackCount: 1,
    artworkUrl: "/images/flow-collection.svg",
  },
]

const wisdom: WisdomData = {
  thoughts: [
    {
      id: "thought-1",
      title: "Creative Flow",
      date: "2025-01-02",
      excerpt: "Flow through practice.",
      content: ["Flow notes"],
    },
  ],
  guides: [
    {
      id: "guide-1",
      title: "Mixing Basics",
      category: "DJing",
      excerpt: "Start with transitions.",
      sections: [{ heading: "Intro", paragraphs: ["Basics"] }],
    },
  ],
  reflections: [
    {
      id: "reflection-1",
      title: "Late Night Session",
      excerpt: "Reflect and grow.",
      sections: [{ heading: "Notes", paragraphs: ["Keep going"] }],
    },
  ],
}

const journalEntries = [
  {
    id: "journal-1",
    title: "Flow Notes",
    content: "Creative flow through practice.",
    createdAt: "2025-01-01T10:00:00.000Z",
    updatedAt: "2025-01-02T12:00:00.000Z",
  },
]

describe("buildSearchContentResults", () => {
  it("returns empty results for empty query", () => {
    const results = buildSearchContentResults({
      query: "   ",
      tracks,
      collections,
      wisdom,
      journalEntries,
    })

    expect(results.totalCount).toBe(0)
    expect(results.tracks).toHaveLength(0)
    expect(results.collections).toHaveLength(0)
    expect(results.wisdom).toHaveLength(0)
    expect(results.journal).toHaveLength(0)
  })

  it("includes matches across tracks, collections, wisdom, and journal", () => {
    const results = buildSearchContentResults({
      query: "flow",
      tracks,
      collections,
      wisdom,
      journalEntries,
    })

    expect(results.tracks).toHaveLength(1)
    expect(results.collections).toHaveLength(1)
    expect(results.wisdom).toHaveLength(1)
    expect(results.journal).toHaveLength(1)
    expect(results.totalCount).toBe(4)
  })
})
