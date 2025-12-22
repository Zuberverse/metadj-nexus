# E2E Test Coverage — Gap Note

**Last Modified**: 2025-12-19 21:20 EST

MetaDJ Nexus relies on unit/integration + accessibility suites (Vitest/jsdom). There are currently **no browser-based end-to-end tests** (tool TBD) covering full user journeys (navigation + playback + AI + cinema). Coverage reports exist, but they are not CI gates yet.

When to add E2E:
- After next major release or before public launch with heavier traffic.
- To guard regressions across: landing → search → play/queue → cinema → MetaDJai interactions.
- When adding auth/payments or multi-step flows.

If adding:
1) Use a browser automation runner with seeded data (collections/tracks JSON) and mocked media/AI to avoid network costs.
2) Cover sanity flows: load hub, search and play track, queue add/reorder, toggle cinema, invoke MetaDJai prompt with mocked tool response, verify a11y landmarks.
3) Run headless in CI on push/PR; gate deployments optionally.

Until then, rely on current integration + accessibility tests and manual smoke checks.
