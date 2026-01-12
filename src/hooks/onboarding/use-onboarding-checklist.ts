/**
 * Onboarding Checklist Hook
 *
 * Tracks key activation steps for mobile onboarding.
 */

import { useCallback, useEffect, useMemo, useState } from "react"
import { STORAGE_KEYS, getBoolean, setBoolean, type StorageKey } from "@/lib/storage"
import type { ActiveView, Track } from "@/types"

type OnboardingStepKey =
  | "playedTrack"
  | "openedCinema"
  | "openedWisdom"
  | "openedMetaDjAi"

export interface UseOnboardingChecklistOptions {
  currentTrack?: Track | null
  isPlaying?: boolean
  activeView?: ActiveView
  isMetaDjAiOpen?: boolean
}

export interface OnboardingChecklistState {
  completed: Record<OnboardingStepKey, boolean>
  completedCount: number
  totalCount: number
  isDismissed: boolean
  dismiss: () => void
}

const STEP_STORAGE_KEYS: Record<OnboardingStepKey, StorageKey> = {
  playedTrack: STORAGE_KEYS.ONBOARDING_PLAYED_TRACK,
  openedCinema: STORAGE_KEYS.ONBOARDING_OPENED_CINEMA,
  openedWisdom: STORAGE_KEYS.ONBOARDING_OPENED_WISDOM,
  openedMetaDjAi: STORAGE_KEYS.ONBOARDING_OPENED_METADJAI,
}

function loadInitialState(): Record<OnboardingStepKey, boolean> {
  return {
    playedTrack: getBoolean(STEP_STORAGE_KEYS.playedTrack, false),
    openedCinema: getBoolean(STEP_STORAGE_KEYS.openedCinema, false),
    openedWisdom: getBoolean(STEP_STORAGE_KEYS.openedWisdom, false),
    openedMetaDjAi: getBoolean(STEP_STORAGE_KEYS.openedMetaDjAi, false),
  }
}

export function useOnboardingChecklist({
  currentTrack,
  isPlaying,
  activeView,
  isMetaDjAiOpen,
}: UseOnboardingChecklistOptions): OnboardingChecklistState {
  const [completed, setCompleted] = useState<Record<OnboardingStepKey, boolean>>(loadInitialState)
  const [isDismissed, setIsDismissed] = useState(() =>
    getBoolean(STORAGE_KEYS.ONBOARDING_CHECKLIST_DISMISSED, false)
  )

  const markComplete = useCallback((step: OnboardingStepKey) => {
    setCompleted((prev) => {
      if (prev[step]) return prev
      setBoolean(STEP_STORAGE_KEYS[step], true)
      return { ...prev, [step]: true }
    })
  }, [])

  useEffect(() => {
    if (!currentTrack || !isPlaying) return
    markComplete("playedTrack")
  }, [currentTrack, isPlaying, markComplete])

  useEffect(() => {
    if (activeView === "cinema") {
      markComplete("openedCinema")
    } else if (activeView === "wisdom") {
      markComplete("openedWisdom")
    }
  }, [activeView, markComplete])

  useEffect(() => {
    if (isMetaDjAiOpen) {
      markComplete("openedMetaDjAi")
    }
  }, [isMetaDjAiOpen, markComplete])

  const dismiss = useCallback(() => {
    setBoolean(STORAGE_KEYS.ONBOARDING_CHECKLIST_DISMISSED, true)
    setIsDismissed(true)
  }, [])

  const completedCount = useMemo(
    () => Object.values(completed).filter(Boolean).length,
    [completed]
  )

  return {
    completed,
    completedCount,
    totalCount: 4,
    isDismissed,
    dismiss,
  }
}
