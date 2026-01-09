/**
 * AI Tools Module
 *
 * Barrel export for AI tool utilities.
 *
 * @module lib/ai/tools
 */

export {
  // Constants
  MAX_TOOL_RESULT_SIZE,
  MAX_SEARCH_RESULTS,
  MAX_RECOMMENDATIONS,
  MAX_ACTIVE_CONTROL_TRACKS,
  DEFAULT_ACTIVE_CONTROL_LIMIT,
  // Types
  type ToolResultMeta,
  // Functions
  sanitizeAndValidateToolResult,
  safeToolExecute,
  wrapToolsWithErrorHandling,
  normalizeCatalogText,
  levenshteinDistance,
  stringSimilarity,
  fuzzyMatch,
} from "./utils"
