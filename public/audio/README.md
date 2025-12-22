# Audio Assets — Replit App Storage

**Last Modified**: 2025-12-22 08:51 EST

This directory is **intentionally empty** by design. All audio files for MetaDJ Nexus are hosted on **Replit App Storage** and served through Next.js API routes.

## Architecture

### Production (Replit)
- Audio files stored in Replit App Storage bucket: `audio-files/`
- Structure: `audio-files/<collection>/<track-slug>.mp3`
- Served via: `/api/audio/[...path]/route.ts`
- Format: 320 kbps MP3

**Example**:
- Storage path: `audio-files/majestic-ascent/01-majestic-ascent-mastered-v0.mp3`
- Public URL: `/api/audio/majestic-ascent/01-majestic-ascent-mastered-v0.mp3`
- Browser streams from App Storage through API proxy

### Local Development

For local development outside Replit:
1. Place temporary MP3 files in this directory
2. Files are gitignored (see `.gitignore`)
3. Update `audioUrl` in `src/data/tracks.json` to point to local paths if needed

**Example local setup**:
```
public/audio/
├── majestic-ascent/
│   ├── 01-track.mp3
│   └── 02-track.mp3
└── bridging-reality/
    └── 01-track.mp3
```

## Why This Approach?

**Benefits**:
- ✅ Repository stays lightweight (<10MB vs 500MB+)
- ✅ Large media files never committed to Git
- ✅ Streaming performance optimized via range requests
- ✅ Scalable for future catalog expansion
- ✅ Simpler deployment (no Git LFS complexity)

**Legacy**: Pre-v1.53 used Git LFS for audio files. Migrated to App Storage on 2025-10-05.

## Complete Documentation

See **[docs/APP-STORAGE-SETUP.md](../../docs/APP-STORAGE-SETUP.md)** for:
- Full upload workflow
- Encoding specifications (320 kbps MP3)
- FFmpeg commands
- Troubleshooting guide
- Migration notes from Git LFS

## Data References

Track metadata lives in:
- `src/data/tracks.json` — Track metadata with `/api/audio/` URLs
- `src/data/collections.json` — Collection metadata

## Scripts

Encoding utilities available in:
- `scripts/encode-audio.sh` — Legacy helper that converts high-resolution source files to 320 kbps MP3 (all production music is already MP3)
- `scripts/validate-tracks.js` — Validate track metadata

---

**Questions?** Check `3-projects/5-software/metadj-nexus/docs/APP-STORAGE-SETUP.md` or `CLAUDE.md`.
