**Last Modified**: 2025-12-22 14:03 EST

# In-Development Roadmap

> Canonical snapshot of features that are actively in development, staged, or otherwise not live in the current MetaDJ Nexus build.

## Recently Implemented (v0.9.20)

### Cinema System Enhancements
- **Audio-Reactive Visualizers** — Real-time visualizers responding to music (Cosmos, Black Hole, Space Travel, Disco Ball, Pixel Portal, 8-Bit Adventure, Synthwave Horizon)
- **Video Scene Library** — Current video scene: MetaDJ Avatar
- **Collection-Cinema Associations** — Each collection has recommended visuals matching its sonic identity
- **Categorized Dropdown UI** — Clear separation between video scenes and audio-reactive visualizers

### Smart Playback Features
- **Recently Played (Library)** — Last 10 plays pinned under Featured in the Music panel (localStorage)
- **Mood Channels** — Curated listening experiences (Deep Focus, Energy Boost, Creative Flow)

### MetaDJai Enhancements
- **Conversation Persistence** — Sessions preserved across page reloads via localStorage
- **AI Streaming Responses** — Real-time streaming for responsive conversations

### Track Details
- **Production Details Card** — BPM, Key, and Release Date display in track details modal

---

## In Active Development

### Key Features

- **Guides (Wisdom)** — First guide live: "Encoding Your Identity With AI". Additional playbooks (release ops, show design) remain staged until editing and QA finish.
- **Wisdom (Remaster)** — Narrative and reflections covering experience and stories. The data model (`BIOGRAPHIES`) is ready; the dashboard displays a placeholder while the chapters are remastered.
- **Tiered Access (Planned)** — General Admission (free) → VIP → DJ / Digital Jockey. Unlock extended visuals, exclusive mixes, performance archives, and marketplace incentives. Stripe integration spec is archived for now; billing + entitlement flows implementation pending.
- **Advanced Model Access (MetaDJai)** — Explore subscriber-tier access to higher-capability models across providers, with simple UX labels and clear guardrails.
- **Transformer Final Masters** — The Transformer tab still streams placeholder uploads. Final 320 kbps masters and narratives will replace them in a later drop.
- **Additional State of Mind Dispatches** — Only "Welcome to MetaDJ Nexus" is published today. Future essays stay in draft to keep releases intentional.

### Key UI / UX Enhancements

- **Wisdom Navigation** — Future iterations may add breadcrumb hints once more posts go live.
- **Cinema Visual Packs** — Additional motion packs being tuned for greater variety.
- **User Guide Expansion** — Planned deep dive with quickstart checklists and direct links into Guides once they unlock.

---

## Future Innovation Roadmap

### Near Term (Q1 2025)

| Feature | Description | Priority |
|---------|-------------|----------|
| **Offline Mode** | PWA support for offline playback with sync | High |
| **Custom Playlists** | User-created playlists beyond mood channels | High |
| **Social Sharing** | Share playing track/mood to social platforms | Medium |
| **Collaborative Queues** | Real-time shared listening sessions | Medium |

### Mid Term (Q2 2025)

| Feature | Description | Priority |
|---------|-------------|----------|
| **AI DJ Curation** | MetaDJai curates continuous mixes based on context | High |
| **Voice Commands** | Hands-free control via Web Speech API | Medium |
| **Cinema Creation Studio** | User-generated visual packs | Medium |
| **Performance Analytics** | Listening stats and insights dashboard | Low |

### Long Term (Q3-Q4 2025)

| Feature | Description | Priority |
|---------|-------------|----------|
| **Live Events Integration** | Sync with MetaDJ live streams | High |
| **Spatial Audio** | 3D audio positioning for immersive listening | Medium |
| **Cross-Platform Sync** | Unified experience across devices | Medium |
| **API Access** | Developer API for third-party integrations | Low |

---

## Backend & Quality

- **Coverage Reporting** — `test:coverage` scripts were removed temporarily. Coverage will return once `@vitest/coverage-v8` is reintroduced to the toolchain.
- **Object Storage Secrets** — MUSIC/VISUALS bucket IDs now require explicit configuration; fallbacks are dev-only.
- **Logging Webhook** — `/api/log` allows Replit preview hosts but still requires `LOGGING_CLIENT_KEY` and HTTPS webhooks before forwarding logs.
- **Stripe Integration** — Implementation ready pending business requirements finalization (see `stripe-integration-spec.md`)
- **Vercel AI SDK v6 (Beta)** — Track the beta release; plan integration once production-ready and stable.

---

## How to Use This Document

- Treat each bullet as a live contract: if a feature is listed here, it is not yet in production even if code scaffolding exists.
- Update this roadmap whenever staged functionality changes scope, crosses the finish line, or gains a public milestone.
- Cross-reference the relevant spec (e.g., `docs/features/wisdom-system.md`, `README.md`, `CHANGELOG.md`) for implementation details.
