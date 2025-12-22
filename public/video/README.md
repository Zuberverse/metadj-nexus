# Video Assets — Replit App Storage

**Last Modified**: 2025-12-19 20:50 EST

This directory is **intentionally empty** by design. All video files for MetaDJ Nexus's Cinema are hosted on **Replit App Storage** and served through Next.js API routes.

## Architecture

### Production (Replit)
- Video files stored in Replit App Storage at root level
- Files: `MetaDJ Performance Loop - MetaDJ Nexus.webm` (optional VP9 primary) + `MetaDJ Performance Loop - MetaDJ Nexus.mp4` (H.264 fallback currently served)
- Served via: `/api/video/[...path]/route.ts`

**Browser Selection**:
- Chrome/Firefox/Edge: Use VP9 WebM (37MB, 960×540, 30fps)
- Safari/iOS: Use H.264 MP4 (119MB, 1280×720, 60fps)

**Example**:
```html
<video>
  <source src="/api/video/metadj-avatar/MetaDJ Performance Loop - MetaDJ Nexus.mp4" type="video/mp4" />
</video>
```

### Local Development

For local development outside Replit:
1. Place temporary video files in this directory
2. Files are gitignored (see `.gitignore`)
3. Component will fallback to local paths if App Storage unavailable

**Example local setup**:
```
public/video/
├── MetaDJ Performance Loop - MetaDJ Nexus.webm  (VP9 WebM, optional)
└── MetaDJ Performance Loop - MetaDJ Nexus.mp4   (H.264 MP4)
```

## Video Specifications

### Primary: VP9 WebM
- Container: WebM
- Codec: VP9
- Resolution: 960×540 (qHD)
- Frame Rate: 30 fps
- Quality: CRF 36
- Audio: Opus @ 96 kbps
- Size: ~37 MB (60-second loop)
- Browser Support: 85%+ (Chrome, Firefox, Edge)

### Fallback: H.264 MP4
- Container: MP4
- Codec: H.264 High Profile Level 4.2
- Resolution: 1280×720 (HD)
- Frame Rate: 60 fps
- Quality: CRF 18
- Audio: AAC @ 192 kbps
- Size: ~119 MB (60-second loop)
- Browser Support: 100% (Safari, iOS)

## Why Dual Format?

**Safari requires H.264**: Safari/iOS doesn't support VP9 codec natively.
**WebM for efficiency**: VP9 delivers similar quality at 1/3 the file size.
**Native fallback**: Browser automatically selects compatible format via `<source>` tags.

## Encoding Commands

Use the provided script:
```bash
./scripts/encode-video.sh source.mp4 "MetaDJ Performance Loop - MetaDJ Nexus"
```

Or manually:
```bash
# VP9 WebM
ffmpeg -i source.mp4 \
  -vf scale=960:-2,fps=30 \
  -c:v libvpx-vp9 -crf 36 -b:v 0 \
  -c:a libopus -b:a 96k \
  "MetaDJ Performance Loop - MetaDJ Nexus.webm"

# H.264 MP4
ffmpeg -i source.mp4 \
  -c:v libx264 -preset slow -crf 18 -profile:v high -level 4.2 \
  -c:a aac -b:a 192k -movflags +faststart \
  "MetaDJ Performance Loop - MetaDJ Nexus.mp4"
```

## Cinema Implementation

The fullscreen Cinema overlay loads videos dynamically:
- Auto-hide controls after 2.5s
- Sync video playback with audio
- Graceful fallback to black screen when video unavailable

See: `src/app/page.tsx` (cinema section, lines 1361-1472)

## Complete Documentation

See **[docs/APP-STORAGE-SETUP.md](../../docs/APP-STORAGE-SETUP.md)** for:
- Upload workflow
- Encoding specifications
- Troubleshooting
- Migration notes

---

**Questions?** Check `3-projects/5-software/metadj-nexus/docs/APP-STORAGE-SETUP.md` or `CLAUDE.md`.
