# AI Resilience Patterns

**Last Modified**: 2025-12-19 18:34 EST

MetaDJai implements a comprehensive resilience architecture to ensure reliable AI responses despite provider issues, rate limits, and network failures.

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                     MetaDJai API Route                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐   ┌─────────────────────────────────────┐   ┌────────────────┐  │
│  │  Rate Limiter   │ → │ Circuit Breaker (GPT/Gemini/Claude/  │ → │ Failover Router│  │
│  │ (In-mem/Redis)  │   │ Grok)                               │   │ + Retry/Timeout│  │
│  └─────────────────┘   └─────────────────────────────────────┘   └────────────────┘  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                        ┌──────────────────┐
                        │ Provider Router  │
                        └──────────────────┘
                          │      │      │      │
                          ▼      ▼      ▼      ▼
                    ┌──────────┐ ┌──────────┐ ┌──────────────┐ ┌──────────┐
                    │  OpenAI  │ │  Google  │ │  Anthropic   │ │   xAI    │
                    │  (GPT)   │ │ (Gemini) │ │  (Claude)    │ │  (Grok)  │
                    └──────────┘ └──────────┘ └──────────────┘ └──────────┘
                              ▼
                        ┌──────────┐
                        │  Error   │
                        │ Handler  │
                        └──────────┘
```

## Components

### 1. Rate Limiter

**Location**: `src/lib/ai/rate-limiter.ts`

Prevents abuse and manages API costs through tiered rate limiting.

#### Limits

| Type | Window | Limit | Burst Prevention |
|------|--------|-------|------------------|
| Chat | 5 minutes | 20 messages | 500ms minimum |
| Transcription | 5 minutes | 5 requests | 500ms minimum |

#### Modes

**In-Memory (Default)**
- Used for single-instance deployments (Replit)
- Resets on server restart
- No external dependencies
- `checkRateLimitDistributed()` falls back to in-memory when Upstash is not configured

```typescript
import { checkRateLimitDistributed, updateRateLimit } from '@/lib/ai/rate-limiter'

const result = await checkRateLimitDistributed(clientId, isFingerprint)
if (!result.allowed) {
  return Response.json({ error: 'Rate limited' }, { status: 429 })
}
// Process request...
updateRateLimit(clientId) // No-op for Upstash; required for in-memory fallback
```

**Distributed (Upstash Redis)**
- Enabled when `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set
- Persistent across restarts
- Consistent across serverless instances
- Enforces burst limits across instances via Upstash fixed-window limiter

```typescript
import { checkRateLimitDistributed } from '@/lib/ai/rate-limiter'

const result = await checkRateLimitDistributed(clientId)
if (!result.allowed) {
  return Response.json({ error: 'Rate limited' }, { status: 429 })
}
```

#### Client Identification

1. **Session Cookie** (priority): `metadjai-session` cookie for per-device isolation
2. **Fingerprint** (fallback): SHA-256 hash of 12+ request headers for first-time users

### 2. Circuit Breaker

**Location**: `src/lib/ai/circuit-breaker.ts`

Prevents cascading failures by tracking provider health (OpenAI, Google, Anthropic, xAI) and temporarily disabling requests when unhealthy.

#### States

```
CLOSED ──[3 failures]──→ OPEN ──[60s]──→ HALF-OPEN ──[success]──→ CLOSED
                           ↑                  │
                           └──[failure]───────┘
```

| State | Behavior |
|-------|----------|
| CLOSED | Normal operation, all requests pass through |
| OPEN | Provider disabled, requests fail fast |
| HALF-OPEN | Testing recovery, single request allowed |

#### Configuration

| Parameter | Value | Description |
|-----------|-------|-------------|
| `FAILURE_THRESHOLD` | 3 | Consecutive failures before opening |
| `RECOVERY_TIME_MS` | 60,000 | Time before half-open test |
| `SUCCESS_RESET_TIME_MS` | 300,000 | Time to reset failure count after success |

#### Usage

```typescript
import {
  isCircuitOpen,
  recordFailure,
  recordSuccess,
  getProviderHealth
} from '@/lib/ai/circuit-breaker'

// Check before making request
if (isCircuitOpen(provider)) {
  // Fail fast when selected provider is unhealthy
}

try {
  const result = await providerRequest()
  recordSuccess(provider)
} catch (error) {
  recordFailure(provider, error.message)
}

// Monitoring dashboard
const health = getProviderHealth()
// { openai: { healthy: true, failures: 0 }, anthropic: { healthy: true, failures: 0 } }
```

#### Error Classification

Only provider-level errors trigger the circuit breaker:

| Triggers Circuit | Does NOT Trigger |
|------------------|------------------|
| Network timeouts | Invalid API key (401) |
| Rate limits (429) | Bad request (400) |
| Service unavailable (502, 503) | Content policy violations |
| Connection refused | Validation errors |

### 3. Failover (Active)

**Location**: `src/lib/ai/failover.ts`

Failover is active for MetaDJai. When the selected provider returns a provider-level error (or its circuit is open), the system falls back to the mapped fallback provider if configured.

**Key Behaviors**:
- Controlled by `AI_FAILOVER_ENABLED` (defaults to enabled)
- Fallback priority: GPT → Gemini → Claude → Grok (skips the active provider)
- Skips failover for non-provider errors (validation, policy, or timeouts)

## Integration Example

Complete flow for a MetaDJai chat request:

```typescript
// 1. Rate limiting
const clientId = getClientIdentifier(request)
const rateResult = await checkRateLimitDistributed(clientId.id)
if (!rateResult.allowed) {
  return Response.json(buildRateLimitResponse(rateResult.remainingMs), { status: 429 })
}

// 2. Provider selection + failover toggle
const preferredProvider = payload.modelPreference ?? 'openai'
const failoverEnabled = isFailoverEnabled() && isFailoverAvailable(preferredProvider)

// 3. Circuit breaker check (selected provider)
if (isCircuitOpen(preferredProvider)) {
  if (!failoverEnabled) {
    return Response.json({ error: 'AI temporarily unavailable' }, { status: 503 })
  }
}

// 4. Execute request with fallback
try {
  const result = await streamText({
    model: getModel(preferredProvider),
    messages,
    // ...tools, prompt, stopWhen
  })
  recordSuccess(preferredProvider)
  updateRateLimit(clientId.id)
  return result
} catch (error) {
  recordFailure(preferredProvider, error instanceof Error ? error.message : 'unknown error')

  if (failoverEnabled && isProviderError(error)) {
    const fallbackInfo = getFallbackModelInfo(preferredProvider) // GPT -> Gemini -> Claude -> Grok
    if (!fallbackInfo?.available) {
      return Response.json({ error: 'AI temporarily unavailable' }, { status: 503 })
    }
    const result = await streamText({
      model: getModel(fallbackInfo.provider),
      messages,
      // ...tools, prompt, stopWhen
    })
    recordSuccess(fallbackInfo.provider)
    updateRateLimit(clientId.id)
    return result
  }

  return Response.json({ error: 'Failed to process request' }, { status: 500 })
}
```

## Monitoring

### Provider Health API

```typescript
import { getProviderHealth } from '@/lib/ai/circuit-breaker'

// Returns:
{
  openai: {
    healthy: true,
    failures: 0,
    totalFailures: 5,
    lastFailure: 1702617600000,
    lastSuccess: 1702620000000
  },
  anthropic: {
    healthy: true,
    failures: 0,
    totalFailures: 1,
    lastFailure: 1702617600000,
    lastSuccess: 1702620000000
  },
  google: {
    healthy: true,
    failures: 0,
    totalFailures: 0,
    lastFailure: 0,
    lastSuccess: 1702620000000
  },
  xai: {
    healthy: true,
    failures: 0,
    totalFailures: 0,
    lastFailure: 0,
    lastSuccess: 1702620000000
  }
}
```

### Rate Limit Mode

```typescript
import { getRateLimitMode } from '@/lib/ai/rate-limiter'

const mode = getRateLimitMode() // 'distributed' | 'in-memory'
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | No | OpenAI provider key (required for GPT + web search) |
| `GOOGLE_API_KEY` | No | Google provider key (required for Gemini) |
| `ANTHROPIC_API_KEY` | No | Anthropic provider key (required for Claude) |
| `XAI_API_KEY` | No | xAI provider key (required for Grok) |
| `AI_PROVIDER` | No | Default provider when request does not specify (`openai`, `google`, `anthropic`, `xai`) |
| `AI_FAILOVER_ENABLED` | No | Toggle provider failover (defaults to enabled) |
| `UPSTASH_REDIS_REST_URL` | No | Distributed rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | No | Distributed rate limiting |

## Related Documentation

- [Vercel AI SDK Integration](../features/vercel-ai-sdk-integration.md)
- [MetaDJai Knowledge Base](../features/metadjai-knowledge-base.md)
- [Error Tracking](../operations/ERROR-TRACKING.md)

---

**Navigation**: [Back to Architecture](./README.md) | [Back to docs/](../README.md)
