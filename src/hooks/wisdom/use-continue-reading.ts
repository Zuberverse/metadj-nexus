/**
 * Wisdom Continue Reading Hook
 *
 * Keeps Hub in sync with the last opened Wisdom entry.
 */

import { useCallback, useEffect, useState } from "react"
import {
  clearContinueReading,
  getContinueReading,
  onContinueReadingChange,
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
