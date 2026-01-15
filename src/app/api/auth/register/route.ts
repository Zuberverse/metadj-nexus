/**
 * Register API Route
 *
 * POST /api/auth/register
 * Creates a new user account and logs them in.
 */

import { NextRequest, NextResponse } from 'next/server';
import { registerUser, createSession } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { withOriginValidation } from '@/lib/validation/origin-validation';
import { getMaxRequestSize, readJsonBodyWithLimit } from '@/lib/validation/request-size';

type RegisterPayload = {
  email?: string;
  username?: string;
  password?: string;
  termsAccepted?: boolean;
};

export const POST = withOriginValidation(async (request: NextRequest, _context: unknown) => {
  try {
    const bodyResult = await readJsonBodyWithLimit<RegisterPayload>(
      request,
      getMaxRequestSize(request.nextUrl.pathname)
    );
    if (!bodyResult.ok) return bodyResult.response;

    const { email, username, password, termsAccepted } = bodyResult.data ?? {};

    if (!email || !username || !password) {
      return NextResponse.json(
        { success: false, message: 'Email, username, and password are required' },
        { status: 400 }
      );
    }

    if (!termsAccepted) {
      return NextResponse.json(
        { success: false, message: 'Terms & Conditions must be accepted' },
        { status: 400 }
      );
    }

    const user = await registerUser({ email, username, password });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Registration failed' },
        { status: 400 }
      );
    }

    await createSession(user);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        isAdmin: user.isAdmin,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed';
    logger.error('[Auth] Register error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { success: false, message },
      { status: 400 }
    );
  }
});
