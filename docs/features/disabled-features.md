# Disabled Features

**Last Modified**: 2025-12-30 10:31 EST

Canonical list of features that exist in code but are disabled in the current MetaDJ Nexus build.

## Mood Channels (disabled)

- Status: Disabled via `FEATURE_MOOD_CHANNELS` in `src/lib/app.constants.ts`.
- Reason: Catalog size and per-channel depth must meet activation criteria.
- Re-enable criteria:
  1. 50+ tracks overall (met).
  2. 10+ tracks per channel (validate).
  3. Update `src/data/moodChannels.ts` assignments if needed.
  4. Set `FEATURE_MOOD_CHANNELS = true` and validate Left Panel UX.
