import { collectionList, trackIndex, trackList } from "./data";
import { normalizeCollectionSlug } from "./utils";
import type { MusicRepository } from "./repository";
import type { Collection, Track } from "@/types";

class StaticMusicRepository implements MusicRepository {
  private readonly collections: Collection[] = collectionList;
  private readonly tracks: Track[] = trackList;
  private readonly collectionIndex = new Map(this.collections.map((collection) => [collection.id, collection]));

  async listCollections(): Promise<Collection[]> {
    return this.collections;
  }

  async listTracks(): Promise<Track[]> {
    return this.tracks;
  }

  async findTrackById(id: string): Promise<Track | undefined> {
    return trackIndex.get(id);
  }

  async listTracksByCollection(collectionIdOrName: string): Promise<Track[]> {
    const normalized = normalizeCollectionSlug(collectionIdOrName);

    return this.tracks.filter((track) => {
      const matchesSlug = normalizeCollectionSlug(track.collection) === normalized;
      return track.collection === collectionIdOrName || matchesSlug;
    });
  }

  async findCollectionById(id: string): Promise<Collection | undefined> {
    const direct = this.collectionIndex.get(id);
    if (direct) return direct;

    const normalized = normalizeCollectionSlug(id);
    return this.collections.find(
      (collection) =>
        normalizeCollectionSlug(collection.title) === normalized ||
        normalizeCollectionSlug(collection.id) === normalized,
    );
  }
}

let repository: MusicRepository | null = null;

export function getMusicRepository(): MusicRepository {
  if (!repository) {
    repository = new StaticMusicRepository();
  }

  return repository;
}

export async function preloadMusic() {
  const repo = getMusicRepository();
  const [collections, tracks] = await Promise.all([
    repo.listCollections(),
    repo.listTracks(),
  ]);

  return { collections, tracks };
}
