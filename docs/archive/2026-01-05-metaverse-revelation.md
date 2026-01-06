# Metaverse Revelation (Collection Reference)

> Complete reference for the Metaverse Revelation collection.

**Last Modified**: 2025-12-19 15:35 EST

## Concept

- **Narrative**: I created Metaverse Revelation as my third collection, rallying creative communities and festival-scale energy into one movement. It's the moment where the dancefloor, the Metaverse, and the studio collapse into a single pulse of transformation.
- **Theme**: High-energy empowerment, future-facing optimism, and collective transformation—capturing the feel of a packed arena and a Metaverse wide open for reinvention.
- **Release Date**: 2025-12-10 (expanded to 9 tracks with new additions Pioneers and Cosmic Journey).

## Track Order (9 tracks)

| # | ID | Title | Duration (mm:ss) | Filename |
|---|----|-------|------------------|----------|
| 1 | mr-001 | I Want to Believe | 5:04 | `01 - I Want to Believe (v0) - Mastered.mp3` |
| 2 | mr-002 | Embrace the Moment | 3:40 | `02 - Embrace the Moment (v0) - Mastered.mp3` |
| 3 | mr-003 | Pioneers | 4:51 | `03 - Pioneers (v0) - Mastered.mp3` |
| 4 | mr-004 | Cosmic Journey | 6:18 | `04 - Cosmic Journey (v0) - Mastered.mp3` |
| 5 | mr-005 | Metaverse Revelation | 4:07 | `05 - Metaverse Revelation (v0) - Mastered.mp3` |
| 6 | mr-006 | MetaDJ Revolution | 3:14 | `06 - MetaDJ Revolution (v0) - Mastered.mp3` |
| 7 | mr-007 | Cosmic Rendezvous | 3:04 | `07 - Cosmic Rendezvous (v0) - Mastered.mp3` |
| 8 | mr-008 | Dreaming of a World | 2:34 | `08 - Dreaming of a World (v0) - Mastered.mp3` |
| 9 | mr-009 | Welcome to the Zuberverse | 4:17 | `09 - Welcome to the Zuberverse (v0) - Mastered.mp3` |

> Durations use rounded times for quick reference. Exact second counts live in `src/data/tracks.json`.

## Mastering Workflow

1. **Source Files**: LANDR MP3 exports stored in `~/Downloads` with filenames matching the track titles — these are the canonical music files.
2. **Streaming Copies**: Upload 320 kbps MP3 files to App Storage under `audio-files/Metaverse Revelation/NN - Track Title (v0) - Mastered.mp3` path to match `/api/audio/Metaverse Revelation/...` endpoints.
3. **Formats**: MP3 is the single source of truth for both streaming and archived backups—no alternate lossless tier.
4. **Metadata**: Track records added to `src/data/tracks.json` with IDs `mr-001` → `mr-009` and linked to the `Metaverse Revelation` collection entry.
5. **Note on Filenames**: Metaverse Revelation tracks now use numbered prefixes matching the other collections (e.g., `01 - I Want to Believe (v0) - Mastered.mp3`).

## Collection Art

- **Visual Identity**: "Neon Nights" - Cyberpunk cityscapes with glowing neon lights, symbolizing the futuristic, high-energy, and transformational nature of the collection.
- **Asset**: `metaverse-revelation-collection.svg`
- **Tab Gradient**: Cyan → Electric Blue, matching the cosmic empowerment theme.

## Notes

- Future tracks should continue the numbering (`mr-010+`) and update `trackCount`.
- Capture BPM / key metadata for each track once analysis is complete.
- Updated 2025-12-10: Expanded from 7 to 9 tracks with Pioneers and Cosmic Journey added at positions 3-4.
