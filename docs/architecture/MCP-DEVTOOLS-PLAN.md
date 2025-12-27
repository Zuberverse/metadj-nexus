# MCP + DevTools Integration Plan (Draft)

**Last Modified**: 2025-12-27 14:57 EST
**Status**: Draft (directional, not final)

## Intent

Provide a safe, staged path for adding MCP tools and AI SDK DevTools in MetaDJ Nexus without destabilizing production behavior or user trust.

## Current State

- AI SDK 6 core is live (generateText/streamText, tools, SSE UI streaming).
- MCP is not integrated.
- DevTools is not integrated.

## Guiding Principles

- Local-first: DevTools stays dev-only; production remains clean and deterministic.
- Explicit boundaries: MCP tools require allowlists and clear user-visible context.
- Safety before scale: approvals and guardrails before tool expansion.
- Incremental adoption: start small, validate UX, then widen scope.

## High-Level Plan (No Dates)

### Phase 1: Decisions + Scoping
- Decide which MCP servers are in scope and why.
- Define what data/tool access is acceptable.
- Confirm UX expectations for approvals and transparency.

### Phase 2: DevTools (Local Only)
- Add dev-only instrumentation for debugging and trace inspection.
- Keep disabled outside local development.

### Phase 3: MCP Scaffold (Behind Flags)
- Add MCP client wiring behind feature flags.
- Start with read-only or low-risk tools.
- Capture logs and UX signals before enabling more.

### Phase 4: Gradual Expansion
- Expand MCP tool coverage based on validated workflows.
- Add richer prompts/resources when the UX needs them.
- Maintain explicit consent for any action tools.

## Safety + UX Guardrails

- Use tool approvals for any action or external side effects.
- Keep tool output concise and user-visible when it matters.
- Maintain allowlists for MCP servers and tool categories.
- Log usage for debugging and rollback readiness.

## Open Questions

- Which MCP servers are worth first adoption?
- What user-facing consent model feels right?
- Do we need additional moderation or redaction layers?
- What telemetry is acceptable while preserving privacy?

## Success Criteria (Qualitative)

- Debugging clarity improves without changing prod behavior.
- Users understand when external tools are used.
- No regressions to stream stability or response format.

## References

- `docs/features/vercel-ai-sdk-integration.md`
