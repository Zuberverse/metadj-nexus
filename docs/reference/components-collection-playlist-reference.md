# Collection and Playlist Components Reference

**Last Modified**: 2026-01-10 13:36 EST

Comprehensive documentation for collection browsing and playlist management components in MetaDJ Nexus.

---

## Table of Contents

- [Overview](#overview)
- [Collection Components](#collection-components)
  - [BrowseView](#browseview)
  - [CollectionDetailView](#collectiondetailview)
- [Playlist Components](#playlist-components)
  - [PlaylistList](#playlistlist)
  - [PlaylistDetailView](#playlistdetailview)
  - [PlaylistCreator](#playlistcreator)
  - [PlaylistSelector](#playlistselector)
  - [AddToPlaylistButton](#addtoplaylistbutton)
  - [TrackCard](#trackcard)
- [Data Flow](#data-flow)
- [State Management](#state-management)
- [CRUD Operations](#crud-operations)
- [Accessibility](#accessibility)

---

## Overview

The collection and playlist systems form the core content browsing experience in MetaDJ Nexus. Collections are curated groupings of tracks (music collections—evolving projects, not static releases) surfaced in the Left Panel Library tab, while playlists are user-created track lists persisted to localStorage.

### Architecture Summary

```
LeftPanel (Library tab)
    |
    +-- SearchBar (inline)
    +-- BrowseView
    |     |
    |     +-- Featured + Recently Played
    |     +-- Collections list
    |     +-- Mood Channels (feature-flagged)
    |
    +-- CollectionDetailView
          |
          +-- Play All / Shuffle
          +-- About Collection toggle
          +-- TrackListItem[]

LeftPanel (Playlists tab)
    |
    +-- PlaylistList
    |
    +-- PlaylistCreator (inline create)

PlaylistDetailView (full playlist view)
    |
    +-- TrackListItem[] (with remove actions)
```

---

## Collection Components

### BrowseView

**Location**: `src/components/panels/left-panel/BrowseView.tsx`

**Purpose**: Library browse surface for Featured, Recently Played, and the collections list. Hosts `SearchBar` and optional Mood Channels (feature-flagged).

#### Props Interface

```typescript
interface BrowseViewProps {
  collections: Collection[];
  recentlyPlayed: Track[];
  allTracks: Track[];
  onCollectionSelect: (collectionId: string) => void;
  onMoodChannelSelect: (channelId: string) => void;
  getCollectionArtwork: (collectionId: string) => string;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  onSearchResultsChange: (results: Track[]) => void;
  currentTrack: Track | null;
  onSearchSelect: (track: Track) => void;
  onSearchQueueAdd: (track: Track) => void;
}
```

#### Key Behaviors

- SearchBar drives collection + track search and resets when a collection is selected.
- Featured and Recently Played cards are pinned above the collection list.
- Collection buttons apply `getCollectionHoverStyles` for themed glow states.
- Mood Channels render only when `FEATURE_MOOD_CHANNELS` is enabled.

---

### CollectionDetailView

**Location**: `src/components/panels/left-panel/CollectionDetailView.tsx`

**Purpose**: Detail view for a selected collection with Play All / Shuffle controls, optional About toggle, and track list.

#### Props Interface

```typescript
interface CollectionDetailViewProps {
  collection: Collection;
  collectionTitle: string;
  tracks: Track[];
  description: string;
  isFeatured: boolean;
  showShare?: boolean;
  onBack: () => void;
  onTrackPlay: (track: Track, tracks?: Track[]) => void;
  onQueueAdd?: (track: Track) => void;
  scrollToTrackId?: string | null;
  onScrollComplete?: () => void;
}
```

#### Key Behaviors

- `Play` and `Shuffle` call `onTrackPlay` with a tracks array for continuous playback.
- About Collection toggle reveals narrative text from `COLLECTION_NARRATIVES`.
- Optional `scrollToTrackId` support brings a track into view on open.
- Track list renders via `TrackListItem` with collection hover styling.

---

### Legacy Collection Components (Removed)

`CollectionSurface`, `CollectionManager`, `CollectionHeader`, and `CollectionTabs` were removed in the v0.8.1 cleanup. Historical reference lives in `docs/archive/2025-12-collection-tabs-system.md`.

## Playlist Components

### PlaylistList

**Location**: `src/components/playlist/PlaylistList.tsx`

**Purpose**: Sidebar navigation component for playlist browsing with search and management.

#### Props Interface

```typescript
interface PlaylistListProps {
  onPlaylistSelect: (playlistId: string) => void;
  selectedPlaylistId?: string | null;
  className?: string;
}
```

#### Key Features

- **Search filtering**: Local search within playlists using `useMemo`
- **Inline creation**: Embedded `PlaylistCreator` component
- **Artwork thumbnails**: Auto cover from first track or custom artwork
- **Context menu**: Per-playlist options menu with duplicate + delete actions
- **Delete confirmation**: Inline confirmation overlay
- **Empty state**: Friendly prompt to create first playlist

#### Performance Optimization

- Wrapped with `React.memo` with custom comparison
- Only re-renders when `selectedPlaylistId` or `className` changes
- Playlist data comes from context, triggering re-renders automatically

---

### PlaylistDetailView

**Location**: `src/components/playlist/PlaylistDetailView.tsx`

**Purpose**: Full playlist detail view replacing collection view when viewing a playlist.

#### Props Interface

```typescript
interface PlaylistDetailViewProps {
  playlistId: string;
  onBack: () => void;
  onPlayTrack: (track: Track, tracks?: Track[]) => void;
  onPlayAll?: (playlistId: string) => void;
  className?: string;
}
```

#### Key Features

- **Track list with removal + reordering**: Drag and arrow-key reorder with a handle on each row
- **Play All button**: Triggers playlist playback through context
- **Share button**: Share playlist functionality
- **Rename + duplicate actions**: Accessed from the playlist options menu
- **Artwork selection**: Auto cover from first track or custom selection
- **Delete with confirmation**: Modal confirmation for playlist deletion
- **Duration calculation**: Total playlist duration displayed
- **Empty state**: Prompt to add tracks from collections

#### Context Dependencies

- `usePlaylist()`: For `playlists`, `removeTrackFromPlaylist`, `deletePlaylist`, `duplicatePlaylist`, `updatePlaylist`, `reorderTracks`, `playPlaylist`
- `usePlayer()`: For `currentTrack`, `shouldPlay` (highlighting current track)

---

### PlaylistCreator

**Location**: `src/components/playlist/PlaylistCreator.tsx`

**Purpose**: Inline playlist creation interface with validation.

#### Props Interface

```typescript
interface PlaylistCreatorProps {
  onClose: () => void;
  source?: "navigation" | "track_card" | "collection_header";
  onCreated?: (playlist: Playlist) => void | Promise<void>;
  className?: string;
}
```

#### Validation Rules

- Name cannot be empty
- Name must be 1-100 characters
- Real-time character count display

#### Keyboard Support

- **Enter**: Create playlist
- **Escape**: Cancel and close

#### Analytics

Tracks `playlist_created` event with:
- `playlistId`
- `nameLength`
- `source` (navigation, track_card, collection_header)

---

### PlaylistSelector

**Location**: `src/components/playlist/PlaylistSelector.tsx`

**Purpose**: Dropdown/popover for adding tracks to playlists with keyboard navigation.

#### Props Interface

```typescript
interface PlaylistSelectorProps {
  trackId: string;
  trackTitle: string;
  source?: "track_card" | "collection_header" | "detail_view";
  onClose: () => void;
  onBack?: () => void;
  className?: string;
}
```

#### Key Features

- **Create New option**: First item in list, opens `PlaylistCreator`
- **Existing playlists**: Shows all playlists (max 50) with track counts
- **Already added indicator**: Check icon and disabled state for tracks already in playlist
- **Click outside to close**: Focus trap with mousedown listener

#### Keyboard Navigation

| Key | Action |
|-----|--------|
| Arrow Down | Move to next item |
| Arrow Up | Move to previous item |
| Enter / Space | Select item |
| Escape | Close selector |

#### Accessibility

- `role="listbox"` on container
- `role="option"` on each item
- `aria-selected` for current selection
- `aria-disabled` for tracks already in playlist
- Keyboard hint text at bottom

---

### AddToPlaylistButton

**Location**: `src/components/playlist/AddToPlaylistButton.tsx`

**Purpose**: Small button that opens PlaylistSelector popover.

#### Props Interface

```typescript
interface AddToPlaylistButtonProps {
  trackId: string;
  trackTitle: string;
  source?: "track_card" | "collection_header" | "detail_view";
  className?: string;
}
```

#### Key Features

- **44px minimum touch target**: WCAG compliant
- **Escape key handling**: Closes popover and returns focus to button
- **Event propagation stop**: Prevents click bubbling to parent track card

---

### TrackCard

**Location**: `src/components/playlist/TrackCard.tsx`

**Purpose**: Individual track card with artwork, metadata, and action buttons.

#### Props Interface

```typescript
interface TrackCardProps {
  track: Track;
  isPlaying?: boolean;
  onClick: () => void;
  onAddToQueue?: (track: Track) => void;
  onShowDetails?: (track: Track) => void;
  positionInList?: number;
}
```

#### Key Features

- **Audio preloading**: Preloads track on hover/focus via `preloadTrackOnHover()`
- **Play overlay**: Shows play icon on artwork hover
- **Queue feedback**: "Added!" state with 2-second timeout and overlay animation
- **Collection gradient**: Per-collection hover styles via `getCollectionHoverStyles()`
- **Responsive text**: Font size adjusts for mobile/desktop

#### Performance Optimization

- Wrapped with `React.memo`
- Custom comparison: only re-renders when `track.id` or `isPlaying` changes

#### Action Buttons

| Button | Icon | Action |
|--------|------|--------|
| Info | `Info` | Opens track details |
| Add to Playlist | `ListPlus` | Opens `PlaylistSelector` |
| Share | (via ShareButton) | Opens share options |
| Add to Queue | `ListPlus` | Adds to playback queue |

---

## Data Flow

### Collection Data Flow

```
music.json (static data)
       |
       v
getTracksByCollection() + FEATURED_TRACK_IDS
       |
       v
BrowseView (Featured + collections list)
       |
       +---> CollectionDetailView
                |
                +---> TrackListItem[]
```

### Playlist Data Flow

```
localStorage (persisted)
       |
       v
PlaylistContext (state management)
       |
       +---> PlaylistList (sidebar)
       |           |
       |           +---> PlaylistCreator (inline)
       |
       +---> PlaylistDetailView (detail page)
       |
       +---> PlaylistSelector (add to playlist)
                   |
                   +---> AddToPlaylistButton (trigger)
```

---

## State Management

### Contexts Used

| Context | Components | Purpose |
|---------|------------|---------|
| `PlaylistContext` | All playlist components | Playlist CRUD, track management |
| `PlayerContext` | CollectionDetailView, PlaylistDetailView | Current track, playback state |
| `QueueContext` | PlaylistContext (internal) | Queue management for playlist playback |
| `ToastContext` | PlaylistContext (internal) | User feedback notifications |

### PlaylistContext API

```typescript
interface PlaylistContextValue {
  // State
  playlists: Playlist[];
  selectedPlaylist: Playlist | null;
  isLoading: boolean;

  // Playlist CRUD
  createPlaylist: (name: string, source?: string) => Promise<Playlist>;
  duplicatePlaylist: (playlistId: string, source?: string) => Promise<Playlist>;
  updatePlaylist: (id: string, updates: Partial<Playlist>) => Promise<void>;
  deletePlaylist: (id: string) => Promise<void>;

  // Track operations
  addTrackToPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  addTracksToPlaylist: (playlistId: string, trackIds: string[]) => Promise<{ added: number; skipped: number }>;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  reorderTracks: (playlistId: string, fromIndex: number, toIndex: number) => Promise<void>;

  // Playback
  playPlaylist: (playlistId: string) => void;

  // Selection
  selectPlaylist: (playlistId: string) => void;
  clearSelection: () => void;
}
```

---

## CRUD Operations

### Create Playlist

**Component**: `PlaylistCreator`
**Context Method**: `createPlaylist(name, source)`

```typescript
// Flow:
1. User enters name (1-100 chars)
2. Validation passes
3. createPlaylistRepo() called (generates ID, timestamps)
4. State updated with new playlist
5. Analytics tracked
6. Toast shown with "View" action
7. onCreated callback fired (optional)
```

### Read Playlists

**Component**: `PlaylistList`, `PlaylistSelector`
**Context State**: `playlists`

```typescript
// Loaded on mount from localStorage via getPlaylists()
// Automatically synced to state changes
```

### Update Playlist

**Context Method**: `updatePlaylist(id, updates)`

```typescript
// Supports partial updates:
- name (triggers rename toast + analytics)
- trackIds (for reordering)
```

### Delete Playlist

**Component**: `PlaylistList`, `PlaylistDetailView`
**Context Method**: `deletePlaylist(id)`

```typescript
// Flow:
1. Confirmation dialog shown
2. deletePlaylistRepo() removes from localStorage
3. State filtered to remove playlist
4. selectedPlaylist cleared if deleted
5. Analytics tracked (age, track count)
6. Toast shown
```

### Add Track to Playlist

**Component**: `PlaylistSelector`
**Context Method**: `addTrackToPlaylist(playlistId, trackId)`

```typescript
// Flow:
1. Check if track already in playlist
2. addTrackRepo() updates localStorage
3. State updated
4. Analytics tracked
5. Toast with "Undo" action
```

### Remove Track from Playlist

**Component**: `PlaylistDetailView`
**Context Method**: `removeTrackFromPlaylist(playlistId, trackId)`

```typescript
// Flow:
1. removeTrackRepo() updates localStorage
2. State updated
3. Analytics tracked
4. Toast with "Undo" action
```

---

## Accessibility

### WCAG 2.1 AA Compliance

| Component | Requirement | Implementation |
|-----------|-------------|----------------|
| PlaylistSelector | Keyboard navigation | Full arrow key support |
| PlaylistSelector | Focus management | Auto-scroll to selected |
| AddToPlaylistButton | Touch targets | 44px minimum |
| TrackCard | Keyboard activation | Enter and Space keys |
| PlaylistCreator | Form semantics | Label, error messages, hints |

### Keyboard Shortcuts Summary

| Context | Key | Action |
|---------|-----|--------|
| Playlist selector | Arrow Up/Down | Navigate items |
| Playlist selector | Enter/Space | Select item |
| Playlist selector | Escape | Close selector |
| Playlist creator | Enter | Create playlist |
| Playlist creator | Escape | Cancel |
| Track card | Enter/Space | Play track |

### ARIA Patterns

- **Listbox**: PlaylistSelector menu
- **Dialog**: PlaylistCreator (when in PlaylistSelector)
- **Button**: All interactive elements with clear labels

---

## Related Documentation

- [Playlist System](../features/playlist-system.md) - Complete playlist feature documentation
- [Collections System](../features/collections-system.md) - Collection architecture
- [Contexts Reference](./contexts-reference.md) - Context API details
- [Hooks Reference](./hooks-reference.md) - Custom hooks documentation
