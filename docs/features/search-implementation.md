# Search Implementation

**Last Modified**: 2026-01-13 08:56 EST

Comprehensive documentation of the search system in MetaDJ Nexus, including architecture, components, algorithms, and performance optimizations.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Components](#components)
  - [SearchBar](#searchbar)
  - [SearchResultItem](#searchresultitem)
- [Search Hook](#search-hook)
- [Composite Results](#composite-results)
- [Search Algorithm](#search-algorithm)
- [Filtering System](#filtering-system)
- [Performance Optimizations](#performance-optimizations)
- [Keyboard Navigation](#keyboard-navigation)
- [Integration](#integration)
- [Accessibility](#accessibility)

---

## Architecture Overview

The search system provides real-time track, collection, wisdom, and journal discovery with debounced queries, keyboard navigation, and WCAG 2.1 AA accessibility compliance.

### System Flow

```
User Input
    |
    v
SearchBar (controlled/uncontrolled)
    |
    v
useDebounce (300ms default)
    |
    v
filterTracks / filterCollections
buildSearchContentResults (tracks + collections + wisdom + journal)
    |
    +---> Track/collection relevance scoring
    |
    v
SearchResultItem + Wisdom/Journal rows
    |
    v
Selection handlers (track, collection, wisdom, journal)
```

### Key Files

| File | Purpose |
|------|---------|
| `src/components/search/SearchBar.tsx` | Main search component with dropdown |
| `src/components/search/SearchResultItem.tsx` | Memoized result card |
| `src/lib/search/search-results.ts` | Composite search result builder |
| `src/hooks/use-search.ts` | Reusable search hook |
| `src/hooks/use-debounce.ts` | Debounce utility hook |
| `src/lib/music/filters.ts` | Filtering and scoring logic |

---

## Components

### SearchBar

**Location**: `src/components/search/SearchBar.tsx`

**Purpose**: Comprehensive search interface with real-time results, keyboard navigation, and dropdown display.

#### Props Interface

```typescript
export interface SearchBarProps {
  /** All available tracks for searching */
  tracks: Track[];

  /** Available collections for searching */
  collections?: Collection[];

  /** Currently playing track (for highlighting active results) */
  currentTrack: Track | null;

  /** Callback when a search result track is selected for playback */
  onTrackSelect: (track: Track) => void;

  /** Callback when a track is added to the playback queue */
  onTrackQueueAdd: (track: Track) => void;

  /** Callback when a collection is selected */
  onCollectionSelect?: (collection: Collection) => void;

  /** Optional externally controlled query */
  value?: string;

  /** Handler fired when the query changes */
  onValueChange?: (value: string) => void;

  /** Handler fired when filtered results change */
  onResultsChange?: (results: Track[]) => void;

  /** Handler fired when composite results change */
  onContentResultsChange?: (results: SearchContentResults) => void;

  /** Callback when search queries return zero results (for analytics) */
  onEmptySearch?: (queryLength: number) => void;

  /** Callback when a Wisdom result is selected */
  onWisdomSelect?: (entry: WisdomSearchEntry) => void;

  /** Callback when a Journal result is selected */
  onJournalSelect?: (entry: JournalSearchEntry) => void;

  /** Optional CSS class name for styling customization */
  className?: string;

  /** Hide the leading search icon (for minimal inline usage) */
  hideIcon?: boolean;

  /** Disable dropdown results (for inline filtering only) */
  disableDropdown?: boolean;

  /** Optional input id (avoid duplicate IDs when multiple SearchBars render) */
  inputId?: string;
}
```

#### Controlled vs Uncontrolled Mode

The SearchBar supports both controlled and uncontrolled patterns:

```typescript
// Uncontrolled (internal state)
<SearchBar
  tracks={tracks}
  currentTrack={currentTrack}
  onTrackSelect={handleSelect}
  onTrackQueueAdd={handleQueue}
/>

// Controlled (external state)
const [query, setQuery] = useState('');

<SearchBar
  tracks={tracks}
  currentTrack={currentTrack}
  value={query}
  onValueChange={setQuery}
  onTrackSelect={handleSelect}
  onTrackQueueAdd={handleQueue}
/>
```

#### Key Features

- **Debounced search**: 300ms delay via `useDebounce` hook
- **Composite result types**: Tracks, collections, wisdom entries, and journal entries
- **Fixed dropdown positioning**: Uses `position: fixed` with dynamic placement
- **Focus management**: Tracks focus state with blur timeout
- **Clear button**: X button with 44px touch target
- **Visual design**: Glass morphism with gradient backgrounds

#### State Management

```typescript
// Internal state
const [internalQuery, setInternalQuery] = useState('');
const [isSearchFocused, setIsSearchFocused] = useState(false);
const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
const [dropdownStyle, setDropdownStyle] = useState<{ top; left; width } | null>(null);
const [wisdomData, setWisdomData] = useState<WisdomData | null>(getCachedWisdomData());
const [journalEntries, setJournalEntries] = useState<JournalEntryInput[]>([]);

// Refs
const searchInputRef = useRef<HTMLInputElement>(null);
const searchAreaRef = useRef<HTMLDivElement>(null);
const searchBlurTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
const searchResultRefs = useRef<(HTMLButtonElement | null)[]>([]);
```

#### Usage Example

```tsx
<SearchBar
  tracks={allTracks}
  collections={collections}
  currentTrack={currentTrack}
  onTrackSelect={(track) => {
    // Play the selected track
    playTrack(track);
  }}
  onTrackQueueAdd={(track) => {
    // Add to playback queue
    addToQueue(track);
  }}
  onCollectionSelect={(collection) => {
    // Navigate to collection
    setSelectedCollection(collection.id);
  }}
  onEmptySearch={(length) => {
    // Track analytics for failed searches
    analytics.track('search_no_results', { queryLength: length });
  }}
/>
```

---

### SearchResultItem

**Location**: `src/components/search/SearchResultItem.tsx`

**Purpose**: Memoized search result card optimized for render performance.

#### Props Interface

```typescript
export interface SearchResultItemProps {
  /** Track data to display */
  track: Track;

  /** Index position in the search results list */
  index: number;

  /** Whether this track is currently playing */
  isActive: boolean;

  /** Whether this item is currently hovered/focused */
  isHovered: boolean;

  /** Callback when the track is selected for playback */
  onSelect: (track: Track) => void;

  /** Callback when the track is added to queue */
  onQueueAdd: (track: Track) => void;

  /** Callback for keyboard navigation */
  onKeyDown: (event: KeyboardEvent, index: number, track: Track) => void;

  /** Callback when mouse enters the item */
  onMouseEnter: (index: number) => void;

  /** Callback when mouse leaves the item */
  onMouseLeave: (index: number) => void;

  /** Callback when the play button receives focus */
  onFocus: (index: number) => void;

  /** Callback when the play button loses focus */
  onBlur: (index: number) => void;

  /** Ref callback for keyboard navigation */
  buttonRef: (element: HTMLButtonElement | null) => void;
}
```

#### Visual Features

- **Track artwork**: 40x40 image with play overlay on hover
- **Metadata display**: Title, collection, genres (up to 2)
- **Active state styling**: Purple/blue gradient background for playing track
- **Collection-specific hover**: Uses `getCollectionHoverStyles()` for theming
- **Queue button**: 44px touch target, visible on hover/focus

#### Memoization

Wrapped with `React.memo` for performance:

```typescript
export const SearchResultItem = memo(function SearchResultItem(props) {
  // Component implementation
});
```

---

## Search Hook

**Location**: `src/hooks/use-search.ts`

**Purpose**: Reusable search logic extracted from SearchBar for better testability.

### Interface

```typescript
export interface UseSearchOptions {
  /** All tracks to search through */
  tracks: Track[];

  /** Current search query */
  query: string;

  /** Debounce delay in milliseconds (default: 300) */
  debounceMs?: number;

  /** Optional collection ID to filter by */
  collectionId?: string;
}

export interface UseSearchResult {
  /** Filtered search results */
  searchResults: Track[];

  /** Debounced search query */
  debouncedQuery: string;

  /** Whether search is active (non-empty query) */
  isSearching: boolean;

  /** Number of search results */
  resultCount: number;
}
```

### Usage

```typescript
const { searchResults, debouncedQuery, isSearching, resultCount } = useSearch({
  tracks: allTracks,
  query: searchQuery,
  debounceMs: 300,
  collectionId: selectedCollection, // optional filter
});
```

### Implementation Details

```typescript
export function useSearch(options: UseSearchOptions): UseSearchResult {
  const { tracks, query, debounceMs = 300, collectionId } = options;

  // Debounce search query
  const debouncedQuery = useDebounce(query, debounceMs);

  // Filter tracks (memoized)
  const searchResults = useMemo(() => {
    const trimmedQuery = debouncedQuery.trim();

    // Require 2+ characters to start searching
    if (!trimmedQuery || trimmedQuery.length < 2) {
      return [];
    }

    return filterTracks(tracks, trimmedQuery, collectionId, getTracksByCollection);
  }, [debouncedQuery, tracks, collectionId]);

  const isSearching = debouncedQuery.trim().length > 0;
  const resultCount = searchResults.length;

  return { searchResults, debouncedQuery, isSearching, resultCount };
}
```

**Note**: The `useSearch` hook requires 2+ characters to begin searching, while `SearchBar` starts at 1 character. Use the appropriate one based on your UX needs.

---

## Composite Results

SearchBar builds a composite result set that merges music, wisdom, and journal matches.

### Data Sources

- **Tracks + collections**: `filterTracks` and `filterCollections` via `buildSearchContentResults`.
- **Wisdom**: Loaded from `/api/wisdom` using `loadWisdomData` (cached in-memory).
- **Journal**: Parsed from `localStorage` key `metadj_wisdom_journal_entries`.

### Result Shape

```typescript
export interface SearchContentResults {
  tracks: Track[]
  collections: Collection[]
  wisdom: WisdomSearchEntry[]
  journal: JournalSearchEntry[]
  totalCount: number
}
```

### Integration Notes

- `onContentResultsChange` powers the inline search overlays in `AppHeader` and `ControlPanelOverlay`.
- Wisdom and Journal results are only included when selection handlers are provided.

---

## Search Algorithm

**Location**: `src/lib/music/filters.ts`

### Text Normalization

All search queries and track titles are normalized for consistent matching:

```typescript
const normalize = (value: string): string =>
  value
    .normalize("NFKD")           // Unicode normalization
    .replace(/[^\w\s]/g, " ")    // Remove special characters
    .replace(/\s+/g, " ")        // Collapse whitespace
    .trim()
    .toLowerCase();
```

### Tokenization

Search queries are split into tokens for multi-word matching:

```typescript
const tokens = normalizedQuery.split(" ").filter(Boolean);

// All tokens must match:
return tokens.every((token) => title.includes(token));
```

### Relevance Scoring

Results are sorted by relevance score:

```typescript
function calculateRelevanceScore(normalizedTitle: string, query: string): number {
  const title = normalizedTitle;

  // Exact matches get highest priority
  if (title === query) return 100;

  // Prefix matches get high priority
  if (title.startsWith(query)) return 80;

  // Word boundary matches (e.g., "Battle" matches "Boss Battle")
  if (title.includes(` ${query}`)) return 60;

  // General containment
  if (title.includes(query)) return 50;

  return 0;
}
```

### Score Hierarchy

| Match Type | Score | Example |
|------------|-------|---------|
| Exact match | 100 | Query "dawn" matches title "dawn" |
| Prefix match | 80 | Query "dawn" matches title "dawn patrol" |
| Word boundary | 60 | Query "battle" matches title "boss battle" |
| Contains | 50 | Query "awn" matches title "dawn" |

---

## Filtering System

### filterTracks

Filters tracks by search query with relevance sorting:

```typescript
export function filterTracks(
  allTracks: Track[],
  searchQuery: string,
  selectedCollectionId: string | undefined,
  getTracksByCollection: (collectionId: string) => Track[],
): Track[]
```

**Behavior**:
1. If `searchQuery` exists: Filter all tracks by title, sort by relevance
2. If only `selectedCollectionId`: Return tracks from that collection
3. Otherwise: Return all tracks

### filterCollections

Filters collections by title:

```typescript
export function filterCollections(
  collections: Collection[],
  searchQuery: string,
): Collection[]
```

**Behavior**:
- Tokenizes query
- All tokens must exist in collection title
- No relevance sorting (simple filter)

### Helper Functions

```typescript
// Resolve collection from filtered tracks
export function resolveCollectionFromTracks(
  filteredTracks: Track[],
  collections: Collection[],
): string | null

// Compute selected collection based on search results
export function computeSelectedCollection(
  currentSelectedId: string,
  filteredTracks: Track[],
  collections: Collection[],
): string
```

---

## Performance Optimizations

### Debouncing

**Location**: `src/hooks/use-debounce.ts`

Prevents excessive filtering on every keystroke:

```typescript
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}
```

**Default delay**: 300ms (`SEARCH_DEBOUNCE_MS` constant)

### Title Caching

Normalized titles are cached to avoid repeated unicode normalization:

```typescript
const normalizedTrackTitleCache = new Map<string, string>();

function getNormalizedTrackTitle(track: Track): string {
  const cached = normalizedTrackTitleCache.get(track.id);
  if (cached !== undefined) return cached;

  const normalized = normalize(track.title);
  normalizedTrackTitleCache.set(track.id, normalized);
  return normalized;
}
```

**Benefits**:
- First search: O(n) normalization
- Subsequent searches: O(1) cache lookup
- Cache persists for session lifetime

### Result Memoization

Search results are memoized with `useMemo`:

```typescript
const { trackResults, collectionResults } = useMemo(() => {
  // Filtering logic
}, [debouncedSearchQuery, tracks, collections]);
```

### Result Signature Tracking

Prevents redundant parent updates:

```typescript
const prevResultsRef = useRef<string>('');

useEffect(() => {
  const resultsSignature = trackResults.map(t => t.id).join(',');

  if (prevResultsRef.current !== resultsSignature) {
    prevResultsRef.current = resultsSignature;
    onResultsChange?.(trackResults);
  }
}, [onResultsChange, trackResults]);
```

### Component Memoization

`SearchResultItem` wrapped with `React.memo` to prevent unnecessary re-renders.

---

## Keyboard Navigation

### Input Field

| Key | Action |
|-----|--------|
| Arrow Down | Focus first search result |
| Escape | Clear query, close dropdown, blur input |

### Search Results

| Key | Action |
|-----|--------|
| Arrow Down | Focus next result (wraps to first) |
| Arrow Up | Focus previous result (first item focuses input) |
| Enter | Select focused result (play track/navigate to collection) |
| Escape | Clear query, close dropdown, focus input |

### Implementation

```typescript
const handleSearchResultKeyDown = useCallback(
  (event: KeyboardEvent, index: number, item: Track | Collection, type: string) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const next = searchResultRefs.current[index + 1] ?? searchResultRefs.current[0];
      next?.focus();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (index === 0) {
        searchInputRef.current?.focus();
      } else {
        searchResultRefs.current[index - 1]?.focus();
      }
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (type === 'track') {
        handleSearchResultSelect(item as Track);
      } else {
        handleCollectionSelect(item as Collection);
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setIsSearchFocused(false);
      updateQuery('');
      searchInputRef.current?.focus();
    }
  },
  [/* dependencies */]
);
```

---

## Integration

### With Collections System

Search results can navigate to collections:

```tsx
<SearchBar
  collections={collections}
  onCollectionSelect={(collection) => {
    setSelectedCollection(collection.id);
    setSearchQuery(''); // Clear search
  }}
/>
```

### With Player Context

Highlighting current track in results:

```tsx
<SearchBar
  currentTrack={currentTrack} // From PlayerContext
  onTrackSelect={(track) => {
    playTrack(track); // Updates PlayerContext
  }}
/>
```

### With Queue Context

Adding tracks to queue without closing search:

```tsx
<SearchBar
  onTrackQueueAdd={(track) => {
    addToQueue(track); // Updates QueueContext
    // Dropdown stays open for multi-track queueing
  }}
/>
```

### UX Behaviors

| Action | Dropdown Behavior |
|--------|-------------------|
| Select track to play | **Closes** dropdown |
| Add track to queue | **Stays open** (for multi-track queueing) |
| Select collection | **Closes** dropdown |
| Click outside | **Closes** dropdown |
| Press Escape | **Closes** dropdown |

---

## Accessibility

### WCAG 2.1 AA Compliance

| Requirement | Implementation |
|-------------|----------------|
| Form labeling | `<label htmlFor>` with `sr-only` class |
| Screen reader instructions | Hidden span with usage guidance |
| Keyboard operability | Full arrow key + Enter/Escape support |
| Focus management | Refs track focusable elements |
| Touch targets | 44px minimum on clear button and results |
| ARIA patterns | Combobox with listbox |

### ARIA Attributes

```tsx
<input
  role="combobox"
  aria-autocomplete="list"
  aria-haspopup="listbox"
  aria-expanded={Boolean(query && isSearchFocused)}
  aria-controls={query && isSearchFocused ? resultsId : undefined}
  aria-label="Search tracks by title"
  aria-describedby={instructionsId}
/>

<div role="listbox" aria-label="Search suggestions">
  <button
    role="option"
    aria-selected={isActive}
  >
    {/* Result content */}
  </button>
</div>
```

### Screen Reader Guidance

```tsx
<span id={instructionsId} className="sr-only">
  Type to search across tracks, artists, and genres.
  Use arrow keys to navigate results.
</span>
```

---

## Related Documentation

- [Components Collection Playlist Reference](../reference/components-collection-playlist-reference.md) - Track display components
- [Hooks Reference](../reference/hooks-reference.md) - useDebounce documentation
- [Keyboard Navigation](./keyboard-navigation.md) - App-wide keyboard shortcuts
- [Collections System](./collections-system.md) - Collection integration details
