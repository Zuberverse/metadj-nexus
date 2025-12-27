/**
 * Mobile Keyboard Hook Tests
 *
 * Tests for virtual keyboard detection on mobile devices.
 */

import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useMobileKeyboard } from '@/hooks/use-mobile-keyboard'

describe('useMobileKeyboard', () => {
  let originalInnerHeight: number
  let originalVisualViewport: VisualViewport | null
  let mockVisualViewport: {
    height: number
    offsetTop: number
    addEventListener: ReturnType<typeof vi.fn>
    removeEventListener: ReturnType<typeof vi.fn>
  } | null

  beforeEach(() => {
    originalInnerHeight = window.innerHeight
    originalVisualViewport = window.visualViewport
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 800,
    })
    mockVisualViewport = null
    Object.defineProperty(window, 'visualViewport', {
      configurable: true,
      get: () => mockVisualViewport,
    })
  })

  afterEach(() => {
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: originalInnerHeight,
    })
    Object.defineProperty(window, 'visualViewport', {
      configurable: true,
      get: () => originalVisualViewport,
    })
  })

  describe('when disabled', () => {
    it('returns zero keyboard height', () => {
      const { result } = renderHook(() => useMobileKeyboard({ enabled: false }))
      expect(result.current.keyboardHeight).toBe(0)
      expect(result.current.isKeyboardVisible).toBe(false)
    })

    it('does not register event listeners', () => {
      const addSpy = vi.spyOn(window, 'addEventListener')
      renderHook(() => useMobileKeyboard({ enabled: false }))
      expect(addSpy).not.toHaveBeenCalledWith('resize', expect.any(Function))
      addSpy.mockRestore()
    })
  })

  describe('with Visual Viewport API', () => {
    beforeEach(() => {
      mockVisualViewport = {
        height: 800,
        offsetTop: 0,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }
    })

    it('initially shows no keyboard', () => {
      const { result } = renderHook(() => useMobileKeyboard())
      expect(result.current.keyboardHeight).toBe(0)
      expect(result.current.isKeyboardVisible).toBe(false)
    })

    it('detects keyboard when viewport shrinks', () => {
      const { result, rerender } = renderHook(() => useMobileKeyboard())

      // Simulate keyboard opening (viewport shrinks)
      act(() => {
        mockVisualViewport!.height = 500
        // Trigger the resize event handler
        const resizeHandler = mockVisualViewport!.addEventListener.mock.calls.find(
          (call) => call[0] === 'resize'
        )?.[1]
        if (resizeHandler) resizeHandler()
      })

      rerender()
      expect(result.current.keyboardHeight).toBe(300)
      expect(result.current.isKeyboardVisible).toBe(true)
    })

    it('registers viewport event listeners', () => {
      renderHook(() => useMobileKeyboard())
      expect(mockVisualViewport!.addEventListener).toHaveBeenCalledWith(
        'resize',
        expect.any(Function)
      )
      expect(mockVisualViewport!.addEventListener).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function)
      )
    })

    it('cleans up listeners on unmount', () => {
      const { unmount } = renderHook(() => useMobileKeyboard())
      unmount()
      expect(mockVisualViewport!.removeEventListener).toHaveBeenCalledWith(
        'resize',
        expect.any(Function)
      )
      expect(mockVisualViewport!.removeEventListener).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function)
      )
    })
  })

  describe('fallback mode (no Visual Viewport)', () => {
    beforeEach(() => {
      mockVisualViewport = null
    })

    it('initially shows no keyboard', () => {
      const { result } = renderHook(() => useMobileKeyboard())
      expect(result.current.keyboardHeight).toBe(0)
      expect(result.current.isKeyboardVisible).toBe(false)
    })

    it('registers window resize listener', () => {
      const addSpy = vi.spyOn(window, 'addEventListener')
      renderHook(() => useMobileKeyboard())
      expect(addSpy).toHaveBeenCalledWith('resize', expect.any(Function))
      addSpy.mockRestore()
    })

    it('registers orientationchange listener', () => {
      const addSpy = vi.spyOn(window, 'addEventListener')
      renderHook(() => useMobileKeyboard())
      expect(addSpy).toHaveBeenCalledWith('orientationchange', expect.any(Function))
      addSpy.mockRestore()
    })

    it('cleans up listeners on unmount', () => {
      const removeSpy = vi.spyOn(window, 'removeEventListener')
      const { unmount } = renderHook(() => useMobileKeyboard())
      unmount()
      expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function))
      expect(removeSpy).toHaveBeenCalledWith('orientationchange', expect.any(Function))
      removeSpy.mockRestore()
    })
  })

  describe('enabled toggle', () => {
    it('resets state when disabled', () => {
      const { result, rerender } = renderHook(
        ({ enabled }) => useMobileKeyboard({ enabled }),
        { initialProps: { enabled: true } }
      )

      // Simulate keyboard state
      expect(result.current.keyboardHeight).toBe(0)

      // Disable
      rerender({ enabled: false })
      expect(result.current.keyboardHeight).toBe(0)
      expect(result.current.isKeyboardVisible).toBe(false)
    })
  })

  describe('default options', () => {
    it('defaults to enabled', () => {
      const addSpy = vi.spyOn(window, 'addEventListener')
      renderHook(() => useMobileKeyboard())
      expect(addSpy).toHaveBeenCalled()
      addSpy.mockRestore()
    })

    it('accepts empty options object', () => {
      const { result } = renderHook(() => useMobileKeyboard({}))
      expect(result.current.keyboardHeight).toBe(0)
    })

    it('accepts no options', () => {
      const { result } = renderHook(() => useMobileKeyboard())
      expect(result.current.keyboardHeight).toBe(0)
    })
  })
})
