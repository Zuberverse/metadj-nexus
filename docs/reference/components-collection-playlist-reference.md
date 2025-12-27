# Collection and Playlist Components Reference

**Last Modified**: 2025-12-27 10:26 EST

Comprehensive documentation for collection browsing and playlist management components in MetaDJ Nexus.

---

## Table of Contents

- [Overview](#overview)
- [Collection Components](#collection-components)
  - [CollectionSurface](#collectionsurface)
  - [CollectionManager](#collectionmanager)
  - [CollectionHeader](#collectionheader)
  - [CollectionTabs](#collectiontabs)
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

The collection and playlist systems form the core content browsing experience in MetaDJ Nexus. Collections are curated groupings of tracks (music collections—evolving projects, not static releases), while playlists are user-created track lists persisted to localStorage.

### Architecture Summary

```
CollectionSurface
    |
    +-- WisdomFeature (conditional)
    |
    +-- CollectionManager
            |
            +-- CollectionHeader (collection selector grid)
            |
            +-- TrackCard[] (track list)

PlaylistList (sidebar navigation)
    |
    +-- PlaylistCreator (inline create)

PlaylistDetailView (full playlist view)
    |
    +-- TrackListItem[] (with remove actions)
```

---

## Collection Components

### CollectionSurface

**Location**: `src/components/collection/CollectionSurface.tsx`

**Purpose**: Top-level orchestrator for the main content area, switching between Wisdom feature and collection browser.

#### Props Interface

```typescript
interface CollectionSurfaceProps {
  // Wisdom state
  isWisdomOpen: boolean;

  // Collection state
  selectedCollection: string;
  onCollectionChange: (collectionId: string) => void;
  tabCollections: Array<{ id: string; title: string }>;
  featuredTrackIds: readonly string[];
  onSearchQueryChange: (query: string) => void;

  // Track list
  tracks: Track[];

  // Player state
  currentTrack: Track | null;
  shouldPlay: boolean;

  // Queue state
  queue: Track[];
  onQueueContextChange: (context: "search" | "collection") => void;

  // Handlers
  onTrackClick: (track: Track, tracks?: Track[]) => void;
  onTrackQueueAdd: (track: Track) => void;
  onShowTrackDetails: (track: Track) => void;
  onInfoOpen?: () => void;
}
```

#### Key Behaviors

- Conditionally renders `WisdomExperience` (dynamically imported) or `CollectionManager`
- Clears search query when manually switching collections
- Updates queue context to "collection" on collection change

#### Usage Example

```tsx
<CollectionSurface
  isWisdomOpen={isWisdomOpen}
  selectedCollection={selectedCollection}
  onCollectionChange={handleCollectionChange}
  tabCollections={collections}
  featuredTrackIds={FEATURED_TRACK_IDS}
  onSearchQueryChange={setSearchQuery}
  tracks={allTracks}
  currentTrack={currentTrack}
  shouldPlay={isPlaying}
  queue={queue}
  onQueueContextChange={setQueueContext}
  onTrackClick={handleTrackSelect}
  onTrackQueueAdd={handleAddToQueue}
  onShowTrackDetails={handleShowDetails}
/>
```

---

### CollectionManager

**Location**: `src/components/collection/CollectionManager.tsx`

**Purpose**: Main collection browsing component with track list rendering and analytics integration.

#### Props Interface

```typescript
interface CollectionManagerProps {
  selectedCollection: string;
  onCollectionChange: (collectionId: string) => void;
  tracks: Track[];
  featuredTrackIds: readonly string[];
  currentTrack: Track | null;
  shouldPlay: boolean;
  onTrackClick: (track: Track) => void;
  onTrackQueueAdd: (track: Track) => void;
  onShowTrackDetails?: (track: Track) => void;
  collections: Collection[];
  queue?: Track[];
  onInfoOpen?: () => void;
}
```

#### Key Features

- **Featured collection handling**: Maps `featuredTrackIds` to track objects for the "featured" collection
- **Collection filtering**: Uses `getTracksByCollection()` for standard collections
- **Analytics integration**: Tracks collection views, browsing, track clicks, info icon clicks, and queue additions
- **Expandable collection description**: Toggle to show/hide collection narratives from `COLLECTION_NARRATIVES`
- **Empty state**: Graceful display when no tracks exist

#### Analytics Events

| Event | Trigger | Properties |
|-------|---------|------------|
| `collection_viewed` | Collection changes | `collectionId`, `collectionTitle`, `trackCount`, `previousCollection` |
| `collection_browsed` | Tracks render | `collectionId`, `collectionTitle`, `trackCount` |
| `track_card_clicked` | Track play | `trackId`, `trackTitle`, `collection`, `position`, `action` |
| `track_info_icon_clicked` | Info button | `trackId`, `trackTitle`, `collection`, `triggerSource` |
| `add_to_queue_clicked` | Queue add | `trackId`, `trackTitle`, `collection`, `queuePositionAfterAdd` |

---

### CollectionHeader

**Location**: `src/components/collection/CollectionHeader.tsx`

**Purpose**: Grid-based collection selector with gradient styling per collection.

#### Props Interface

```typescript
interface CollectionHeaderProps {
  selectedCollection: string;
  onCollectionChange: (collectionId: string) => void;
  collections: Array<{ id: string; title: string }>;
}
```

#### Visual Features

- **Responsive grid**: 1 column on mobile, 3 columns on tablet+
- **Collection gradients**: Uses `getCollectionGradient()` for per-collection theming
- **Active indicator**: Pulsing dot, elevated shadow, and ring for selected collection
- **Glass morphism**: Backdrop blur with white/transparent overlays

#### Usage Example

```tsx
<CollectionHeader
  selectedCollection="aether"
  onCollectionChange={handleChange}
  collections={[
    { id: "featured", title: "Featured" },
    { id: "aether", title: "Aether" },
    { id: "neon", title: "Neon" },
  ]}
/>
```

---

### CollectionTabs

**Location**: `src/components/collection/CollectionTabs.tsx`

**Purpose**: Dropdown selector alternative to CollectionHeader (memoized for performance).

#### Props Interface

```typescript
interface CollectionTabSummary {
  id: string;
  title: string;
  subtitle?: string;
}

interface CollectionTabsProps {
  collections: CollectionTabSummary[];
  selectedCollection: string;
  onCollectionChange: (collectionId: string) => void;
}
```

#### Performance Optimization

- Wrapped with `React.memo` with custom comparison
- Only re-renders when:
  - `selectedCollection` changes
  - `collections.length` changes
  - Collection IDs change (shallow comparison)
- Expected impact: 30-40% reduction in re-renders during navigation

#### Accessibility

- `aria-label="Select collection"` on trigger
- `aria-haspopup="listbox"` and `aria-expanded` for popup state
- `role="listbox"` on menu, `role="option"` on items
- `aria-selected` for current selection

---

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
- **Context menu**: Per-playlist options menu with delete action
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

- **Track list with removal**: Each track has a remove button (X icon)
- **Play All button**: Triggers playlist playback through context
- **Share button**: Share playlist functionality
- **Delete with confirmation**: Modal confirmation for playlist deletion
- **Duration calculation**: Total playlist duration displayed
- **Empty state**: Prompt to add tracks from collections

#### Context Dependencies

- `usePlaylist()`: For `playlists`, `removeTrackFromPlaylist`, `deletePlaylist`, `playPlaylist`
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
tracks.json (static data)
       |
       v
getTracksByCollection() ----+
       |                    |
       v                    v
CollectionManager     Featured tracks mapping
       |
       +---> CollectionHeader (displays collections)
       |
       +---> TrackCard[] (displays tracks)
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
| `PlayerContext` | PlaylistDetailView, TrackCard | Current track, playback state |
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
  updatePlaylist: (id: string, updates: Partial<Playlist>) => Promise<void>;
  deletePlaylist: (id: string) => Promise<void>;

  // Track operations
  addTrackToPlaylist: (playlistId: string, trackId: string) => Promise<void>;
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
| CollectionTabs | Keyboard navigation | Arrow keys, Enter, Escape |
| CollectionTabs | Screen reader | ARIA listbox pattern |
| PlaylistSelector | Keyboard navigation | Full arrow key support |
| PlaylistSelector | Focus management | Auto-scroll to selected |
| AddToPlaylistButton | Touch targets | 44px minimum |
| TrackCard | Keyboard activation | Enter and Space keys |
| PlaylistCreator | Form semantics | Label, error messages, hints |

### Keyboard Shortcuts Summary

| Context | Key | Action |
|---------|-----|--------|
| Collection tabs dropdown | Escape | Close dropdown |
| Playlist selector | Arrow Up/Down | Navigate items |
| Playlist selector | Enter/Space | Select item |
| Playlist selector | Escape | Close selector |
| Playlist creator | Enter | Create playlist |
| Playlist creator | Escape | Cancel |
| Track card | Enter/Space | Play track |

### ARIA Patterns

- **Combobox**: CollectionTabs dropdown
- **Listbox**: PlaylistSelector, CollectionTabs menu
- **Dialog**: PlaylistCreator (when in PlaylistSelector)
- **Button**: All interactive elements with clear labels

---

## Related Documentation

- [Playlist System](../features/playlist-system.md) - Complete playlist feature documentation
- [Collections System](../features/collections-system.md) - Collection architecture
- [Contexts Reference](./contexts-reference.md) - Context API details
- [Hooks Reference](./hooks-reference.md) - Custom hooks documentation
