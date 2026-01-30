/**
 * Resend Email Utility
 *
 * Sends transactional emails for verification and password reset flows.
 */

import 'server-only';
import { Resend } from 'resend';
import { getAppBaseUrl } from '@/lib/app-url';
import { getServerEnv } from '@/lib/env';
import { logger } from '@/lib/logger';

type SendResult = { delivered: boolean; reason?: string };

let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  const env = getServerEnv();
  if (!env.RESEND_API_KEY) {
    return null;
  }

  if (!resendClient) {
    resendClient = new Resend(env.RESEND_API_KEY);
  }

  return resendClient;
}

function getFromAddress(): string {
  const env = getServerEnv();
  return env.RESEND_FROM || 'MetaDJ Nexus <noreply@metadjnexus.ai>';
}

export async function sendVerificationEmail(email: string, token: string): Promise<SendResult> {
  const client = getResendClient();
  const verifyUrl = `${getAppBaseUrl()}/api/auth/verify-email?token=${encodeURIComponent(token)}`;

  if (!client) {
    logger.warn('[Email] Resend not configured; verification email skipped', { email, verifyUrl });
    return { delivered: false, reason: 'not_configured' };
  }

  try {
    await client.emails.send({
      from: getFromAddress(),
      to: email,
      subject: 'Verify your MetaDJ Nexus email',
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5;color:#0f172a;">
          <h2 style="margin:0 0 12px;">Verify your email</h2>
          <p style="margin:0 0 16px;">Confirm your email to finish setting up your MetaDJ Nexus account.</p>
          <p style="margin:0 0 24px;"><a href="${verifyUrl}" style="color:#7c3aed;">Verify email</a></p>
          <p style="margin:0;font-size:12px;color:#475569;">If you didn't create this account, you can ignore this email.</p>
        </div>
      `,
    });
    return { delivered: true };
  } catch (error) {
    logger.error('[Email] Verification email send failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return { delivered: false, reason: 'send_failed' };
  }
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<SendResult> {
  const client = getResendClient();
  const resetUrl = `${getAppBaseUrl()}/reset-password?token=${encodeURIComponent(token)}`;

  if (!client) {
    logger.warn('[Email] Resend not configured; password reset email skipped', { email, resetUrl });
    return { delivered: false, reason: 'not_configured' };
  }

  try {
    await client.emails.send({
      from: getFromAddress(),
      to: email,
      subject: 'Reset your MetaDJ Nexus password',
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5;color:#0f172a;">
          <h2 style="margin:0 0 12px;">Reset your password</h2>
          <p style="margin:0 0 16px;">Use the link below to set a new password for your MetaDJ Nexus account.</p>
          <p style="margin:0 0 24px;"><a href="${resetUrl}" style="color:#7c3aed;">Reset password</a></p>
          <p style="margin:0;font-size:12px;color:#475569;">This link expires in 60 minutes.</p>
        </div>
      `,
    });
    return { delivered: true };
  } catch (error) {
    logger.error('[Email] Password reset email send failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return { delivered: false, reason: 'send_failed' };
  }
}
