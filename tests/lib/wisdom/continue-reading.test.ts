import { beforeEach, describe, expect, it, vi } from "vitest"
import { STORAGE_KEYS } from "@/lib/storage"
import {
  clearContinueReading,
  getContinueReading,
  onContinueReadingChange,
  setContinueReading,
  type WisdomContinueReading,
} from "@/lib/wisdom/continue-reading"

const mockLocalStorage = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, "localStorage", {
  value: mockLocalStorage,
})

const sample: WisdomContinueReading = {
  section: "thoughts",
  id: "welcome-to-metadj-nexus",
  title: "Welcome to MetaDJ Nexus",
  excerpt: "An introduction to the creative hub.",
  readTimeMinutes: 3,
  lastOpenedAt: "2026-01-11T12:00:00.000Z",
}

describe("continue reading persistence", () => {
  beforeEach(() => {
    mockLocalStorage.clear()
  })

  it("stores and loads continue reading state", () => {
    setContinueReading(sample)
    expect(getContinueReading()).toEqual(sample)
  })

  it("clears continue reading state", () => {
    setContinueReading(sample)
    clearContinueReading()
    expect(getContinueReading()).toBeNull()
    expect(mockLocalStorage.getItem(STORAGE_KEYS.WISDOM_CONTINUE_READING)).toBeNull()
  })
})

describe("onContinueReadingChange", () => {
  beforeEach(() => {
    mockLocalStorage.clear()
  })

  it("notifies listeners when updated", () => {
    const handler = vi.fn()
    const unsubscribe = onContinueReadingChange(handler)

    setContinueReading(sample)
    expect(handler).toHaveBeenCalledWith(sample)

    unsubscribe()
  })
})
