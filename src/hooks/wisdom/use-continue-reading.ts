/**
 * Wisdom Continue Reading Hook
 *
 * Keeps Hub in sync with the last opened Wisdom entries.
 * Returns up to 3 most recently viewed items.
 */

import { useCallback, useEffect, useState } from "react"
import {
  clearContinueReading,
  getContinueReading,
  getContinueReadingList,
  onContinueReadingChange,
  onContinueReadingListChange,
  type WisdomContinueReading,
} from "@/lib/wisdom/continue-reading"

export function useContinueReading() {
  const [value, setValue] = useState<WisdomContinueReading | null>(() => getContinueReading())

  useEffect(() => {
    return onContinueReadingChange(setValue)
  }, [])

  const clear = useCallback(() => {
    clearContinueReading()
  }, [])

  return { value, clear }
}

export function useContinueReadingList() {
  const [items, setItems] = useState<WisdomContinueReading[]>(() => getContinueReadingList())

  useEffect(() => {
    return onContinueReadingListChange(setItems)
  }, [])

  const clear = useCallback(() => {
    clearContinueReading()
  }, [])

  return { items, clear }
}
