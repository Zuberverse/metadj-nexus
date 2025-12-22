import { useCallback, useEffect, useState } from "react"
import type { ActiveView } from "@/types"

type ViewMountMode = "eager" | "balanced" | "lazy"

type NetworkInformationLike = {
  effectiveType?: string
  saveData?: boolean
  downlink?: number
  addEventListener?: (type: string, listener: () => void) => void
  removeEventListener?: (type: string, listener: () => void) => void
}

const ALWAYS_MOUNTED: ActiveView[] = ["hub"]
const ALL_MOUNTABLE_VIEWS: ActiveView[] = ["hub", "wisdom", "journal"]

function resolveConnection(): NetworkInformationLike | undefined {
  if (typeof navigator === "undefined") return undefined
  const candidate = navigator as Navigator & { connection?: NetworkInformationLike }
  return candidate.connection
}

function getMountMode(reducedMotion: boolean): ViewMountMode {
  if (typeof navigator === "undefined") return "balanced"

  const connection = resolveConnection()
  const effectiveType = connection?.effectiveType ?? ""
  const saveData = connection?.saveData === true

  const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 0
  const hardwareConcurrency = navigator.hardwareConcurrency ?? 0

  const slowConnection =
    effectiveType === "slow-2g" || effectiveType === "2g" || effectiveType === "3g"
  const lowMemory = deviceMemory > 0 && deviceMemory <= 4
  const lowCPU = hardwareConcurrency > 0 && hardwareConcurrency <= 4
  const highMemory = deviceMemory >= 8
  const highCPU = hardwareConcurrency >= 8

  if (reducedMotion || saveData || slowConnection || lowMemory || lowCPU) return "lazy"
  if (highMemory && highCPU) return "eager"
  return "balanced"
}

export interface UseViewMountingOptions {
  activeView: ActiveView
  reducedMotion?: boolean
}

export interface UseViewMountingResult {
  mountMode: ViewMountMode
  mountedViews: ReadonlySet<ActiveView>
  ensureViewMounted: (view: ActiveView) => void
  shouldMountView: (view: ActiveView) => boolean
}

export function useViewMounting({
  activeView,
  reducedMotion = false,
}: UseViewMountingOptions): UseViewMountingResult {
  const [mountMode, setMountMode] = useState<ViewMountMode>("balanced")
  const [mountedViews, setMountedViews] = useState<Set<ActiveView>>(() => {
    const initial = new Set<ActiveView>(ALWAYS_MOUNTED)
    initial.add(activeView)
    return initial
  })

  useEffect(() => {
    setMountedViews((prev) => {
      if (prev.has(activeView)) return prev
      const next = new Set(prev)
      next.add(activeView)
      return next
    })
  }, [activeView])

  useEffect(() => {
    const updateMode = () => setMountMode(getMountMode(reducedMotion))
    updateMode()

    const connection = resolveConnection()
    if (!connection || typeof connection.addEventListener !== "function") return

    connection.addEventListener("change", updateMode)
    return () => connection.removeEventListener?.("change", updateMode)
  }, [reducedMotion])

  useEffect(() => {
    if (mountMode === "eager") {
      setMountedViews(new Set(ALL_MOUNTABLE_VIEWS))
      return
    }

    if (mountMode !== "balanced" || typeof window === "undefined") return

    const scheduleIdle =
      typeof window.requestIdleCallback === "function"
        ? window.requestIdleCallback
        : (cb: () => void) => window.setTimeout(cb, 350)

    const handle = scheduleIdle(() => {
      setMountedViews((prev) => {
        const next = new Set(prev)
        for (const view of ALL_MOUNTABLE_VIEWS) {
          next.add(view)
        }
        return next
      })
    })

    return () => {
      if (typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(handle)
      } else {
        window.clearTimeout(handle)
      }
    }
  }, [mountMode])

  const ensureViewMounted = useCallback((view: ActiveView) => {
    if (view === "cinema") return
    setMountedViews((prev) => {
      if (prev.has(view)) return prev
      const next = new Set(prev)
      next.add(view)
      return next
    })
  }, [])

  const shouldMountView = useCallback(
    (view: ActiveView) => {
      if (view === "cinema") return true
      if (mountMode === "eager") return true
      return mountedViews.has(view)
    },
    [mountMode, mountedViews],
  )

  return {
    mountMode,
    mountedViews,
    ensureViewMounted,
    shouldMountView,
  }
}
