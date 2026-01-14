/**
 * Media Storage Provider - Cloudflare R2
 *
 * Unified interface for media file storage using Cloudflare R2 (S3-compatible, zero egress).
 * R2 is the primary and only storage provider.
 */

import { logger } from '@/lib/logger';
import {
  getR2MusicBucket,
  getR2VisualsBucket,
  r2Diagnostics,
} from '@/lib/r2-storage';
import type { StorageBucket } from '@/lib/storage/storage.types';

/**
 * Storage provider - R2 only
 */
export const STORAGE_PROVIDER = 'r2' as const;

// Log active provider at startup (skip in test environment)
if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
  logger.info(`Media storage provider: ${STORAGE_PROVIDER}`);
}

/**
 * Get music bucket from R2
 */
export async function getMusicBucket(): Promise<StorageBucket | null> {
  return getR2MusicBucket();
}

/**
 * Alias for getMusicBucket (backward compatibility)
 */
export async function getAudioBucket(): Promise<StorageBucket | null> {
  return getR2MusicBucket();
}

/**
 * Get visuals bucket from R2
 */
export async function getVisualsBucket(): Promise<StorageBucket | null> {
  return getR2VisualsBucket();
}

/**
 * Alias for getVisualsBucket (backward compatibility)
 */
export async function getVideoBucket(): Promise<StorageBucket | null> {
  return getR2VisualsBucket();
}

/**
 * Storage diagnostics from R2 provider
 */
export const storageDiagnostics = {
  provider: STORAGE_PROVIDER,
  r2: r2Diagnostics,
  active: r2Diagnostics,
};
