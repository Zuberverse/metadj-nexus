/**
 * Admin User Stats API Route
 *
 * GET /api/admin/users/stats - Get user statistics
 */

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { getUserStats } from '../../../../../../server/storage';

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    if (!session.isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const stats = await getUserStats();

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    logger.error('[Admin User Stats] Error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { success: false, message: 'Failed to fetch user statistics' },
      { status: 500 }
    );
  }
}
