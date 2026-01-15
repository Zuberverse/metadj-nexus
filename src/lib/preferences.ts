/**
 * User Preferences Management
 *
 * Functions for getting and updating user preferences in the database.
 */

import 'server-only';

import { eq } from 'drizzle-orm';
import { db } from '../../server/db';
import { userPreferences } from '../../shared/schema';

export interface AudioPreferences {
  volume: number;
  autoplay: boolean;
  crossfadeEnabled: boolean;
  muted: boolean;
}

export interface PlayerPreferences {
  repeatMode: 'none' | 'track' | 'queue';
  shuffleEnabled: boolean;
}

export interface CinemaPreferences {
  scene: string | null;
  posterOnly: boolean;
  dreamPresentation: string | null;
}

export interface MetaDJaiPreferences {
  provider: string | null;
  personalization: string | null;
  fullscreen: boolean;
}

export interface AllPreferences {
  audio: AudioPreferences;
  player: PlayerPreferences;
  cinema: CinemaPreferences;
  metadjai: MetaDJaiPreferences;
}

const DEFAULT_AUDIO_PREFERENCES: AudioPreferences = {
  volume: 0.8,
  autoplay: false,
  crossfadeEnabled: false,
  muted: false,
};

const DEFAULT_PLAYER_PREFERENCES: PlayerPreferences = {
  repeatMode: 'none',
  shuffleEnabled: false,
};

const DEFAULT_CINEMA_PREFERENCES: CinemaPreferences = {
  scene: null,
  posterOnly: false,
  dreamPresentation: null,
};

const DEFAULT_METADJAI_PREFERENCES: MetaDJaiPreferences = {
  provider: null,
  personalization: null,
  fullscreen: false,
};

/**
 * Get user preferences by user ID
 */
export async function getUserPreferences(userId: string): Promise<AllPreferences | null> {
  const result = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  const prefs = result[0];

  return {
    audio: { ...DEFAULT_AUDIO_PREFERENCES, ...(prefs.audioPreferences as Partial<AudioPreferences> || {}) },
    player: DEFAULT_PLAYER_PREFERENCES,
    cinema: DEFAULT_CINEMA_PREFERENCES,
    metadjai: DEFAULT_METADJAI_PREFERENCES,
  };
}

/**
 * Update user audio preferences
 */
export async function updateAudioPreferences(
  userId: string,
  updates: Partial<AudioPreferences>
): Promise<AudioPreferences> {
  const existing = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);

  const currentAudio = existing.length > 0
    ? { ...DEFAULT_AUDIO_PREFERENCES, ...(existing[0].audioPreferences as Partial<AudioPreferences> || {}) }
    : DEFAULT_AUDIO_PREFERENCES;

  const newAudio = { ...currentAudio, ...updates };

  if (existing.length === 0) {
    await db.insert(userPreferences).values({
      id: crypto.randomUUID(),
      userId,
      audioPreferences: newAudio,
    });
  } else {
    await db
      .update(userPreferences)
      .set({
        audioPreferences: newAudio,
        updatedAt: new Date(),
      })
      .where(eq(userPreferences.userId, userId));
  }

  return newAudio;
}

/**
 * Ensure user has a preferences record (creates if doesn't exist)
 */
export async function ensureUserPreferences(userId: string): Promise<void> {
  const existing = await db
    .select({ id: userPreferences.id })
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(userPreferences).values({
      id: crypto.randomUUID(),
      userId,
      audioPreferences: DEFAULT_AUDIO_PREFERENCES,
    });
  }
}
