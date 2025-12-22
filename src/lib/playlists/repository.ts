/**
 * Playlist Repository
 *
 * Storage layer for playlist management using localStorage.
 * Handles CRUD operations, validation, and migration to future backend.
 */

import { logger } from '@/lib/logger';
import { isStorageAvailable, STORAGE_KEYS, getRawValue, setRawValue } from '@/lib/storage/persistence';
import { PlaylistErrors } from '@/types/playlist';
import type { Playlist, PlaylistStorage } from '@/types/playlist';

const STORAGE_VERSION = 'v1';

// Playlist limits
const MAX_PLAYLISTS = 50;
const MAX_TRACKS_PER_PLAYLIST = 200;
const MAX_NAME_LENGTH = 100;

/**
 * Generate a UUID v4
 */
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Get all playlists from localStorage
 */
export function getPlaylists(): Playlist[] {
  if (!isStorageAvailable()) {
    logger.warn('localStorage not available');
    return [];
  }

  try {
    const data = getRawValue(STORAGE_KEYS.PLAYLISTS);
    if (!data) return [];

    const storage: PlaylistStorage = JSON.parse(data);

    // Version validation
    if (storage.version !== STORAGE_VERSION) {
      logger.warn('Playlist storage version mismatch', {
        stored: storage.version,
        expected: STORAGE_VERSION
      });
      return [];
    }

    return storage.playlists;
  } catch (error) {
    logger.error('Failed to load playlists', { error });
    return [];
  }
}

/**
 * Save playlists to localStorage
 */
export function savePlaylists(playlists: Playlist[]): void {
  if (!isStorageAvailable()) {
    throw new Error(PlaylistErrors.STORAGE_ERROR);
  }

  try {
    const storage: PlaylistStorage = {
      version: STORAGE_VERSION,
      playlists,
      updatedAt: new Date().toISOString(),
    };

    setRawValue(STORAGE_KEYS.PLAYLISTS, JSON.stringify(storage));
    logger.info('Playlists saved', { count: playlists.length });
  } catch (error) {
    logger.error('Failed to save playlists', { error });
    throw new Error(PlaylistErrors.STORAGE_ERROR);
  }
}

/**
 * Validate playlist name
 */
export function validatePlaylistName(name: string, existingPlaylists: Playlist[]): void {
  const trimmed = name.trim();

  if (trimmed.length === 0) {
    throw new Error(PlaylistErrors.NAME_EMPTY);
  }

  if (trimmed.length > MAX_NAME_LENGTH) {
    throw new Error(PlaylistErrors.NAME_TOO_LONG);
  }

  // Check for duplicate names (case-insensitive)
  const duplicate = existingPlaylists.find(
    (p) => p.name.toLowerCase() === trimmed.toLowerCase()
  );

  if (duplicate) {
    throw new Error(PlaylistErrors.DUPLICATE_NAME.replace('{name}', trimmed));
  }
}

/**
 * Create a new playlist
 */
export function createPlaylist(name: string): Playlist {
  const playlists = getPlaylists();

  // Check playlist limit
  if (playlists.length >= MAX_PLAYLISTS) {
    throw new Error(PlaylistErrors.PLAYLIST_LIMIT_REACHED);
  }

  // Validate name
  validatePlaylistName(name, playlists);

  const trimmedName = name.trim();
  const now = new Date().toISOString();

  const newPlaylist: Playlist = {
    id: generateId(),
    name: trimmedName,
    trackIds: [],
    createdAt: now,
    updatedAt: now,
  };

  playlists.push(newPlaylist);
  savePlaylists(playlists);

  logger.info('Playlist created', { id: newPlaylist.id, name: trimmedName });
  return newPlaylist;
}

/**
 * Update a playlist
 */
export function updatePlaylist(id: string, updates: Partial<Playlist>): Playlist {
  const playlists = getPlaylists();
  const index = playlists.findIndex((p) => p.id === id);

  if (index === -1) {
    throw new Error(PlaylistErrors.PLAYLIST_NOT_FOUND);
  }

  // Validate name if updating
  if (updates.name !== undefined) {
    const otherPlaylists = playlists.filter((p) => p.id !== id);
    validatePlaylistName(updates.name, otherPlaylists);
    updates.name = updates.name.trim();
  }

  const updated: Playlist = {
    ...playlists[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  playlists[index] = updated;
  savePlaylists(playlists);

  logger.info('Playlist updated', { id, updates: Object.keys(updates) });
  return updated;
}

/**
 * Delete a playlist
 */
export function deletePlaylist(id: string): void {
  const playlists = getPlaylists();
  const filtered = playlists.filter((p) => p.id !== id);

  if (filtered.length === playlists.length) {
    throw new Error(PlaylistErrors.PLAYLIST_NOT_FOUND);
  }

  savePlaylists(filtered);
  logger.info('Playlist deleted', { id });
}

/**
 * Add a track to a playlist
 */
export function addTrackToPlaylist(playlistId: string, trackId: string): Playlist {
  const playlists = getPlaylists();
  const playlist = playlists.find((p) => p.id === playlistId);

  if (!playlist) {
    throw new Error(PlaylistErrors.PLAYLIST_NOT_FOUND);
  }

  // Check if track already exists
  if (playlist.trackIds.includes(trackId)) {
    throw new Error(
      PlaylistErrors.TRACK_ALREADY_IN_PLAYLIST.replace('{playlistName}', playlist.name)
    );
  }

  // Check track limit
  if (playlist.trackIds.length >= MAX_TRACKS_PER_PLAYLIST) {
    throw new Error(PlaylistErrors.TRACK_LIMIT_REACHED);
  }

  playlist.trackIds.push(trackId);
  playlist.updatedAt = new Date().toISOString();

  savePlaylists(playlists);
  logger.info('Track added to playlist', { playlistId, trackId });

  return playlist;
}

/**
 * Remove a track from a playlist
 */
export function removeTrackFromPlaylist(playlistId: string, trackId: string): Playlist {
  const playlists = getPlaylists();
  const playlist = playlists.find((p) => p.id === playlistId);

  if (!playlist) {
    throw new Error(PlaylistErrors.PLAYLIST_NOT_FOUND);
  }

  playlist.trackIds = playlist.trackIds.filter((id) => id !== trackId);
  playlist.updatedAt = new Date().toISOString();

  savePlaylists(playlists);
  logger.info('Track removed from playlist', { playlistId, trackId });

  return playlist;
}

/**
 * Reorder tracks in a playlist
 */
export function reorderTracks(
  playlistId: string,
  fromIndex: number,
  toIndex: number
): Playlist {
  const playlists = getPlaylists();
  const playlist = playlists.find((p) => p.id === playlistId);

  if (!playlist) {
    throw new Error(PlaylistErrors.PLAYLIST_NOT_FOUND);
  }

  const { trackIds } = playlist;

  // Validate indices
  if (fromIndex < 0 || fromIndex >= trackIds.length) {
    throw new Error('Invalid fromIndex');
  }
  if (toIndex < 0 || toIndex >= trackIds.length) {
    throw new Error('Invalid toIndex');
  }

  // Reorder
  const [removed] = trackIds.splice(fromIndex, 1);
  trackIds.splice(toIndex, 0, removed);

  playlist.updatedAt = new Date().toISOString();

  savePlaylists(playlists);
  logger.info('Playlist tracks reordered', { playlistId, fromIndex, toIndex });

  return playlist;
}

/**
 * Find a playlist by ID
 */
export function findPlaylistById(id: string): Playlist | null {
  const playlists = getPlaylists();
  return playlists.find((p) => p.id === id) || null;
}

/**
 * Get warning state for playlist limits
 */
export function getPlaylistLimitWarning(count: number): string | null {
  if (count >= MAX_PLAYLISTS) {
    return `Maximum ${MAX_PLAYLISTS} playlists reached`;
  }
  if (count >= 40) {
    return `Approaching playlist limit (${count}/${MAX_PLAYLISTS})`;
  }
  return null;
}

/**
 * Get warning state for track limits
 */
export function getTrackLimitWarning(count: number): string | null {
  if (count >= MAX_TRACKS_PER_PLAYLIST) {
    return `Maximum ${MAX_TRACKS_PER_PLAYLIST} tracks reached`;
  }
  if (count >= 180) {
    return `Approaching track limit (${count}/${MAX_TRACKS_PER_PLAYLIST})`;
  }
  return null;
}
