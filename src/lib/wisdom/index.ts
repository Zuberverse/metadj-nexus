/**
 * Wisdom Domain - Barrel Export
 *
 * Consolidated exports for wisdom content loading, deep linking, and utilities.
 */

// Data loading
export {
  loadWisdomData,
  getCachedWisdomData,
  clearWisdomCache,
  type WisdomData,
} from "./data"

// Deep linking
export {
  parseWisdomDeepLinkPath,
  buildWisdomDeepLinkPath,
  buildWisdomDeepLinkUrl,
  isWisdomSection,
  type WisdomSection,
  type WisdomDeepLink,
} from "./deeplink"

// Utilities
export {
  estimateReadTime,
  estimateSectionedReadTime,
  getReadTimeBucket,
  type ReadTimeBucket,
  formatReadTime,
  stripSignoffParagraphs,
} from "./utils"

// Continue reading
export {
  getContinueReading,
  setContinueReading,
  clearContinueReading,
  onContinueReadingChange,
  type WisdomContinueReading,
} from "./continue-reading"
