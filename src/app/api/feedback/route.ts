/**
 * Feedback API Route
 *
 * GET /api/feedback - List all feedback (admin) or user's feedback
 * POST /api/feedback - Submit new feedback
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createFeedback, getPaginatedFeedback, type CreateFeedbackInput } from '@/lib/feedback';
import { logger } from '@/lib/logger';
import { resolveClientAddress } from '@/lib/network';
import { BoundedMap } from '@/lib/rate-limiting/bounded-map';
import { withOriginValidation } from '@/lib/validation/origin-validation';
import { getMaxRequestSize, readJsonBodyWithLimit } from '@/lib/validation/request-size';

const FEEDBACK_RATE_LIMIT = { maxRequests: 5, windowMs: 10 * 60 * 1000 };
const feedbackRateLimitMap = new BoundedMap<string, { count: number; resetAt: number }>(5000);

function checkFeedbackRateLimit(identifier: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = feedbackRateLimitMap.get(identifier);

  if (!record || now > record.resetAt) {
    feedbackRateLimitMap.set(identifier, {
      count: 1,
      resetAt: now + FEEDBACK_RATE_LIMIT.windowMs,
    });
    return { allowed: true };
  }

  if (record.count >= FEEDBACK_RATE_LIMIT.maxRequests) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  record.count += 1;
  return { allowed: true };
}

export async function GET(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as CreateFeedbackInput['type'] | null;
    const status = searchParams.get('status') as 'new' | 'reviewed' | 'in-progress' | 'resolved' | 'closed' | null;

    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');
    const parsedPage = pageParam ? parseInt(pageParam, 10) : NaN;
    const parsedLimit = limitParam ? parseInt(limitParam, 10) : NaN;
    const page = Number.isFinite(parsedPage) ? Math.max(1, parsedPage) : 1;
    const limit = Number.isFinite(parsedLimit) ? Math.min(100, Math.max(1, parsedLimit)) : 50;

    // Admin can see all feedback, users see only their own
    const filters = session.isAdmin
      ? { type: type || undefined, status: status || undefined }
      : { userId: session.id, type: type || undefined, status: status || undefined };

    const { feedback, total } = await getPaginatedFeedback({
      page,
      limit,
      ...filters,
    });
    const totalPages = Math.max(1, Math.ceil(total / Math.max(1, limit)));

    return NextResponse.json({
      success: true,
      feedback,
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error) {
    logger.error('[Feedback] List error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { success: false, message: 'Failed to fetch feedback' },
      { status: 500 }
    );
  }
}

type FeedbackPayload = {
  type?: CreateFeedbackInput['type'];
  title?: string;
  description?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
};

export const POST = withOriginValidation(async (request: NextRequest, _context: unknown) => {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { ip, fingerprint } = resolveClientAddress(request);
    const rateLimitId = session?.id
      ? `feedback-user:${session.id}`
      : `feedback-ip:${ip !== 'unknown' ? ip : fingerprint}`;

    const rateLimitCheck = checkFeedbackRateLimit(rateLimitId);
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { success: false, message: 'Too many feedback submissions. Please try again later.' },
        {
          status: 429,
          headers: rateLimitCheck.retryAfter ? { 'Retry-After': rateLimitCheck.retryAfter.toString() } : {},
        }
      );
    }

    const bodyResult = await readJsonBodyWithLimit<FeedbackPayload>(
      request,
      getMaxRequestSize(request.nextUrl.pathname)
    );
    if (!bodyResult.ok) return bodyResult.response;

    const { type, title, description, severity } = bodyResult.data ?? {};

    if (!type || !title || !description) {
      return NextResponse.json(
        { success: false, message: 'Type, title, and description are required' },
        { status: 400 }
      );
    }

    // Validate type
    if (!['bug', 'feature', 'feedback', 'idea'].includes(type)) {
      return NextResponse.json(
        { success: false, message: 'Invalid feedback type' },
        { status: 400 }
      );
    }

    // Validate severity if provided
    if (severity && !['low', 'medium', 'high', 'critical'].includes(severity)) {
      return NextResponse.json(
        { success: false, message: 'Invalid severity' },
        { status: 400 }
      );
    }

    const feedback = await createFeedback(
      { type, title, description, severity },
      session?.id,
      session?.email
    );

    return NextResponse.json({
      success: true,
      feedback,
    });
  } catch (error) {
    logger.error('[Feedback] Create error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { success: false, message: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
});
