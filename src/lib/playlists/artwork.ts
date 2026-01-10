/**
 * Playlist Artwork Helpers
 *
 * Resolves the best available artwork for a playlist.
 */

import { getTrackById } from '@/lib/music';
import type { Playlist } from '@/types';

export function resolvePlaylistArtwork(playlist: Playlist): string | null {
  if (playlist.artworkUrl) {
    return playlist.artworkUrl;
  }

  const firstTrackId = playlist.trackIds[0];
  if (!firstTrackId) {
    return null;
  }

  return getTrackById(firstTrackId)?.artworkUrl ?? null;
}
