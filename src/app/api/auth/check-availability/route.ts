/**
 * Check Availability API Route
 *
 * POST /api/auth/check-availability
 * Checks if a username or email is available for registration.
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkUsernameAvailability, checkEmailAvailability } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { withOriginValidation } from '@/lib/validation/origin-validation';
import { getMaxRequestSize, readJsonBodyWithLimit } from '@/lib/validation/request-size';

type AvailabilityPayload = {
  type?: 'username' | 'email';
  value?: string;
  excludeUserId?: string;
};

export const POST = withOriginValidation(async (request: NextRequest, _context: unknown) => {
  try {
    const bodyResult = await readJsonBodyWithLimit<AvailabilityPayload>(
      request,
      getMaxRequestSize(request.nextUrl.pathname)
    );
    if (!bodyResult.ok) return bodyResult.response;

    const { type, value, excludeUserId } = bodyResult.data ?? {};

    if (!type || !value) {
      return NextResponse.json(
        { success: false, message: 'Type and value are required' },
        { status: 400 }
      );
    }

    if (type === 'username') {
      const result = await checkUsernameAvailability(value, excludeUserId);
      return NextResponse.json({
        success: true,
        available: result.available,
        error: result.error,
      });
    }

    if (type === 'email') {
      const result = await checkEmailAvailability(value, excludeUserId);
      return NextResponse.json({
        success: true,
        available: result.available,
        error: result.error,
      });
    }

    return NextResponse.json(
      { success: false, message: 'Invalid type. Must be "username" or "email"' },
      { status: 400 }
    );
  } catch (error) {
    logger.error('[Auth] Check availability error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { success: false, message: 'An error occurred' },
      { status: 500 }
    );
  }
});
