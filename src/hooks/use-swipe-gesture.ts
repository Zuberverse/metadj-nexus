import { useEffect, useRef, RefObject } from 'react';

interface SwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  /** Minimum distance in pixels to trigger a swipe (default: 50) */
  minSwipeDistance?: number;
  /** Maximum perpendicular movement allowed (default: 100) */
  maxCrossAxisDistance?: number;
  /** Maximum time in ms for a valid swipe (default: 500) */
  maxSwipeTime?: number;
  /** Minimum velocity in px/ms to trigger a fast swipe with reduced distance (default: 0.5) */
  minVelocity?: number;
}

/**
 * Custom hook for detecting swipe gestures on touch devices
 *
 * @param elementRef - Reference to the element to attach swipe listeners
 * @param options - Swipe configuration options
 *
 * Usage:
 * ```typescript
 * const playerRef = useRef<HTMLDivElement>(null);
 * useSwipeGesture(playerRef, {
 *   onSwipeLeft: handleNext,
 *   onSwipeRight: handlePrevious,
 *   onSwipeDown: handleDismiss,
 *   minSwipeDistance: 50,
 *   maxCrossAxisDistance: 100
 * });
 * ```
 */
export function useSwipeGesture<T extends HTMLElement = HTMLElement>(
  elementRef: RefObject<T | null>,
  options: SwipeGestureOptions
) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    minSwipeDistance = 50,
    maxCrossAxisDistance = 100,
    maxSwipeTime = 500,
    minVelocity = 0.5, // px per ms - fast swipes can have reduced distance requirement
  } = options;

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Only track single-finger touches
      if (e.touches.length !== 1) {
        touchStartRef.current = null;
        return;
      }

      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current || e.changedTouches.length !== 1) {
        touchStartRef.current = null;
        return;
      }

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const deltaTime = Date.now() - touchStartRef.current.time;

      // Reset start position
      touchStartRef.current = null;

      // Ignore if swipe is too slow
      if (deltaTime > maxSwipeTime) return;

      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      // Calculate velocity (px/ms) - fast swipes can have reduced distance requirement
      const velocity = Math.max(absX, absY) / Math.max(deltaTime, 1);
      const isFastSwipe = velocity >= minVelocity;

      // Fast swipes need only 60% of minimum distance
      const effectiveMinDistance = isFastSwipe ? minSwipeDistance * 0.6 : minSwipeDistance;

      // Determine if this is a horizontal or vertical swipe
      const isHorizontalSwipe = absX > absY;

      if (isHorizontalSwipe) {
        // Horizontal swipe - check vertical distance constraint
        if (absY > maxCrossAxisDistance) return;
        if (absX < effectiveMinDistance) return;

        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight();
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft();
        }
      } else {
        // Vertical swipe - check horizontal distance constraint
        if (absX > maxCrossAxisDistance) return;
        if (absY < effectiveMinDistance) return;

        if (deltaY > 0 && onSwipeDown) {
          onSwipeDown();
        } else if (deltaY < 0 && onSwipeUp) {
          onSwipeUp();
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      // Optional: Could add visual feedback during swipe here
      // Prevent default to avoid interference with scrolling when swiping
      if (touchStartRef.current && e.touches.length === 1) {
        const touch = e.touches[0];
        const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
        const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);

        // Determine if this looks like a deliberate swipe gesture
        const isHorizontalSwipe = deltaX > deltaY;

        if (isHorizontalSwipe) {
          // Horizontal swipe - prevent default if significant horizontal movement
          if (deltaX > minSwipeDistance / 2 && deltaY < maxCrossAxisDistance / 2) {
            e.preventDefault();
          }
        } else {
          // Vertical swipe - prevent default if significant vertical movement
          // Only prevent if we have vertical swipe handlers to avoid breaking normal scroll
          if ((onSwipeUp || onSwipeDown) && deltaY > minSwipeDistance / 2 && deltaX < maxCrossAxisDistance / 2) {
            e.preventDefault();
          }
        }
      }
    };

    // Attach event listeners
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });

    // Cleanup
    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchmove', handleTouchMove);
    };
  }, [elementRef, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, minSwipeDistance, maxCrossAxisDistance, maxSwipeTime, minVelocity]);
}
