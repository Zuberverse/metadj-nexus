# MetaDJai System

> **AI creative companion for MetaDJ Nexus**

**Last Modified**: 2026-02-02 16:57 EST

**Feature**: MetaDJai — AI Creative Companion
**Status**: Active (v0.8+)
**Main Component**: `src/components/metadjai/MetaDjAiChat.tsx`

## Table of Contents

- [Overview](#overview)
- [Persona & Voice](#persona--voice)
- [Architecture](#architecture)
- [Multi-Provider System](#multi-provider-system)
- [Tools System](#tools-system)
- [Active Control (Proposals)](#active-control-proposals)
- [Knowledge Base](#knowledge-base)
- [Voice Input](#voice-input)
- [Personalization](#personalization)
- [Conversation Management](#conversation-management)
- [Streaming & Message Flow](#streaming--message-flow)
- [Context Awareness](#context-awareness)
- [Resilience Patterns](#resilience-patterns)
- [Safety & Validation](#safety--validation)
- [Rate Limiting](#rate-limiting)
- [Configuration Reference](#configuration-reference)
- [API Endpoints](#api-endpoints)
- [Mobile Behavior](#mobile-behavior)
- [Integration Points](#integration-points)
- [Related Documentation](#related-documentation)
- [Future Enhancements](#future-enhancements)

---

## Overview

MetaDJai is the AI creative companion embedded in MetaDJ Nexus. It provides conversational interaction with music-first context awareness, multi-provider AI support with automatic failover, a hybrid knowledge base, interactive proposals for platform actions, voice input, and deep personalization — all within a glassmorphism-styled chat interface that adapts between panel, overlay, and fullscreen modes.

MetaDJai is context-aware of what the user is listening to, viewing, and doing within the platform. It can search the music catalog, answer questions about MetaDJ and Zuberant, provide platform help, generate recommendations, retrieve Wisdom content, and propose platform actions (playback changes, queue updates, playlist creation, navigation) — always requiring explicit user confirmation before executing.

## Persona & Voice

MetaDJai's persona is defined in `src/lib/ai/meta-dj-ai-prompt.ts` (705 lines).

### Identity

- AI companion built by Z, surfaced inside MetaDJ Nexus
- An AI extension — transparent about being AI, never pretending otherwise
- Conversational and direct, never clinical or corporate

### Voice Spectrum

MetaDJai blends five internal voice modes depending on context:

| Mode | When Used |
|------|-----------|
| **Friendly Explainer** | Platform help, how-to questions |
| **Philosopher-Essayist** | Vision, philosophy, creative principles |
| **Systems Architect** | Technical questions, architecture |
| **Creative Director** | Music, aesthetics, creative workflows |
| **Mentor-Leader** | Encouragement, feedback, growth |

These are blended internally — there is no user-facing mode toggle.

### Language Rules

- Direct and concrete with named trade-offs
- Avoids corporate clichés, hashtags, and hype language
- Uses "I/me" for the MetaDJai persona, not the user
- References only tracks present in the current context
- Scene-specific personality hints when Cinema is active (e.g., cosmic language for Cosmos, gravity metaphors for Black Hole)

## Architecture

### Component Structure

```
src/components/metadjai/
├── MetaDjAiChat.tsx              # Main chat panel (overlay/panel/fullscreen)
├── MetaDjAiChatInput.tsx         # Text + voice input
├── MetaDjAiMessageList.tsx       # Message display with streaming
├── MetaDjAiMessageItem.tsx       # Individual message rendering (markdown)
├── MetaDjAiWelcomeState.tsx      # Welcome screen with starter prompts
├── MetaDjAiPersonalizePopover.tsx # Personalization settings
├── MetaDjAiHistoryPopover.tsx    # Conversation history browser
├── MetaDjAiActionsPopover.tsx    # Quick action suggestions
├── MetaDjAiStreamingSkeleton.tsx # Loading state indicator
└── curated-actions.ts            # Quick action definitions
```

### Hooks

```
src/hooks/metadjai/
├── use-metadjai.ts               # Main orchestrator (send, stream, fallback)
├── use-metadjai-rate-limit.ts    # Client-side rate limiting
└── use-chat-scroll.ts            # Scroll management during streaming

src/hooks/home/
├── use-metadjai-context.ts       # Context provider/consumer
├── use-metadjai-chat-props.ts    # Props composition from player/UI state
└── use-metadjai-panel-controls.ts # Panel open/close logic
```

### AI Library

```
src/lib/ai/
├── meta-dj-ai-prompt.ts          # System prompt & persona (705 lines)
├── providers.ts                   # Provider registry & failover chain
├── failover.ts                    # Failover orchestration
├── circuit-breaker.ts             # Circuit breaker state machine
├── config.ts                      # AI configuration
├── validation.ts                  # Input sanitization & validation
├── spending-alerts.ts             # Cost tracking & alerts
├── cache.ts                       # Response caching (LRU)
├── stream-recovery.ts             # Stream error recovery
└── tools/
    ├── index.ts                   # Tool registry barrel
    ├── catalog.ts                 # searchCatalog, getCatalogSummary
    ├── knowledge.ts               # getZuberantContext (hybrid search)
    ├── platform-help.ts           # getPlatformHelp
    ├── recommendations.ts         # getRecommendations
    ├── wisdom.ts                  # getWisdomContent
    ├── feedback.ts                # openFeedback
    ├── proposals.ts               # proposePlayback, proposeQueueSet, proposePlaylist, proposeSurface
    ├── provider.ts                # getTools() composer (provider-specific)
    ├── utils.ts                   # Sanitization, fuzzy match, size limits
    ├── music-helpers.ts           # Track/collection resolution
    └── mcp.ts                     # Optional MCP tool integration
```

### Data Flow

```
User Input → ChatInput → use-metadjai hook
  → sanitize & validate → POST /api/metadjai/stream
  → provider resolution → rate limit check → circuit breaker check
  → AI SDK streamText() with tools → SSE response
  → client parses stream → renders tokens → processes tool calls
  → proposals rendered as confirm cards → user confirms → action executes
```

## Multi-Provider System

MetaDJai supports five AI providers with automatic failover.

### Provider Configuration

| Provider | Model | SDK Package |
|----------|-------|-------------|
| **OpenAI** (default) | `gpt-5.2-chat-latest` | `@ai-sdk/openai` |
| **Google** | `gemini-3-flash-preview` | `@ai-sdk/google` |
| **Anthropic** | `claude-haiku-4-5` | `@ai-sdk/anthropic` |
| **xAI** | `grok-4-1-fast-non-reasoning` | `@ai-sdk/xai` |
| **Moonshot/Kimi** | `kimi-k2.5` | `@ai-sdk/openai-compatible` |

### Failover Chain

```
GPT → Gemini → Claude → Grok → Kimi
```

- Failover activates when the current provider fails (network error, rate limit, API error)
- The active provider is skipped in the chain
- Circuit breaker opens after 3 consecutive failures, auto-recovers after 30 seconds
- Configurable via `AI_FAILOVER_ENABLED` (default: `true`)

### Model Selection UI

Users can switch providers via a dropdown in the chat header. The selected model persists in localStorage. Response headers expose the active provider and model:

- `X-MetaDJai-Provider` — Provider used for the response
- `X-MetaDJai-Model` — Model used
- `X-MetaDJai-Used-Fallback` — Whether failover was triggered
- `X-MetaDJai-Cache` — Whether a cached response was returned

### Model Settings (All Providers)

| Setting | Value |
|---------|-------|
| Temperature | 0.7 |
| Max output tokens | 2048 |
| Max tool steps | 3 (or `AI_MAX_TOOL_STEPS`) |

## Tools System

MetaDJai has 12 local tools, plus provider-native `web_search` and optional MCP tools.

### Local Tools

| Tool | Purpose | Key Parameters |
|------|---------|----------------|
| `searchCatalog` | Query music catalog by title/genre/description | `query`, `type` (track/collection/all) |
| `getCatalogSummary` | Overview of all collections, genres, track counts | — |
| `getPlatformHelp` | Contextual help for platform features | `feature` (hub/music/cinema/dream/wisdom/journal/queue/search/metadjai/account/shortcuts/overview) |
| `getRecommendations` | Mood-based track recommendations | `mood`, `energy`, `collection`, `limit` |
| `getZuberantContext` | Hybrid search on knowledge base | `query`, `topic` (metadj/zuberant/ecosystem/philosophy/identity/platform/workflows/all) |
| `getWisdomContent` | Fetch Wisdom articles | `section` (thoughts/guides/reflections), `id` |
| `openFeedback` | Open the feedback modal | `type` (bug/feature/feedback/idea) |
| `proposePlayback` | Propose playback actions | `action` (play/pause/next/prev/queue), `searchQuery` |
| `proposeQueueSet` | Propose queue updates | `trackIds`/`trackTitles`, `mode` (replace/append), `autoplay` |
| `proposePlaylist` | Propose playlist creation | `name`, `trackIds`/`trackTitles`, `queueMode`, `autoplay` |
| `proposeSurface` | Propose UI navigation | `action` (openWisdom/openQueue/focusSearch/openMusicPanel), `tab` |

### Provider-Native Tools

- **`web_search`** — Real-time web search, only available on OpenAI when a direct `OPENAI_API_KEY` is configured

### MCP Tools (Optional)

When `AI_MCP_ENABLED=true`, additional tools from configured MCP servers are loaded via `src/lib/ai/tools/mcp.ts`. This is currently gated to development environments.

### Tool Output Limits

- Max tool result size: **24,000 characters** (`MAX_TOOL_RESULT_SIZE` in `src/lib/ai/tools/utils.ts`)
- Results exceeding the limit are truncated with a metadata flag
- All tool outputs pass through injection pattern filtering and sanitization

## Active Control (Proposals)

MetaDJai never directly controls playback or navigation. Instead, it proposes actions via **confirm cards** that require explicit user confirmation.

### Proposal Types

| Type | Component | Actions |
|------|-----------|---------|
| **Playback** | `proposePlayback` | Play, pause, next, previous, queue a track |
| **Queue Set** | `proposeQueueSet` | Replace or append tracks to the queue |
| **Playlist** | `proposePlaylist` | Create a named playlist from suggested tracks |
| **Surface** | `proposeSurface` | Navigate to Wisdom, Queue, Search, or Music panel |

### Confirm Card Flow

1. MetaDJai calls a proposal tool with the action details
2. The tool returns a structured proposal (validated against Zod schema)
3. The client renders a confirm card in the message stream
4. User clicks **Confirm** → action executes
5. User clicks **Dismiss** → proposal is cancelled

Proposals include a `context` field — brief reasoning displayed on the confirm card explaining why the action was suggested.

### Proposal Limits

- Queue set: max 50 tracks (default 20)
- Playlist: max 50 tracks (default 20)
- Track resolution: by ID or by fuzzy title match against the catalog

## Knowledge Base

MetaDJai retrieves knowledge about MetaDJ, Zuberant, and the broader ecosystem via a hybrid keyword + semantic search system.

### Knowledge Categories

| Category | File | Content |
|----------|------|---------|
| `metadj` | `src/data/knowledge/metadj.json` | Artist identity, creative journey, collections, methodology |
| `zuberant` | `src/data/knowledge/zuberant.json` | Studio identity, philosophy, operations |
| `ecosystem` | `src/data/knowledge/ecosystem.json` | Vision, reality layers, culture, expansion |
| `philosophy` | `src/data/knowledge/philosophy.json` | Compose/orchestrate/conduct, creativity, human-AI |
| `identity` | `src/data/knowledge/identity.json` | Brand voice, visual identity, typography, design |
| `platform` | `src/data/knowledge/platform-features.json` | Feature descriptions and navigation help |
| `workflows` | `src/data/knowledge/workflows.json` | Creative protocols (deep work, ideation, writing) |

### Retrieval Algorithm

1. **Keyword scoring** — Token matching with weighted scoring across title, content, and tags
2. **Semantic boost** (optional) — `text-embedding-3-small` embeddings for similarity scoring when keyword confidence is low
3. **Auto-gating** — Semantic search only activates when keyword results fall below a confidence threshold
4. **Topic filtering** — Optional narrowing to a specific knowledge category
5. **Results** — Up to 5 matches returned, size-limited to ~8k characters total

### Configuration

- `AI_SEMANTIC_SEARCH_MODE` — `auto` (default, gated), `on` (always embed), `off` (keyword-only)
- Embeddings are cached in memory (lazy-initialized on first semantic query)
- No external vector database required — embeddings computed at query time

## Voice Input

MetaDJai supports voice input via browser MediaRecorder and OpenAI transcription.

### Flow

1. User holds the microphone button
2. Browser MediaRecorder captures audio
3. Audio is sent to `POST /api/metadjai/transcribe`
4. OpenAI Audio API transcribes to text
5. Transcribed text populates the chat input

### Specifications

| Setting | Value |
|---------|-------|
| Transcription model | `gpt-4o-mini-transcribe-2025-12-15` (configurable via `OPENAI_TRANSCRIBE_MODEL`) |
| Max audio size | 10 MB |
| Language | English (enforced) |
| Rate limit | 5 transcriptions per 5-minute window |

## Personalization

MetaDJai adapts its responses based on user-configured personalization settings.

### Profile Presets

| Preset | Description |
|--------|-------------|
| **Default** | Balanced conversational style |
| **Creative** | Imaginative, expansive responses |
| **Mentor** | Guiding, structured, educational |
| **DJ** | Music-first, energy-focused |
| **Custom** | User-defined settings |

### Configurable Settings

| Setting | Options | Default |
|---------|---------|---------|
| Response length | Concise / Balanced / Expansive | Balanced |
| Response format | Bullets / Steps / Paragraphs / Mixed | Mixed |
| Tone | Direct / Warm / Visionary / Technical | Warm |
| Display name | Free text (max 100 chars) | — |
| Interests | Free text (max 1500 chars) | — |
| Current projects | Free text (max 1500 chars) | — |
| Custom instructions | Free text (max 1500 chars) | — |

### Persistence

- **Authenticated users**: Personalization syncs to `user_preferences` in Postgres via `PATCH /api/auth/preferences`
- **Unauthenticated users**: Settings stored in localStorage only
- Personalization is injected into the system prompt at request time as a dedicated section

## Conversation Management

MetaDJai supports full conversation lifecycle management for authenticated users.

### Conversation Storage

- Conversations persist to Postgres (`conversations` + `messages` tables)
- Each conversation has a title, status (active/archived), and message history
- Messages include role, content, status, and optional metadata (model, provider, tool usage)

### API Operations

| Operation | Endpoint | Method |
|-----------|----------|--------|
| Create conversation | `/api/metadjai/conversations` | POST |
| List conversations | `/api/metadjai/conversations` | GET |
| Get conversation | `/api/metadjai/conversations/[id]` | GET |
| Update conversation | `/api/metadjai/conversations/[id]` | PATCH |
| Delete conversation | `/api/metadjai/conversations/[id]` | DELETE |
| Get messages | `/api/metadjai/conversations/[id]/messages` | GET |
| Append message | `/api/metadjai/conversations/[id]/messages` | POST |
| Clear messages | `/api/metadjai/conversations/[id]/messages` | DELETE |
| Archive | `/api/metadjai/conversations/[id]/archive` | POST |
| Unarchive | `/api/metadjai/conversations/[id]/unarchive` | POST |
| List archived | `/api/metadjai/conversations/archived` | GET |

### History UI

The History Popover (`MetaDjAiHistoryPopover.tsx`) provides:
- List of active conversations with timestamps
- Archived conversations section
- One-tap conversation switching
- Delete and archive actions
- Search within conversations

## Streaming & Message Flow

MetaDJai uses Server-Sent Events (SSE) for real-time response streaming.

### Streaming Endpoint

`POST /api/metadjai/stream` — Returns an SSE stream using Vercel AI SDK's `toUIMessageStreamResponse()` format.

### Stream Events

```
data: {"type":"text-delta","delta":"..."}   // Progressive token delivery
data: {"type":"tool-call","..."}             // Tool invocation
data: {"type":"tool-result","..."}           // Tool result
data: {"type":"finish","..."}                // Stream complete
```

### Fallback Behavior

If streaming fails (connection error, parse error, timeout), the client automatically falls back to the non-streaming endpoint (`POST /api/metadjai`) which returns a complete JSON response.

### Client Processing

1. `use-metadjai.ts` manages the stream via Vercel AI SDK hooks
2. Tokens are rendered progressively in the message list
3. Tool calls are accumulated and processed
4. Proposals are validated against Zod schemas and rendered as confirm cards
5. Auto-scroll tracks the bottom of the message list during streaming (with manual scroll detection)

## Context Awareness

MetaDJai builds contextual awareness from multiple sources, injected into the system prompt within a managed token budget.

### Context Sources

| Source | Content | Budget Priority |
|--------|---------|-----------------|
| **Now Playing** | Track title, artist, collection | High |
| **Page View** | Active view (collections/cinema/wisdom/journal/search/queue) | High |
| **Cinema Scene** | Active scene name and personality hints | Medium |
| **Wisdom Content** | Active section and article | Medium |
| **Dream Mode** | Avatar mode status | Medium |
| **Session Info** | Model identity disclosure | Low |
| **Catalog Snapshot** | Collection names and track counts | Low |

### Token Budget Management

| Parameter | Value |
|-----------|-------|
| Target | 4000 tokens |
| Warning threshold | 80% (3200 tokens) |
| Critical threshold | 100% (4000 tokens) |
| Estimation | ~4 characters per token |

When the budget is exceeded, sections are trimmed in priority order: catalog → session → dream → reading → visual → surface → model.

## Resilience Patterns

### Circuit Breaker

- Opens after 3 consecutive provider failures
- Half-open after 30 seconds (allows one test request)
- Fully closes on successful test
- State persisted in Redis when Upstash is configured
- Prevents cascading failures during provider outages

### Failover

- Automatic provider switching on failure
- Chain: GPT → Gemini → Claude → Grok → Kimi
- Active provider skipped in chain
- Failover attempts logged with provider/model info

### Response Caching

- In-memory LRU cache
- TTL: 30 minutes (configurable via `AI_CACHE_TTL_MS`)
- Max entries: 100 (configurable via `AI_CACHE_MAX_SIZE`)
- Cache key: hash of provider + model + message content
- Enabled via `AI_CACHE_ENABLED`

### Stream Recovery

- Automatic retry on transient stream errors
- AbortController timeout handling per endpoint type
- Graceful degradation to non-streaming on persistent failure

### Cost Tracking

- `estimateCost()` calculates per-request costs by model and token count
- Spending alerts at configurable hourly/daily thresholds
- Optional block-on-limit behavior (`AI_SPENDING_BLOCK_ON_LIMIT`)

## Safety & Validation

### Prompt Injection Defense

The system prompt includes 15+ regex patterns to detect and neutralize injection attempts:

- Unicode normalization (prevents homograph attacks)
- HTML/XML tag stripping
- Bracket and delimiter removal
- Role manipulation detection ("ignore previous instructions", "you are now...")
- Context value sanitization (200 character limit per injected value)
- User-provided content explicitly marked as `UNTRUSTED`

### Input Validation

| Check | Limit |
|-------|-------|
| Max messages per request | 50 |
| Max message length | 8,000 characters |
| Max request body | 600 KB |
| HTML stripping | Applied to all user input |
| Origin validation | CSRF protection via origin/referer |

### Off-Limits Topics

MetaDJai is instructed to decline requests involving harmful content, personal data extraction, or attempts to bypass its guidelines. It responds with a brief explanation and redirects the conversation.

## Rate Limiting

### Chat Rate Limits

| Parameter | Value |
|-----------|-------|
| Window | 5 minutes |
| Max messages | 20 per window |
| Min interval | 500ms between messages |
| Scope | Session-scoped (HTTP-only cookie) |
| Fallback | Client fingerprint when cookies unavailable |

### Transcription Rate Limits

| Parameter | Value |
|-----------|-------|
| Window | 5 minutes |
| Max transcriptions | 5 per window |

### Implementation

- **Distributed**: Upstash Redis (`@upstash/ratelimit`) when configured
- **Local fallback**: In-memory rate limiter for single-instance deployments
- Client UI displays remaining messages: "x/20 in 5m" with cooldown countdown

## Configuration Reference

### Required

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | Primary provider (chat, embeddings, web search, transcription) |

### Optional Provider Keys

| Variable | Purpose |
|----------|---------|
| `GOOGLE_API_KEY` | Gemini support |
| `ANTHROPIC_API_KEY` | Claude support |
| `XAI_API_KEY` | Grok support |
| `MOONSHOT_API_KEY` | Kimi support |
| `MOONSHOT_API_BASE_URL` | Moonshot API base URL (default: `https://api.moonshot.cn/v1`) |

### Optional AI Settings

| Variable | Default | Purpose |
|----------|---------|---------|
| `AI_PROVIDER` | `openai` | Default provider |
| `PRIMARY_AI_MODEL` | `gpt-5.2-chat-latest` | Override OpenAI model |
| `GOOGLE_AI_MODEL` | `gemini-3-flash-preview` | Override Gemini model |
| `ANTHROPIC_AI_MODEL` | `claude-haiku-4-5` | Override Claude model |
| `XAI_AI_MODEL` | `grok-4-1-fast-non-reasoning` | Override Grok model |
| `MOONSHOT_AI_MODEL` | `kimi-k2.5` | Override Kimi model |
| `OPENAI_TRANSCRIBE_MODEL` | `gpt-4o-mini-transcribe-2025-12-15` | Voice transcription model |
| `AI_FAILOVER_ENABLED` | `true` | Automatic provider failover |
| `AI_CACHE_ENABLED` | `true` (production) | Response caching |
| `AI_CACHE_TTL_MS` | `1800000` (30 min) | Cache time-to-live |
| `AI_CACHE_MAX_SIZE` | `100` | Max cache entries |
| `AI_SEMANTIC_SEARCH_MODE` | `auto` | Knowledge search mode (auto/on/off) |
| `AI_REQUEST_TIMEOUT_MS` | `30000` | Default request timeout |
| `AI_MAX_TOOL_STEPS` | `3` | Max tool invocations per request |
| `AI_MCP_ENABLED` | `false` | MCP tool support (dev-only) |
| `AI_DEVTOOLS_ENABLED` | `false` | AI DevTools middleware (dev-only) |

### Spending Controls

| Variable | Default | Purpose |
|----------|---------|---------|
| `AI_SPENDING_HOURLY_LIMIT` | — | Hourly cost ceiling |
| `AI_SPENDING_DAILY_LIMIT` | — | Daily cost ceiling |
| `AI_SPENDING_WARNING_THRESHOLD` | — | Warning threshold (% of limit) |
| `AI_SPENDING_BLOCK_ON_LIMIT` | `false` | Block requests when limit reached |

## API Endpoints

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/metadjai` | POST | Non-streaming chat (complete JSON response) |
| `/api/metadjai/stream` | POST | Streaming chat (SSE) |
| `/api/metadjai/transcribe` | POST | Voice transcription |
| `/api/metadjai/conversations` | GET, POST | List and create conversations |
| `/api/metadjai/conversations/[id]` | GET, PATCH, DELETE | Manage individual conversations |
| `/api/metadjai/conversations/[id]/messages` | GET, POST, DELETE | Manage messages |
| `/api/metadjai/conversations/[id]/archive` | POST | Archive a conversation |
| `/api/metadjai/conversations/[id]/unarchive` | POST | Restore an archived conversation |
| `/api/metadjai/conversations/archived` | GET | List archived conversations |
| `/api/health/ai` | GET | AI system health (internal) |
| `/api/health/providers` | GET | Provider availability (internal) |

Full request/response schemas are documented in [API.md](../API.md).

## Mobile Behavior

- **Layout**: Full-height overlay (vs. side panel on desktop)
- **Input**: Keyboard-aware positioning, swipe gestures
- **Voice**: MediaRecorder support on iOS Safari 15+ and Android Chrome
- **Scroll**: Touch-optimized auto-scroll during streaming
- **Quick Actions**: Bottom-sheet style action popover

## Integration Points

### Player Context

MetaDJai receives the current playback state: now playing track (title, artist, collection), playback status, and queue contents. This enables music-contextual responses and accurate catalog tool calls.

### Cinema Integration

When Cinema is active, MetaDJai receives the active scene name and adapts its personality with scene-specific language (cosmic for Cosmos, gravity for Black Hole, retro for 8-Bit Adventure, etc.).

### Wisdom Integration

When the user is reading Wisdom content, MetaDJai receives the active section and article. The "Summarize" and "Ask MetaDJai" actions on Wisdom articles open the chat with pre-filled context.

### Feedback System

The `openFeedback` tool dispatches a custom event that opens the platform's feedback modal, bridging the chat interface to the structured feedback form.

### Analytics

MetaDJai tracks `trackActivationFirstChat` for first-time engagement analytics.

## Related Documentation

| Document | Focus |
|----------|-------|
| [Vercel AI SDK Integration](vercel-ai-sdk-integration.md) | Provider architecture, SDK patterns, resilience implementation |
| [MetaDJai Knowledge Base](metadjai-knowledge-base.md) | Knowledge retrieval algorithm, entry format, extension patterns |
| [MetaDJai Skills & MCP Roadmap](metadjai-skills-mcp-roadmap.md) | Future skills system and MCP server integration plans |
| [API Reference](../API.md) | Complete endpoint documentation with request/response schemas |
| [Auth System](../AUTH-SYSTEM.md) | Session management and rate limiting infrastructure |
| [Security](../SECURITY.md) | CSP, input validation, and prompt injection defense |

## Future Enhancements

- **AI DJ Mode** — MetaDJai curates continuous mixes and radio-style flow
- **User Personalization Layer** — Opt-in profile sharing (goals, tastes, projects) for deeper collaboration
- **Vector Store Retrieval** — Persistent vector index (pgvector or managed) when knowledge base outgrows in-memory caching
- **Agentic Multi-Step Tools** — Chain multiple tools/workflows with proposal-and-confirm at each step
- **Muse Board** — Node-based ideation space co-created with MetaDJai
- **Image Generation** — Visual creation via lightweight image models
- **Voice Chat → Video Chat** — Real-time voice conversation, later video presence
- **3D Avatar Exploration** — Embodied MetaDJai avatar for Metaverse sessions
- **MCP Server Integrations** — Memory persistence, Spotify integration, Perplexity deep research
