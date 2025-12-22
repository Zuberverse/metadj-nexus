# ErrorBoundary Patterns

> React error boundary patterns for graceful error handling.

**Last Modified**: 2025-12-19 20:50 EST

## Overview

Error boundaries catch JavaScript errors in component trees and display fallback UI instead of crashing the entire application. MetaDJ Nexus provides a flexible `ErrorBoundary` component with multiple configuration options.

## Base ErrorBoundary

**Location**: `src/components/ui/ErrorBoundary.tsx`
**Import**: `import { ErrorBoundary } from '@/components/ui'`

### Props Interface

```typescript
interface ErrorBoundaryProps {
  children: ReactNode

  /** Name of the component for error reporting */
  componentName: string

  /** Optional custom fallback UI */
  fallback?: ReactNode

  /** Optional callback when error occurs */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void

  /** Whether to show compact error UI (for smaller components) */
  compact?: boolean

  /** Maximum retry attempts before showing permanent error state */
  maxRetries?: number

  /** Callback when user dismisses the error state */
  onClose?: () => void
}
```

### Basic Usage

```tsx
import { ErrorBoundary } from '@/components/ui'

// Wrap a component that might fail
<ErrorBoundary componentName="Audio Player">
  <AudioPlayer />
</ErrorBoundary>
```

### Compact Variant

For inline components where a full error card would be too large:

```tsx
<ErrorBoundary componentName="Track Info" compact>
  <TrackInfo track={track} />
</ErrorBoundary>
```

**Compact UI**: Shows a single-line error message with inline retry link.

### With Retry Limit

Prevent infinite retry loops by limiting attempts:

```tsx
<ErrorBoundary
  componentName="Data Loader"
  maxRetries={3}
  onClose={() => setShowComponent(false)}
>
  <DataLoader />
</ErrorBoundary>
```

**Behavior**:
- Users can retry up to `maxRetries` times
- After limit reached, shows permanent error state with red icon
- If `onClose` provided, shows Close button to dismiss

### With Custom Fallback

Provide entirely custom error UI:

```tsx
<ErrorBoundary
  componentName="Cinema"
  fallback={<div className="text-sm text-white/70">Cinema is temporarily unavailable.</div>}
>
  <CinemaOverlay {...cinemaProps} />
</ErrorBoundary>
```

### With Error Callback

Log errors or send to monitoring service:

```tsx
<ErrorBoundary
  componentName="MetaDJai Chat"
  onError={(error, errorInfo) => {
    logger.error('Chat error', { error, componentStack: errorInfo.componentStack })
    trackError('chat_crash', error)
  }}
>
  <MetaDJaiChat />
</ErrorBoundary>
```

## Retry Behavior

### Unlimited Retries (Default)

When `maxRetries` is undefined, users can retry indefinitely:
- First error: "Something went wrong loading this section."
- After retry: "Still having trouble loading. (Attempt 2)"
- After more retries: "Still having trouble loading. (Attempt N)"

### Limited Retries

When `maxRetries` is set (e.g., `maxRetries={3}`):
- Attempts 1-3: Standard retry UI with yellow warning icon
- After 3 failed attempts: Permanent error state with red icon
- Message: "We've tried multiple times but couldn't load this section."
- Retry button hidden; only Close button shown (if `onClose` provided)

## Specialized Variants

### AppErrorBoundary

**Location**: `src/components/error/AppErrorBoundary.tsx`

App-level crash handler for unrecoverable errors. Wraps the entire application.

**Differences from base**:
- Full-page error UI with branded styling
- Uses `window.location.reload()` instead of state reset
- Shows technical details in development mode
- Custom messaging: "Signal Interrupted"

```tsx
// In layout.tsx
<AppErrorBoundary>
  {children}
</AppErrorBoundary>
```

**When to use**: Only at the app root. Do not use for component-level errors.

### TrackDetailsModalErrorBoundary

**Location**: `src/components/modals/TrackDetailsModalErrorBoundary.tsx`

Specialized error boundary for the TrackDetailsModal.

**Differences from base**:
- Modal-specific positioning (fixed bottom with safe-area-inset)
- Built-in Suspense wrapper for lazy-loaded content
- Custom radiant-panel styling matching modal design
- Fixed `maxRetries` of 3

```tsx
<TrackDetailsModalErrorBoundary onClose={() => setSelectedTrack(null)}>
  <TrackDetailsModal track={selectedTrack} />
</TrackDetailsModalErrorBoundary>
```

**When to use**: Only for TrackDetailsModal. For other modals, use base ErrorBoundary with custom fallback.

## Usage Across the Codebase

| Component | ErrorBoundary Config | File |
|-----------|---------------------|------|
| Cinema | `componentName="Cinema"` | `MobileShell.tsx`, `DesktopShell.tsx` |
| Left Panel | `componentName="Left Panel"` | `MobileShell.tsx` |
| MetaDJai Chat | `componentName="MetaDJai Chat"` | `RightPanel.tsx`, `MobileShell.tsx` |
| Audio Player | `componentName="Audio Player" compact` | `HomePageClient.tsx` |
| Track Details | `TrackDetailsModalErrorBoundary` | `ModalOrchestrator.tsx` |

## Error State Styling

### Default Variant
- Card with rounded corners (`rounded-2xl`)
- Glassmorphic background (`bg-black/40 backdrop-blur-xl`)
- Yellow warning icon (AlertCircle)
- Red error icon when max retries reached (XCircle)

### Compact Variant
- Inline flexbox layout
- Smaller text (`text-sm`)
- Purple underlined retry link
- No card or background

## Testing Error Boundaries

```tsx
// In development, trigger an error to test
const BrokenComponent = () => {
  throw new Error('Test error')
}

<ErrorBoundary componentName="Test">
  <BrokenComponent />
</ErrorBoundary>
```

## Best Practices

### Do
- Wrap major feature sections in ErrorBoundary
- Use descriptive `componentName` for debugging
- Provide `onError` callback for error tracking
- Use `compact` for inline/small components
- Set `maxRetries` for data-fetching components

### Don't
- Wrap every small component (too granular)
- Use ErrorBoundary for expected errors (use try/catch instead)
- Forget to test error states in development
- Use AppErrorBoundary for anything other than app root

## Related Documentation

- [Component UI Reference](./components-ui-reference.md) — Full UI component documentation
- [Barrel Export Patterns](./barrel-export-patterns.md) — Import patterns
- [UI Visual System](../features/ui-visual-system.md) — Visual design standards
