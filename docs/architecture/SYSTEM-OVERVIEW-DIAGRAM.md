# MetaDJ Nexus System Overview

**Last Modified**: 2026-01-14 19:59 EST

Visual system overview showing all major subsystems and their relationships.

---

## High-Level System Architecture

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                              METADJ NEXUS                                       ║
║                         NextJS 16 + React 19 App                               ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                                  ║
║  ┌────────────────────────────────────────────────────────────────────────┐   ║
║  │                         PRESENTATION LAYER                              │   ║
║  │                                                                          │   ║
║  │   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐              │   ║
║  │   │   HUB    │  │  CINEMA  │  │  WISDOM  │  │ METADJAI │              │   ║
║  │   │  Music   │  │  Videos  │  │ Insights │  │ AI Chat  │              │   ║
║  │   │ Browser  │  │Visualizer│  │ Explorer │  │ Assistant│              │   ║
║  │   └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘              │   ║
║  │        │             │             │             │                      │   ║
║  │        └──────────┬──┴─────────────┴──┬──────────┘                      │   ║
║  │                   │                    │                                 │   ║
║  │   ┌───────────────┴────────────────────┴───────────────┐               │   ║
║  │   │           HomePageClient (Orchestrator)            │               │   ║
║  │   │   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ │               │   ║
║  │   │   │ Player  │ │ Queue   │ │  UI     │ │ Toast   │ │               │   ║
║  │   │   │ Context │ │ Context │ │ Context │ │ Context │ │               │   ║
║  │   │   └─────────┘ └─────────┘ └─────────┘ └─────────┘ │               │   ║
║  │   └─────────────────────────────────────────────────────┘               │   ║
║  └────────────────────────────────────────────────────────────────────────┘   ║
║                                      │                                          ║
║                                      ▼                                          ║
║  ┌────────────────────────────────────────────────────────────────────────┐   ║
║  │                            HOOK LAYER                                   │   ║
║  │                                                                          │   ║
║  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐       │   ║
║  │  │   Audio    │  │  Cinema    │  │  Search    │  │  Keyboard  │       │   ║
║  │  │  Playback  │  │  Controls  │  │  Filters   │  │  Shortcuts │       │   ║
║  │  └────────────┘  └────────────┘  └────────────┘  └────────────┘       │   ║
║  │                                                                          │   ║
║  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐       │   ║
║  │  │   Queue    │  │  Swipe     │  │  Panel     │  │  Focus     │       │   ║
║  │  │ Operations │  │  Gesture   │  │  Position  │  │   Trap     │       │   ║
║  │  └────────────┘  └────────────┘  └────────────┘  └────────────┘       │   ║
║  └────────────────────────────────────────────────────────────────────────┘   ║
║                                      │                                          ║
║                                      ▼                                          ║
║  ┌────────────────────────────────────────────────────────────────────────┐   ║
║  │                            API LAYER                                    │   ║
║  │                                                                          │   ║
║  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐     │   ║
║  │  │  /api/audio/*    │  │  /api/video/*    │  │  /api/metadjai/* │     │   ║
║  │  │  Audio Streaming │  │  Video Streaming │  │  AI Chat/Voice   │     │   ║
║  │  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘     │   ║
║  │           │                      │                      │               │   ║
║  │  ┌────────┴──────────────────────┴──────────────────────┴─────────┐   │   ║
║  │  │                    Rate Limiting (Redis)                        │   │   ║
║  │  │  - IP-based limits    - Circuit breaker   - Media throttling   │   │   ║
║  │  └─────────────────────────────────────────────────────────────────┘   │   ║
║  │                                                                          │   ║
║  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐     │   ║
║  │  │  /api/wisdom     │  │  /api/daydream/* │  │  /api/health     │     │   ║
║  │  │  Wisdom Content  │  │  Dream Engine    │  │  Health Check    │     │   ║
║  │  └──────────────────┘  └──────────────────┘  └──────────────────┘     │   ║
║  └────────────────────────────────────────────────────────────────────────┘   ║
║                                      │                                          ║
╠══════════════════════════════════════╪══════════════════════════════════════════╣
║                          EXTERNAL SERVICES                                       ║
║                                      │                                          ║
║  ┌──────────────────┐  ┌─────────────┴─────────────┐  ┌──────────────────┐   ║
║  │  CLOUDFLARE R2   │  │      AI PROVIDERS          │  │  LIVEPEER       │   ║
║  │                   │  │                            │  │  (Daydream)     │   ║
║  │  ├─ R2 Bucket    │  │  ├─ OpenAI (Primary)       │  │                  │   ║
║  │  │   music/ +    │  │  │   - GPT-4o-mini         │  │  ├─ WHIP Stream │   ║
║  │  │   visuals/    │  │  │   - Whisper (STT)       │  │  │   Ingestion  │   ║
║  │  │               │  │  │                         │  │  │               │   ║
║  │  ├─ Audio Files  │  │  ├─ Anthropic (Fallback)   │  │  ├─ StreamDiff  │   ║
║  │  │   mp3 files   │  │  │   - Claude 3.5          │  │  │   Processing │   ║
║  │  │               │  │  │                         │  │  │               │   ║
║  │  ├─ Video Files  │  │  │                         │  │  │               │   ║
║  │  │   mp4/webm    │  │  │                         │  │  │               │   ║
║  │  └───────────────┘  │  └─────────────────────────│  └───────────────┘   ║
║                         │  └─────────────────────────│  └───────────────┘   ║
║                         │                            │                        ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

---

## Data Flow: Music Playback

```
┌──────────┐    ┌─────────────┐    ┌──────────────┐    ┌──────────────┐
│  User    │───▶│ AudioPlayer │───▶│ /api/audio/* │───▶│ Cloudflare   │
│  Click   │    │ Component   │    │ Route Handler│    │ R2           │
└──────────┘    └─────────────┘    └──────────────┘    └──────────────┘
                       │                   │
                       ▼                   ▼
                ┌──────────────┐    ┌──────────────┐
                │ Web Audio    │    │ Rate Limiter │
                │ Analyzer     │    │ (200/min)    │
                └──────────────┘    └──────────────┘
                       │
                       ▼
                ┌──────────────┐
                │ Visualizer   │
                │ (Cinema/Hub) │
                └──────────────┘
```

---

## Data Flow: AI Chat (MetaDJai)

```
┌──────────┐    ┌─────────────┐    ┌──────────────┐    ┌──────────────┐
│  User    │───▶│ MetaDJai    │───▶│ /api/metadjai│───▶│ OpenAI       │
│  Message │    │ Chat Panel  │    │ /stream      │    │ GPT-4o-mini  │
└──────────┘    └─────────────┘    └──────────────┘    └──────────────┘
                       │                   │                   │
                       │                   ▼                   ▼
                       │            ┌──────────────┐    ┌──────────────┐
                       │            │ Rate Limiter │    │ Anthropic    │
                       │            │ (10req/min)  │    │ (Fallback)   │
                       │            └──────────────┘    └──────────────┘
                       │                   │
                       ▼                   ▼
                ┌──────────────┐    ┌──────────────┐
                │ Tool Calling │◀───│ Circuit      │
                │ (Search, Nav)│    │ Breaker      │
                └──────────────┘    └──────────────┘
```

---

## Data Flow: Daydream (Real-Time AI Video)

```
┌──────────┐    ┌─────────────┐    ┌──────────────┐    ┌──────────────┐
│  Webcam  │───▶│ WHIP Client │───▶│ /api/daydream│───▶│ Livepeer     │
│  Input   │    │ (WebRTC)    │    │ /streams     │    │ Daydream API │
└──────────┘    └─────────────┘    └──────────────┘    └──────────────┘
                       │                   │                   │
                       │                   ▼                   ▼
                       │            ┌──────────────┐    ┌──────────────┐
                       │            │ Stream       │    │ StreamDiff   │
                       │            │ Session Mgmt │    │ Processing   │
                       │            └──────────────┘    └──────────────┘
                       │                                       │
                       ▼                                       ▼
                ┌──────────────┐                        ┌──────────────┐
                │ Preview      │◀───────────────────────│ Output       │
                │ Surface      │                        │ Stream       │
                └──────────────┘                        └──────────────┘
```

---

## Security Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                        SECURITY STACK                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Layer 1: Content Security Policy                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ CSP Headers (src/proxy.ts entrypoint)                    │   │
│  │ - Nonce-based script execution                           │   │
│  │ - Restricted media sources                               │   │
│  │ - Frame ancestors protection                             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Layer 2: Rate Limiting                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Redis-backed Rate Limiter                                │   │
│  │ - IP fingerprinting (SHA-256)                            │   │
│  │ - Route-specific limits                                  │   │
│  │ - Circuit breaker for AI                                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Layer 3: Input Validation                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Zod Schemas + Request Size Limits                        │   │
│  │ - Path sanitization for media routes                     │   │
│  │ - JSON body validation                                   │   │
│  │ - Request size enforcement (10KB-12MB by route)          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Related Documentation

- [Component Architecture](./component-architecture.md) - Detailed component hierarchy
- [Storage Architecture](./STORAGE-ARCHITECTURE-DIAGRAM.md) - Media streaming critical path
- [AI Resilience Patterns](./AI-RESILIENCE-PATTERNS.md) - Circuit breaker and failover
- [Data Architecture](./data-architecture.md) - Music metadata structure

---

**Navigation**: [Architecture Index](./README.md) | [Features](../features/README.md) | [API Reference](../API.md)
