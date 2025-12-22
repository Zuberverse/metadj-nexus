"use client"

/**
 * Playlist Context
 *
 * Manages user-created playlists with localStorage persistence.
 * Provides CRUD operations, track management, and playback integration.
 *
 * ## Context Dependencies
 *
 * This context depends on:
 * - **QueueContext** (required): Used for `playPlaylist()` to set queue with playlist tracks
 * - **ToastContext** (required): Used for user feedback on playlist operations
 *
 * PlaylistProvider MUST be rendered inside QueueProvider and ToastProvider.
 * See `src/app/layout.tsx` for the correct provider nesting order.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { trackEvent } from '@/lib/analytics';
import { logger } from '@/lib/logger';
import { tracks } from '@/lib/music';
import {
  getPlaylists,
  createPlaylist as createPlaylistRepo,
  updatePlaylist as updatePlaylistRepo,
  deletePlaylist as deletePlaylistRepo,
  addTrackToPlaylist as addTrackRepo,
  removeTrackFromPlaylist as removeTrackRepo,
  reorderTracks as reorderTracksRepo,
  findPlaylistById,
} from '@/lib/playlists/repository';
import { toasts } from '@/lib/toast-helpers';
import { PlaylistErrors } from '@/types/playlist';
import { useQueue } from './QueueContext';
import { useToast } from './ToastContext';
import type { Track, PlaylistContextValue, Playlist } from '@/types';

const PlaylistContext = createContext<PlaylistContextValue | null>(null);

export function PlaylistProvider({ children }: { children: React.ReactNode }) {
  const { showToast } = useToast();
  const queue = useQueue();

  // Playlist state
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load playlists on mount
  useEffect(() => {
    try {
      const loadedPlaylists = getPlaylists();
      setPlaylists(loadedPlaylists);
      logger.debug('Playlists loaded', { count: loadedPlaylists.length });
    } catch (error) {
      logger.error('Failed to load playlists', { error });
      showToast({
        message: 'Failed to load playlists',
        variant: 'error',
      });
    }
  }, [showToast]);

  /**
   * Create a new playlist
   */
  const createPlaylist = useCallback(
    async (
      name: string,
      source: "navigation" | "track_card" | "collection_header" | "metadjai" = "navigation"
    ): Promise<Playlist> => {
      setIsLoading(true);

      try {
        const newPlaylist = createPlaylistRepo(name);
        setPlaylists((prev) => [...prev, newPlaylist]);

        // Analytics
        trackEvent('playlist_created', {
          playlistId: newPlaylist.id,
          nameLength: name.length,
          source,
        });

        // Success toast
        showToast(toasts.playlistCreated(name, () => {
          setSelectedPlaylist(newPlaylist);
          window.dispatchEvent(new CustomEvent("metadj:openPlaylist", {
            detail: { playlistId: newPlaylist.id },
          }));
          window.dispatchEvent(new CustomEvent("metadj:openMusicPanel"));
        }));

        logger.info('Playlist created', { id: newPlaylist.id, name });
        return newPlaylist;
      } catch (error) {
        logger.error('Failed to create playlist', { error, name });
        showToast({
          message: error instanceof Error ? error.message : 'Failed to create playlist',
          variant: 'error',
        });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [showToast]
  );

  /**
   * Update a playlist
   */
  const updatePlaylist = useCallback(
    async (id: string, updates: Partial<Playlist>): Promise<void> => {
      setIsLoading(true);

      try {
        const updated = updatePlaylistRepo(id, updates);
        setPlaylists((prev) => prev.map((p) => (p.id === id ? updated : p)));

        if (selectedPlaylist?.id === id) {
          setSelectedPlaylist(updated);
        }

        // Track rename event
        if (updates.name) {
          trackEvent('playlist_renamed', {
            playlistId: id,
            nameLength: updates.name.length,
          });

          showToast({
            message: `Playlist renamed to "${updates.name}"`,
            variant: 'success',
          });
        }

        logger.info('Playlist updated', { id, updates: Object.keys(updates) });
      } catch (error) {
        logger.error('Failed to update playlist', { error, id, updates });
        showToast({
          message: error instanceof Error ? error.message : 'Failed to update playlist',
          variant: 'error',
        });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [selectedPlaylist, showToast]
  );

  /**
   * Delete a playlist
   */
  const deletePlaylist = useCallback(
    async (id: string): Promise<void> => {
      setIsLoading(true);

      try {
        const playlist = findPlaylistById(id);
        if (!playlist) {
          throw new Error('Playlist not found');
        }

        deletePlaylistRepo(id);
        setPlaylists((prev) => prev.filter((p) => p.id !== id));

        if (selectedPlaylist?.id === id) {
          setSelectedPlaylist(null);
        }

        // Calculate playlist age
        const ageInDays = Math.floor(
          (Date.now() - new Date(playlist.createdAt).getTime()) / (1000 * 60 * 60 * 24)
        );

        // Analytics
        trackEvent('playlist_deleted', {
          playlistId: id,
          trackCount: playlist.trackIds.length,
          ageInDays,
        });

        showToast(toasts.playlistDeleted(playlist.name));

        logger.info('Playlist deleted', { id, trackCount: playlist.trackIds.length });
      } catch (error) {
        logger.error('Failed to delete playlist', { error, id });
        showToast({
          message: error instanceof Error ? error.message : 'Failed to delete playlist',
          variant: 'error',
        });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [selectedPlaylist, showToast]
  );

  /**
   * Core track operation without toast (used internally to avoid circular dependencies)
   */
  const addTrackCore = useCallback(
    (playlistId: string, trackId: string): { updated: Playlist; track: Track | undefined } => {
      const updated = addTrackRepo(playlistId, trackId);
      setPlaylists((prev) => prev.map((p) => (p.id === playlistId ? updated : p)));
      setSelectedPlaylist((prev) => (prev?.id === playlistId ? updated : prev));
      const track = tracks.find((t) => t.id === trackId);
      return { updated, track };
    },
    []
  );

  const removeTrackCore = useCallback(
    (playlistId: string, trackId: string): { updated: Playlist; track: Track | undefined } => {
      const updated = removeTrackRepo(playlistId, trackId);
      setPlaylists((prev) => prev.map((p) => (p.id === playlistId ? updated : p)));
      setSelectedPlaylist((prev) => (prev?.id === playlistId ? updated : prev));
      const track = tracks.find((t) => t.id === trackId);
      return { updated, track };
    },
    []
  );

  /**
   * Add a track to a playlist
   */
  const addTrackToPlaylist = useCallback(
    async (playlistId: string, trackId: string): Promise<void> => {
      setIsLoading(true);

      try {
        const { updated, track } = addTrackCore(playlistId, trackId);

        // Analytics
        trackEvent('track_added_to_playlist', {
          playlistId,
          trackId,
          trackCount: updated.trackIds.length,
          source: 'track_card',
        });

        showToast(
          toasts.trackAddedToPlaylist(track?.title || 'track', updated.name, () => {
            removeTrackCore(playlistId, trackId);
            trackEvent('track_removed_from_playlist', { playlistId, trackId, trackCount: updated.trackIds.length - 1 });
          })
        );

        logger.info('Track added to playlist', { playlistId, trackId });
      } catch (error) {
        logger.error('Failed to add track to playlist', { error, playlistId, trackId });
        showToast({
          message: error instanceof Error ? error.message : 'Failed to add track',
          variant: 'error',
        });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [addTrackCore, removeTrackCore, showToast]
  );

  /**
   * Add multiple tracks to a playlist (bulk, single toast)
   */
  const addTracksToPlaylist = useCallback(
    async (playlistId: string, trackIds: string[]): Promise<{ added: number; skipped: number }> => {
      setIsLoading(true);

      try {
        if (trackIds.length === 0) {
          return { added: 0, skipped: 0 };
        }

        const uniqueIds = Array.from(new Set(trackIds));
        let updatedPlaylist: Playlist | null = null;
        let added = 0;
        let skipped = 0;

        for (const trackId of uniqueIds) {
          try {
            const { updated } = addTrackCore(playlistId, trackId);
            updatedPlaylist = updated;
            added += 1;
          } catch (error) {
            skipped += 1;
            if (error instanceof Error && error.message === PlaylistErrors.TRACK_LIMIT_REACHED) {
              break;
            }
          }
        }

        if (updatedPlaylist) {
          trackEvent('playlist_tracks_added', {
            playlistId,
            addedCount: added,
            skippedCount: skipped,
          });

          const skippedLabel = skipped > 0 ? ` (${skipped} skipped)` : "";
          showToast({
            message: `Added ${added} track${added === 1 ? "" : "s"} to "${updatedPlaylist.name}"${skippedLabel}`,
            variant: 'success',
          });

          logger.info('Tracks added to playlist', {
            playlistId,
            added,
            skipped,
          });
        }

        return { added, skipped };
      } catch (error) {
        logger.error('Failed to add tracks to playlist', { error, playlistId });
        showToast({
          message: error instanceof Error ? error.message : 'Failed to add tracks',
          variant: 'error',
        });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [addTrackCore, showToast]
  );

  /**
   * Remove a track from a playlist
   */
  const removeTrackFromPlaylist = useCallback(
    async (playlistId: string, trackId: string): Promise<void> => {
      setIsLoading(true);

      try {
        const { updated, track } = removeTrackCore(playlistId, trackId);

        // Analytics
        trackEvent('track_removed_from_playlist', {
          playlistId,
          trackId,
          trackCount: updated.trackIds.length,
        });

        showToast(
          toasts.trackRemovedFromPlaylist(track?.title || 'track', updated.name, () => {
            addTrackCore(playlistId, trackId);
            trackEvent('track_added_to_playlist', { playlistId, trackId, trackCount: updated.trackIds.length + 1, source: 'undo' });
          })
        );

        logger.info('Track removed from playlist', { playlistId, trackId });
      } catch (error) {
        logger.error('Failed to remove track from playlist', { error, playlistId, trackId });
        showToast({
          message: error instanceof Error ? error.message : 'Failed to remove track',
          variant: 'error',
        });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [addTrackCore, removeTrackCore, showToast]
  );

  /**
   * Reorder tracks within a playlist
   */
  const reorderTracks = useCallback(
    async (playlistId: string, fromIndex: number, toIndex: number): Promise<void> => {
      setIsLoading(true);

      try {
        const updated = reorderTracksRepo(playlistId, fromIndex, toIndex);
        setPlaylists((prev) => prev.map((p) => (p.id === playlistId ? updated : p)));

        if (selectedPlaylist?.id === playlistId) {
          setSelectedPlaylist(updated);
        }

        // Analytics
        trackEvent('playlist_tracks_reordered', {
          playlistId,
          trackCount: updated.trackIds.length,
        });

        logger.info('Playlist tracks reordered', { playlistId, fromIndex, toIndex });
      } catch (error) {
        logger.error('Failed to reorder tracks', { error, playlistId, fromIndex, toIndex });
        showToast({
          message: 'Failed to reorder tracks',
          variant: 'error',
        });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [selectedPlaylist, showToast]
  );

  /**
   * Play a playlist
   */
  const playPlaylist = useCallback(
    (playlistId: string) => {
      const playlist = playlists.find((p) => p.id === playlistId);
      if (!playlist) {
        logger.error('Playlist not found for playback', { playlistId });
        return;
      }

      // Get track objects from IDs
      const playlistTracks = playlist.trackIds
        .map((id) => tracks.find((t) => t.id === id))
        .filter((t): t is Track => Boolean(t));

      if (playlistTracks.length === 0) {
        showToast({
          message: 'This playlist is empty',
          variant: 'info',
        });
        return;
      }

      // Update queue with playlist tracks
      queue.setQueue(playlistTracks);
      queue.setQueueContext('playlist');
      queue.updatePersistenceMetadata({
        playlistId,
        currentIndex: 0,
      });

      // Analytics
      trackEvent('playlist_played', {
        playlistId,
        trackCount: playlistTracks.length,
        source: 'navigation',
      });

      logger.info('Playing playlist', { playlistId, trackCount: playlistTracks.length });
    },
    [playlists, queue, showToast]
  );

  /**
   * Select a playlist for viewing
   */
  const selectPlaylist = useCallback((playlistId: string) => {
    const playlist = findPlaylistById(playlistId);
    setSelectedPlaylist(playlist);
  }, []);

  /**
   * Clear playlist selection
   */
  const clearSelection = useCallback(() => {
    setSelectedPlaylist(null);
  }, []);

  const value: PlaylistContextValue = useMemo(() => ({
    // State
    playlists,
    selectedPlaylist,
    isLoading,

    // Operations
    createPlaylist,
    updatePlaylist,
    deletePlaylist,

    // Track operations
    addTrackToPlaylist,
    addTracksToPlaylist,
    removeTrackFromPlaylist,
    reorderTracks,

    // Playback
    playPlaylist,

    // Selection
    selectPlaylist,
    clearSelection,
  }), [
    playlists,
    selectedPlaylist,
    isLoading,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    addTrackToPlaylist,
    addTracksToPlaylist,
    removeTrackFromPlaylist,
    reorderTracks,
    playPlaylist,
    selectPlaylist,
    clearSelection,
  ]);

  return <PlaylistContext.Provider value={value}>{children}</PlaylistContext.Provider>;
}

/**
 * Hook to access playlist context
 * @throws Error if used outside PlaylistProvider
 */
export function usePlaylist(): PlaylistContextValue {
  const context = useContext(PlaylistContext);

  if (!context) {
    throw new Error('usePlaylist must be used within PlaylistProvider');
  }

  return context;
}
