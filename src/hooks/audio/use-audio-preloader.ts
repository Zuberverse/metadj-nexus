import { useEffect, useRef, useCallback, useState } from "react";
import { logger } from "@/lib/logger";
import type { Track } from "@/types";

type NetworkInformationLike = {
  effectiveType?: string;
  saveData?: boolean;
  addEventListener?: (type: string, listener: () => void) => void;
  removeEventListener?: (type: string, listener: () => void) => void;
};

interface PreloadCache {
  blob: Blob;
  url: string;
  lastUsed: number;
}

interface PreloadConfig {
  maxCacheSize: number;
  featuredPreloadLimit: number;
  visiblePreloadLimit: number;
  queuePreloadLookahead: number;
  maxConcurrentPreloads: number;
  prefetchFeaturedOnLoad: boolean;
  reservedHighPrioritySlots: number;
  collectionLookaheadLimit: number;
}

const DEFAULT_PRELOAD_CONFIG: PreloadConfig = {
  maxCacheSize: 6,
  featuredPreloadLimit: 2,
  visiblePreloadLimit: 4,
  queuePreloadLookahead: 2,
  maxConcurrentPreloads: 2,
  prefetchFeaturedOnLoad: false,
  reservedHighPrioritySlots: 1,
  collectionLookaheadLimit: 2,
};

const preloadCache = new Map<string, PreloadCache>();
const activePreloads = new Map<string, Promise<string>>();
const completedTracks = new Set<string>();
const failedTracks = new Map<string, { timestamp: number; attempts: number }>();
const activeControllers = new Map<string, AbortController>();
const preloadStats = {
  hits: 0,
  misses: 0,
  evictions: 0,
};

let activePreloadSlots = 0;
const pendingPreloads: Array<() => void> = [];
let runtimePreloadConfig: PreloadConfig = { ...DEFAULT_PRELOAD_CONFIG };
const LONG_TRACK_DURATION_THRESHOLD_SECONDS = 8 * 60;
const FAILED_TRACK_RETRY_DELAY_MS = 5 * 60 * 1000;
const MAX_PRELOAD_ATTEMPTS = 2;

function shouldSkipLowPriorityPreload(track: Track, priority: "high" | "low"): boolean {
  if (priority === "high") return false;
  if (typeof track.duration !== "number") return false;
  return track.duration > LONG_TRACK_DURATION_THRESHOLD_SECONDS;
}

function isTrackFailedRecently(trackId: string): boolean {
  const failureInfo = failedTracks.get(trackId);
  if (!failureInfo) return false;
  
  const now = Date.now();
  const timeSinceFailure = now - failureInfo.timestamp;
  
  if (timeSinceFailure > FAILED_TRACK_RETRY_DELAY_MS) {
    failedTracks.delete(trackId);
    return false;
  }
  
  return failureInfo.attempts >= MAX_PRELOAD_ATTEMPTS;
}

function markTrackAsFailed(trackId: string): void {
  const existing = failedTracks.get(trackId);
  const attempts = (existing?.attempts ?? 0) + 1;
  failedTracks.set(trackId, { timestamp: Date.now(), attempts });
}

export function clearFailedTrack(trackId: string): void {
  failedTracks.delete(trackId);
}

function resolveConnection(): NetworkInformationLike | undefined {
  if (typeof navigator === "undefined") return undefined;
  const candidate = navigator as Navigator & { connection?: NetworkInformationLike };
  return candidate.connection;
}

function resolveDeviceMemory(): number | null {
  if (typeof navigator === "undefined") return null;
  const candidate = navigator as Navigator & { deviceMemory?: number };
  return typeof candidate.deviceMemory === "number" ? candidate.deviceMemory : null;
}

function isHighThroughputConnection(connection: NetworkInformationLike | undefined | null): boolean {
  if (!connection) return false;
  const effectiveType = connection.effectiveType ?? '';
  const downlink = typeof (connection as { downlink?: number }).downlink === 'number'
    ? (connection as { downlink: number }).downlink
    : 0;

  return effectiveType === '4g' && downlink >= 5;
}

function updateRuntimePreloadConfig(
  connection: NetworkInformationLike | undefined | null,
): PreloadConfig {
  // If connection info is unavailable, use defaults (Safari iOS, most desktop browsers)
  if (!connection) {
    runtimePreloadConfig = { ...DEFAULT_PRELOAD_CONFIG };
    return runtimePreloadConfig;
  }

  const effectiveType = connection.effectiveType ?? "";
  const saveData = connection.saveData === true;
  const isSlowConnection =
    effectiveType === "slow-2g" || effectiveType === "2g" || effectiveType === "3g";
  const highThroughput = isHighThroughputConnection(connection);
  const deviceMemory = resolveDeviceMemory();
  const lowMemory = typeof deviceMemory === "number" && deviceMemory <= 4;

  runtimePreloadConfig = {
    maxCacheSize: saveData
      ? 1
      : isSlowConnection || lowMemory
        ? 3
        : highThroughput
          ? 8
          : DEFAULT_PRELOAD_CONFIG.maxCacheSize,
    featuredPreloadLimit: saveData
      ? 0
      : isSlowConnection || lowMemory
        ? 1
        : highThroughput
          ? 3
          : DEFAULT_PRELOAD_CONFIG.featuredPreloadLimit,
    visiblePreloadLimit: saveData
      ? 0
      : isSlowConnection || lowMemory
        ? 2
        : highThroughput
          ? 4
          : DEFAULT_PRELOAD_CONFIG.visiblePreloadLimit,
    queuePreloadLookahead: saveData
      ? 0
      : isSlowConnection || lowMemory
        ? 1
        : highThroughput
          ? 3
          : DEFAULT_PRELOAD_CONFIG.queuePreloadLookahead,
    maxConcurrentPreloads: saveData
      ? 1
      : isSlowConnection || lowMemory
        ? 1
        : highThroughput
          ? 3
          : DEFAULT_PRELOAD_CONFIG.maxConcurrentPreloads,
    prefetchFeaturedOnLoad: !saveData && !isSlowConnection && !lowMemory,
    reservedHighPrioritySlots: DEFAULT_PRELOAD_CONFIG.reservedHighPrioritySlots,
    collectionLookaheadLimit: saveData
      ? 0
      : isSlowConnection || lowMemory
        ? 1
        : highThroughput
          ? 3
          : DEFAULT_PRELOAD_CONFIG.collectionLookaheadLimit,
  };

  if (preloadCache.size > runtimePreloadConfig.maxCacheSize) {
    evictLRU();
  }

  return runtimePreloadConfig;
}

function startNextPreload() {
  const maxBackgroundSlots = Math.max(
    1,
    runtimePreloadConfig.maxConcurrentPreloads - runtimePreloadConfig.reservedHighPrioritySlots
  );
  if (activePreloadSlots >= maxBackgroundSlots) return;
  const nextTask = pendingPreloads.shift();
  if (!nextTask) return;
  nextTask();
}

function evictLRU() {
  while (preloadCache.size > runtimePreloadConfig.maxCacheSize) {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, value] of preloadCache.entries()) {
      if (value.lastUsed < oldestTime) {
        oldestTime = value.lastUsed;
        oldestKey = key;
      }
    }

    if (!oldestKey) break;

    const cached = preloadCache.get(oldestKey);
    if (cached) {
      URL.revokeObjectURL(cached.url);
      preloadCache.delete(oldestKey);
      completedTracks.delete(oldestKey);
      preloadStats.evictions += 1;
    }
  }
}

async function preloadTrack(
  trackId: string,
  audioUrl: string,
  highPriority = false,
): Promise<string> {
  const cached = preloadCache.get(trackId);
  if (cached) {
    cached.lastUsed = Date.now();
    preloadStats.hits += 1;
    completedTracks.add(trackId);
    return cached.url;
  }
  preloadStats.misses += 1;

  if (isTrackFailedRecently(trackId)) {
    return audioUrl;
  }

  const inFlight = activePreloads.get(trackId);
  if (inFlight) {
    return inFlight;
  }

  const promise = new Promise<string>((resolve, reject) => {
    const execute = () => {
      activePreloadSlots += 1;
      const controller = new AbortController();
      activeControllers.set(trackId, controller);

      fetch(audioUrl, {
        cache: "default",
        headers: { Accept: "audio/mpeg,audio/*;q=0.9,*/*;q=0.8" },
        signal: controller.signal,
      })
        .then((response) => {
          if (!response.ok) throw new Error(`Failed to preload: ${response.status}`);
          return response.blob();
        })
        .then((blob) => {
          const url = URL.createObjectURL(blob);

          preloadCache.set(trackId, {
            blob,
            url,
            lastUsed: Date.now(),
          });
          completedTracks.add(trackId);
          failedTracks.delete(trackId);

          evictLRU();

          resolve(url);
        })
        .catch((err) => {
          completedTracks.delete(trackId);
          const message = err instanceof Error ? err.message : String(err);
          const isAbort = err instanceof DOMException && err.name === "AbortError";

          if (!isAbort) {
            markTrackAsFailed(trackId);
          }

          logger.warn(isAbort ? "Audio preload aborted" : "Audio preload failed", {
            trackId,
            error: message || "Unknown error",
          });
          reject(err);
        })
        .finally(() => {
          activePreloadSlots = Math.max(0, activePreloadSlots - 1);
          activePreloads.delete(trackId);
          activeControllers.delete(trackId);
          startNextPreload();
        });
    };

    if (highPriority || activePreloadSlots < runtimePreloadConfig.maxConcurrentPreloads) {
      execute();
    } else {
      pendingPreloads.push(execute);
    }
  });

  activePreloads.set(trackId, promise);
  return promise;
}

export function getCachedUrl(trackId: string): string | null {
  const cached = preloadCache.get(trackId);
  if (cached) {
    cached.lastUsed = Date.now();
    return cached.url;
  }
  return null;
}

export function releaseTrack(trackId: string) {
  const controller = activeControllers.get(trackId);
  if (controller) {
    controller.abort();
    activeControllers.delete(trackId);
  }

  const cached = preloadCache.get(trackId);
  if (cached) {
    URL.revokeObjectURL(cached.url);
    preloadCache.delete(trackId);
  }
  completedTracks.delete(trackId);
}

export async function waitForCachedUrl(
  trackId: string,
  audioUrl: string,
  timeoutMs = 5000,
  highPriority = false,
): Promise<string> {
  const cached = getCachedUrl(trackId);
  if (cached) {
    return cached;
  }

  let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

  try {
    const preloadPromise = preloadTrack(trackId, audioUrl, highPriority);

    if (timeoutMs <= 0) {
      const url = await preloadPromise;
      return getCachedUrl(trackId) ?? url;
    }

    const timeoutPromise = new Promise<string>((_, reject) => {
      timeoutHandle = setTimeout(() => reject(new Error("timeout")), timeoutMs);
    });

    const raceResult = await Promise.race([preloadPromise, timeoutPromise]).catch((error) => {
      if (error instanceof Error && error.message === "timeout") {
        const controller = activeControllers.get(trackId);
        controller?.abort();
      }
      throw error;
    });
    const url = raceResult as string;
    return getCachedUrl(trackId) ?? url;
  } catch (error) {
    if (error instanceof Error && error.message !== "timeout") {
      logger.warn("Cache wait failed, falling back to direct URL", {
        trackId,
        error: error.message,
      });
    }

    return audioUrl;
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
}

export function preloadTrackOnHover(track: Track): void {
  if (!track?.audioUrl) return;
  
  if (preloadCache.has(track.id) || completedTracks.has(track.id)) {
    return;
  }
  
  if (activePreloads.has(track.id)) {
    return;
  }
  
  if (isTrackFailedRecently(track.id)) {
    return;
  }
  
  preloadTrack(track.id, track.audioUrl, true).catch((error) => {
    logger.warn("Hover preload failed", {
      trackId: track.id,
      error: error instanceof Error ? error.message : String(error),
    });
  });
}

interface Collection {
  id: string;
  title: string;
}

export function useAudioPreloader(
  currentTrack: Track | null,
  queue: Track[],
  visibleTracks: Track[] = [],
  featuredTracks: Track[] = [],
  collections: Collection[] = [],
  allTracks: Track[] = [],
) {
  const scheduledTracksRef = useRef(new Set<string>());
  const visibleTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const previousVisibleIdsRef = useRef<string>("");
  const hasPrefetchedFeaturedRef = useRef(false);
  const hasEarlyPreloadedRef = useRef(false);
  const configRef = useRef<PreloadConfig>(runtimePreloadConfig);
  const [configVersion, setConfigVersion] = useState(0);
  const [hasActivatedWarmup, setHasActivatedWarmup] = useState(false);

  useEffect(() => {
    // Avoid preloading any audio until the user has explicitly picked a track.
    // This keeps startup in a true null state (no background "song loading").
    if (currentTrack && !hasActivatedWarmup) {
      setHasActivatedWarmup(true);
    }
  }, [currentTrack, hasActivatedWarmup]);

  // Early preload: Preload first featured track on page load for faster second-track experience
  // Note: First play on mobile uses direct URL (not cache) for gesture context preservation
  // This preload primarily benefits the SECOND track and desktop first-play scenarios
  useEffect(() => {
    if (
      hasEarlyPreloadedRef.current ||
      featuredTracks.length === 0 ||
      !configRef.current.prefetchFeaturedOnLoad ||
      !hasActivatedWarmup
    ) {
      return;
    }

    // Short delay to avoid competing with critical initial render
    // 300ms balances render priority vs. preload head start
    const timer = setTimeout(() => {
      if (hasEarlyPreloadedRef.current) return;
      hasEarlyPreloadedRef.current = true;

      const firstTrack = featuredTracks[0];
      if (firstTrack?.audioUrl) {
        // High priority ensures dedicated concurrent slot for early preload
        preloadTrack(firstTrack.id, firstTrack.audioUrl, true).catch(() => {
          // Silent failure - this is a best-effort optimization
        });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [featuredTracks, configVersion, hasActivatedWarmup]);

  useEffect(() => {
    let isMounted = true;

    const applyProfile = () => {
      const nextConfig = updateRuntimePreloadConfig(resolveConnection());
      configRef.current = nextConfig;
      if (isMounted) {
        setConfigVersion((value) => value + 1);
      }
    };

    applyProfile();

    const connection = resolveConnection();
    if (connection && typeof connection.addEventListener === "function") {
      const listener = () => applyProfile();
      connection.addEventListener("change", listener);
      return () => {
        isMounted = false;
        connection.removeEventListener?.("change", listener);
      };
    }

    return () => {
      isMounted = false;
    };
  }, []);

  const schedulePreload = useCallback((track: Track, priority: "high" | "low") => {
    if (!track?.audioUrl) {
      logger.warn("Cannot preload track: missing audioUrl", {
        trackId: track?.id,
        trackTitle: track?.title,
      });
      return;
    }

    if (preloadCache.has(track.id) || completedTracks.has(track.id)) {
      return;
    }

    if (activePreloads.has(track.id)) {
      return;
    }

    if (isTrackFailedRecently(track.id)) {
      return;
    }

    if (shouldSkipLowPriorityPreload(track, priority)) {
      // Avoid preloading very long tracks until the user actively requests them
      return;
    }

    const runPreload = (highPriority: boolean) =>
      preloadTrack(track.id, track.audioUrl, highPriority)
        .catch((error) => {
          logger.warn("Preload failed for track", {
            trackId: track.id,
            trackTitle: track.title,
            error: error instanceof Error ? error.message : String(error),
          });
        })
        .finally(() => {
          scheduledTracksRef.current.delete(track.id);
        });

    const startPreload = (highPriority: boolean) => {
      if (scheduledTracksRef.current.has(track.id)) {
        return;
      }

      scheduledTracksRef.current.add(track.id);
      runPreload(highPriority);
    };

    // Always start high-priority preloads immediately
    if (priority === "high") {
      startPreload(true);
      return;
    }

    // For low-priority, use minimal debounce (50ms) instead of long throttle + idle callback
    if (visibleTimeoutRef.current) {
      clearTimeout(visibleTimeoutRef.current);
    }

    const minimalDebounce = 50;

    visibleTimeoutRef.current = setTimeout(() => {
      startPreload(false);
    }, minimalDebounce);
  }, []);

  useEffect(() => {
    if (
      hasPrefetchedFeaturedRef.current ||
      featuredTracks.length === 0 ||
      !hasActivatedWarmup ||
      !configRef.current.prefetchFeaturedOnLoad
    ) {
      return;
    }

    hasPrefetchedFeaturedRef.current = true;
    const featuredLimit = configRef.current.featuredPreloadLimit;
    featuredTracks
      .filter((track) => track.id !== currentTrack?.id)
      .slice(0, featuredLimit)
      .forEach((track) => {
      schedulePreload(track, "high");
    });
  }, [featuredTracks, schedulePreload, configVersion, hasActivatedWarmup, currentTrack?.id]);

          useEffect(() => {
            const currentVisibleIds = visibleTracks.map((t) => t.id).join(",");
            if (currentVisibleIds === previousVisibleIdsRef.current) return;
            if (!hasActivatedWarmup) return;

            previousVisibleIdsRef.current = currentVisibleIds;

            if (visibleTracks.length > 0) {
              const visibleLimit = configRef.current.visiblePreloadLimit;
              visibleTracks
                .filter((track) => track.id !== currentTrack?.id)
                .slice(0, visibleLimit)
                .forEach((track) => {
                schedulePreload(track, "high");
              });
            }
          }, [visibleTracks, schedulePreload, configVersion, hasActivatedWarmup, currentTrack?.id]);

          useEffect(() => {
            if (!hasActivatedWarmup) return;
            if (collections.length === 0 || allTracks.length === 0) return;
            
            const collectionLimit = configRef.current.collectionLookaheadLimit;
            const collectionsToPreload = collections.slice(0, collectionLimit);
            
            collectionsToPreload.forEach((collection) => {
              const collectionTracks = allTracks.filter((track) => track.collection === collection.title);
              if (collectionTracks.length > 0) {
                const firstTrack = collectionTracks[0];
                if (firstTrack?.id !== currentTrack?.id) {
                  schedulePreload(firstTrack, "low");
                }
              }
            });
          }, [collections, allTracks, schedulePreload, configVersion, hasActivatedWarmup, currentTrack?.id]);

  useEffect(() => {
    if (!currentTrack) return;

    const currentIndex = queue.findIndex((t) => t.id === currentTrack.id);

    // Don't preload the currently playing track - the <audio> element is already
    // streaming it. Preloading it would create bandwidth competition and cause stuttering.
    // Only preload upcoming tracks in the queue.

    if (currentIndex !== -1) {
      const lookahead = configRef.current.queuePreloadLookahead;
      const endIndex = Math.min(queue.length, currentIndex + 1 + lookahead);
      for (let i = currentIndex + 1; i < endIndex; i += 1) {
        schedulePreload(queue[i], "high");
      }
    }

    return () => {
      if (visibleTimeoutRef.current) {
        clearTimeout(visibleTimeoutRef.current);
      }
    };
  }, [currentTrack, queue, schedulePreload, configVersion]);

  useEffect(
    () => () => {
      if (visibleTimeoutRef.current) {
        clearTimeout(visibleTimeoutRef.current);
        visibleTimeoutRef.current = undefined;
      }
    },
    [],
  );

  // L4: Visibility-based cache cleanup
  // When tab is hidden for 5+ minutes, reduce cache to free memory
  useEffect(() => {
    let hiddenTimeoutId: NodeJS.Timeout | undefined;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // After 5 minutes hidden, aggressively reduce cache to save memory
        hiddenTimeoutId = setTimeout(() => {
          if (document.hidden) {
            // Evict all but the most recently used tracks
            const maxCacheWhenHidden = 2;
            while (preloadCache.size > maxCacheWhenHidden) {
              let oldestKey: string | null = null;
              let oldestTime = Infinity;

              for (const [key, value] of preloadCache.entries()) {
                if (value.lastUsed < oldestTime) {
                  oldestTime = value.lastUsed;
                  oldestKey = key;
                }
              }

              if (!oldestKey) break;

              const cached = preloadCache.get(oldestKey);
              if (cached) {
                URL.revokeObjectURL(cached.url);
                preloadCache.delete(oldestKey);
                completedTracks.delete(oldestKey);
              }
            }

            // Cancel any pending preloads to save bandwidth
            for (const [trackId, controller] of activeControllers.entries()) {
              controller.abort();
              activeControllers.delete(trackId);
            }
            pendingPreloads.length = 0;

            logger.info("Audio preloader: Cache reduced due to extended tab hidden state");
          }
        }, 5 * 60 * 1000); // 5 minutes
      } else {
        // Tab became visible, cancel the cleanup timeout
        if (hiddenTimeoutId) {
          clearTimeout(hiddenTimeoutId);
          hiddenTimeoutId = undefined;
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (hiddenTimeoutId) {
        clearTimeout(hiddenTimeoutId);
      }
    };
  }, []);

  return {
    getCachedUrl,
    waitForCachedUrl,
    releaseTrack,
  };
}

export const __audioPreloaderTestUtils = {
  updateRuntimePreloadConfig,
  isHighThroughputConnection,
  DEFAULT_PRELOAD_CONFIG,
  LONG_TRACK_DURATION_THRESHOLD_SECONDS,
  shouldSkipLowPriorityPreload,
  preloadStats,
};
