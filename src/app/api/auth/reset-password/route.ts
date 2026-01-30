/**
 * Reset Password API Route
 *
 * POST /api/auth/reset-password
 * Validates reset token and updates password.
 */

import { NextRequest, NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth/password';
import { hashToken } from '@/lib/auth/tokens';
import { SESSION_COOKIE_NAME, SESSION_COOKIE_PATH } from '@/lib/auth/session';
import { logger } from '@/lib/logger';
import { buildRateLimitError, buildRateLimitHeaders, createRateLimiter } from '@/lib/rate-limiting/rate-limiter-core';
import { withOriginValidation } from '@/lib/validation/origin-validation';
import { getMaxRequestSize, readJsonBodyWithLimit } from '@/lib/validation/request-size';
import { deletePasswordResetsForUser, findPasswordResetByToken, markPasswordResetUsed, updateUserPassword } from '../../../../../server/storage';

const RESET_RATE_LIMIT = { maxRequests: 6, windowMs: 10 * 60 * 1000 };
const resetLimiter = createRateLimiter({
  prefix: 'metadj:ratelimit:auth-reset-password',
  maxRequests: RESET_RATE_LIMIT.maxRequests,
  windowMs: RESET_RATE_LIMIT.windowMs,
});

type ResetPasswordPayload = {
  token?: string;
  newPassword?: string;
};

export const POST = withOriginValidation(async (request: NextRequest, _context: unknown) => {
  const bodyResult = await readJsonBodyWithLimit<ResetPasswordPayload>(
    request,
    getMaxRequestSize(request.nextUrl.pathname)
  );
  if (!bodyResult.ok) return bodyResult.response;

  const token = bodyResult.data?.token?.trim();
  const newPassword = bodyResult.data?.newPassword?.trim();

  if (!token || !newPassword) {
    return NextResponse.json(
      { success: false, message: 'Token and new password are required' },
      { status: 400 }
    );
  }

  if (newPassword.length < 8) {
    return NextResponse.json(
      { success: false, message: 'Password must be at least 8 characters' },
      { status: 400 }
    );
  }

  const rateLimitId = `auth-reset:${hashToken(token).slice(0, 16)}`;
  const rateLimit = await resetLimiter.check(rateLimitId);
  if (!rateLimit.allowed) {
    const error = buildRateLimitError(
      rateLimit.remainingMs ?? RESET_RATE_LIMIT.windowMs,
      'Too many reset attempts. Please wait before trying again.'
    );
    return NextResponse.json(
      { success: false, message: error.error, retryAfter: error.retryAfter },
      { status: 429, headers: buildRateLimitHeaders(rateLimit, RESET_RATE_LIMIT.maxRequests) }
    );
  }

  try {
    const tokenHash = hashToken(token);
    const resetRecord = await findPasswordResetByToken(tokenHash);
    if (!resetRecord) {
      return NextResponse.json(
        { success: false, message: 'Reset link is invalid or expired' },
        { status: 400 }
      );
    }

    const newPasswordHash = await hashPassword(newPassword);
    await updateUserPassword(resetRecord.userId, newPasswordHash);
    await markPasswordResetUsed(resetRecord.id);
    await deletePasswordResetsForUser(resetRecord.userId);

    const response = NextResponse.json({ success: true });
    response.cookies.set(SESSION_COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: SESSION_COOKIE_PATH,
    });

    return response;
  } catch (error) {
    logger.error('[Auth] Reset password error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { success: false, message: 'Failed to reset password' },
      { status: 500 }
    );
  }
});
