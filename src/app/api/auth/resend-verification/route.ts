/**
 * Resend Email Verification API Route
 *
 * POST /api/auth/resend-verification
 * Requires authenticated session.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { generateToken, hashToken } from '@/lib/auth/tokens';
import { sendVerificationEmail } from '@/lib/email/resend';
import { logger } from '@/lib/logger';
import { resolveClientAddress } from '@/lib/network';
import { buildRateLimitError, buildRateLimitHeaders, createRateLimiter } from '@/lib/rate-limiting/rate-limiter-core';
import { withOriginValidation } from '@/lib/validation/origin-validation';
import { createEmailVerificationToken, findUserById } from '../../../../../server/storage';

const RESEND_RATE_LIMIT = { maxRequests: 3, windowMs: 10 * 60 * 1000 };
const resendLimiter = createRateLimiter({
  prefix: 'metadj:ratelimit:auth-resend-verification',
  maxRequests: RESEND_RATE_LIMIT.maxRequests,
  windowMs: RESEND_RATE_LIMIT.windowMs,
});

const VERIFY_TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000;

export const POST = withOriginValidation(async (request: NextRequest, _context: unknown) => {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
  }

  const { ip, fingerprint } = resolveClientAddress(request);
  const rateLimitId = `auth-resend:${session.id || ip || fingerprint}`;
  const rateLimit = await resendLimiter.check(rateLimitId);
  if (!rateLimit.allowed) {
    const error = buildRateLimitError(
      rateLimit.remainingMs ?? RESEND_RATE_LIMIT.windowMs,
      'Too many verification requests. Please wait before trying again.'
    );
    return NextResponse.json(
      { success: false, message: error.error, retryAfter: error.retryAfter },
      { status: 429, headers: buildRateLimitHeaders(rateLimit, RESEND_RATE_LIMIT.maxRequests) }
    );
  }

  try {
    const user = await findUserById(session.id);
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ success: true, message: 'Email already verified' });
    }

    const token = generateToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + VERIFY_TOKEN_EXPIRY_MS);
    await createEmailVerificationToken(user.id, user.email, tokenHash, expiresAt);

    const result = await sendVerificationEmail(user.email, token);
    if (!result.delivered) {
      logger.warn('[Auth] Verification email not delivered', { userId: user.id, reason: result.reason });
    }

    return NextResponse.json({ success: true, message: 'Verification email sent' });
  } catch (error) {
    logger.error('[Auth] Resend verification error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { success: false, message: 'Failed to send verification email' },
      { status: 500 }
    );
  }
});
