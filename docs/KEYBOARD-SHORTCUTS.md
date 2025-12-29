# MetaDJ Nexus Keyboard Shortcuts

**Complete keyboard navigation reference for efficient control**

**Last Modified**: 2025-12-29 15:30 EST

## WCAG 2.1.4 Compliance

MetaDJ Nexus requires **modifier keys** (Ctrl on Windows/Linux, Cmd on Mac) for most keyboard shortcuts. This is not arbitrary—it is mandated by **WCAG 2.1.4: Character Key Shortcuts**.

### Why Modifiers Are Required

Single-character shortcuts (like pressing "N" alone) conflict with:
- **Screen reader commands**: Users navigating with JAWS, NVDA, or VoiceOver rely on single keys
- **Speech input software**: Voice control users may accidentally trigger shortcuts
- **Browser shortcuts**: Some browsers use single keys for navigation

By requiring Ctrl/Cmd modifiers, we ensure keyboard shortcuts work harmoniously with assistive technologies.

### Modifier Keys Reference

| Platform | Modifier Key |
|----------|-------------|
| Windows / Linux | **Ctrl** |
| macOS | **Cmd** (Command) |

All shortcuts below showing `Ctrl/Cmd` mean: hold Ctrl (Windows/Linux) or Cmd (Mac) while pressing the key.

## Global Controls

### Playback (Require Ctrl/Cmd)

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + Space` | Play / Pause |
| `Ctrl/Cmd + Arrow Left` | Previous track (or restart if >3 seconds played) |
| `Ctrl/Cmd + Arrow Right` | Next track |
| `Ctrl/Cmd + Arrow Up` | Increase volume (+10%) |
| `Ctrl/Cmd + Arrow Down` | Decrease volume (-10%) |

### Track Navigation (Require Ctrl/Cmd)

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + N` | Next track (alternative) |
| `Ctrl/Cmd + P` | Previous track (alternative) |
| `Ctrl/Cmd + S` | Toggle shuffle mode |
| `Ctrl/Cmd + R` | Cycle repeat mode (Queue > Track > Off) |
| `Ctrl/Cmd + M` | Toggle mute |

### Application Navigation

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + /` | Focus search input |
| `Ctrl/Cmd + K` | Focus search input (alternative) |
| `Ctrl/Cmd + J` | Toggle MetaDJai chat panel |
| `?` | Show keyboard shortcuts help (no modifier required) |
| `Esc` | Close modals, overlays, or exit fullscreen |
| `Tab` | Navigate to next interactive element |
| `Shift + Tab` | Navigate to previous interactive element |

### Skip Links

| Shortcut | Action |
|----------|--------|
| `Tab` (on page load) | Access skip navigation link to jump directly to main content |

## Shortcuts That Work Without Modifiers

A small set of shortcuts are designed to work without Ctrl/Cmd because they don't conflict with assistive technology commands:

| Shortcut | Action | Reason |
|----------|--------|--------|
| `?` | Show keyboard shortcuts help | Shift-modified character, unlikely to conflict |
| `Esc` | Close modals/overlays | Standard escape behavior across all applications |
| `Tab` / `Shift+Tab` | Focus navigation | Standard browser behavior |

## Cinema (Visual Experience)

When the Cinema visual experience is active:

| Shortcut | Action |
|----------|--------|
| `Esc` | Exit fullscreen Cinema mode |
| `Ctrl/Cmd + Space` | Play / Pause (audio continues synced) |

**Note**: Cinema view maintains the same modifier requirements for consistency and accessibility.

## Accessibility Features

### Screen Reader Support
All interactive elements include proper ARIA labels and live region announcements for state changes. The modifier-key requirement ensures shortcuts don't interfere with screen reader navigation.

### Focus Management
- Visible focus indicators on all interactive elements
- Focus trap in modals and overlays
- Logical tab order throughout the application

### Keyboard-Only Navigation
Complete application functionality is accessible without mouse interaction. All controls are reachable via Tab navigation.

## Context-Aware Behavior

### Shortcuts Disabled When
- Typing in search input
- Typing in text fields
- Focus is within chat/messaging interfaces
- Modal dialogs are open (except Esc to close and ? for help)

### Shortcuts Active When
- Browsing music collections
- Viewing track details
- Queue management interface
- Cinema/visual experience

## Quick Reference Card

```
PLAYBACK (Ctrl/Cmd +)    NAVIGATION (Ctrl/Cmd +)    NO MODIFIER
Space    Play/Pause      / or K Focus Search        ?      Help
Left     Prev Track      J      MetaDJai Toggle     Esc    Close
Right    Next Track      N      Next Track          Tab    Focus Next
Up       Vol Up          P      Prev Track
Down     Vol Down        S      Shuffle
                         R      Repeat
                         M      Mute
```

## Pro Tips

1. **Seamless Queue Management**: Use `Ctrl/Cmd + N` and `Ctrl/Cmd + P` to navigate your queue without touching the mouse
2. **Quick Volume Adjustments**: Hold `Ctrl/Cmd + Arrow Up/Down` for continuous volume changes
3. **Instant Mute**: Hit `Ctrl/Cmd + M` for quick privacy during interruptions
4. **Search Anywhere**: Press `Ctrl/Cmd + K` (or `Ctrl/Cmd + /`) from any page to instantly focus the search box
5. **Quick AI Access**: Press `Ctrl/Cmd + J` to toggle MetaDJai chat from anywhere
6. **Cinema Control**: Use `Esc` to quickly exit fullscreen visual experiences
7. **Help Anytime**: Press `?` to view shortcuts without needing Ctrl/Cmd

## Mobile Considerations

Keyboard shortcuts are optimized for desktop use. On mobile devices:
- Touch gestures provide primary control
- On-screen controls remain accessible
- External keyboards connected to tablets support full shortcuts with the same modifier requirements

## Direct Mode (Development Only)

The `useKeyboardShortcuts` hook supports a `requireModifiers: false` option for development/testing purposes. This direct mode allows single-key shortcuts but **should never be used in production** as it violates WCAG 2.1.4 compliance.

## Reporting Issues

If a keyboard shortcut isn't working as expected, please check:
1. You're holding the correct modifier key (Ctrl on Windows/Linux, Cmd on Mac)
2. Focus is not in a text input field
3. No modal or overlay is currently open (except shortcuts that work in modals)
4. Browser is not intercepting the shortcut for its own use

For accessibility concerns or keyboard navigation issues, please report through the standard feedback channels.

---

**Remember**: Press `?` anytime to view this help within the application!
