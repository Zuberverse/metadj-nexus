import type { Collection, Track } from "@/types";

const normalize = (value: string): string =>
  value
    .normalize("NFKD")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

// Cache normalized titles to avoid repeated unicode normalization on every keystroke.
const normalizedTrackTitleCache = new Map<string, string>();
const normalizedCollectionTitleCache = new Map<string, string>();

function getNormalizedTrackTitle(track: Track): string {
  const cached = normalizedTrackTitleCache.get(track.id);
  if (cached !== undefined) return cached;
  const normalized = normalize(track.title);
  normalizedTrackTitleCache.set(track.id, normalized);
  return normalized;
}

function getNormalizedCollectionTitle(collection: Collection): string {
  const cached = normalizedCollectionTitleCache.get(collection.id);
  if (cached !== undefined) return cached;
  const normalized = normalize(collection.title);
  normalizedCollectionTitleCache.set(collection.id, normalized);
  return normalized;
}

function calculateRelevanceScore(normalizedTitle: string, query: string): number {
  const title = normalizedTitle;

  // Exact matches get highest priority
  if (title === query) return 100;

  // Prefix matches get high priority
  if (title.startsWith(query)) return 80;

  // Word boundary matches (e.g. "Battle" matches "Boss Battle")
  if (title.includes(` ${query}`)) return 60;

  // General containment
  if (title.includes(query)) return 50;

  return 0;
}

export function filterCollections(
  collections: Collection[],
  searchQuery: string,
): Collection[] {
  const normalizedQuery = normalize(searchQuery);

  if (!normalizedQuery) return [];

  const tokens = normalizedQuery.split(" ").filter(Boolean);

  return collections.filter((collection) => {
    const title = getNormalizedCollectionTitle(collection);
    return tokens.every((token) => title.includes(token));
  });
}

export function filterTracks(
  allTracks: Track[],
  searchQuery: string,
  selectedCollectionId: string | undefined,
  getTracksByCollection: (collectionId: string) => Track[],
) {
  const normalizedQuery = normalize(searchQuery);

  if (normalizedQuery) {
    const tokens = normalizedQuery.split(" ").filter(Boolean);
    const MAX_TRACK_RESULTS = 100;
    const scored: Array<{ track: Track; score: number }> = [];
    let minScore = Infinity;
    let minIndex = -1;

    allTracks.forEach((track) => {
      // Only search the track title
      const title = getNormalizedTrackTitle(track);

      // Check if every token exists in the title
      const matches = tokens.every((token) => title.includes(token));
      if (!matches) {
        return;
      }

      const score = calculateRelevanceScore(title, normalizedQuery);

      if (scored.length < MAX_TRACK_RESULTS) {
        scored.push({ track, score });
        if (score < minScore) {
          minScore = score;
          minIndex = scored.length - 1;
        }
        return;
      }

      if (score > minScore && minIndex !== -1) {
        scored[minIndex] = { track, score };
        minScore = scored[0]?.score ?? score;
        minIndex = 0;
        for (let i = 1; i < scored.length; i += 1) {
          if (scored[i].score < minScore) {
            minScore = scored[i].score;
            minIndex = i;
          }
        }
      }
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.track);
  }

  if (selectedCollectionId) {
    return getTracksByCollection(selectedCollectionId);
  }

  return allTracks;
}

export function resolveCollectionFromTracks(
  filteredTracks: Track[],
  collections: Collection[],
): string | null {
  if (filteredTracks.length === 0) return null;

  const firstTrack = filteredTracks[0];
  const matchingCollection = collections.find(
    (collection) => collection.id === firstTrack.collection || collection.title === firstTrack.collection,
  );

  return matchingCollection ? matchingCollection.id : null;
}

export function computeSelectedCollection(
  currentSelectedId: string,
  filteredTracks: Track[],
  collections: Collection[],
) {
  const nextCollectionId = resolveCollectionFromTracks(filteredTracks, collections);

  return nextCollectionId ?? currentSelectedId;
}
