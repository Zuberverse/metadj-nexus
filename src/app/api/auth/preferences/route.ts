/**
 * User Preferences API Route
 *
 * GET /api/auth/preferences - Get user preferences
 * PATCH /api/auth/preferences - Update user preferences
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getUserPreferences, updateAudioPreferences, ensureUserPreferences, type AudioPreferences } from '@/lib/preferences';
import { logger } from '@/lib/logger';
import { withOriginValidation } from '@/lib/validation/origin-validation';
import { getMaxRequestSize, readJsonBodyWithLimit } from '@/lib/validation/request-size';

const DEFAULT_PREFERENCES = {
  audio: { volume: 0.8, autoplay: false, crossfadeEnabled: false, muted: false },
  player: { repeatMode: 'none' as const, shuffleEnabled: false },
  cinema: { scene: null, posterOnly: false, dreamPresentation: null },
  metadjai: { provider: null, personalization: null, fullscreen: false },
};

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Admin user is virtual (no database record) - return defaults
    // Client should use localStorage for admin preferences
    if (session.id === 'admin') {
      return NextResponse.json({
        success: true,
        preferences: DEFAULT_PREFERENCES,
        isVirtualUser: true,
      });
    }

    let preferences = await getUserPreferences(session.id);
    
    if (!preferences) {
      await ensureUserPreferences(session.id);
      preferences = await getUserPreferences(session.id);
    }

    return NextResponse.json({
      success: true,
      preferences,
    });
  } catch (error) {
    logger.error('[Preferences] Get error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { success: false, message: 'Failed to get preferences' },
      { status: 500 }
    );
  }
}

type PreferencesPayload = {
  category: 'audio';
  updates: Partial<AudioPreferences>;
};

export const PATCH = withOriginValidation(async (request: NextRequest, _context: unknown) => {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Admin user is virtual - preferences should be stored client-side
    if (session.id === 'admin') {
      return NextResponse.json({
        success: true,
        message: 'Admin preferences should be stored locally',
        isVirtualUser: true,
      });
    }

    const bodyResult = await readJsonBodyWithLimit<PreferencesPayload>(
      request,
      getMaxRequestSize(request.nextUrl.pathname)
    );
    if (!bodyResult.ok) return bodyResult.response;

    const { category, updates } = bodyResult.data ?? {};

    if (category === 'audio') {
      const newAudio = await updateAudioPreferences(session.id, updates || {});
      return NextResponse.json({
        success: true,
        audio: newAudio,
      });
    }

    return NextResponse.json(
      { success: false, message: 'Invalid category' },
      { status: 400 }
    );
  } catch (error) {
    logger.error('[Preferences] Update error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { success: false, message: 'Failed to update preferences' },
      { status: 500 }
    );
  }
});
