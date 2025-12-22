import type { Collection, Track } from "@/types";

/**
 * MusicRepository defines the contract for querying collections/tracks.
 * Keeping it separate from domain models prevents duplicate type definitions.
 */
export interface MusicRepository {
  listCollections(): Promise<Collection[]>;
  listTracks(): Promise<Track[]>;
  findTrackById(id: string): Promise<Track | undefined>;
  listTracksByCollection(collectionIdOrName: string): Promise<Track[]>;
  findCollectionById(id: string): Promise<Collection | undefined>;
}
