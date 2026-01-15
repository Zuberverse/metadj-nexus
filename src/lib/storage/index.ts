/**
 * Storage Module Exports
 *
 * Unified persistence layer for MetaDJ Nexus
 */

// Main persistence API
export {
  STORAGE_KEYS,
  type StorageKey,
  isStorageAvailable,
  getValue,
  setValue,
  getString,
  setString,
  getNumber,
  setNumber,
  getBoolean,
  setBoolean,
  removeValue,
  getRawValue,
  setRawValue,
  runMigrations,
  clearAllStorage,
  clearSessionStorage,
  exportStorageData,
  onStorageChange,
} from "./persistence"

// MetaDJai session storage
export { metadjAiSessionStorage } from "./metadjai-session-storage"

// Storage types (bucket interface)
export type { StorageBucket, StorageBucketFile } from "./storage.types"
