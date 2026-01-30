/**
 * Verify Email API Route
 *
 * GET /api/auth/verify-email?token=...
 * Validates verification token and marks email as verified.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAppBaseUrl } from '@/lib/app-url';
import { hashToken } from '@/lib/auth/tokens';
import { SESSION_COOKIE_NAME, SESSION_COOKIE_PATH } from '@/lib/auth/session';
import { logger } from '@/lib/logger';
import { consumeEmailVerificationToken, deleteVerificationTokensForUser, findEmailVerificationByToken, updateUserEmailVerified } from '../../../../../server/storage';

export async function GET(request: NextRequest) {
  const appBaseUrl = getAppBaseUrl();
  const redirectUrl = new URL('/', appBaseUrl);
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    redirectUrl.searchParams.set('verify', 'missing');
    return NextResponse.redirect(redirectUrl);
  }

  try {
    const tokenHash = hashToken(token);
    const record = await findEmailVerificationByToken(tokenHash);
    if (!record) {
      redirectUrl.searchParams.set('verify', 'invalid');
      return NextResponse.redirect(redirectUrl);
    }

    await updateUserEmailVerified(record.userId, true);
    await consumeEmailVerificationToken(record.id);
    await deleteVerificationTokensForUser(record.userId);

    redirectUrl.searchParams.set('verify', 'success');
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.set(SESSION_COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: SESSION_COOKIE_PATH,
    });
    return response;
  } catch (error) {
    logger.error('[Auth] Verify email error', {
      error: error instanceof Error ? error.message : String(error),
    });
    redirectUrl.searchParams.set('verify', 'error');
    return NextResponse.redirect(redirectUrl);
  }
}
