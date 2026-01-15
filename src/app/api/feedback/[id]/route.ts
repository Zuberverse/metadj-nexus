/**
 * Individual Feedback API Route
 *
 * GET /api/feedback/[id] - Get single feedback item
 * PATCH /api/feedback/[id] - Update feedback (admin only)
 * DELETE /api/feedback/[id] - Delete feedback (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getFeedbackById, updateFeedback, deleteFeedback } from '@/lib/feedback';
import { logger } from '@/lib/logger';
import { withOriginValidation } from '@/lib/validation/origin-validation';
import { getMaxRequestSize, readJsonBodyWithLimit } from '@/lib/validation/request-size';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const feedback = await getFeedbackById(id);

    if (!feedback) {
      return NextResponse.json(
        { success: false, message: 'Feedback not found' },
        { status: 404 }
      );
    }

    // Users can only see their own feedback
    if (!session.isAdmin && feedback.userId !== session.id) {
      return NextResponse.json(
        { success: false, message: 'Not authorized' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      feedback,
    });
  } catch (error) {
    logger.error('[Feedback] Get error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { success: false, message: 'Failed to fetch feedback' },
      { status: 500 }
    );
  }
}

type FeedbackUpdatePayload = {
  status?: 'new' | 'reviewed' | 'in-progress' | 'resolved' | 'closed';
  severity?: 'low' | 'medium' | 'high' | 'critical';
};

export const PATCH = withOriginValidation(async (request: NextRequest, context: RouteContext) => {
  try {
    const session = await getSession();

    if (!session?.isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const bodyResult = await readJsonBodyWithLimit<FeedbackUpdatePayload>(
      request,
      getMaxRequestSize(request.nextUrl.pathname)
    );
    if (!bodyResult.ok) return bodyResult.response;

    const { status, severity } = bodyResult.data ?? {};

    // Validate status if provided
    if (status && !['new', 'reviewed', 'in-progress', 'resolved', 'closed'].includes(status)) {
      return NextResponse.json(
        { success: false, message: 'Invalid status' },
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

    const feedback = await updateFeedback(id, { status, severity });

    if (!feedback) {
      return NextResponse.json(
        { success: false, message: 'Feedback not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      feedback,
    });
  } catch (error) {
    logger.error('[Feedback] Update error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { success: false, message: 'Failed to update feedback' },
      { status: 500 }
    );
  }
});

export const DELETE = withOriginValidation(async (request: NextRequest, context: RouteContext) => {
  try {
    const session = await getSession();

    if (!session?.isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const success = await deleteFeedback(id);

    if (!success) {
      return NextResponse.json(
        { success: false, message: 'Feedback not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('[Feedback] Delete error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { success: false, message: 'Failed to delete feedback' },
      { status: 500 }
    );
  }
});
