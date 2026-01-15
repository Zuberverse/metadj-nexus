# Data Synchronization Protocol

**Last Modified**: 2026-01-14 20:41 EST

## Overview

MetaDJ Nexus uses a **Single Source of Truth** architecture for music data. The Brand Corpus maintains the authoritative catalog, and the application synchronizes from it. This ensures consistency across all Zuberant properties while allowing the app to have technical metadata specific to its needs.

## Source of Truth

### Authoritative Source (Corpus)

**Location**: `1-system/1-context/1-knowledge/5-music/music-context-collections-catalog.md`

**Contains**:
- Collection names, concepts, thematic cores, stories
- Complete tracklists with canonical titles
- Genre signatures and sonic identities
- Production notes and creation context
- Track counts per collection
- Release dates and status information

### Application Data (App)

**Locations**:
- `src/data/collections.json` - Collection metadata for app display
- `src/data/music.json` - Track data with technical metadata

**Contains**:
- Synchronized: Collection names, track titles, descriptions, track counts
- App-specific: audioUrl, duration, artworkUrl, bpm, key, genres array

## Synchronization Process

### Step 1: Review Corpus Catalog

Open the corpus catalog and note:
- Total number of collections (currently: 3 published + 2 in development)
- Track count per collection
- Any new or modified tracks
- Collection names and descriptions

### Step 2: Update collections.json

For each collection in the corpus:

1. Verify collection exists in `src/data/collections.json`
2. Update `trackCount` to match corpus tracklist count
3. Verify `title` matches corpus collection name exactly
4. Update `description` if changed in corpus
5. Verify `releaseDate` matches corpus

### Step 3: Update music.json

For each track in the corpus tracklists:

1. Verify track exists in `src/data/music.json` with matching `id`
2. Verify `title` matches corpus tracklist exactly
3. Verify `collection` field matches collection name exactly
4. Ensure track has exactly **2 genre tags** (Primary + Characteristic)
5. Update `description` if changed in corpus

### Step 4: Validate Sync

Run the validation checklist (see below).

## Validation Checklist

Run before committing any changes to music data:

- [ ] **Collection count matches**: Corpus published collections = `collections.json` entries
- [ ] **Track counts match**: For each collection, corpus tracklist count = app track count
- [ ] **Collection names consistent**: Exact spelling match between corpus and app
- [ ] **All tracks have 2 genre tags**: No more, no less (per tag standard)
- [ ] **No "Cinematic" tags**: "Cinematic" is allowed in descriptions only, never as tag
- [ ] **Release dates accurate**: Match corpus release dates
- [ ] **Artwork URLs valid**: All artworkUrl paths exist in `/public/images/`
- [ ] **Audio URLs valid**: All audioUrl paths use `/api/audio/<collection-slug>/` format

### Current Expected Counts

| Collection | Corpus Track Count | App Track Count |
|------------|-------------------|-----------------|
| Majestic Ascent | 10 | 10 |
| Metaverse Revelation | 10 | 10 |

**Total**: 20 tracks across 2 published collections

**Note**: Bridging Reality remains corpus-only until it is synced into app data.

## When to Sync

### Triggers Requiring Sync

1. **New tracks added** to a collection in corpus
2. **New collection created** in corpus with Status: "Released"
3. **Track renamed** in corpus catalog
4. **Collection renamed** in corpus catalog
5. **Track reordered** within a collection
6. **Description updated** for track or collection
7. **Release date changed** in corpus

### Non-Sync Events

- Personal collections (Status: "Personal Collection") - NOT synced to app
- Collections with Status: "In Development" or "TBD" - NOT synced until released
- Production notes and creation context - Corpus only, not in app data

## Handling Discrepancies

### Corpus Has More Tracks Than App

1. Identify missing tracks by comparing tracklists
2. Add track entries to `music.json` with required fields:
   - `id`: Format `[collection-prefix]-[number]` (e.g., `mr-010`)
   - `title`: Exact match from corpus
   - `artist`: "MetaDJ"
   - `collection`: Exact collection name
   - `duration`: In seconds (must obtain from actual audio file)
   - `releaseDate`: From corpus
   - `audioUrl`: Format `/api/audio/<collection-slug>/[##] - [Title] (v0) - Mastered.mp3`
   - `artworkUrl`: Collection artwork path
   - `genres`: Array of exactly 2 tags
   - `description`: From corpus or create if not specified
3. Update `trackCount` in `collections.json`

### App Has More Tracks Than Corpus

This indicates a sync issue. Either:
- Track was removed from corpus but not app (remove from app)
- Track was added to app prematurely (remove until corpus documents it)

### Name Mismatch

Always use the corpus as truth. Update app data to match corpus spelling and naming.

## Tag Standards

### Two-Tag Requirement

Every track MUST have exactly 2 genre tags:

1. **Primary Genre**: Main musical style
   - Examples: "Rock", "Techno", "Ambient", "Electronic", "EDM", "House", "Trance"

2. **Secondary Characteristic**: Distinctive quality or sub-genre
   - Examples: "Retro Future", "Epic", "Ethereal", "Futuristic", "Cosmic", "Uplifting", "Anthem"

### Prohibited Tags

- **"Cinematic"**: Never use as a tag (overused, too broad)
  - Acceptable in descriptions, copy, and narrative text
  - Not acceptable in the `genres` array

### Examples

```json
{
  "genres": ["Retro Future", "Techno"]
}
```

```json
{
  "genres": ["Rock", "Techno"]
}
```

```json
{
  "genres": ["EDM", "Anthem"]
}
```

## Personal Collections Exception

Collections marked with **Status: "Personal Collection"** in the corpus:
- Are NOT synchronized to the app
- Remain in corpus for documentation purposes only
- May contain experimental or private material
- Are excluded from public-facing platforms

Currently no personal collections are documented as such.

## Troubleshooting

### Audio Not Playing

1. Verify `audioUrl` format matches expected pattern
2. Check file exists in R2 at expected path
3. Verify collection name in path matches exactly (case-sensitive)
4. Check track filename format: `[##] - [Title] (v0) - Mastered.mp3`

### Track Count Mismatch After Sync

1. Count tracks in corpus tracklist manually
2. Count tracks in `music.json` with matching collection field
3. Identify discrepancy (missing or extra tracks)
4. Correct app data to match corpus

### Genre Tag Validation Errors

1. Check track has exactly 2 tags in `genres` array
2. Remove any "Cinematic" tags if present
3. Ensure tags are strings, not arrays

## Automation Opportunities

### Future Enhancements

1. **Validation Script (planned)**: `scripts/validate-music-sync.js` (not implemented yet)
   - Compare corpus track counts with app data
   - Flag mismatches and missing tracks
   - Validate tag counts and prohibited tags

2. **Sync Report Generator**
   - Generate diff report between corpus and app
   - Highlight items needing attention
   - Output as markdown for review

3. **Pre-commit Hook**
   - Run validation before allowing commits to music data files
   - Fail commit if validation errors detected

### Current Manual Process

Until automation is implemented, sync verification is a manual process following this protocol. Run the validation checklist before any PR that modifies `music.json` or `collections.json`.

---

**Remember**: The corpus catalog is the authoritative source. When in doubt, the corpus is correct. App data exists to serve the application's technical needs while maintaining fidelity to the corpus truth.
