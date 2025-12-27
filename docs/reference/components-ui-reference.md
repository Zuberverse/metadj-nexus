# UI Components API Reference

**Last Modified**: 2025-12-20 20:15 EST

## Overview

The MetaDJ Nexus UI component library provides a cohesive set of reusable components designed for the music hub experience. All components follow the MetaDJ visual system with glassmorphism effects, neon accents, and OKLCH color tokens.

**Import Pattern**:
```tsx
import { Button, Card, Modal, Toast } from '@/components/ui';
```

**Design Principles**:
- **Glassmorphism**: Backdrop blur effects with translucent backgrounds
- **OKLCH Colors**: Consistent color tokens via CSS custom properties
- **Accessibility First**: WCAG 2.1 AA compliance, keyboard navigation, ARIA attributes
- **Touch-Friendly**: 44px minimum touch targets for mobile interactions
- **Animation**: Smooth transitions with `motion-safe` media query respect

**Design Token System**: All components use the standardized design token system. See **[DESIGN-TOKENS.md](./DESIGN-TOKENS.md)** for complete token documentation including:
- Border radius scale and semantic tokens
- Shadow elevation system
- Typography (tracking) tokens
- Animation duration tokens

---

## Component Index

| Component | Purpose | File |
|-----------|---------|------|
| [Button](#button) | Primary action trigger with variants | `Button.tsx` |
| [IconButton](#iconbutton) | Icon-only circular button | `Button.tsx` |
| [ToggleButton](#togglebutton) | Toggle state button (shuffle, repeat) | `Button.tsx` |
| [Card](#card) | Container with variants and sub-components | `Card.tsx` |
| [Modal](#modal) | Dialog overlay with focus trapping | `Modal.tsx` |
| [ConfirmDialog](#confirmdialog) | Pre-built confirmation modal | `Modal.tsx` |
| [Toast](#toast) | Notification message | `Toast.tsx` |
| [ToastContainer](#toastcontainer) | Toast positioning container | `ToastContainer.tsx` |
| [TrackListItem](#tracklistitem) | Track display row | `TrackListItem.tsx` |
| [TrackOptionsMenu](#trackoptionsmenu) | Track action dropdown | `TrackOptionsMenu.tsx` |
| [PlayingIndicator](#playingindicator) | Animated playback bars | `PlayingIndicator.tsx` |
| [ShareButton](#sharebutton) | Share action with menu | `ShareButton.tsx` |
| [EmptyState](#emptystate) | Empty list/content placeholder | `EmptyState.tsx` |
| [ErrorBoundary](#errorboundary) | Error handling with fallback UI | `ErrorBoundary.tsx` |
| [OfflineIndicator](#offlineindicator) | Offline status banner | `OfflineIndicator.tsx` |
| [Skeleton](#skeleton) | Loading placeholder with shimmer | `Skeleton.tsx` |

---

## Components

### Button

Primary action button with multiple style variants and sizes. Supports loading states, icons, and full accessibility.

**Location**: `src/components/ui/Button.tsx`

#### Props Interface

```typescript
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant */
  variant?: ButtonVariant;
  /** Size preset */
  size?: ButtonSize;
  /** Show loading spinner */
  isLoading?: boolean;
  /** Icon to display before children */
  leftIcon?: ReactNode;
  /** Icon to display after children */
  rightIcon?: ReactNode;
  /** Accessible label for icon-only buttons */
  'aria-label'?: string;
}

type ButtonVariant =
  | 'primary'      // Gradient CTA with neon glow
  | 'secondary'    // Glass background (default)
  | 'accent'       // Toolbar accent for active states
  | 'ghost'        // Transparent
  | 'destructive'; // Red/danger

type ButtonSize =
  | 'xs'       // h-8, px-2.5, text-xs
  | 'sm'       // h-9, px-3, text-sm
  | 'md'       // h-11, px-4, text-sm (default)
  | 'lg'       // h-12, px-6, text-base
  | 'xl'       // h-14, px-8, text-lg
  | 'icon-sm'  // 36px circular (44px touch target)
  | 'icon-md'  // 44px circular
  | 'icon-lg'; // 52px circular
```

#### Default Values

| Prop | Default |
|------|---------|
| `variant` | `'secondary'` |
| `size` | `'md'` |
| `isLoading` | `false` |

#### Usage Examples

```tsx
// Primary CTA button
<Button variant="primary" size="lg">
  Get Started
</Button>

// Button with left icon
<Button leftIcon={<Play className="h-4 w-4" />}>
  Play All
</Button>

// Loading state
<Button isLoading disabled>
  Saving...
</Button>

// Icon-only button (use aria-label)
<Button size="icon-md" aria-label="Settings">
  <Settings className="h-5 w-5" />
</Button>

// Destructive action
<Button variant="destructive" size="sm">
  Delete
</Button>
```

#### Accessibility

- Uses native `<button>` element
- `disabled` state applies `disabled:pointer-events-none disabled:opacity-50`
- Loading state automatically disables button
- Focus ring via `focus-ring-glow` custom class
- Touch manipulation enabled for mobile
- All sizes meet 44px minimum touch target

#### Styling Details

| Variant | Classes |
|---------|---------|
| `primary` | `brand-gradient`, `neon-glow`, white text, scale on hover |
| `secondary` | Glass background, elevated border on hover |
| `accent` | `toolbar-accent`, purple shadow, scale on hover |
| `ghost` | Transparent, glass on hover |
| `destructive` | Red background, red border |

---

### IconButton

Convenience wrapper for icon-only buttons with simplified size API.

**Location**: `src/components/ui/Button.tsx`

#### Props Interface

```typescript
interface IconButtonProps extends Omit<ButtonProps, 'size' | 'leftIcon' | 'rightIcon'> {
  /** Size: sm (36px), md (44px), lg (52px) */
  size?: 'sm' | 'md' | 'lg';
  /** Icon to display */
  icon: ReactNode;
}
```

#### Default Values

| Prop | Default |
|------|---------|
| `size` | `'md'` |

#### Usage Examples

```tsx
// Standard icon button
<IconButton
  icon={<Heart className="h-5 w-5" />}
  aria-label="Like track"
/>

// Small with variant
<IconButton
  size="sm"
  variant="ghost"
  icon={<X className="h-4 w-4" />}
  aria-label="Close"
/>
```

---

### ToggleButton

Button for active/inactive toggle states (shuffle, repeat, favorite).

**Location**: `src/components/ui/Button.tsx`

#### Props Interface

```typescript
interface ToggleButtonProps extends Omit<ButtonProps, 'variant'> {
  /** Whether the toggle is active */
  isActive: boolean;
  /** Active state variant (default: accent) */
  activeVariant?: ButtonVariant;
  /** Inactive state variant (default: secondary) */
  inactiveVariant?: ButtonVariant;
}
```

#### Default Values

| Prop | Default |
|------|---------|
| `activeVariant` | `'accent'` |
| `inactiveVariant` | `'secondary'` |

#### Usage Examples

```tsx
// Shuffle toggle
<ToggleButton
  isActive={isShuffleOn}
  onClick={() => setIsShuffleOn(!isShuffleOn)}
  aria-label={isShuffleOn ? 'Disable shuffle' : 'Enable shuffle'}
>
  <Shuffle className="h-4 w-4" />
</ToggleButton>
```

#### Accessibility

- Automatically sets `aria-pressed={isActive}` for screen readers
- Visual state change indicates toggle status

---

### Card

Container component with glassmorphism styling and multiple variants.

**Location**: `src/components/ui/Card.tsx`

#### Props Interface

```typescript
interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Visual style variant */
  variant?: CardVariant;
  /** Size preset (affects padding and border radius) */
  size?: CardSize;
  /** Add gradient hover effect */
  hoverGradient?: boolean;
  /** Make the card a clickable element (adds button role) */
  asButton?: boolean;
}

type CardVariant =
  | 'default'     // Subtle background with border
  | 'glass'       // Full glassmorphism effect
  | 'elevated'    // Stronger shadow and background
  | 'interactive' // Clickable with hover transforms
  | 'info';       // Information display

type CardSize = 'sm' | 'md' | 'lg' | 'xl';
```

#### Default Values

| Prop | Default |
|------|---------|
| `variant` | `'default'` |
| `size` | `'md'` |
| `hoverGradient` | `false` |
| `asButton` | `false` |

#### Sub-Components

```typescript
// CardHeader - flexbox column container
interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}

// CardTitle - heading with gradient text
interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

// CardDescription - muted paragraph
interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {}

// CardContent - main content area
interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

// CardFooter - action area with gap
interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}
```

#### Usage Examples

```tsx
// Standard card with sub-components
<Card variant="glass" size="lg">
  <CardHeader>
    <CardTitle>Collection Title</CardTitle>
    <CardDescription>12 tracks</CardDescription>
  </CardHeader>
  <CardContent>
    <TrackList tracks={tracks} />
  </CardContent>
  <CardFooter>
    <Button>Play All</Button>
  </CardFooter>
</Card>

// Interactive clickable card
<Card
  variant="interactive"
  asButton
  onClick={() => navigate(`/collection/${id}`)}
>
  <CardContent>Click to view</CardContent>
</Card>
```

#### Accessibility

- `asButton` mode adds `role="button"` and `tabIndex={0}`
- Keyboard activation with Enter or Space when `asButton` is true
- Focus ring via `focus-ring-glow` class

#### Size Styles

| Size | Padding | Border Radius |
|------|---------|---------------|
| `sm` | `p-3` | `rounded-lg` |
| `md` | `p-4` | `rounded-xl` |
| `lg` | `p-6` | `rounded-2xl` |
| `xl` | `p-8` | `rounded-[28px]` |

---

### Modal

Dialog overlay with focus trapping, escape key handling, and scroll locking.

**Location**: `src/components/ui/Modal.tsx`

#### Props Interface

```typescript
interface ModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Modal title (renders in header) */
  title?: string;
  /** Modal content */
  children: ReactNode;
  /** Size preset */
  size?: ModalSize;
  /** Show close button in header */
  showCloseButton?: boolean;
  /** Close when clicking overlay */
  closeOnOverlayClick?: boolean;
  /** Close when pressing Escape */
  closeOnEscape?: boolean;
  /** Additional class name for modal container */
  className?: string;
  /** Additional class name for overlay */
  overlayClassName?: string;
  /** Use gradient border wrapper (premium look) */
  gradientBorder?: boolean;
  /** ARIA description ID */
  'aria-describedby'?: string;
  /** Footer content */
  footer?: ReactNode;
}

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';
```

#### Default Values

| Prop | Default |
|------|---------|
| `size` | `'md'` |
| `showCloseButton` | `true` |
| `closeOnOverlayClick` | `true` |
| `closeOnEscape` | `true` |
| `gradientBorder` | `false` |

#### Usage Examples

```tsx
// Basic modal
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Add to Playlist"
>
  <ModalContent>
    <PlaylistSelector trackId={trackId} />
  </ModalContent>
</Modal>

// Modal with footer actions
<Modal
  isOpen={isOpen}
  onClose={handleClose}
  title="Confirm Action"
  footer={
    <>
      <Button variant="secondary" onClick={handleClose}>Cancel</Button>
      <Button variant="primary" onClick={handleConfirm}>Confirm</Button>
    </>
  }
>
  <ModalContent>
    <p>Are you sure you want to proceed?</p>
  </ModalContent>
</Modal>

// Premium gradient border modal
<Modal
  isOpen={isOpen}
  onClose={handleClose}
  gradientBorder
  size="lg"
>
  <ModalContent>Premium content</ModalContent>
</Modal>
```

#### Accessibility

- `role="dialog"` and `aria-modal="true"`
- `aria-labelledby` auto-linked to title
- Focus trapped within modal via `useFocusTrap` hook
- Escape key closes modal (configurable)
- Body scroll locked via `useBodyScrollLock` hook
- Focus restored to triggering element on close

#### Size Styles

| Size | Max Width |
|------|-----------|
| `sm` | `max-w-md` |
| `md` | `max-w-lg` |
| `lg` | `max-w-3xl` |
| `xl` | `max-w-5xl` |
| `full` | `max-w-[calc(100vw-2rem)]` |

---

### ConfirmDialog

Pre-built confirmation dialog extending Modal.

**Location**: `src/components/ui/Modal.tsx`

#### Props Interface

```typescript
interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
}
```

#### Default Values

| Prop | Default |
|------|---------|
| `confirmText` | `'Confirm'` |
| `cancelText` | `'Cancel'` |
| `variant` | `'default'` |

#### Usage Examples

```tsx
<ConfirmDialog
  isOpen={showDeleteConfirm}
  onClose={() => setShowDeleteConfirm(false)}
  onConfirm={handleDelete}
  title="Delete Playlist"
  message="This action cannot be undone."
  confirmText="Delete"
  variant="destructive"
/>
```

---

### Toast

Individual notification message with auto-dismiss and hover pause.

**Location**: `src/components/ui/Toast.tsx`

#### Props Interface

```typescript
interface ToastProps {
  id: string;
  message: string;
  variant?: ToastVariant;
  duration?: number;
  action?: ToastAction;
  onDismiss: (id: string) => void;
}

interface ToastAction {
  label: string;
  onClick: () => void;
}

type ToastVariant = 'success' | 'error' | 'info' | 'warning';
```

#### Default Values

| Prop | Default |
|------|---------|
| `variant` | `'info'` |
| `duration` | `3000` |

#### Usage Examples

```tsx
// Via ToastContext (recommended)
const { showToast } = useToast();

showToast({
  message: 'Track added to queue',
  variant: 'success',
});

// With undo action
showToast({
  message: 'Playlist deleted',
  variant: 'info',
  action: {
    label: 'Undo',
    onClick: handleUndo,
  },
});
```

#### Accessibility

- `role="status"` for non-urgent notifications
- `aria-live="polite"` for screen reader announcements
- Hover/focus pauses auto-dismiss timer (WCAG 2.2.1 Timing Adjustable)
- Visual ring indicates paused state

#### Variant Styles

| Variant | Background | Icon |
|---------|------------|------|
| `success` | Emerald/10 | CheckCircle |
| `error` | Red/10 | AlertCircle |
| `info` | Purple/10 | Info |
| `warning` | Yellow/10 | AlertTriangle |

---

### ToastContainer

Positioned container for rendering active toasts.

**Location**: `src/components/ui/ToastContainer.tsx`

#### Props Interface

```typescript
// No props - uses ToastContext internally
```

#### Usage

Place once at app root level:

```tsx
// In layout or app root
import { ToastContainer } from '@/components/ui';

export default function RootLayout({ children }) {
  return (
    <ToastProvider>
      {children}
      <ToastContainer />
    </ToastProvider>
  );
}
```

#### Positioning

- Fixed position: bottom-right
- Mobile: Accounts for safe area insets and bottom navigation
- Desktop: `right-6 bottom-6`
- Z-index: 100

#### Accessibility

- `aria-live="polite"` container
- `aria-atomic="false"` to announce individual toasts

---

### TrackListItem

Reusable track display row for lists throughout the app.

**Location**: `src/components/ui/TrackListItem.tsx`

#### Props Interface

```typescript
interface TrackListItemProps {
  /** Track data */
  track: Track;
  /** Whether this track is currently playing (shows animated equalizer) */
  isPlaying?: boolean;
  /** Whether this is the current/highlighted track (visual emphasis) */
  isCurrent?: boolean;
  /** Click handler for playing/selecting the track */
  onPlay?: () => void;
  /** Keyboard handler for accessibility (arrow keys, enter, space) */
  onKeyDown?: (e: KeyboardEvent<HTMLButtonElement>) => void;
  /** Additional actions (buttons) to show on hover/focus */
  actions?: ReactNode;
  /** Queue add handler - shows built-in queue button if provided */
  onQueueAdd?: () => void;
  /** Show share button */
  showShare?: boolean;
  /** Show duration on the right side */
  showDuration?: boolean;
  /** Show collection name in metadata */
  showCollection?: boolean;
  /** Show track number instead of artwork */
  trackNumber?: number;
  /** Additional class name */
  className?: string;
  /** Size variant */
  size?: 'sm' | 'md';
  /** Whether to show the playing indicator animation */
  showPlayingIndicator?: boolean;
  /** Apply collection-specific hover gradient styles */
  useCollectionHover?: boolean;
  /** ARIA role for accessibility */
  role?: 'button' | 'option';
  /** Data attribute for queue item identification */
  dataQueueItem?: string;
}
```

#### Default Values

| Prop | Default |
|------|---------|
| `isPlaying` | `false` |
| `isCurrent` | `false` |
| `showShare` | `false` |
| `showDuration` | `false` |
| `showCollection` | `false` |
| `size` | `'md'` |
| `showPlayingIndicator` | `true` |
| `useCollectionHover` | `false` |
| `role` | `'button'` |

#### Usage Examples

```tsx
// Basic track item
<TrackListItem
  track={track}
  isPlaying={currentTrack?.id === track.id && isPlaying}
  isCurrent={currentTrack?.id === track.id}
  onPlay={() => playTrack(track)}
/>

// With queue add and share
<TrackListItem
  track={track}
  onPlay={() => playTrack(track)}
  onQueueAdd={() => addToQueue(track)}
  showShare
  showDuration
/>

// In a listbox context
<TrackListItem
  track={track}
  role="option"
  onPlay={() => selectTrack(track)}
  onKeyDown={handleArrowNavigation}
/>

// With track number (collection view)
<TrackListItem
  track={track}
  trackNumber={index + 1}
  size="sm"
/>
```

#### Accessibility

- Interactive with `role="button"` or `role="option"`
- `tabIndex={0}` for keyboard focus
- Enter/Space activates play
- `aria-selected` when used as option
- Focus ring via Tailwind focus-visible

#### Size Styles

| Size | Padding | Artwork | Text |
|------|---------|---------|------|
| `sm` | `px-2 py-1.5` | `32px` | `text-xs` |
| `md` | `px-2 py-2` | `40px` | `text-sm` |

---

### TrackOptionsMenu

Dropdown menu for track actions (add to queue, add to playlist).

**Location**: `src/components/ui/TrackOptionsMenu.tsx`

#### Props Interface

```typescript
interface TrackOptionsMenuProps {
  track: Track;
  onQueueAdd?: () => void;
  className?: string;
}
```

#### Usage Examples

```tsx
// With queue action
<TrackOptionsMenu
  track={track}
  onQueueAdd={() => addToQueue(track)}
/>

// Playlist-only mode (no queue button)
<TrackOptionsMenu track={track} />
```

#### Accessibility

- `aria-haspopup="menu"` on trigger
- `aria-expanded` reflects open state
- Escape closes menu or returns from playlist view
- Click outside closes menu
- Focus management on open/close

#### Menu Options

1. **Add to Queue** (when `onQueueAdd` provided)
2. **Add to Playlist** (always available, opens PlaylistSelector)

---

### PlayingIndicator

Animated equalizer bars showing playback state.

**Location**: `src/components/ui/PlayingIndicator.tsx`

#### Props Interface

```typescript
interface PlayingIndicatorProps {
  /** Whether audio is actively playing */
  isPlaying: boolean;
  /** Visual size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Custom className for the container */
  className?: string;
  /** Color of the bars */
  color?: 'white' | 'purple' | 'cyan';
}
```

#### Default Values

| Prop | Default |
|------|---------|
| `size` | `'md'` |
| `color` | `'white'` |

#### Usage Examples

```tsx
// Standard playing indicator
<PlayingIndicator isPlaying={isPlaying} />

// Colored variant
<PlayingIndicator isPlaying={true} color="purple" size="lg" />

// Returns null when not playing
<PlayingIndicator isPlaying={false} /> // Renders nothing
```

#### Accessibility

- `aria-label="Now playing"` when visible
- Animation respects `motion-safe` media query

#### Size Styles

| Size | Height | Bar Width | Gap |
|------|--------|-----------|-----|
| `sm` | `10px` | `2px` | `2px` |
| `md` | `12px` | `2px` | `2px` |
| `lg` | `16px` | `4px` | `4px` |

---

### ShareButton

Share action with native share API support and fallback menu.

**Location**: `src/components/ui/ShareButton.tsx`

#### Props Interface

```typescript
interface ShareButtonProps {
  track?: Track;
  collection?: Collection;
  playlist?: Playlist;
  size?: 'xxs' | 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'icon' | 'button';
  className?: string;
}
```

#### Default Values

| Prop | Default |
|------|---------|
| `size` | `'md'` |
| `variant` | `'icon'` |

#### Usage Examples

```tsx
// Icon-only share
<ShareButton track={track} />

// Button variant with label
<ShareButton
  track={track}
  variant="button"
  size="md"
/>

// Share collection
<ShareButton collection={collection} />

// Share playlist
<ShareButton playlist={playlist} size="sm" />
```

#### Behavior

1. **Mobile**: Triggers native Web Share API
2. **Desktop**: Shows dropdown menu with options:
   - Copy Link (clipboard)
   - Share to X (Twitter)

#### Accessibility

- `aria-label` describes share target
- `aria-expanded` and `aria-haspopup="menu"`
- Menu keyboard navigation (Arrow keys, Home, End)
- Escape closes menu and returns focus to button
- Focus trapped in menu when open

#### Analytics Events

- `share_button_clicked`
- `share_initiated`
- `share_success`
- `share_error`

---

### EmptyState

Placeholder component for empty lists and content areas.

**Location**: `src/components/ui/EmptyState.tsx`

#### Props Interface

```typescript
interface EmptyStateProps {
  /** Icon to display in the rounded container */
  icon: ReactNode;
  /** Main heading text */
  title: string;
  /** Supporting description text or element */
  description?: ReactNode;
  /** Optional action button or content */
  action?: ReactNode;
  /** Additional class name */
  className?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Icon container variant */
  iconVariant?: 'default' | 'elevated' | 'subtle';
}
```

#### Default Values

| Prop | Default |
|------|---------|
| `size` | `'md'` |
| `iconVariant` | `'default'` |

#### Usage Examples

```tsx
// Basic empty state
<EmptyState
  icon={<Music className="h-8 w-8" />}
  title="No tracks in queue"
  description="Add some tracks to get started"
/>

// With action button
<EmptyState
  icon={<ListMusic className="h-8 w-8" />}
  title="No playlists yet"
  description="Create your first playlist to organize your music"
  action={
    <Button variant="primary" onClick={handleCreate}>
      Create Playlist
    </Button>
  }
/>

// Compact variant
<EmptyState
  icon={<Search className="h-5 w-5" />}
  title="No results"
  size="sm"
/>
```

#### Size Styles

| Size | Padding | Icon Container | Title | Description |
|------|---------|----------------|-------|-------------|
| `sm` | `py-6 px-4` | `p-3` | `text-sm` | `text-xs` |
| `md` | `py-8 px-5` | `p-4` | `text-base` | `text-sm` |
| `lg` | `py-12 px-6` | `p-5` | `text-lg` | `text-base` |

#### Icon Variants

| Variant | Style |
|---------|-------|
| `default` | Glass background, elevated border |
| `elevated` | White overlay, stronger shadow |
| `subtle` | Minimal white overlay |

---

### ErrorBoundary

React error boundary for catching JavaScript errors in component trees and displaying fallback UI.

**Location**: `src/components/ui/ErrorBoundary.tsx`

#### Props Interface

```typescript
interface ErrorBoundaryProps {
  /** Child components to wrap */
  children: ReactNode;
  /** Name of the component for error reporting */
  componentName: string;
  /** Optional custom fallback UI */
  fallback?: ReactNode;
  /** Optional callback when error occurs */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  /** Whether to show compact error UI (for smaller components) */
  compact?: boolean;
  /** Maximum retry attempts before showing permanent error state */
  maxRetries?: number;
  /** Callback when user dismisses the error state */
  onClose?: () => void;
}
```

#### Default Values

| Prop | Default |
|------|---------|
| `compact` | `false` |
| `maxRetries` | `undefined` (unlimited) |

#### Usage Examples

```tsx
// Basic usage
<ErrorBoundary componentName="Audio Player">
  <AudioPlayer />
</ErrorBoundary>

// Compact variant for inline components
<ErrorBoundary componentName="Track Info" compact>
  <TrackInfo track={track} />
</ErrorBoundary>

// With retry limit and close handler
<ErrorBoundary
  componentName="Data Loader"
  maxRetries={3}
  onClose={() => setShowComponent(false)}
>
  <DataLoader />
</ErrorBoundary>

// With error callback for monitoring
<ErrorBoundary
  componentName="MetaDJai Chat"
  onError={(error, errorInfo) => {
    logger.error('Chat error', { error, componentStack: errorInfo.componentStack });
  }}
>
  <MetaDJaiChat />
</ErrorBoundary>

// With custom fallback UI
<ErrorBoundary
  componentName="Cinema"
  fallback={<div className="text-sm text-white/70">Cinema is temporarily unavailable.</div>}
>
  <CinemaOverlay {...cinemaProps} />
</ErrorBoundary>
```

#### Retry Behavior

**Unlimited Retries** (when `maxRetries` is undefined):
- First error: "Something went wrong loading this section."
- After retry: "Still having trouble loading. (Attempt N)"
- Users can retry indefinitely

**Limited Retries** (when `maxRetries` is set):
- Attempts 1-N: Standard retry UI with yellow warning icon (AlertCircle)
- After max attempts: Permanent error state with red icon (XCircle)
- Message: "We've tried multiple times but couldn't load this section."
- Retry button hidden; only Close button shown (if `onClose` provided)

#### Error State Styling

**Default Variant**:
- Card with rounded corners (`rounded-2xl`)
- Glassmorphic background (`bg-black/40 backdrop-blur-xl`)
- Yellow warning icon (AlertCircle) for retryable errors
- Red error icon (XCircle) when max retries reached

**Compact Variant**:
- Inline flexbox layout
- Smaller text (`text-sm`)
- Purple underlined retry link
- No card or background

#### Accessibility

- `role="alert"` for error state announcements
- Icon has `aria-hidden="true"` (decorative)
- Retry/Close buttons use native `<button>` elements
- Focus management after retry/close actions

#### Usage Across the Codebase

| Component | Config | File |
|-----------|--------|------|
| Cinema | `componentName="Cinema"` | `MobileShell.tsx`, `DesktopShell.tsx` |
| Left Panel | `componentName="Left Panel"` | `MobileShell.tsx` |
| MetaDJai Chat | `componentName="MetaDJai Chat"` | `RightPanel.tsx`, `MobileShell.tsx` |
| Audio Player | `componentName="Audio Player" compact` | `HomePageClient.tsx` |

#### Specialized Variants

For app-level and modal-specific error handling, see:
- **AppErrorBoundary** (`src/components/error/AppErrorBoundary.tsx`) — Full-page crash handler
- **TrackDetailsModalErrorBoundary** (`src/components/modals/`) — Modal-specific positioning with Suspense

**Related Documentation**: [Error Boundary Patterns](./error-boundary-patterns.md)

---

### OfflineIndicator

Banner displayed when network connectivity is lost.

**Location**: `src/components/ui/OfflineIndicator.tsx`

#### Props Interface

```typescript
// No props - uses useOnlineStatus hook internally
```

#### Usage

Place once at app root level:

```tsx
import { OfflineIndicator } from '@/components/ui';

export default function RootLayout({ children }) {
  return (
    <>
      <OfflineIndicator />
      {children}
    </>
  );
}
```

#### Behavior

- Automatically detects offline state via `Navigator.onLine`
- Renders nothing when online
- Animates in from top when offline
- Memoized component for performance

#### Accessibility

- `role="alert"` for immediate announcement
- `aria-live="assertive"` for priority
- Icon hidden from screen readers (`aria-hidden`)

#### Styling

- Fixed position at viewport top
- Z-index: 200
- Red background with backdrop blur
- Fade + slide animation on appear

---

### Skeleton

Shimmer-effect placeholder components for loading states. Use instead of spinners for better perceived performance.

**Location**: `src/components/ui/Skeleton.tsx`

#### Components

| Component | Purpose |
|-----------|---------|
| `Skeleton` | Base shimmer placeholder (control size via className) |
| `SkeletonText` | Text line placeholder with multi-line support |
| `SkeletonTrackCard` | Track list item placeholder |
| `SkeletonCollectionCard` | Collection card placeholder |
| `SkeletonMessage` | Chat message bubble placeholder |
| `SkeletonWisdomCard` | Wisdom spotlight card placeholder |
| `SkeletonPlayerBar` | Audio player bar placeholder |

#### Props Interface

```typescript
interface SkeletonProps {
  /** Additional CSS classes */
  className?: string;
  /** Whether to animate the shimmer effect (default: true) */
  animate?: boolean;
}

// SkeletonText extends SkeletonProps
interface SkeletonTextProps extends SkeletonProps {
  /** Number of text lines to render */
  lines?: number;
}

// SkeletonMessage extends SkeletonProps
interface SkeletonMessageProps extends SkeletonProps {
  /** Align message to right (user) vs left (assistant) */
  isUser?: boolean;
}
```

#### Usage Examples

```tsx
import {
  Skeleton,
  SkeletonText,
  SkeletonTrackCard,
  SkeletonCollectionCard,
  SkeletonMessage,
  SkeletonWisdomCard,
  SkeletonPlayerBar,
} from '@/components/ui';

// Basic shapes
<Skeleton className="h-4 w-32" />           // Text line
<Skeleton className="h-10 w-10 rounded-full" /> // Avatar circle
<Skeleton className="h-48 w-full rounded-2xl" /> // Card

// Multi-line text
<SkeletonText lines={3} />

// Domain-specific placeholders
<SkeletonTrackCard />      // Track list loading
<SkeletonCollectionCard /> // Collection grid loading
<SkeletonMessage />        // AI chat loading
<SkeletonMessage isUser /> // User message loading
<SkeletonWisdomCard />     // Wisdom spotlight loading
<SkeletonPlayerBar />      // Player bar loading

// Disable animation (e.g., for reduced motion)
<Skeleton className="h-4 w-32" animate={false} />
```

#### Styling

- Base: `bg-white/10 rounded animate-pulse`
- Animation: CSS `animate-pulse` (3s duration)
- Respects `motion-safe` when used with Tailwind's animation utilities
- All components use `aria-hidden="true"` for accessibility

#### Design Rationale

Skeleton loading provides better perceived performance than spinners because:
1. Users see the approximate layout immediately
2. Content appears to "fill in" rather than pop in
3. Reduces layout shift when content loads

---

## Barrel Export

All components are exported from `src/components/ui/index.ts`:

```typescript
// Button
export { Button, IconButton, ToggleButton } from './Button';
export type { ButtonProps, IconButtonProps, ToggleButtonProps, ButtonVariant, ButtonSize } from './Button';

// Card
export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './Card';
export type { CardProps, CardVariant, CardSize } from './Card';

// Modal
export { Modal, ModalContent, ConfirmDialog } from './Modal';
export type { ModalProps, ModalContentProps, ConfirmDialogProps, ModalSize } from './Modal';

// Toast
export { Toast, ToastContainer } from './Toast';
export type { ToastProps, ToastAction } from './Toast';

// Indicators
export { OfflineIndicator, PlayingIndicator } from './';
export type { PlayingIndicatorProps } from './PlayingIndicator';

// TrackListItem
export { TrackListItem } from './TrackListItem';
export type { TrackListItemProps } from './TrackListItem';

// ShareButton
export { ShareButton } from './ShareButton';
export type { ShareButtonProps } from './ShareButton';

// EmptyState
export { EmptyState } from './EmptyState';
export type { EmptyStateProps } from './EmptyState';

// ErrorBoundary
export { ErrorBoundary } from './ErrorBoundary';
export type { ErrorBoundaryProps } from './ErrorBoundary';

// Skeleton loading states
export {
  Skeleton,
  SkeletonText,
  SkeletonTrackCard,
  SkeletonCollectionCard,
  SkeletonMessage,
  SkeletonWisdomCard,
  SkeletonPlayerBar,
} from './Skeleton';
```

---

## Usage Patterns

### Composing Track Lists

```tsx
function TrackList({ tracks, onPlay, onQueueAdd }) {
  if (tracks.length === 0) {
    return (
      <EmptyState
        icon={<Music className="h-8 w-8" />}
        title="No tracks"
        description="This collection is empty"
      />
    );
  }

  return (
    <div className="space-y-1">
      {tracks.map((track) => (
        <TrackListItem
          key={track.id}
          track={track}
          isPlaying={currentTrack?.id === track.id && isPlaying}
          isCurrent={currentTrack?.id === track.id}
          onPlay={() => onPlay(track)}
          onQueueAdd={() => onQueueAdd(track)}
          showShare
        />
      ))}
    </div>
  );
}
```

### Modal with Form

```tsx
function CreatePlaylistModal({ isOpen, onClose, onSubmit }) {
  const [name, setName] = useState('');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Playlist"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => onSubmit(name)}>
            Create
          </Button>
        </>
      }
    >
      <ModalContent>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Playlist name"
          className="w-full rounded-lg bg-white/10 px-4 py-2"
        />
      </ModalContent>
    </Modal>
  );
}
```

### Interactive Cards

```tsx
function CollectionGrid({ collections }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {collections.map((collection) => (
        <Card
          key={collection.id}
          variant="interactive"
          asButton
          onClick={() => navigate(`/collection/${collection.id}`)}
        >
          <CardHeader>
            <CardTitle as="h3">{collection.title}</CardTitle>
            <CardDescription>
              {collection.trackCount} tracks
            </CardDescription>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
```

---

## Accessibility Notes

### General Guidelines

1. **Keyboard Navigation**: All interactive components support keyboard activation (Enter, Space)
2. **Focus Management**: Modals trap focus; menus return focus on close
3. **ARIA Attributes**: Proper roles, states, and properties throughout
4. **Motion Preferences**: Animations respect `prefers-reduced-motion`
5. **Touch Targets**: Minimum 44x44px for all interactive elements
6. **Color Contrast**: OKLCH colors tested for WCAG AA compliance

### Screen Reader Considerations

- Toasts announce via `aria-live="polite"`
- Offline banner uses `aria-live="assertive"`
- Modal titles linked via `aria-labelledby`
- Icon-only buttons require `aria-label`
- Playing state announced via `aria-label="Now playing"`

### Focus Indicators

All interactive elements use the `focus-ring-glow` utility:
- Purple glow ring on focus-visible
- High contrast against dark backgrounds
- Consistent across all components

---

## Related Documentation

- **Hooks Reference**: `docs/reference/hooks-reference.md`
- **Contexts Reference**: `docs/reference/contexts-reference.md`
- **Error Boundary Patterns**: `docs/reference/error-boundary-patterns.md`
- **Barrel Export Patterns**: `docs/reference/barrel-export-patterns.md`
- **Visual Identity Standards**: `1-system/1-context/1-knowledge/9-visual-assets/visual-identity-context-standards.md`
- **Accessibility Validation**: `docs/ACCESSIBILITY-VALIDATION.md`
