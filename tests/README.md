# MetaDJ Nexus Test Suite

**Last Modified**: 2025-12-19 21:04 EST

Automated tests for MetaDJ Nexus, focused on behavior, accessibility, and safety. Keep the suite comprehensive but not complicated: test user-facing outcomes and core logic, avoid brittle implementation details.

## Quick Start

```bash
# Run full suite (includes track validation via pretest)
npm test

# Watch mode
npm run test:watch

# Coverage report (writes ./coverage)
npm run test:coverage

# API-focused subset
npm run test:api
```

## What We Test

- **Components** (`tests/components/`): UI behavior + a11y-critical attributes
- **Accessibility** (`tests/accessibility/`): WCAG 2.1 AA checks for core UI patterns
- **Hooks** (`tests/hooks/`): playback/queue/cinema logic and edge cases
- **Contexts** (`tests/contexts/`): provider state + integration
- **Lib** (`tests/lib/`): pure logic (music repository, filtering, utilities)
- **API** (`tests/api/`): route validation + security safeguards
- **Validation** (`tests/validation/`): schema validation for data integrity

## Quality Gate (Build)

```bash
npm run prebuild  # lint → type-check → test
npm run build     # only succeeds if prebuild passes
```

## Conventions

- Tests live in `tests/` (don’t add tests under `src/`).
- Prefer behavior over implementation details (React Testing Library patterns).
- Avoid flaky timing-dependent tests; use fake timers only when needed.
- Shared setup and browser mocks live in `tests/setup.ts`.

## CI

GitHub Actions runs lint/type-check/tests on PRs and mainline; see `.github/workflows/`.
