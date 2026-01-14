/**
 * Unified Persistence Layer for MetaDJ Nexus
 *
 * Provides type-safe localStorage management with:
 * - Centralized storage key management
 * - JSON serialization/deserialization
 * - Error handling for private browsing
 * - Storage availability detection
 * - Schema versioning for migrations
 */

import { logger } from "@/lib/logger"

// ============================================================================
// Storage Keys - Single source of truth for all localStorage keys
// ============================================================================

/**
 * All localStorage keys used by the application
 * Centralizing these prevents key collision and makes auditing easy
 */
export const STORAGE_KEYS = {
  // Player state
  VOLUME: "metadj-volume",
  MUTED: "metadj-muted",

  // Queue state
  QUEUE: "metadj-queue",
  QUEUE_STATE: "metadj_queue_state",
  REPEAT_MODE: "metadj-repeat-mode",
  REPEAT_MODE_USER_SET: "metadj-repeat-mode-user-set",
  SHUFFLE_ENABLED: "metadj-shuffle-enabled",
  RECENTLY_PLAYED: "metadj-recently-played",

  // UI preferences
  SELECTED_COLLECTION: "metadj_selected_collection",
  FEATURED_EXPANDED: "metadj_featured_expanded",
  LEFT_PANEL_TAB: "metadj_left_panel_tab",
  ACTIVE_VIEW: "metadj_active_view",
  PANEL_STATE: "metadj_panel_state",

  // Cinema settings
  CINEMA_SCENE: "metadj_cinema_scene",
  CINEMA_POSTER_ONLY: "metadj_cinema_poster_only",
  DREAM_PRESENTATION: "metadj_dream_presentation",
  // Note: DREAM_PROMPT_BASE intentionally not persisted - resets to default on app restart

  // Wisdom
  WISDOM_LAST_SECTION: "metadj_wisdom_last_section",
  WISDOM_CONTINUE_READING: "metadj_wisdom_continue_reading",
  WISDOM_JOURNAL_ENTRIES: "metadj_wisdom_journal_entries",
  WISDOM_JOURNAL_LAST_VIEW: "metadj_wisdom_journal_last_view",
  WISDOM_JOURNAL_LAST_ENTRY_ID: "metadj_wisdom_journal_last_entry_id",
  WISDOM_JOURNAL_DRAFT_ENTRY_ID: "metadj_wisdom_journal_draft_entry_id",
  WISDOM_JOURNAL_DRAFT_TITLE: "metadj_wisdom_journal_draft_title",
  WISDOM_JOURNAL_DRAFT_CONTENT: "metadj_wisdom_journal_draft_content",

  // MetaDJai session
  METADJAI_SESSION: "metadj-ai-session",
  METADJAI_PROVIDER: "metadj_ai_provider",
  METADJAI_PERSONALIZATION: "metadj_ai_personalization",
  METADJAI_ACTIONS: "metadj_ai_actions",

  // Playlists
  PLAYLISTS: "metadj-nexus-playlists",

  // Analytics
  VISITED: "metadj_visited",
  ACTIVATION_FIRST_PLAY: "metadj_activation_first_play",
  ACTIVATION_FIRST_CHAT: "metadj_activation_first_chat",
  ACTIVATION_FIRST_GUIDE: "metadj_activation_first_guide",
  ACTIVATION_FIRST_PLAYLIST: "metadj_activation_first_playlist",

  // Welcome overlay
  WELCOME_SHOWN: "metadj-nexus-welcome-shown",
  WELCOME_DISMISSED: "metadj-nexus-welcome-dismissed",

  // Onboarding checklist
  ONBOARDING_PLAYED_TRACK: "metadj_onboarding_played_track",
  ONBOARDING_OPENED_CINEMA: "metadj_onboarding_opened_cinema",
  ONBOARDING_OPENED_WISDOM: "metadj_onboarding_opened_wisdom",
  ONBOARDING_OPENED_METADJAI: "metadj_onboarding_opened_metadjai",
  ONBOARDING_CHECKLIST_DISMISSED: "metadj_onboarding_checklist_dismissed",

  // MetaDJai nudge
  METADJAI_NUDGE_DISMISSED: "metadj_metadjai_nudge_dismissed",

  // Schema version for migrations
  SCHEMA_VERSION: "metadj_schema_version",
} as const

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS]

// Current schema version - increment when storage format changes
const CURRENT_SCHEMA_VERSION = 2

// ============================================================================
// Storage Availability
// ============================================================================

let storageAvailable: boolean | null = null

/**
 * Check if localStorage is available
 * Caches result for performance
 */
export function isStorageAvailable(): boolean {
  if (storageAvailable !== null) {
    return storageAvailable
  }

  if (typeof window === "undefined") {
    return false
  }

  try {
    const testKey = "__storage_test__"
    window.localStorage.setItem(testKey, "test")
    window.localStorage.removeItem(testKey)
    storageAvailable = true
    return true
  } catch {
    storageAvailable = false
    logger.warn("localStorage unavailable (private browsing or quota exceeded)")
    return false
  }
}

// ============================================================================
// Core Storage Operations
// ============================================================================

/**
 * Get a raw string value from storage
 */
export function getRawValue(key: StorageKey): string | null {
  if (!isStorageAvailable()) return null

  try {
    return window.localStorage.getItem(key)
  } catch (error) {
    logger.error(`Failed to read from storage: ${key}`, { error })
    return null
  }
}

/**
 * Set a raw string value in storage
 */
export function setRawValue(key: StorageKey, value: string): boolean {
  if (!isStorageAvailable()) return false

  try {
    window.localStorage.setItem(key, value)
    return true
  } catch (error) {
    logger.error(`Failed to write to storage: ${key}`, { error })
    return false
  }
}

/**
 * Remove a value from storage
 */
export function removeValue(key: StorageKey): boolean {
  if (!isStorageAvailable()) return false

  try {
    window.localStorage.removeItem(key)
    return true
  } catch (error) {
    logger.error(`Failed to remove from storage: ${key}`, { error })
    return false
  }
}

// ============================================================================
// Type-Safe JSON Storage
// ============================================================================

/**
 * Get a JSON-parsed value from storage with type safety
 *
 * @param key - Storage key
 * @param fallback - Default value if key not found or parse fails
 * @returns Parsed value or fallback
 *
 * @example
 * const volume = getValue(STORAGE_KEYS.VOLUME, 1.0)
 * const queue = getValue<Track[]>(STORAGE_KEYS.QUEUE, [])
 */
export function getValue<T>(key: StorageKey, fallback: T): T {
  const raw = getRawValue(key)

  if (raw === null) {
    return fallback
  }

  try {
    return JSON.parse(raw) as T
  } catch {
    // If parse fails, try returning raw string if fallback is string type
    if (typeof fallback === "string") {
      return raw as unknown as T
    }
    logger.warn(`Failed to parse storage value for ${key}, using fallback`)
    return fallback
  }
}

/**
 * Set a value in storage with JSON serialization
 *
 * @param key - Storage key
 * @param value - Value to store (will be JSON stringified)
 * @returns true if successful
 *
 * @example
 * setValue(STORAGE_KEYS.VOLUME, 0.8)
 * setValue(STORAGE_KEYS.QUEUE, tracks)
 */
export function setValue<T>(key: StorageKey, value: T): boolean {
  try {
    const serialized = JSON.stringify(value)
    return setRawValue(key, serialized)
  } catch (error) {
    logger.error(`Failed to serialize value for ${key}`, { error })
    return false
  }
}

// ============================================================================
// Convenience Getters/Setters for Primitives
// ============================================================================

/**
 * Get a string value from storage
 */
export function getString(key: StorageKey, fallback: string): string {
  return getRawValue(key) ?? fallback
}

/**
 * Set a string value in storage
 */
export function setString(key: StorageKey, value: string): boolean {
  return setRawValue(key, value)
}

/**
 * Get a number value from storage
 */
export function getNumber(key: StorageKey, fallback: number): number {
  const raw = getRawValue(key)
  if (raw === null) return fallback

  const parsed = parseFloat(raw)
  return Number.isFinite(parsed) ? parsed : fallback
}

/**
 * Set a number value in storage
 */
export function setNumber(key: StorageKey, value: number): boolean {
  return setRawValue(key, String(value))
}

/**
 * Get a boolean value from storage
 */
export function getBoolean(key: StorageKey, fallback: boolean): boolean {
  const raw = getRawValue(key)
  if (raw === null) return fallback

  return raw === "true"
}

/**
 * Set a boolean value in storage
 */
export function setBoolean(key: StorageKey, value: boolean): boolean {
  return setRawValue(key, value ? "true" : "false")
}

// ============================================================================
// Schema Migration
// ============================================================================

/**
 * Check and run any necessary storage migrations
 * Call this early in app initialization
 */
export function runMigrations(): void {
  if (!isStorageAvailable()) return

  const storedVersion = getNumber(STORAGE_KEYS.SCHEMA_VERSION, 0)

  if (storedVersion >= CURRENT_SCHEMA_VERSION) {
    return // Already up to date
  }

  logger.info(`Running storage migrations from v${storedVersion} to v${CURRENT_SCHEMA_VERSION}`)

  // Migration v0 -> v1: Initial schema, no changes needed
  // Migration v1 -> v2: Reserved for future schema changes (no-op)

  setNumber(STORAGE_KEYS.SCHEMA_VERSION, CURRENT_SCHEMA_VERSION)
  logger.info("Storage migrations complete")
}

// ============================================================================
// Bulk Operations
// ============================================================================

/**
 * Clear all MetaDJ storage keys
 * Useful for "reset to defaults" functionality
 */
export function clearAllStorage(): boolean {
  if (!isStorageAvailable()) return false

  try {
    Object.values(STORAGE_KEYS).forEach((key) => {
      window.localStorage.removeItem(key)
    })
    return true
  } catch (error) {
    logger.error("Failed to clear storage", { error })
    return false
  }
}

/**
 * Session-specific storage keys that should be cleared on logout
 * These represent user session state, not device preferences
 */
const SESSION_STORAGE_KEYS: StorageKey[] = [
  // Queue and playback state (user-specific)
  STORAGE_KEYS.QUEUE,
  STORAGE_KEYS.QUEUE_STATE,
  STORAGE_KEYS.RECENTLY_PLAYED,
  STORAGE_KEYS.REPEAT_MODE,
  STORAGE_KEYS.REPEAT_MODE_USER_SET,
  STORAGE_KEYS.SHUFFLE_ENABLED,

  // UI navigation state (resets to defaults on fresh login)
  STORAGE_KEYS.SELECTED_COLLECTION,
  STORAGE_KEYS.FEATURED_EXPANDED,
  STORAGE_KEYS.LEFT_PANEL_TAB,
  STORAGE_KEYS.ACTIVE_VIEW,
  STORAGE_KEYS.PANEL_STATE,

  // Wisdom session state
  STORAGE_KEYS.WISDOM_LAST_SECTION,
  STORAGE_KEYS.WISDOM_CONTINUE_READING,

  // MetaDJai session (user-specific conversations)
  STORAGE_KEYS.METADJAI_SESSION,

  // Playlists (user-specific)
  STORAGE_KEYS.PLAYLISTS,
]

/**
 * Clear session-specific storage on logout
 * Preserves device preferences (volume, cinema settings, etc.)
 * This ensures a clean slate when logging in as a different user
 * or logging back in after logout
 */
export function clearSessionStorage(): boolean {
  if (!isStorageAvailable()) return false

  try {
    SESSION_STORAGE_KEYS.forEach((key) => {
      try {
        window.localStorage.removeItem(key)
      } catch {
        // Ignore individual key removal failures
      }
    })
    logger.debug("[Storage] Session storage cleared for logout")
    return true
  } catch (error) {
    logger.error("Failed to clear session storage", { error })
    return false
  }
}

/**
 * Export all stored data as JSON
 * Useful for debugging or data portability
 */
export function exportStorageData(): Record<string, unknown> {
  const data: Record<string, unknown> = {}

  Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
    const raw = getRawValue(key)
    if (raw !== null) {
      try {
        data[name] = JSON.parse(raw)
      } catch {
        data[name] = raw
      }
    }
  })

  return data
}

// ============================================================================
// Storage Event Listener
// ============================================================================

type StorageChangeCallback = (key: StorageKey, newValue: string | null) => void

const listeners = new Set<StorageChangeCallback>()

/**
 * Subscribe to storage changes (useful for cross-tab sync)
 */
export function onStorageChange(callback: StorageChangeCallback): () => void {
  listeners.add(callback)

  // Set up window storage event listener if this is the first subscriber
  if (listeners.size === 1 && typeof window !== "undefined") {
    window.addEventListener("storage", handleStorageEvent)
  }

  return () => {
    listeners.delete(callback)
    if (listeners.size === 0 && typeof window !== "undefined") {
      window.removeEventListener("storage", handleStorageEvent)
    }
  }
}

function handleStorageEvent(event: StorageEvent): void {
  const key = event.key as StorageKey | null
  if (key && Object.values(STORAGE_KEYS).includes(key)) {
    listeners.forEach((callback) => callback(key, event.newValue))
  }
}
