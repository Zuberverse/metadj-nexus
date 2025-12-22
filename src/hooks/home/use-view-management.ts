import { useCallback, useEffect } from "react"
import type { useUI } from "@/contexts/UIContext"
import type { ActiveView } from "@/types"

interface UseViewManagementProps {
  ui: ReturnType<typeof useUI>
  cinemaEnabled: boolean
  setCinemaEnabled: (enabled: boolean) => void
  setIsFullscreen: (fullscreen: boolean) => void
  shouldUseSidePanels: boolean
  activeView: ActiveView
}

/**
 * Custom hook for managing view state across Hub, Cinema, and Wisdom
 *
 * Handles view transitions, cinema state, fullscreen toggling, and ensures
 * mutually exclusive view states (only one primary view active at a time).
 */
export function useViewManagement({
  ui,
  cinemaEnabled,
  setCinemaEnabled,
  setIsFullscreen,
  shouldUseSidePanels,
  activeView,
}: UseViewManagementProps) {
  /**
   * Toggle Wisdom view
   * - Closes Cinema and MetaDJai when opening Wisdom
   * - Scrolls to top for better UX
   */
  const handleWisdomToggle = useCallback(() => {
    const nextState = !ui.modals.isWisdomOpen
    ui.setWisdomOpen(nextState)
    ui.setActiveView(nextState ? "wisdom" : "hub")

    if (nextState) {
      if (cinemaEnabled) setCinemaEnabled(false)
      if (ui.modals.isMetaDjAiOpen) ui.setMetaDjAiOpen(false)
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
    }
  }, [ui, cinemaEnabled, setCinemaEnabled])

  /**
   * Toggle Cinema view
   * - Closes Wisdom when opening Cinema
   * - Manages fullscreen state based on panel visibility
   */
  const handleCinemaToggle = useCallback((toggleFn: () => void) => {
    const nextState = !cinemaEnabled
    toggleFn()

    if (nextState && ui.modals.isWisdomOpen) {
      ui.setWisdomOpen(false)
    }
    ui.setActiveView(nextState ? "cinema" : "hub")
    setIsFullscreen(nextState ? !shouldUseSidePanels : false)
  }, [ui, cinemaEnabled, setIsFullscreen, shouldUseSidePanels])

  /**
   * Handle active view changes from mobile feature rail
   * Coordinates state across all views to maintain consistency
   */
  const handleActiveViewChange = useCallback((view: ActiveView) => {
    ui.setActiveView(view)

    if (view === "hub") {
      if (ui.modals.isWisdomOpen) ui.setWisdomOpen(false)
      if (cinemaEnabled) setCinemaEnabled(false)
      setIsFullscreen(false)
      return
    }

    if (view === "cinema") {
      if (ui.modals.isWisdomOpen) ui.setWisdomOpen(false)
      if (!cinemaEnabled) setCinemaEnabled(true)
      setIsFullscreen(false)
      return
    }

    if (view === "wisdom") {
      if (cinemaEnabled) setCinemaEnabled(false)
      setIsFullscreen(false)
      ui.setWisdomOpen(true)
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
    }

    if (view === "journal") {
      if (cinemaEnabled) setCinemaEnabled(false)
      if (ui.modals.isWisdomOpen) ui.setWisdomOpen(false)
      setIsFullscreen(false)
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
    }
  }, [ui, cinemaEnabled, setCinemaEnabled, setIsFullscreen])

  /**
   * Sync activeView state with actual view states (Wisdom/Cinema)
   * Ensures activeView always reflects the current UI state
   */
  useEffect(() => {
    if (!ui.viewHydrated) return

    if (ui.modals.isWisdomOpen && activeView !== "wisdom") {
      ui.setActiveView("wisdom")
      return
    }

    if (cinemaEnabled && activeView !== "cinema") {
      ui.setActiveView("cinema")
      return
    }

    if (!ui.modals.isWisdomOpen && !cinemaEnabled && activeView !== "hub" && activeView !== "journal") {
      ui.setActiveView("hub")
    }
  }, [ui, activeView, cinemaEnabled])

  /**
   * Manage fullscreen state for Cinema
   * Cinema should always be fullscreen when active
   */
  useEffect(() => {
    if (!cinemaEnabled) {
      if (setIsFullscreen) setIsFullscreen(false)
      return
    }

    // Cinema should occupy full screen; panels overlay on top
    if (!shouldUseSidePanels && setIsFullscreen) {
      setIsFullscreen(true)
    }
  }, [cinemaEnabled, setIsFullscreen, shouldUseSidePanels])

  return {
    handleWisdomToggle,
    handleCinemaToggle,
    handleActiveViewChange,
  }
}
