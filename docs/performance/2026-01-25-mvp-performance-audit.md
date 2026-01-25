# MVP Performance Audit — 2026-01-25

**Last Modified**: 2026-01-25 14:19 EST

## Scope

Pre‑MVP performance pass focused on Cinema mounting behavior, overlay prefetching, and low‑end adaptability.

## Findings

- **Cinema overlay prefetch ran unconditionally** after idle, pulling the heavy chunk on low‑capability devices.
- **Cinema overlay stayed mounted after first open** on all devices, which keeps WebGL resources resident even when the view is closed.
- **Low‑capability tiers already use lazy view mounting**, but Cinema behavior bypassed those limits.

## Changes Implemented

- **Adaptive Cinema prefetch**: only prefetch the Cinema overlay on non‑lazy, desktop‑capable tiers.
- **Adaptive Cinema keep‑mounted**: keep the overlay mounted after first open only on non‑lazy, desktop‑capable tiers; otherwise unmount after close.

## Validation

- Unit tests and E2E smoke tests re‑run after the change set (see testing logs).

## Next Measurements

- Lighthouse run on `/app` (desktop + mobile) with 4x CPU throttling.
- Chrome DevTools Performance trace on Cinema toggle + 3D scene for long‑task detection.
- Bundle analyzer snapshot to validate chunk size impact after additional code‑splitting.

## Follow‑Up Ideas

- Gate Cinema prefetch by explicit user intent (first hover/visit to Cinema nav).
- Profile `HomePageClient` re‑renders during queue/search interactions; memoize hot selectors if needed.
- Add lightweight Web Vitals logging during preview for real‑world baselines.
