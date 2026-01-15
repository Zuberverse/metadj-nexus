# Cross-Device Sync Plan

**Last Modified**: 2026-01-15

## Summary

MetaDJ Nexus is local-first with selective cross-device sync for logged-in users. Audio preferences and recently played history now sync across devices via PostgreSQL. The sync is automatic for authenticated users with localStorage fallback for guests and offline resilience.

## Implemented Cross-Device Sync

The following features now sync across devices for logged-in users:

### Audio Preferences (2026-01-15)
- **Storage**: PostgreSQL `user_preferences.audio_preferences` JSONB column
- **API**: `GET/PATCH /api/auth/preferences`
- **Synced Settings**: crossfadeEnabled, muted, volume, autoplay
- **Fallback**: localStorage for guests and API failures

### Recently Played (2026-01-15)
- **Storage**: PostgreSQL `recently_played` table (user_id, track_id, played_at)
- **API**: `GET/POST/DELETE /api/auth/recently-played`
- **Limit**: 50 tracks per user, auto-pruned on insert
- **Fallback**: localStorage for guests

**Key Files:**
- `src/lib/preferences.ts` - Audio preferences CRUD
- `src/app/api/auth/preferences/route.ts` - Preferences API
- `src/app/api/auth/recently-played/route.ts` - Recently played API
- `src/hooks/use-recently-played.ts` - Hook with DB sync
- `src/hooks/audio/use-audio-settings.ts` - Audio settings hook with DB sync

## Current Local-Only Surfaces

- **Journal entries**: `metadj_wisdom_journal_entries` plus view/draft keys in localStorage.
- **Queue persistence**: `metadj_queue_state` (see `../features/queue-persistence.md`).
- **UI session state**: last open views and draft buffers for Wisdom/Journal.

## Goals

- **Local-first**: Sync is optional and never required to use the app.
- **Privacy by design**: No journal content in analytics; sync should avoid storing raw content without encryption.
- **Offline-safe**: Local edits remain usable even when sync is unavailable.
- **Minimal dependency**: Favor a simple backend and avoid heavy client SDKs.

## Proposed Phases

### Phase 1: Manual Export/Import (Low Risk)
- Export Journal entries to a JSON file.
- Import JSON to merge entries on another device.
- No auth required; user-controlled transfer.

### Phase 2: Opt-In Cloud Sync (Core)
- Add lightweight auth (email link or token-based).
- Store encrypted journal payload per user.
- Sync on demand (manual refresh + background at idle).

### Phase 3: Continuous Sync + Conflict Resolution
- Background sync with incremental updates.
- Conflict UI for divergent edits (default to last-write-wins).
- Activity log and last-synced visibility.

## Data Model (Draft)

```typescript
type SyncedJournalEntry = {
  id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
  contentHash: string
}

type SyncState = {
  deviceId: string
  lastSyncedAt: string
  lastPulledAt: string
}
```

## Conflict Strategy

- **Default**: Last-write-wins using `updatedAt`.
- **Fallback**: If hash mismatch and timestamps close, keep both versions.
- **UI**: Offer a merge dialog only when both versions are edited after the last sync.

## API/Infrastructure Notes

- Requires a user identity layer (email link or token-based).
- Data store can be a simple relational table keyed by user + entry id.
- Store encrypted blobs if end-to-end encryption is enabled.
- Keep write path idempotent and tolerant of retries.

## UX Requirements

- Clear opt-in toggle with status indicator ("Last synced 3m ago").
- Manual "Sync now" action for user confidence.
- "Export / Import" remains available even with sync enabled.
- One-click "Delete cloud data" option.

## Open Questions

- Should playlists or queue state be included in sync?
- What is the minimum viable identity flow?
- Will we support per-entry encryption keys or a single user key?

