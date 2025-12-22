import { useCallback, useEffect, useLayoutEffect, RefObject } from "react"
import { STORAGE_KEYS, getRawValue, getString, isStorageAvailable } from "@/lib/storage"

interface UseHomeInitializersOptions {
  headerRef: RefObject<HTMLDivElement | null>
  setHeaderHeight: (value: number) => void
  setCinemaEnabled: (enabled: boolean) => void
  setSelectedCollection: (collectionId: string, source?: 'default' | 'hydrate' | 'user' | 'system') => void
  onWisdomOpen: () => void
  onUserGuideOpen: () => void
  onMusicPanelOpen?: () => void
  /** First collection ID to use as default */
  defaultCollectionId?: string
}

/**
 * Handles one-time bootstrap logic for the home experience:
 * - Resets scroll position and default collection on first paint
 * - Keeps header height in sync for layout-dependent overlays
 * - Subscribes to global wisdom open events
 */
export function useHomeInitializers({
  headerRef,
  setHeaderHeight,
  setCinemaEnabled,
  setSelectedCollection,
  onWisdomOpen,
  onUserGuideOpen,
  onMusicPanelOpen,
  defaultCollectionId,
}: UseHomeInitializersOptions) {
  useLayoutEffect(() => {
    window.scrollTo(0, 0)
    const storedView = isStorageAvailable()
      ? getString(STORAGE_KEYS.ACTIVE_VIEW, "hub")
      : "hub"
    const resolvedView = storedView === "music" ? "hub" : storedView
    const shouldEnableCinema = resolvedView === "cinema"

    setCinemaEnabled(shouldEnableCinema)

    if (resolvedView === "wisdom") {
      onWisdomOpen()
    }

    // Set to first collection only when nothing has been persisted yet.
    if (!defaultCollectionId) return
    if (isStorageAvailable() && getRawValue(STORAGE_KEYS.SELECTED_COLLECTION) !== null) return
    setSelectedCollection(defaultCollectionId, 'system')
  }, [setCinemaEnabled, setSelectedCollection, defaultCollectionId, onWisdomOpen])

  const updateHeaderHeight = useCallback(() => {
    if (headerRef.current) {
      setHeaderHeight(headerRef.current.offsetHeight)
    }
  }, [headerRef, setHeaderHeight])

  // LAYOUT SHIFT FIX: Try to measure header synchronously before paint
  // This prevents the visual "jump" when the header height updates after paint
  useLayoutEffect(() => {
    if (headerRef.current) {
      updateHeaderHeight()
    }
  }, [headerRef, updateHeaderHeight])

  useEffect(() => {
    // Fallback: If header wasn't available in useLayoutEffect, poll until ready
    // This handles dynamic shell components that may mount later
    let rafId: number | null = null
    const measureOnNextFrame = () => {
      if (!headerRef.current) {
        rafId = requestAnimationFrame(measureOnNextFrame)
        return
      }
      updateHeaderHeight()
    }

    // Only start polling if not already measured
    if (!headerRef.current) {
      measureOnNextFrame()
    }

    const handleResize = () => updateHeaderHeight()
    window.addEventListener("resize", handleResize)

    // Track header reflows (e.g., wrapping search bar) without requiring a window resize
    const observer = typeof ResizeObserver !== "undefined" && headerRef.current
      ? new ResizeObserver(() => updateHeaderHeight())
      : null
    if (observer && headerRef.current) {
      observer.observe(headerRef.current)
    }

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId)
      }
      window.removeEventListener("resize", handleResize)
      observer?.disconnect()
    }
  }, [headerRef, updateHeaderHeight])

  useEffect(() => {
    const handleOpenWisdomEvent = () => {
      onWisdomOpen()
    }

    const handleOpenUserGuideEvent = () => {
      onUserGuideOpen()
    }

    const handleOpenMusicPanelEvent = () => {
      onMusicPanelOpen?.()
    }

    window.addEventListener("metadj:openWisdom", handleOpenWisdomEvent)
    window.addEventListener("metadj:openUserGuide", handleOpenUserGuideEvent)
    window.addEventListener("metadj:openMusicPanel", handleOpenMusicPanelEvent)
    return () => {
      window.removeEventListener("metadj:openWisdom", handleOpenWisdomEvent)
      window.removeEventListener("metadj:openUserGuide", handleOpenUserGuideEvent)
      window.removeEventListener("metadj:openMusicPanel", handleOpenMusicPanelEvent)
    }
  }, [onWisdomOpen, onUserGuideOpen, onMusicPanelOpen])
}
