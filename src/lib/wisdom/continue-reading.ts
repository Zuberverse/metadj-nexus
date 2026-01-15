/**
 * Wisdom Continue Reading
 *
 * Persists the last opened Wisdom items for quick return from the Hub.
 * Tracks up to MAX_CONTINUE_READING_ITEMS most recently viewed items.
 */

import { STORAGE_KEYS, getValue, setValue, removeValue, onStorageChange } from "@/lib/storage"
import type { WisdomSection } from "@/lib/wisdom/deeplink"

export const MAX_CONTINUE_READING_ITEMS = 3

export interface WisdomContinueReading {
  section: WisdomSection
  id: string
  title: string
  excerpt: string
  readTimeMinutes: number
  lastOpenedAt: string
}

const CONTINUE_READING_EVENT = "metadj:continue-reading"

function parseContinueReadingList(raw: string | null): WisdomContinueReading[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is WisdomContinueReading =>
        item && typeof item === "object" && item.id && item.section
      )
    }
    if (parsed && typeof parsed === "object" && parsed.id) {
      return [parsed as WisdomContinueReading]
    }
    return []
  } catch {
    return []
  }
}

function notifyContinueReadingChange(value: WisdomContinueReading[]) {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(CONTINUE_READING_EVENT, { detail: value }))
}

export function getContinueReadingList(): WisdomContinueReading[] {
  const raw = getValue<WisdomContinueReading[] | WisdomContinueReading | null>(
    STORAGE_KEYS.WISDOM_CONTINUE_READING,
    null
  )
  if (Array.isArray(raw)) return raw
  if (raw && typeof raw === "object" && 'id' in raw) return [raw]
  return []
}

export function getContinueReading(): WisdomContinueReading | null {
  const list = getContinueReadingList()
  return list[0] ?? null
}

export function setContinueReading(next: WisdomContinueReading): boolean {
  const existing = getContinueReadingList()
  const filtered = existing.filter(
    (item) => !(item.section === next.section && item.id === next.id)
  )
  const updated = [next, ...filtered].slice(0, MAX_CONTINUE_READING_ITEMS)
  const stored = setValue(STORAGE_KEYS.WISDOM_CONTINUE_READING, updated)
  if (stored) {
    notifyContinueReadingChange(updated)
  }
  return stored
}

export function clearContinueReading(): boolean {
  const cleared = removeValue(STORAGE_KEYS.WISDOM_CONTINUE_READING)
  if (cleared) {
    notifyContinueReadingChange([])
  }
  return cleared
}

export function onContinueReadingChange(
  callback: (value: WisdomContinueReading | null) => void
): () => void {
  const handleCustomEvent = (event: Event) => {
    const detail = (event as CustomEvent<WisdomContinueReading[]>).detail ?? []
    callback(detail[0] ?? null)
  }

  const unsubscribeStorage = onStorageChange((key, newValue) => {
    if (key !== STORAGE_KEYS.WISDOM_CONTINUE_READING) return
    const list = parseContinueReadingList(newValue)
    callback(list[0] ?? null)
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

export function onContinueReadingListChange(
  callback: (value: WisdomContinueReading[]) => void
): () => void {
  const handleCustomEvent = (event: Event) => {
    const detail = (event as CustomEvent<WisdomContinueReading[]>).detail ?? []
    callback(detail)
  }

  const unsubscribeStorage = onStorageChange((key, newValue) => {
    if (key !== STORAGE_KEYS.WISDOM_CONTINUE_READING) return
    callback(parseContinueReadingList(newValue))
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
