import { useCallback } from "react"
import type { UIContextValue } from "@/types"

interface UseMetaDjAiPanelControlsOptions {
  ui: UIContextValue
  shouldUseSidePanels: boolean
  panels: {
    left: { isOpen: boolean }
    right: { isOpen: boolean }
  }
  toggleRightPanel: () => void
}

interface UseMetaDjAiPanelControlsReturn {
  handleMetaDjAiToggle: () => void
  handleMetaDjAiOpen: () => void
  handleMetaDjAiClose: () => void
}

/**
 * Manages MetaDJai panel visibility controls
 * Handles opening/closing the AI chat panel with panel synchronization
 */
export function useMetaDjAiPanelControls({
  ui,
  shouldUseSidePanels,
  panels,
  toggleRightPanel,
}: UseMetaDjAiPanelControlsOptions): UseMetaDjAiPanelControlsReturn {
  const handleMetaDjAiToggle = useCallback(() => {
    const nextState = !ui.modals.isMetaDjAiOpen

    if (shouldUseSidePanels) {
      // Ensure the chat panel is visible when opening in desktop mode
      if (nextState && !panels.right.isOpen) {
        toggleRightPanel()
      }
      if (!nextState && panels.right.isOpen) {
        toggleRightPanel()
      }
    }

    ui.setMetaDjAiOpen(nextState)
  }, [ui, shouldUseSidePanels, panels.right.isOpen, toggleRightPanel])

  const handleMetaDjAiOpen = useCallback(() => {
    if (shouldUseSidePanels && !panels.right.isOpen) {
      toggleRightPanel()
    }
    if (!ui.modals.isMetaDjAiOpen) {
      ui.setMetaDjAiOpen(true)
    }
  }, [shouldUseSidePanels, panels.right.isOpen, toggleRightPanel, ui])

  const handleMetaDjAiClose = useCallback(() => {
    if (ui.modals.isMetaDjAiOpen) {
      ui.setMetaDjAiOpen(false)
    }
    if (panels.right.isOpen) {
      toggleRightPanel()
    }
  }, [ui, panels.right.isOpen, toggleRightPanel])

  return {
    handleMetaDjAiToggle,
    handleMetaDjAiOpen,
    handleMetaDjAiClose,
  }
}
