import { useEffect } from 'react';

interface KeyboardShortcutsProps {
  onPlayPause?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onVolumeUp?: () => void;
  onVolumeDown?: () => void;
  onMute?: () => void;
  onShowHelp?: () => void;
  onShuffle?: () => void;
  onRepeat?: () => void;
  onFocusSearch?: () => void;
  enabled?: boolean;
  /**
   * When true, most shortcuts require Ctrl/Cmd modifier for WCAG 2.1.4 compliance.
   * This prevents conflicts with screen reader commands.
   * Default: true
   */
  requireModifiers?: boolean;
}

/**
 * Keyboard shortcuts for audio playback and navigation (WCAG 2.1.4 compliant)
 *
 * With modifiers (default - screen reader safe):
 * - Ctrl/Cmd + Space: Play/Pause
 * - Ctrl/Cmd + Arrow Right: Next track
 * - Ctrl/Cmd + Arrow Left: Previous track
 * - Ctrl/Cmd + Arrow Up: Volume up
 * - Ctrl/Cmd + Arrow Down: Volume down
 * - Ctrl/Cmd + M: Mute/Unmute
 * - Ctrl/Cmd + N: Next track (alternative)
 * - Ctrl/Cmd + P: Previous track (alternative)
 * - Ctrl/Cmd + S: Toggle shuffle
 * - Ctrl/Cmd + R: Cycle repeat mode
 * - Ctrl/Cmd + /: Focus search
 * - ?: Show keyboard shortcuts help (always works without modifier)
 *
 * Without modifiers (compatibility mode):
 * - Space: Play/Pause
 * - Arrow keys: Navigation/Volume
 * - Single letters: Actions
 */
function isEditableTarget(element: EventTarget | null): boolean {
  if (!element || !(element instanceof Element)) {
    return false;
  }

  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLSelectElement
  ) {
    return true;
  }

  if ('isContentEditable' in element && (element as HTMLElement).isContentEditable) {
    return true;
  }

  const attr = typeof element.getAttribute === 'function' ? element.getAttribute('contenteditable') : null;
  if (attr !== null && attr !== 'false') {
    return true;
  }

  if (typeof element.closest === 'function') {
    const editableAncestor = element.closest('[contenteditable="true"]');
    if (editableAncestor) {
      return true;
    }
  }

  return false;
}

export function useKeyboardShortcuts({
  onPlayPause,
  onNext,
  onPrevious,
  onVolumeUp,
  onVolumeDown,
  onMute,
  onShowHelp,
  onShuffle,
  onRepeat,
  onFocusSearch,
  enabled = true,
  requireModifiers = true,
}: KeyboardShortcutsProps) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in editable fields. Some events bubble
      // from window, so also fall back to document.activeElement.
      const target = e.target;
      const activeElement = typeof document !== 'undefined' ? document.activeElement : null;

      if (isEditableTarget(target) || isEditableTarget(activeElement)) {
        return;
      }

      // Check for modifier key (Ctrl on Windows/Linux, Cmd on Mac)
      const hasModifier = e.ctrlKey || e.metaKey;

      // Help shortcut always works without modifier
      if (e.key === '?') {
        e.preventDefault();
        onShowHelp?.();
        return;
      }

      // If requireModifiers is true, most shortcuts need Ctrl/Cmd (WCAG 2.1.4)
      if (requireModifiers && !hasModifier) {
        return;
      }

      switch (e.key) {
        case ' ': // Spacebar
          e.preventDefault();
          onPlayPause?.();
          break;
        case 'ArrowRight':
          e.preventDefault();
          onNext?.();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          onPrevious?.();
          break;
        case 'ArrowUp':
          e.preventDefault();
          onVolumeUp?.();
          break;
        case 'ArrowDown':
          e.preventDefault();
          onVolumeDown?.();
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          onMute?.();
          break;
        case 'n':
        case 'N':
          e.preventDefault();
          onNext?.();
          break;
        case 'p':
        case 'P':
          e.preventDefault();
          onPrevious?.();
          break;
        case 's':
        case 'S':
          e.preventDefault();
          onShuffle?.();
          break;
        case 'r':
        case 'R':
          e.preventDefault();
          onRepeat?.();
          break;
        case '/':
          e.preventDefault();
          onFocusSearch?.();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, requireModifiers, onPlayPause, onNext, onPrevious, onVolumeUp, onVolumeDown, onMute, onShowHelp, onShuffle, onRepeat, onFocusSearch]);
}
