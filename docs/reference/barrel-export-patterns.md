# Barrel Export Patterns

> Centralized module export patterns for clean, consistent imports.

**Last Modified**: 2025-12-19 20:50 EST

## Overview

Barrel exports are `index.ts` files that re-export module contents, enabling cleaner imports across the codebase. Instead of importing from specific files, consumers import from the directory.

```typescript
// Without barrel exports
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'

// With barrel exports
import { Button, Card, Modal } from '@/components/ui'
```

## Benefits

1. **Clean imports** — Single import statement for multiple exports
2. **Encapsulation** — Hide internal file structure from consumers
3. **Refactoring safety** — Move files around without breaking imports
4. **Discoverability** — Clear API surface for each module

## When to Use Barrel Exports

| Scenario | Use Barrel Export |
|----------|-------------------|
| Directory with 3+ related components | Yes |
| Shared UI component library | Yes |
| Domain-specific utilities | Yes |
| Single-file modules | No |
| Deeply nested implementation details | No |

## Implementation Pattern

### Basic Barrel Export

```typescript
// src/components/cinema/visualizers/index.ts
/**
 * Visualizers barrel export
 *
 * Centralizes all 3D visualizer component exports for the Cinema experience.
 */

export { BlackHole } from './BlackHole'
export { Cosmos } from './Cosmos'
export { DiscoBall } from './DiscoBall'
export { EightBitAdventure } from './EightBitAdventure'
export { PixelParadise } from './PixelParadise'
export { SpaceTravel } from './SpaceTravel'
export { SynthwaveHorizon } from './SynthwaveHorizon'
```

### Barrel with Type Exports

```typescript
// src/lib/validation/index.ts
/**
 * Validation utilities barrel export
 */

// Schemas and types
export {
  trackSchema,
  collectionSchema,
  type Track,
  type Collection,
  type CollectionType,
} from './schemas'

// Validation functions
export {
  validateTrack,
  validateTracks,
  safeValidateTrack,
} from './schemas'

// Error formatting
export { formatZodError, formatZodErrorString } from './format'
```

### Barrel with Re-exports from Subdirectories

```typescript
// src/components/cinema/index.ts
// Cinema components barrel export
export { CinemaDreamControls } from './CinemaDreamControls'
export { CinemaOverlay } from './CinemaOverlay'
export { Visualizer2D } from './Visualizer2D'
export { Visualizer3D } from './Visualizer3D'

// Re-export all visualizers from subdirectory
export * from './visualizers'
```

## Active Barrel Exports

The following barrel exports are currently implemented:

| Module | Path | Contents |
|--------|------|----------|
| **UI Components** | `src/components/ui/index.ts` | Button, Card, Modal, Toast, EmptyState, ErrorBoundary, etc. |
| **Cinema Components** | `src/components/cinema/index.ts` | Cinema controls, overlays, visualizers |
| **Visualizers** | `src/components/cinema/visualizers/index.ts` | All 7 Three.js visualizer components |
| **Validation** | `src/lib/validation/index.ts` | Zod schemas, types, validation functions |
| **Playlists** | `src/lib/playlists/index.ts` | Playlist CRUD, validation, limit warnings |
| **Contexts** | `src/contexts/index.ts` | All React context providers |
| **Daydream** | `src/lib/daydream/index.ts` | Daydream AI video generation utilities |

## Naming Conventions

Per `docs/NAMING-CONVENTIONS.md`:

- **Barrel files**: Always `index.ts`
- **Component files**: PascalCase (e.g., `Button.tsx`)
- **Utility files**: kebab-case (e.g., `format-time.ts`)
- **Directory names**: kebab-case (e.g., `src/components/ui/`)

## Import Path Configuration

Barrel exports work with the `@/` path alias configured in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

This enables:
```typescript
import { Button, Card } from '@/components/ui'
import { validateTrack, type Track } from '@/lib/validation'
```

## Best Practices

### Do

- Include JSDoc comments explaining the barrel's purpose
- Export types alongside runtime exports
- Use named exports for clarity
- Group related exports in the barrel file
- Re-export from subdirectories when hierarchy makes sense

### Don't

- Create circular dependencies between barrels
- Export internal implementation details
- Mix unrelated modules in a single barrel
- Create barrels for single-file modules
- Use `export *` without considering what's exposed

## Adding a New Barrel Export

1. Create `index.ts` in the directory
2. Add JSDoc header explaining the module
3. Export all public API members
4. Export relevant types
5. Update this documentation

## Related Documentation

- [Naming Conventions](../NAMING-CONVENTIONS.md) — File naming standards
- [Component Architecture](../architecture/component-architecture.md) — Component organization
- [Code-to-Docs Map](./code-to-docs-map.md) — Complete codebase mapping
