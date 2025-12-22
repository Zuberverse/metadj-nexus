import { logger } from "./logger"
import { isStorageAvailable, STORAGE_KEYS, getRawValue, setRawValue } from "./storage/persistence"

/**
 * Analytics Module - Privacy-First Event Tracking
 *
 * Uses Plausible Analytics for GDPR-compliant, privacy-respecting analytics.
 * No cookies, no personal data collection, no cross-site tracking.
 *
 * @see https://plausible.io/docs
 */

declare global {
  interface Window {
    plausible?: (
      eventName: string,
      options?: {
        props?: Record<string, string | number | boolean>
        callback?: () => void
      }
    ) => void
  }
}

/**
 * Core event tracking function
 *
 * @param eventName - Name of the event (e.g., 'track_played')
 * @param props - Optional event properties (all values must be primitives)
 */
export function trackEvent(
  eventName: string,
  props?: Record<string, string | number | boolean>
): void {
  // Only track in production or when explicitly enabled
  if (
    typeof window === 'undefined' ||
    (!window.plausible && process.env.NODE_ENV !== 'production')
  ) {
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Analytics event', { eventName, props })
    }
    return
  }

  try {
    window.plausible?.(eventName, { props })
  } catch (error) {
    // Silently fail - analytics should never break the app
    logger.warn('Analytics: Failed to track event', { eventName, error: String(error) })
  }
}

/**
 * Track page view (automatic with Plausible script)
 * Only needed for SPAs with custom routing
 */
export function trackPageView(url?: string): void {
  if (typeof window === 'undefined' || !window.plausible) return

  try {
    window.plausible('pageview', {
      props: url ? { url } : undefined,
    })
  } catch (error) {
    logger.warn('Analytics: Failed to track pageview', { error: String(error) })
  }
}

// ============================================================================
// PLAYBACK EVENTS
// ============================================================================

export interface TrackPlayedProps {
  trackId: string
  trackTitle: string
  collection: string
  source: 'featured' | 'collection' | 'search' | 'queue'
  position?: number // Position in queue/list
}

export function trackTrackPlayed(props: TrackPlayedProps): void {
  trackEvent('track_played', {
    track_id: props.trackId,
    track_title: props.trackTitle,
    collection: props.collection,
    source: props.source,
    ...(props.position !== undefined && { position: props.position }),
  })
}

export interface TrackSkippedProps {
  trackId: string
  trackTitle: string
  playedSeconds: number
  totalDuration: number
  percentagePlayed: number
}

export function trackTrackSkipped(props: TrackSkippedProps): void {
  trackEvent('track_skipped', {
    track_id: props.trackId,
    track_title: props.trackTitle,
    played_seconds: props.playedSeconds,
    total_duration: props.totalDuration,
    percentage_played: Math.round(props.percentagePlayed),
  })
}

export interface TrackCompletedProps {
  trackId: string
  trackTitle: string
  duration: number
  listenedToEnd: boolean // True if user didn't skip near the end
}

export function trackTrackCompleted(props: TrackCompletedProps): void {
  trackEvent('track_completed', {
    track_id: props.trackId,
    track_title: props.trackTitle,
    duration: props.duration,
    listened_to_end: props.listenedToEnd,
  })
}

export interface PlaybackControlProps {
  action: 'play' | 'pause' | 'next' | 'previous' | 'seek' | 'volume'
  trackId?: string
  value?: number // For volume or seek position
}

export function trackPlaybackControl(props: PlaybackControlProps): void {
  trackEvent('playback_control', {
    action: props.action,
    ...(props.trackId && { track_id: props.trackId }),
    ...(props.value !== undefined && { value: props.value }),
  })
}

export function trackRepeatModeChanged(mode: 'none' | 'track' | 'queue'): void {
  trackEvent('repeat_mode_changed', { mode })
}

export function trackShuffleToggled(enabled: boolean): void {
  trackEvent('shuffle_toggled', { enabled })
}

export function trackResumeQueue(): void {
  trackEvent('resume_queue')
}

export function trackSearchEmpty(queryLength: number): void {
  trackEvent('search_empty', { query_length: queryLength })
}

export function trackSearchPlayFromHere(trackId: string, queueSize: number): void {
  trackEvent('search_play_from_here', { track_id: trackId, queue_size: queueSize })
}

export interface CinemaOpenedProps {
  trackId?: string
  fromSource: 'player' | 'hub' | 'cta'
}

export function trackCinemaOpened(props: CinemaOpenedProps): void {
  trackEvent('cinema_opened', {
    ...(props.trackId && { track_id: props.trackId }),
    from_source: props.fromSource,
  })
}

export interface CinemaClosedProps {
  trackId?: string
  durationSeconds: number
  completed: boolean
}

export function trackCinemaClosed(props: CinemaClosedProps): void {
  trackEvent('cinema_closed', {
    ...(props.trackId && { track_id: props.trackId }),
    duration_seconds: Math.round(props.durationSeconds),
    completed: props.completed,
  })
}

export function trackCinemaToggled(enabled: boolean): void {
  trackEvent('cinema_toggle', { enabled })
}

export function trackSceneChanged(sceneId: string): void {
  trackEvent('cinema_scene_changed', { scene_id: sceneId })
}

export interface SearchPerformedProps {
  query: string
  resultsCount: number
  hasResults: boolean
}

export function trackSearchPerformed(props: SearchPerformedProps): void {
  // Don't track the actual query for privacy - just metadata
  trackEvent('search_performed', {
    query_length: props.query.length,
    results_count: props.resultsCount,
    has_results: props.hasResults,
  })
}

export interface SearchZeroResultsProps {
  query: string
}

export function trackSearchZeroResults(props: SearchZeroResultsProps): void {
  trackEvent('search_zero_results', {
    query_length: props.query.length,
  })
}

export interface TrackInfoOpenedProps {
  trackId: string
  trackTitle: string
  collection: string
  source: 'featured' | 'collection' | 'search'
  trigger?: 'artwork' | 'info_button' | 'keyboard'
}

export function trackTrackInfoOpened(props: TrackInfoOpenedProps): void {
  trackEvent('track_info_opened', {
    track_id: props.trackId,
    track_title: props.trackTitle,
    collection: props.collection,
    source: props.source,
    ...(props.trigger && { trigger: props.trigger }),
  })
}

export interface TrackInfoClosedProps {
  trackId: string
  trackTitle: string
  collection: string
  timeSpentMs: number
}

export function trackTrackInfoClosed(props: TrackInfoClosedProps): void {
  trackEvent('track_info_closed', {
    track_id: props.trackId,
    track_title: props.trackTitle,
    collection: props.collection,
    time_spent_seconds: Math.round(props.timeSpentMs / 1000),
  })
}

export interface TrackSharedProps {
  trackId: string
  trackTitle: string
  collection: string
  shareMethod: 'web_share' | 'clipboard'
  platform?: string // Platform from Web Share API if available
}

export function trackTrackShared(props: TrackSharedProps): void {
  trackEvent('track_shared', {
    track_id: props.trackId,
    track_title: props.trackTitle,
    collection: props.collection,
    share_method: props.shareMethod,
    ...(props.platform && { platform: props.platform }),
  })
}

export interface TrackInfoIconClickedProps {
  trackId: string
  trackTitle: string
  collection: string
  triggerSource: 'collection' | 'search' | 'featured'
}

export function trackTrackInfoIconClicked(props: TrackInfoIconClickedProps): void {
  trackEvent('track_info_icon_clicked', {
    track_id: props.trackId,
    track_title: props.trackTitle,
    collection: props.collection,
    trigger_source: props.triggerSource,
  })
}

export interface AddToQueueClickedProps {
  trackId: string
  trackTitle: string
  collection: string
  queuePositionAfterAdd: number
}

export function trackAddToQueueClicked(props: AddToQueueClickedProps): void {
  trackEvent('add_to_queue_clicked', {
    track_id: props.trackId,
    track_title: props.trackTitle,
    collection: props.collection,
    queue_position_after_add: props.queuePositionAfterAdd,
  })
}

// ============================================================================
// COLLECTION EVENTS
// ============================================================================

export interface CollectionViewedProps {
  collectionId: string
  collectionTitle: string
  trackCount: number
}

export function trackCollectionViewed(props: CollectionViewedProps): void {
  trackEvent('collection_viewed', {
    collection_id: props.collectionId,
    collection_title: props.collectionTitle,
    track_count: props.trackCount,
  })
}

export interface CollectionBrowsedProps {
  collectionId: string
  collectionTitle: string
  scrollDepth?: number
  trackCount?: number
}

export function trackCollectionBrowsed(props: CollectionBrowsedProps): void {
  trackEvent('collection_browsed', {
    collection_id: props.collectionId,
    collection_title: props.collectionTitle,
    ...(props.scrollDepth !== undefined && { scroll_depth: props.scrollDepth }),
    ...(props.trackCount !== undefined && { track_count: props.trackCount }),
  })
}

export interface TrackCardClickedProps {
  trackId: string
  trackTitle: string
  collection: string
  position: number
  action: 'play' | 'details' | 'queue'
}

export function trackTrackCardClicked(props: TrackCardClickedProps): void {
  trackEvent('track_card_clicked', {
    track_id: props.trackId,
    track_title: props.trackTitle,
    collection: props.collection,
    position: props.position,
    action: props.action,
  })
}

// ============================================================================
// ENGAGEMENT EVENTS
// ============================================================================

export interface SessionStartedProps {
  isReturningVisitor: boolean
  deviceType: 'mobile' | 'tablet' | 'desktop'
}

export function trackSessionStarted(props: SessionStartedProps): void {
  trackEvent('session_started', {
    is_returning: props.isReturningVisitor,
    device_type: props.deviceType,
  })
}

export interface QueueActionProps {
  action: 'add' | 'remove' | 'reorder' | 'clear'
  trackId?: string
  queueSize: number
}

export function trackQueueAction(props: QueueActionProps): void {
  trackEvent('queue_action', {
    action: props.action,
    ...(props.trackId && { track_id: props.trackId }),
    queue_size: props.queueSize,
  })
}

export interface QueueRestoredProps {
  queueSize: number
  ageMinutes: number
  context: 'collection' | 'search' | 'playlist'
}

export function trackQueueRestored(props: QueueRestoredProps): void {
  trackEvent('queue_restored', {
    queue_size: props.queueSize,
    age_minutes: props.ageMinutes,
    context: props.context,
  })
}

export interface QueueExpiredProps {
  reason: 'time_expired' | 'version_mismatch'
}

export function trackQueueExpired(props: QueueExpiredProps): void {
  trackEvent('queue_expired', {
    reason: props.reason,
  })
}

// ============================================================================
// ERROR EVENTS
// ============================================================================

export interface ErrorOccurredProps {
  /** Error message (truncated to 100 chars for privacy) */
  message: string
  /** Error digest from Next.js */
  digest?: string
  /** Component/feature where error occurred */
  source?: string
  /** Whether this was a route error boundary catch */
  isRouteError?: boolean
}

/**
 * Track application errors for monitoring and debugging
 * Truncates message to avoid PII leakage
 */
export function trackError(props: ErrorOccurredProps): void {
  trackEvent('error_occurred', {
    message: props.message.substring(0, 100),
    ...(props.digest && { digest: props.digest }),
    ...(props.source && { source: props.source }),
    ...(props.isRouteError !== undefined && { is_route_error: props.isRouteError }),
  })
}

// ============================================================================
// USER METRICS
// ============================================================================

/**
 * Get device type from user agent
 */
export function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop'

  const ua = navigator.userAgent
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet'
  }
  if (
    /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(
      ua
    )
  ) {
    return 'mobile'
  }
  return 'desktop'
}

/**
 * Check if user is a returning visitor
 */
export function isReturningVisitor(): boolean {
  if (!isStorageAvailable()) return false

  const visited = getRawValue(STORAGE_KEYS.VISITED)
  if (!visited) {
    setRawValue(STORAGE_KEYS.VISITED, 'true')
    return false
  }
  return true
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Batch track multiple events (useful for page load)
 */
export function trackBatch(
  events: Array<{ name: string; props?: Record<string, string | number | boolean> }>
): void {
  events.forEach((event) => trackEvent(event.name, event.props))
}

/**
 * Calculate percentage played
 */
export function calculatePercentagePlayed(
  currentTime: number,
  duration: number
): number {
  if (duration === 0) return 0
  return Math.round((currentTime / duration) * 100)
}
