/**
 * Admin Users API Route
 *
 * GET /api/admin/users - List all users with pagination (SQL-level)
 * Query params: ?page=1&limit=20&search=email
 */

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { getPaginatedUsers } from '../../../../../server/storage';

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const search = searchParams.get('search') || '';

    // Use SQL-level pagination for scalability
    const { users: paginatedUsers, total } = await getPaginatedUsers({
      page,
      limit,
      search,
    });

    const usersWithoutPassword = paginatedUsers.map((user) => ({
      id: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
      status: user.status,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      users: usersWithoutPassword,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    logger.error('[Admin Users] List error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { success: false, message: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
