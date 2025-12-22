/**
 * Playlists module barrel export
 *
 * Centralizes playlist repository functions for CRUD operations.
 * Import from '@/lib/playlists' for clean, consistent imports.
 */

export {
  // Core CRUD operations
  getPlaylists,
  savePlaylists,
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
  findPlaylistById,

  // Track management
  addTrackToPlaylist,
  removeTrackFromPlaylist,
  reorderTracks,

  // Validation
  validatePlaylistName,

  // Limit warnings
  getPlaylistLimitWarning,
  getTrackLimitWarning,
} from './repository'
