import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';

describe('useKeyboardShortcuts', () => {
  const mockHandlers = {
    onPlayPause: vi.fn(),
    onNext: vi.fn(),
    onPrevious: vi.fn(),
    onVolumeUp: vi.fn(),
    onVolumeDown: vi.fn(),
    onMute: vi.fn(),
    onShowHelp: vi.fn(),
  };

  beforeEach(() => {
    // Clear all mocks before each test
    Object.values(mockHandlers).forEach((mock) => mock.mockClear());
  });

  afterEach(() => {
    // Clean up any event listeners
    vi.restoreAllMocks();
  });

  describe('Keyboard Shortcuts (WCAG Mode - with Ctrl/Cmd modifier)', () => {
    it('should call onPlayPause when Ctrl+Space is pressed', () => {
      renderHook(() => useKeyboardShortcuts(mockHandlers));

      const event = new KeyboardEvent('keydown', { key: ' ', ctrlKey: true });
      window.dispatchEvent(event);

      expect(mockHandlers.onPlayPause).toHaveBeenCalledTimes(1);
    });

    it('should call onNext when Ctrl+ArrowRight is pressed', () => {
      renderHook(() => useKeyboardShortcuts(mockHandlers));

      const event = new KeyboardEvent('keydown', { key: 'ArrowRight', ctrlKey: true });
      window.dispatchEvent(event);

      expect(mockHandlers.onNext).toHaveBeenCalledTimes(1);
    });

    it('should call onPrevious when Ctrl+ArrowLeft is pressed', () => {
      renderHook(() => useKeyboardShortcuts(mockHandlers));

      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft', ctrlKey: true });
      window.dispatchEvent(event);

      expect(mockHandlers.onPrevious).toHaveBeenCalledTimes(1);
    });

    it('should call onVolumeUp when Ctrl+ArrowUp is pressed', () => {
      renderHook(() => useKeyboardShortcuts(mockHandlers));

      const event = new KeyboardEvent('keydown', { key: 'ArrowUp', ctrlKey: true });
      window.dispatchEvent(event);

      expect(mockHandlers.onVolumeUp).toHaveBeenCalledTimes(1);
    });

    it('should call onVolumeDown when Ctrl+ArrowDown is pressed', () => {
      renderHook(() => useKeyboardShortcuts(mockHandlers));

      const event = new KeyboardEvent('keydown', { key: 'ArrowDown', ctrlKey: true });
      window.dispatchEvent(event);

      expect(mockHandlers.onVolumeDown).toHaveBeenCalledTimes(1);
    });

    it('should call onMute when Ctrl+M key is pressed', () => {
      renderHook(() => useKeyboardShortcuts(mockHandlers));

      const event = new KeyboardEvent('keydown', { key: 'M', ctrlKey: true });
      window.dispatchEvent(event);

      expect(mockHandlers.onMute).toHaveBeenCalledTimes(1);
    });

    it('should call onMute when Ctrl+m key is pressed (lowercase)', () => {
      renderHook(() => useKeyboardShortcuts(mockHandlers));

      const event = new KeyboardEvent('keydown', { key: 'm', ctrlKey: true });
      window.dispatchEvent(event);

      expect(mockHandlers.onMute).toHaveBeenCalledTimes(1);
    });

    it('should call onShowHelp when ? is pressed (no modifier needed)', () => {
      renderHook(() => useKeyboardShortcuts(mockHandlers));

      const event = new KeyboardEvent('keydown', { key: '?' });
      window.dispatchEvent(event);

      expect(mockHandlers.onShowHelp).toHaveBeenCalledTimes(1);
    });

    it('should NOT trigger shortcuts without Ctrl/Cmd modifier in WCAG mode', () => {
      renderHook(() => useKeyboardShortcuts(mockHandlers));

      const event = new KeyboardEvent('keydown', { key: ' ' });
      window.dispatchEvent(event);

      expect(mockHandlers.onPlayPause).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard Shortcuts (Legacy Mode - no modifier required)', () => {
    it('should call onPlayPause when Space is pressed without modifier', () => {
      renderHook(() => useKeyboardShortcuts({ ...mockHandlers, requireModifiers: false }));

      const event = new KeyboardEvent('keydown', { key: ' ' });
      window.dispatchEvent(event);

      expect(mockHandlers.onPlayPause).toHaveBeenCalledTimes(1);
    });

    it('should call onNext when ArrowRight is pressed without modifier', () => {
      renderHook(() => useKeyboardShortcuts({ ...mockHandlers, requireModifiers: false }));

      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      window.dispatchEvent(event);

      expect(mockHandlers.onNext).toHaveBeenCalledTimes(1);
    });

    it('should call onMute when M key is pressed without modifier', () => {
      renderHook(() => useKeyboardShortcuts({ ...mockHandlers, requireModifiers: false }));

      const event = new KeyboardEvent('keydown', { key: 'M' });
      window.dispatchEvent(event);

      expect(mockHandlers.onMute).toHaveBeenCalledTimes(1);
    });
  });

  describe('Input Field Exception Handling', () => {
    it('should NOT trigger shortcuts when typing in input field', () => {
      renderHook(() => useKeyboardShortcuts(mockHandlers));

      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();

      const event = new KeyboardEvent('keydown', {
        key: ' ',
        ctrlKey: true,
        bubbles: true,
      });
      Object.defineProperty(event, 'target', {
        value: input,
        enumerable: true,
      });
      window.dispatchEvent(event);

      expect(mockHandlers.onPlayPause).not.toHaveBeenCalled();

      document.body.removeChild(input);
    });

    it('should NOT trigger shortcuts when typing in textarea', () => {
      renderHook(() => useKeyboardShortcuts(mockHandlers));

      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);
      textarea.focus();

      const event = new KeyboardEvent('keydown', {
        key: ' ',
        ctrlKey: true,
        bubbles: true,
      });
      Object.defineProperty(event, 'target', {
        value: textarea,
        enumerable: true,
      });
      window.dispatchEvent(event);

      expect(mockHandlers.onPlayPause).not.toHaveBeenCalled();

      document.body.removeChild(textarea);
    });

    it('should NOT trigger shortcuts when typing in select element', () => {
      renderHook(() => useKeyboardShortcuts(mockHandlers));

      const select = document.createElement('select');
      document.body.appendChild(select);
      select.focus();

      const event = new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        ctrlKey: true,
        bubbles: true,
      });
      Object.defineProperty(event, 'target', {
        value: select,
        enumerable: true,
      });
      window.dispatchEvent(event);

      expect(mockHandlers.onVolumeDown).not.toHaveBeenCalled();

      document.body.removeChild(select);
    });

    it('should NOT trigger shortcuts when typing in contenteditable element', () => {
      renderHook(() => useKeyboardShortcuts(mockHandlers));

      const div = document.createElement('div');
      div.contentEditable = 'true';
      div.setAttribute('contenteditable', 'true');
      div.tabIndex = 0;
      document.body.appendChild(div);
      div.focus();

      const event = new KeyboardEvent('keydown', {
        key: ' ',
        ctrlKey: true,
        bubbles: true,
      });
      Object.defineProperty(event, 'target', {
        value: div,
        enumerable: true,
      });
      window.dispatchEvent(event);

      expect(mockHandlers.onPlayPause).not.toHaveBeenCalled();

      document.body.removeChild(div);
    });
  });

  describe('Enabled/Disabled State', () => {
    it('should register shortcuts when enabled is true (default)', () => {
      renderHook(() => useKeyboardShortcuts(mockHandlers));

      const event = new KeyboardEvent('keydown', { key: ' ', ctrlKey: true });
      window.dispatchEvent(event);

      expect(mockHandlers.onPlayPause).toHaveBeenCalledTimes(1);
    });

    it('should NOT register shortcuts when enabled is false', () => {
      renderHook(() =>
        useKeyboardShortcuts({
          ...mockHandlers,
          enabled: false,
        })
      );

      const event = new KeyboardEvent('keydown', { key: ' ', ctrlKey: true });
      window.dispatchEvent(event);

      expect(mockHandlers.onPlayPause).not.toHaveBeenCalled();
    });

    it('should cleanup event listeners on unmount', () => {
      const { unmount } = renderHook(() => useKeyboardShortcuts(mockHandlers));

      unmount();

      const event = new KeyboardEvent('keydown', { key: ' ', ctrlKey: true });
      window.dispatchEvent(event);

      expect(mockHandlers.onPlayPause).not.toHaveBeenCalled();
    });
  });

  describe('Event Prevention', () => {
    it('should prevent default behavior for Space key with modifier', () => {
      renderHook(() => useKeyboardShortcuts(mockHandlers));

      const event = new KeyboardEvent('keydown', { key: ' ', ctrlKey: true });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
      window.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should prevent default behavior for arrow keys with modifier', () => {
      renderHook(() => useKeyboardShortcuts(mockHandlers));

      const keys = ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'];

      keys.forEach((key) => {
        const event = new KeyboardEvent('keydown', { key, ctrlKey: true });
        const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
        window.dispatchEvent(event);

        expect(preventDefaultSpy).toHaveBeenCalled();
      });
    });

    it('should prevent default for ? key without modifier', () => {
      renderHook(() => useKeyboardShortcuts(mockHandlers));

      const event = new KeyboardEvent('keydown', { key: '?' });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
      window.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('Optional Handlers', () => {
    it('should not error when handlers are not provided', () => {
      renderHook(() => useKeyboardShortcuts({}));

      expect(() => {
        const event = new KeyboardEvent('keydown', { key: ' ', ctrlKey: true });
        window.dispatchEvent(event);
      }).not.toThrow();
    });

    it('should only call provided handlers', () => {
      const partialHandlers = {
        onPlayPause: vi.fn(),
        onNext: vi.fn(),
        // Other handlers omitted
      };

      renderHook(() => useKeyboardShortcuts(partialHandlers));

      // Test provided handlers work
      let event = new KeyboardEvent('keydown', { key: ' ', ctrlKey: true });
      window.dispatchEvent(event);
      expect(partialHandlers.onPlayPause).toHaveBeenCalledTimes(1);

      event = new KeyboardEvent('keydown', { key: 'ArrowRight', ctrlKey: true });
      window.dispatchEvent(event);
      expect(partialHandlers.onNext).toHaveBeenCalledTimes(1);

      // Test unprovided handlers don't error
      expect(() => {
        event = new KeyboardEvent('keydown', { key: 'ArrowUp', ctrlKey: true });
        window.dispatchEvent(event);
      }).not.toThrow();
    });
  });

  describe('Modifier Key Support', () => {
    it('should work with metaKey (Cmd on Mac)', () => {
      renderHook(() => useKeyboardShortcuts(mockHandlers));

      const event = new KeyboardEvent('keydown', { key: ' ', metaKey: true });
      window.dispatchEvent(event);

      expect(mockHandlers.onPlayPause).toHaveBeenCalledTimes(1);
    });

    it('should work with ctrlKey (Ctrl on Windows/Linux)', () => {
      renderHook(() => useKeyboardShortcuts(mockHandlers));

      const event = new KeyboardEvent('keydown', { key: ' ', ctrlKey: true });
      window.dispatchEvent(event);

      expect(mockHandlers.onPlayPause).toHaveBeenCalledTimes(1);
    });
  });
});
