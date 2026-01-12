/**
 * Wisdom Continue Reading
 *
 * Persists the last opened Wisdom item for quick return from the Hub.
 */

import { STORAGE_KEYS, getValue, setValue, removeValue, onStorageChange } from "@/lib/storage"
import type { WisdomSection } from "@/lib/wisdom/deeplink"

export interface WisdomContinueReading {
  section: WisdomSection
  id: string
  title: string
  excerpt: string
  readTimeMinutes: number
  lastOpenedAt: string
}

const CONTINUE_READING_EVENT = "metadj:continue-reading"

function parseContinueReading(raw: string | null): WisdomContinueReading | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as WisdomContinueReading
    return parsed && typeof parsed === "object" ? parsed : null
  } catch {
    return null
  }
}

function notifyContinueReadingChange(value: WisdomContinueReading | null) {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(CONTINUE_READING_EVENT, { detail: value }))
}

export function getContinueReading(): WisdomContinueReading | null {
  return getValue<WisdomContinueReading | null>(STORAGE_KEYS.WISDOM_CONTINUE_READING, null)
}

export function setContinueReading(next: WisdomContinueReading): boolean {
  const stored = setValue(STORAGE_KEYS.WISDOM_CONTINUE_READING, next)
  if (stored) {
    notifyContinueReadingChange(next)
  }
  return stored
}

export function clearContinueReading(): boolean {
  const cleared = removeValue(STORAGE_KEYS.WISDOM_CONTINUE_READING)
  if (cleared) {
    notifyContinueReadingChange(null)
  }
  return cleared
}

export function onContinueReadingChange(
  callback: (value: WisdomContinueReading | null) => void
): () => void {
  const handleCustomEvent = (event: Event) => {
    const detail = (event as CustomEvent<WisdomContinueReading | null>).detail ?? null
    callback(detail)
  }

  const unsubscribeStorage = onStorageChange((key, newValue) => {
    if (key !== STORAGE_KEYS.WISDOM_CONTINUE_READING) return
    callback(parseContinueReading(newValue))
  })

  if (typeof window !== "undefined") {
    window.addEventListener(CONTINUE_READING_EVENT, handleCustomEvent)
  }

  return () => {
    unsubscribeStorage()
    if (typeof window !== "undefined") {
      window.removeEventListener(CONTINUE_READING_EVENT, handleCustomEvent)
    }
  }
}
