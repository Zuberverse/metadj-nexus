/**
 * Validation utilities barrel export
 *
 * Centralizes Zod schemas, type exports, and validation functions.
 * Import from '@/lib/validation' for clean, consistent imports.
 */

// Schemas and types
export {
  trackSchema,
  collectionSchema,
  collectionTypeSchema,
  type Track,
  type Collection,
  type CollectionType,
} from './schemas'

// Validation functions
export {
  validateTrack,
  validateTracks,
  validateCollection,
  validateCollections,
  safeValidateTrack,
  safeValidateCollection,
} from './schemas'

// Error formatting utilities
export { formatZodError, formatZodErrorString } from './format'
