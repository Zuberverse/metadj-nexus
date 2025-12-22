import "server-only";

import { cache } from "react";
import { preloadMusic } from "./static-repository";
import type { Collection, Track } from "@/types";

export interface MusicSnapshot {
  collections: Collection[];
  tracks: Track[];
}

export const getMusicSnapshot = cache(async (): Promise<MusicSnapshot> => {
  const { collections, tracks } = await preloadMusic();
  return { collections, tracks };
});
