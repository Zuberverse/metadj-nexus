/**
 * Playlist Types
 *
 * Type definitions for the playlist management system.
 */

/**
 * User-created playlist
 */
export interface Playlist {
  id: string;                    // UUID v4
  name: string;                  // User-defined name (max 100 chars)
  trackIds: string[];            // Ordered array of track IDs
  createdAt: string;             // ISO 8601 timestamp
  updatedAt: string;             // ISO 8601 timestamp
  artworkUrl?: string | null;    // Optional custom artwork
  isDefault?: boolean;           // System-generated playlists (Favorites)
}

/**
 * Playlist context value for React context
 */
export interface PlaylistContextValue {
  // State
  playlists: Playlist[];
  selectedPlaylist: Playlist | null;
  isLoading: boolean;

  // Operations
  createPlaylist: (
    name: string,
    source?: "navigation" | "track_card" | "collection_header" | "metadjai"
  ) => Promise<Playlist>;
  duplicatePlaylist: (
    playlistId: string,
    source?: "playlist_list" | "detail_view"
  ) => Promise<Playlist>;
  updatePlaylist: (id: string, updates: Partial<Playlist>) => Promise<void>;
  deletePlaylist: (id: string) => Promise<void>;

  // Track operations
  addTrackToPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  addTracksToPlaylist: (playlistId: string, trackIds: string[]) => Promise<{
    added: number;
    skipped: number;
  }>;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  reorderTracks: (playlistId: string, fromIndex: number, toIndex: number) => Promise<void>;

  // Playback
  playPlaylist: (playlistId: string) => void;

  // Selection
  selectPlaylist: (playlistId: string) => void;
  clearSelection: () => void;
}

/**
 * localStorage storage format
 */
export interface PlaylistStorage {
  version: 'v1';
  playlists: Playlist[];
  updatedAt: string;  // Last modification timestamp
}

/**
 * Validation error messages
 */
export const PlaylistErrors = {
  NAME_TOO_LONG: "Playlist name must be 100 characters or less",
  NAME_EMPTY: "Playlist name cannot be empty",
  DUPLICATE_NAME: "You already have a playlist named '{name}'",
  PLAYLIST_LIMIT_REACHED: "Maximum 50 playlists reached. Delete a playlist to create new one.",
  TRACK_LIMIT_REACHED: "Maximum 200 tracks per playlist. Remove tracks to add more.",
  PLAYLIST_NOT_FOUND: "Playlist not found",
  TRACK_ALREADY_IN_PLAYLIST: "This track is already in '{playlistName}'",
  STORAGE_ERROR: "Unable to save playlist. Please try again.",
} as const;
