/**
 * Logout API Route
 *
 * POST /api/auth/logout
 * Clears the session cookie.
 */

import { NextResponse } from 'next/server';
import { clearSession } from '@/lib/auth';
import { logger } from '@/lib/logger';

export async function POST() {
  try {
    await clearSession();
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('[Auth] Logout error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { success: false, message: 'Logout failed' },
      { status: 500 }
    );
  }
}
