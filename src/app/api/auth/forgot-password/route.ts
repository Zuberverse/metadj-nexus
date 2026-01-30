/**
 * Forgot Password API Route
 *
 * POST /api/auth/forgot-password
 * Always returns success to avoid email enumeration.
 */

import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail } from '@/lib/auth';
import { generateToken, hashToken } from '@/lib/auth/tokens';
import { sendPasswordResetEmail } from '@/lib/email/resend';
import { logger } from '@/lib/logger';
import { resolveClientAddress } from '@/lib/network';
import { buildRateLimitError, buildRateLimitHeaders, createRateLimiter } from '@/lib/rate-limiting/rate-limiter-core';
import { withOriginValidation } from '@/lib/validation/origin-validation';
import { getMaxRequestSize, readJsonBodyWithLimit } from '@/lib/validation/request-size';
import { createPasswordResetToken } from '../../../../../server/storage';

const FORGOT_PASSWORD_RATE_LIMIT = { maxRequests: 5, windowMs: 10 * 60 * 1000 };
const forgotPasswordLimiter = createRateLimiter({
  prefix: 'metadj:ratelimit:auth-forgot-password',
  maxRequests: FORGOT_PASSWORD_RATE_LIMIT.maxRequests,
  windowMs: FORGOT_PASSWORD_RATE_LIMIT.windowMs,
});

const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000;
const GENERIC_RESPONSE = {
  success: true,
  message: 'If an account exists for this email, a reset link has been sent.',
};

type ForgotPasswordPayload = {
  email?: string;
};

export const POST = withOriginValidation(async (request: NextRequest, _context: unknown) => {
  const bodyResult = await readJsonBodyWithLimit<ForgotPasswordPayload>(
    request,
    getMaxRequestSize(request.nextUrl.pathname)
  );
  if (!bodyResult.ok) return bodyResult.response;

  const email = bodyResult.data?.email?.toLowerCase().trim();
  if (!email) {
    return NextResponse.json({ success: false, message: 'Email is required' }, { status: 400 });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ success: false, message: 'Invalid email format' }, { status: 400 });
  }

  const { ip, fingerprint } = resolveClientAddress(request);
  const rateLimitId = ip !== 'unknown'
    ? `auth-forgot-ip:${ip}`
    : `auth-forgot-fp:${fingerprint}`;
  const rateLimit = await forgotPasswordLimiter.check(rateLimitId);
  if (!rateLimit.allowed) {
    const error = buildRateLimitError(
      rateLimit.remainingMs ?? FORGOT_PASSWORD_RATE_LIMIT.windowMs,
      'Too many reset attempts. Please wait before trying again.'
    );
    return NextResponse.json(
      { success: false, message: error.error, retryAfter: error.retryAfter },
      { status: 429, headers: buildRateLimitHeaders(rateLimit, FORGOT_PASSWORD_RATE_LIMIT.maxRequests) }
    );
  }

  try {
    const user = await findUserByEmail(email);
    if (user) {
      const token = generateToken();
      const tokenHash = hashToken(token);
      const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);
      await createPasswordResetToken(user.id, tokenHash, expiresAt, ip !== 'unknown' ? ip : undefined);

      const result = await sendPasswordResetEmail(user.email, token);
      if (!result.delivered) {
        logger.warn('[Auth] Password reset email not delivered', { email, reason: result.reason });
      }
    }
  } catch (error) {
    logger.error('[Auth] Forgot password error', {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return NextResponse.json(GENERIC_RESPONSE);
});
