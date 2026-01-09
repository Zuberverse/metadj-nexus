# MetaDJ Nexus

## Overview

MetaDJ Nexus is the primary creative hub for MetaDJ—a multi-experience platform combining AI companion chat (MetaDJai), music streaming, wisdom content, and cinema visualizers. Built as a single-route Next.js application, it demonstrates human-AI creative collaboration through high-fidelity audio streaming, immersive visuals, and comprehensive content exploration.

The platform serves as a showcase for MetaDJ's music collections, featuring 320kbps MP3 streaming, 3D audio-reactive visualizers, AI-driven chat with multi-provider support (GPT/Gemini/Claude/Grok), and a local-first journal with speech-to-text.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

- **Framework**: Next.js 16 with Turbopack, React 19, TypeScript
- **Styling**: Tailwind CSS with custom design tokens (glassmorphism, neon accents)
- **Typography**: Cinzel (headings), Poppins (body)
- **Routing**: Single-route experience at `/` with state-driven views (Hub/Cinema/Wisdom/Journal)
- **State Management**: React Context providers (Player, Queue, UI, Toast) with custom hooks
- **3D Graphics**: React Three Fiber with Drei and postprocessing for audio-reactive visualizers

### Backend Architecture

- **API Routes**: Next.js App Router API routes under `/api/`
- **Media Streaming**: Proxy routes for audio (`/api/audio/[...path]`) and video (`/api/video/[...path]`) with range request support
- **AI Integration**: Vercel AI SDK with multi-provider support (OpenAI default, optional Anthropic/Google/xAI)
- **Security**: CSP headers generated per-request in `src/proxy.ts`, rate limiting via Upstash Redis

### Data Layer

- **Static Data**: JSON files for collections (`src/data/collections.json`) and tracks (`src/data/tracks.json`)
- **Rich Content**: TypeScript modules for narratives, scenes, mood channels, wisdom content
- **Media Storage**: Cloudflare R2 (primary) with Replit App Storage fallback
- **No Database**: Currently uses JSON data files; no SQL database configured

### Key Design Decisions

1. **Single-Route Experience**: All views (Hub, Cinema, Wisdom, MetaDJai) render at `/` via state changes rather than URL routing, keeping URLs clean while enabling rich navigation
2. **Collection-First Music Model**: Music is organized into living "collections" that can evolve over time, rather than traditional fixed albums
3. **AI Resilience**: Circuit breaker pattern with failover routing between AI providers, rate limiting, and spending alerts
4. **Security Headers**: All security headers (CSP, CORS, rate limiting) flow through `src/proxy.ts` as the single source of truth

## External Dependencies

### AI Providers
- **OpenAI** (default): GPT models via `@ai-sdk/openai`
- **Anthropic**: Claude models via `@ai-sdk/anthropic`
- **Google**: Gemini models via `@ai-sdk/google`
- **xAI**: Grok models via `@ai-sdk/xai`
- **Vercel AI SDK**: Unified interface for all providers (`ai` package)

### Cloud Services
- **Cloudflare R2**: Primary media file hosting (audio and video)
- **Replit App Storage**: Fallback media hosting (audio and video buckets)
- **Upstash Redis**: Distributed rate limiting and circuit breaker state (optional, falls back to in-memory)

### Key Environment Variables
- `OPENAI_API_KEY`: Required for AI chat functionality
- `STORAGE_PROVIDER`: `r2` (primary) or `replit` (fallback)
- `R2_ACCOUNT_ID`: Cloudflare R2 account ID (required if `STORAGE_PROVIDER=r2`)
- `R2_ACCESS_KEY_ID`: R2 API token access key (required if `STORAGE_PROVIDER=r2`)
- `R2_SECRET_ACCESS_KEY`: R2 API token secret (required if `STORAGE_PROVIDER=r2`)
- `R2_BUCKET`: R2 bucket name (default: `metadj-nexus-media`)
- `MUSIC_BUCKET_ID`: Replit App Storage bucket for audio files (fallback)
- `VISUALS_BUCKET_ID`: Replit App Storage bucket for video files (fallback)
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`: Optional for distributed rate limiting

### Development Tools
- **Vitest**: Unit and integration testing
- **Playwright**: E2E testing across browsers
- **ESLint**: Code linting with zero-warning policy
- **TypeScript**: Strict mode type checking
