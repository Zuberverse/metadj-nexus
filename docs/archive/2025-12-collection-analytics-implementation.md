# Collection Discovery Analytics Implementation

**Last Modified**: 2025-12-19 17:08 EST
**Status**: ARCHIVED (CollectionManager/TrackCard analytics removed in v0.8.1 cleanup)

> **Analytics instrumentation for collection browsing and track discovery behavior**

*Implementation Date: 2025-10-17*

## Overview

> This document is retained for historical reference. Collection browsing now lives in the Left Panel (`BrowseView.tsx` + `CollectionDetailView.tsx`). If discovery analytics are needed again, reintroduce events there.

This document details the legacy analytics instrumentation added to the CollectionManager component to measure discovery and collection browsing behavior. The implementation uses privacy-first event tracking via Plausible Analytics.

## New Analytics Events

### 1. Collection Browsed (`collection_browsed`)

**Purpose**: Track when users view a collection's track list

**Trigger**: Fires when tracks render in a collection view

**Data Tracked**:
- `collection_id`: ID of the browsed collection
- `collection_title`: Human-readable collection name
- `track_count`: Number of visible tracks
- `scroll_percentage`: Optional scroll depth (not currently implemented)

**Implementation**:
```typescript
// src/components/collection/CollectionManager.tsx (lines 153-168)
useEffect(() => {
  if (visibleTracks.length === 0) return

  try {
    const collectionTitle = collections.find((c) => c.id === selectedCollection)?.title || selectedCollection

    trackCollectionBrowsed({
      collectionId: selectedCollection,
      collectionTitle,
      trackCount: visibleTracks.length,
    })
  } catch (error) {
    console.warn('[Analytics] Failed to track collection browsed:', error)
  }
}, [visibleTracks.length, selectedCollection, collections])
```

### 2. Collection Viewed (`collection_viewed`)

**Purpose**: Track collection tab switches

**Trigger**: Fires when user changes collection selection

**Data Tracked**:
- `collection_id`: ID of the new collection
- `collection_title`: Human-readable collection name
- `track_count`: Number of tracks in collection
- `previous_collection`: ID of previous collection (if switched)

**Implementation**:
```typescript
// src/components/collection/CollectionManager.tsx (lines 133-151)
useEffect(() => {
  try {
    const collectionTitle = collections.find((c) => c.id === selectedCollection)?.title || selectedCollection
    const previousCollection = previousCollectionRef.current

    trackCollectionViewed({
      collectionId: selectedCollection,
      collectionTitle,
      trackCount: visibleTracks.length,
      ...(previousCollection !== selectedCollection && { previousCollection }),
    })

    // Update previous collection reference
    previousCollectionRef.current = selectedCollection
  } catch (error) {
    console.warn('[Analytics] Failed to track collection viewed:', error)
  }
}, [selectedCollection, visibleTracks.length, collections])
```

### 3. Track Card Clicked (`track_card_clicked`)

**Purpose**: Measure track selection patterns

**Trigger**: Fires when user clicks track to play

**Data Tracked**:
- `track_id`: Unique track identifier
- `track_title`: Track name
- `collection`: Source collection name
- `source`: Context of click (`collection`, `search`, or `featured`)
- `position`: Zero-based position in current list

**Implementation**:
```typescript
// src/components/collection/CollectionManager.tsx (lines 171-191)
const handleTrackClick = (track: Track, position: number) => {
  try {
    const source = searchQuery.trim()
      ? 'search'
      : selectedCollection === 'featured'
      ? 'featured'
      : 'collection'

    trackTrackCardClicked({
      trackId: track.id,
      trackTitle: track.title,
      collection: track.collection,
      source,
      position,
    })
  } catch (error) {
    console.warn('[Analytics] Failed to track track card clicked:', error)
  }

  onTrackClick(track)
}
```

### 4. Track Info Icon Clicked (`track_info_icon_clicked`)

**Purpose**: Measure intent to learn more about tracks

**Trigger**: Fires when user clicks info icon on track card

**Data Tracked**:
- `track_id`: Unique track identifier
- `track_title`: Track name
- `collection`: Source collection name
- `trigger_source`: Context of click (`collection`, `search`, or `featured`)

**Implementation**:
```typescript
// src/components/collection/CollectionManager.tsx (lines 193-215)
const handleShowTrackDetails = (track: Track) => {
  if (!onShowTrackDetails) return

  try {
    const triggerSource = searchQuery.trim()
      ? 'search'
      : selectedCollection === 'featured'
      ? 'featured'
      : 'collection'

    trackTrackInfoIconClicked({
      trackId: track.id,
      trackTitle: track.title,
      collection: track.collection,
      triggerSource,
    })
  } catch (error) {
    console.warn('[Analytics] Failed to track info icon clicked:', error)
  }

  onShowTrackDetails(track)
}
```

### 5. Add to Queue Clicked (`add_to_queue_clicked`)

**Purpose**: Measure queue management usage

**Trigger**: Fires when user adds track to queue from collection

**Data Tracked**:
- `track_id`: Unique track identifier
- `track_title`: Track name
- `collection`: Source collection name
- `queue_position_after_add`: Position in queue after addition

**Implementation**:
```typescript
// src/components/collection/CollectionManager.tsx (lines 218-231)
const handleAddToQueue = (track: Track) => {
  try {
    trackAddToQueueClicked({
      trackId: track.id,
      trackTitle: track.title,
      collection: track.collection,
      queuePositionAfterAdd: queue.length + 1,
    })
  } catch (error) {
    console.warn('[Analytics] Failed to track add to queue clicked:', error)
  }

  onTrackQueueAdd(track)
}
```

## Analytics Function Definitions

All new analytics functions are defined in `src/lib/analytics.ts`:

```typescript
// Collection browsing (lines 234-250)
export interface CollectionBrowsedProps {
  collectionId: string
  collectionTitle: string
  trackCount: number
  scrollPercentage?: number
}

export function trackCollectionBrowsed(props: CollectionBrowsedProps): void {
  trackEvent('collection_browsed', {
    collection_id: props.collectionId,
    collection_title: props.collectionTitle,
    track_count: props.trackCount,
    ...(props.scrollPercentage !== undefined && {
      scroll_percentage: Math.round(props.scrollPercentage),
    }),
  })
}

// Track card hover (lines 252-266) - Optional, not yet implemented
export interface TrackCardHoveredProps {
  trackId: string
  trackTitle: string
  collection: string
  position: number
}

export function trackTrackCardHovered(props: TrackCardHoveredProps): void {
  trackEvent('track_card_hovered', {
    track_id: props.trackId,
    track_title: props.trackTitle,
    collection: props.collection,
    position: props.position,
  })
}

// Track card click (lines 268-284)
export interface TrackCardClickedProps {
  trackId: string
  trackTitle: string
  collection: string
  source: 'collection' | 'search' | 'featured'
  position: number
}

export function trackTrackCardClicked(props: TrackCardClickedProps): void {
  trackEvent('track_card_clicked', {
    track_id: props.trackId,
    track_title: props.trackTitle,
    collection: props.collection,
    source: props.source,
    position: props.position,
  })
}

// Track info icon click (lines 286-300)
export interface TrackInfoIconClickedProps {
  trackId: string
  trackTitle: string
  collection: string
  triggerSource: 'collection' | 'search' | 'featured'
}

export function trackTrackInfoIconClicked(props: TrackInfoIconClickedProps): void {
  trackEvent('track_info_icon_clicked', {
    track_id: props.trackId,
    track_title: props.trackTitle,
    collection: props.collection,
    trigger_source: props.triggerSource,
  })
}

// Add to queue click (lines 302-316)
export interface AddToQueueClickedProps {
  trackId: string
  trackTitle: string
  collection: string
  queuePositionAfterAdd: number
}

export function trackAddToQueueClicked(props: AddToQueueClickedProps): void {
  trackEvent('add_to_queue_clicked', {
    track_id: props.trackId,
    track_title: props.trackTitle,
    collection: props.collection,
    queue_position_after_add: props.queuePositionAfterAdd,
  })
}
```

## Modified Components

### CollectionManager.tsx

**Changes**:
1. Added analytics imports (lines 8-14)
2. Added `queue` prop to interface (line 34)
3. Added `previousCollectionRef` for tracking collection switches (line 53)
4. Added collection viewed tracking effect (lines 133-151)
5. Added collection browsed tracking effect (lines 153-168)
6. Created wrapper handlers for analytics (lines 170-231)
7. Updated TrackCard usage to pass position and wrapped handlers (lines 288-300)

**New Props**:
- `queue?: Track[]` - Optional queue for analytics tracking

### page.tsx

**Changes**:
1. Added `queue={queue}` prop to CollectionManager (line 958)

### TrackCard.tsx

**Changes**:
1. Added `positionInList?: number` to interface (line 19)
2. Updated component signature to accept position (lines 34-42)
3. Added comment explaining unused parameter (line 40)

## Insights Enabled

These analytics events reveal:

1. **Collection Exploration Patterns**:
   - Which collections get explored most (Featured vs. Albums)
   - Navigation patterns between collections
   - Track count impact on engagement

2. **Track Selection Behavior**:
   - "First 5 tracks" vs. random selection patterns
   - Position bias in track discovery
   - Source context (collection browse vs. search)

3. **Information Seeking**:
   - Info icon click rates measure curiosity
   - Which tracks generate most interest
   - Context where users seek more details

4. **Queue Management**:
   - Add-to-queue adoption and usage
   - Queue position patterns
   - Collection-specific queuing behavior

## Privacy Considerations

All tracking follows Plausible's privacy-first approach:
- No cookies or persistent identifiers
- No personal data collection
- GDPR compliant by design
- All events wrapped in try/catch for graceful failure
- Development mode logging for debugging

## Next Steps

### Optional Enhancements:

1. **Track Card Hover Event** (trackTrackCardHovered):
   - Function defined but not implemented
   - Would require onMouseEnter handler on TrackCard
   - Useful for measuring artwork engagement

2. **Scroll Percentage Tracking**:
   - CollectionBrowsed event supports scroll_percentage
   - Would require scroll event listener
   - Reveals how deep users explore collections

3. **Plausible Configuration**:
   - Add custom event goals in Plausible dashboard
   - Create funnel visualization for discovery flow
   - Set up conversion tracking for key actions

## Testing

**Development Mode**:
```bash
npm run dev
```
All analytics events log to console with `[Analytics]` prefix

**Production Validation**:
1. Deploy to production
2. Open browser DevTools Network tab
3. Interact with collections
4. Verify Plausible events sent to `/api/event`

**Event Verification Checklist**:
- [ ] Collection browsed fires on collection view
- [ ] Collection viewed fires on tab switch
- [ ] Track card clicked fires with correct position
- [ ] Info icon clicked fires with correct source
- [ ] Add to queue clicked fires with queue position
- [ ] All events include required properties
- [ ] No events fire in development (only logs)

## Related Documentation

- **Analytics Setup**: `3-projects/5-software/metadj-nexus/docs/operations/ANALYTICS-SETUP.md`
- **Implementation Guide**: `3-projects/5-software/metadj-nexus/docs/features/analytics-quick-reference.md`
- **Privacy Policy**: See Plausible documentation

---

*Remember: Technology amplifies; humans orchestrate. Analytics reveal patterns; humans create meaning.*
