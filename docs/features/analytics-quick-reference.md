# Analytics Quick Reference

> **Code snippets for the Plausible helpers exported by `src/lib/analytics.ts`**

**Last Modified**: 2025-12-19 17:08 EST

## Imports

```typescript
import {
  trackTrackPlayed,
  trackTrackSkipped,
  trackTrackCompleted,
  trackPlaybackControl,
  trackShuffleToggled,
  trackRepeatModeChanged,
  trackCollectionViewed,
  trackCollectionBrowsed,
  trackTrackCardClicked,
  trackTrackCardHovered,
  trackAddToQueueClicked,
  trackTrackInfoIconClicked,
  trackTrackInfoOpened,
  trackTrackInfoClosed,
  trackTrackShared,
  trackSearchPerformed,
  trackSearchZeroResults,
  trackSessionStarted,
  trackCinemaOpened,
  trackCinemaClosed,
  trackQueueAction,
  trackQueueRestored,
  trackQueueExpired,
  getDeviceType,
  isReturningVisitor,
  calculatePercentagePlayed,
} from "@/lib/analytics"
```

## Playback Helpers

```typescript
trackTrackPlayed({
  trackId: track.id,
  trackTitle: track.title,
  collection: track.collection,
  source: currentSource, // 'featured' | 'collection' | 'search' | 'queue'
  position: queueIndex,  // optional zero-based index
})

const listenedToEnd = currentTime >= duration - 5
trackTrackCompleted({ trackId: track.id, trackTitle: track.title, duration, listenedToEnd })

trackTrackSkipped({
  trackId: prevTrack.id,
  trackTitle: prevTrack.title,
  playedSeconds: currentTime,
  totalDuration: duration,
  percentagePlayed: calculatePercentagePlayed(currentTime, duration),
})
```

Shuffle / repeat toggles use dedicated helpers:

```typescript
trackShuffleToggled(!isShuffleEnabled)
trackRepeatModeChanged(nextMode) // 'none' | 'track' | 'queue'
```

For button-level interactions use `trackPlaybackControl`:

```typescript
trackPlaybackControl({ action: 'play', trackId: track.id })
trackPlaybackControl({ action: 'seek', value: Math.round(nextTime) })
```

## Collection & Discovery

```typescript
trackCollectionViewed({
  collectionId: selectedCollection,
  collectionTitle,
  trackCount: visibleTracks.length,
  previousCollection,
})

trackCollectionBrowsed({
  collectionId: selectedCollection,
  collectionTitle,
  trackCount: visibleTracks.length,
})

trackTrackCardClicked({
  trackId: track.id,
  trackTitle: track.title,
  collection: track.collection,
  source: 'collection',
  position,
})

trackTrackCardHovered({
  trackId: track.id,
  trackTitle: track.title,
  collection: track.collection,
  source: 'featured',
})

trackAddToQueueClicked({
  trackId: track.id,
  trackTitle: track.title,
  collection: track.collection,
  source: 'search',
})
```

## Track Details & Sharing

```typescript
trackTrackInfoIconClicked({
  trackId: track.id,
  trackTitle: track.title,
  collection: track.collection,
  triggerSource: 'collection', // 'search' | 'featured'
})

trackTrackInfoOpened({
  trackId: track.id,
  trackTitle: track.title,
  collection: track.collection,
  source: 'collection',
  trigger: 'info_button',
})

const startedAt = performance.now()
// ...
trackTrackInfoClosed({
  trackId: track.id,
  trackTitle: track.title,
  collection: track.collection,
  timeSpentMs: performance.now() - startedAt,
})

trackTrackShared({
  trackId: track.id,
  trackTitle: track.title,
  collection: track.collection,
  shareMethod: 'web_share', // or 'clipboard'
  platform: data.platform,  // optional
})
```

## Search & Session

```typescript
trackSearchPerformed({
  query, // helper records only length
  resultsCount: results.length,
  hasResults: results.length > 0,
})

if (results.length === 0) {
  trackSearchZeroResults({ query })
}

trackSessionStarted({
  isReturningVisitor: isReturningVisitor(),
  deviceType: getDeviceType(),
})
```

## Cinema & Queue

```typescript
const startedAt = Date.now()
trackCinemaOpened({ trackId: currentTrack?.id, fromSource: 'player' })

trackCinemaClosed({
  trackId: currentTrack?.id,
  durationSeconds: Math.round((Date.now() - startedAt) / 1000),
  completed: currentTime >= duration - 5,
})

trackQueueAction({ action: 'add', trackId: track.id, queueSize: queue.length + 1 })
trackQueueAction({ action: 'remove', trackId: track.id, queueSize: queue.length - 1 })
trackQueueAction({ action: 'reorder', queueSize: queue.length })
trackQueueAction({ action: 'clear', queueSize: 0 })

trackQueueRestored({
  queueSize: restored.queue.length,
  manualSize: restored.manualTrackIds.length,
})

trackQueueExpired({ reason: 'time_expired' }) // or 'version_mismatch'
```

## React Pattern — Skip Detection

```typescript
const previousTrackRef = useRef<Track | null>(null)

useEffect(() => {
  if (previousTrackRef.current && track && previousTrackRef.current.id !== track.id) {
    const prevTrack = previousTrackRef.current
    const playedSeconds = currentTime
    const totalDuration = duration

    if (totalDuration > 0 && playedSeconds < totalDuration - 5) {
      trackTrackSkipped({
        trackId: prevTrack.id,
        trackTitle: prevTrack.title,
        playedSeconds,
        totalDuration,
        percentagePlayed: calculatePercentagePlayed(playedSeconds, totalDuration),
      })
    }
  }

  previousTrackRef.current = track
}, [track, currentTime, duration])
```

## Tips

- Always use the typed helpers; avoid calling `trackEvent` directly unless adding a brand-new event.  
- Keep event names snake_case and values primitive (string, number, boolean).  
- Wrap analytics calls in try/catch only when invoking inside loops or persistence utilities—helpers already guard against runtime errors.  
- Document any new event in `3-projects/5-software/metadj-nexus/docs/operations/ANALYTICS-SETUP.md` and update monitoring playbooks.
