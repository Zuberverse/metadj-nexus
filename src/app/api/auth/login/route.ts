/**
 * Login API Route
 *
 * POST /api/auth/login
 * Authenticates a user with email/password and creates a session.
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, createSession } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { resolveClientAddress } from '@/lib/network';
import { withOriginValidation } from '@/lib/validation/origin-validation';
import { getMaxRequestSize, readJsonBodyWithLimit } from '@/lib/validation/request-size';
import { getRecentLoginAttempts, getRecentLoginAttemptsByIp, recordLoginAttempt } from '../../../../../server/storage';

type LoginPayload = {
  email?: string;
  password?: string;
};

const MAX_FAILED_ATTEMPTS = 5;
const ATTEMPT_WINDOW_MINUTES = 15;

function getRetryAfterSeconds(attempts: { createdAt: Date }[], windowMs: number): number {
  if (!attempts.length) return 60;
  const oldest = attempts[0]?.createdAt instanceof Date
    ? attempts[0].createdAt.getTime()
    : new Date(attempts[0].createdAt).getTime();
  const retryAfterMs = oldest + windowMs - Date.now();
  return Math.max(1, Math.ceil(retryAfterMs / 1000));
}

export const POST = withOriginValidation(async (request: NextRequest, _context: unknown) => {
  try {
    const bodyResult = await readJsonBodyWithLimit<LoginPayload>(
      request,
      getMaxRequestSize(request.nextUrl.pathname)
    );
    if (!bodyResult.ok) return bodyResult.response;

    const { email, password } = bodyResult.data ?? {};

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    const { ip } = resolveClientAddress(request);
    const ipAddress = ip !== 'unknown' ? ip : null;
    const windowMs = ATTEMPT_WINDOW_MINUTES * 60 * 1000;

    const [emailAttempts, ipAttempts] = await Promise.all([
      getRecentLoginAttempts(email, ATTEMPT_WINDOW_MINUTES),
      ipAddress ? getRecentLoginAttemptsByIp(ipAddress, ATTEMPT_WINDOW_MINUTES) : Promise.resolve([]),
    ]);

    const emailFailures = emailAttempts.filter((attempt) => !attempt.success);
    const ipFailures = ipAttempts.filter((attempt) => !attempt.success);

    if (emailFailures.length >= MAX_FAILED_ATTEMPTS || ipFailures.length >= MAX_FAILED_ATTEMPTS) {
      const retryAfter = getRetryAfterSeconds(
        emailFailures.length >= MAX_FAILED_ATTEMPTS ? emailFailures : ipFailures,
        windowMs
      );
      return NextResponse.json(
        { success: false, message: 'Too many login attempts. Please try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': retryAfter.toString() },
        }
      );
    }

    const user = await authenticateUser({ email, password });

    await recordLoginAttempt(email, ipAddress, Boolean(user));

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
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
    logger.error('[Auth] Login error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { success: false, message: 'An error occurred during login' },
      { status: 500 }
    );
  }
});
