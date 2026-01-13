# Analytics Implementation Reference — MetaDJ Nexus

> **Authoritative map of Plausible instrumentation and extension patterns**

**Last Modified**: 2026-01-13 08:56 EST

## Overview

MetaDJ Nexus tracks listener behaviour with Plausible Analytics. All tracking flows through `src/lib/analytics.ts`, which enforces privacy-friendly payloads, environment checks, and dev-mode logging. This reference explains where events fire in the codebase so future updates stay consistent.

## Instrumentation Map

### Audio Player (`src/components/player/AudioPlayer.tsx`)
- `track_played`, `track_skipped`, `track_completed` — emitted from the playback lifecycle in `useAudioPlayback`.
- `playback_control` — issued for play/pause/previous/next/seek/volume interactions.
- `shuffle_toggled`, `repeat_mode_changed` — button handlers wrap the public analytics helpers.
- `cinema_opened`, `cinema_closed` — forwarded from the cinema toggle button.
- `cinema_toggle`, `dream_toggle` — cinema activation + Dream overlay toggles.
- `queue_action` — queue overlay controls emit add/remove/reorder/clear actions.
- `track_shared` — share modal triggers the helper exposed by `analytics.ts`.

### Experience Orchestration (`HomePageClient` + shells)
- `session_started`, `search_performed`, `search_zero_results` — emitted from `src/components/session/SessionBootstrap.tsx`.
- Audio warmup (`HEAD /api/audio/warmup`) — issued from `SessionBootstrap` to precompile the audio route; no analytics event.
- `trackQueueAction` — queue add/remove/reorder/clear logic in `src/hooks/home/use-queue-mutations.ts` and `src/hooks/home/use-queue-navigation.ts`.

### Activation Milestones (first-time events)
- `activation_first_play` — first playback milestone tracked in `src/hooks/audio/use-audio-analytics.ts`.
- `activation_first_chat` — first MetaDJai message tracked in `src/components/metadjai/MetaDjAiChat.tsx`.
- `activation_first_guide` — first guide open tracked in `src/components/wisdom/Guides.tsx`.
- `activation_first_playlist` — first playlist creation tracked in `src/contexts/PlaylistContext.tsx`.

### Playlists (`src/contexts/PlaylistContext.tsx`)
- `playlist_created`, `playlist_renamed`, `playlist_deleted` — core CRUD events.
- `playlist_duplicated` — duplicate action with track count + source.
- `playlist_artwork_updated` — custom cover selection vs auto reset.
- `track_added_to_playlist`, `track_removed_from_playlist` — per-track edits.
- `playlist_tracks_added` — bulk add flow from PlaylistSelector.
- `playlist_tracks_reordered` — drag/keyboard reorder in playlist detail view.
- `playlist_played` — play-all action from playlist view.

### Collections & Search
- Previous collection dropdown UI (`src/components/collection/*`) and TrackCard analytics were removed in v0.8.1 cleanup. Collection selection now lives in the Left Panel (`src/components/panels/left-panel/BrowseView.tsx`, `CollectionDetailView.tsx`); discovery analytics can be re‑introduced there if needed.
- `src/components/TrackDetailsModal.tsx`
  - `track_info_opened`, `track_info_closed` — modal lifecycle (time spent captured on close).
- `src/components/search/SearchBar.tsx`
  - Reuses prefix search helpers from the page orchestrator so events stay centralised.

### Queue Persistence (`src/lib/queue-persistence.ts`)
- `queue_restored` — emitted when persisted state hydrates successfully.
- `queue_expired` — reason-coded event for version mismatch or TTL expiry.

### Sharing, Wisdom & Journal
- `src/components/guide/UserGuideOverlay.tsx` and `src/components/modals/WelcomeOverlay.tsx` rely on player/cinema metrics; no direct events yet.
- `src/components/wisdom/Guides.tsx`
  - `guide_opened` — per-guide engagement with category metadata.
  - `activation_first_guide` — activation milestone tracking.
- `src/components/wisdom/Journal.tsx`
  - `journal_entry_created`, `journal_entry_updated`, `journal_entry_deleted` — entry lifecycle with length + word count metadata.

## Helper Utilities (`src/lib/analytics.ts`)

- `trackEvent(name, props)` is the only place that calls `window.plausible`.
- Dedicated helper functions guard parameter naming, enforce primitive values, and round numbers (e.g., `calculatePercentagePlayed`).
- Dev mode logs events to the console; production mode sends them to Plausible when `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` is populated.
- `getDeviceType`, `isReturningVisitor`, and persistence helpers support session metadata without storing PII.

## Adding New Events

1. **Define a helper** in `src/lib/analytics.ts` (follow snake_case naming and document props).  
2. **Call the helper** from the relevant component or hook. Avoid duplicate calls on every render—wrap inside handlers or effects with guard conditions.  
3. **Update documentation**:  
   - Append the event to the “Event Catalog” table in `3-projects/5-software/metadj-nexus/docs/operations/ANALYTICS-SETUP.md`.  
   - Note dashboard usage in `3-projects/5-software/metadj-nexus/docs/operations/ANALYTICS-MONITORING-GUIDE.md`.  
4. **Test locally**: run `npm run dev`, trigger the flow, and verify `[Analytics]` console output.  
5. **Optionally add Plausible goals/segments** once the feature hits production.

## Testing & Troubleshooting

- **Local logging**: Helpers print `[Analytics] event_name { ... }` in dev mode.
- **Production verification**: Filter the Network tab for `plausible/js/script.js` and ensure POST requests fire with the expected event.
- **Error handling**: All helpers swallow failures and log warnings; analytics must never break the app.
- **Noise control**: Only add events that map to a real question. Remove or debounce events that trigger excessively.

## Related Documentation

- [operations/ANALYTICS-SETUP.md](../operations/ANALYTICS-SETUP.md) — Setup checklist & event catalog  
- [operations/ANALYTICS-MONITORING-GUIDE.md](../operations/ANALYTICS-MONITORING-GUIDE.md) — Dashboard and insight playbooks  
- [analytics-quick-reference.md](./analytics-quick-reference.md) — Code snippets for the available helpers  
- [../archive/2025-12-collection-analytics-implementation.md](../archive/2025-12-collection-analytics-implementation.md) — Deep dive on collection and discovery signals (archive)
