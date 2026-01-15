/**
 * Analytics Event Ingestion API Route
 *
 * POST /api/analytics/event - Record analytics event for admin reporting
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { resolveClientAddress } from '@/lib/network';
import { BoundedMap } from '@/lib/rate-limiting/bounded-map';
import { withOriginValidation } from '@/lib/validation/origin-validation';
import { getMaxRequestSize, readJsonBodyWithLimit } from '@/lib/validation/request-size';
import { recordAnalyticsEvent } from '../../../../../server/storage';

const ANALYTICS_RATE_LIMIT = { maxRequests: 120, windowMs: 60_000 };
const analyticsRateLimitMap = new BoundedMap<string, { count: number; resetAt: number }>(5000);

const EVENT_NAME_REGEX = /^[a-z0-9_]{1,100}$/;
const MAX_PROPERTIES = 30;
const MAX_STRING_LENGTH = 200;

type AnalyticsPayload = {
  eventName?: string;
  properties?: Record<string, unknown>;
  context?: Record<string, unknown>;
};

function isAnalyticsDbEnabled(): boolean {
  if (process.env.ANALYTICS_DB_ENABLED === 'false') return false;
  if (process.env.ANALYTICS_DB_ENABLED === 'true') return true;
  return process.env.NODE_ENV === 'production';
}

function checkAnalyticsRateLimit(identifier: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = analyticsRateLimitMap.get(identifier);

  if (!record || now > record.resetAt) {
    analyticsRateLimitMap.set(identifier, {
      count: 1,
      resetAt: now + ANALYTICS_RATE_LIMIT.windowMs,
    });
    return { allowed: true };
  }

  if (record.count >= ANALYTICS_RATE_LIMIT.maxRequests) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  record.count += 1;
  return { allowed: true };
}

function sanitizeProperties(input: unknown): Record<string, string | number | boolean> | null {
  if (!input || typeof input !== 'object') return null;

  const out: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (Object.keys(out).length >= MAX_PROPERTIES) break;
    if (!/^[a-z0-9_]+$/.test(key)) continue;

    if (typeof value === 'string') {
      out[key] = value.length > MAX_STRING_LENGTH ? value.slice(0, MAX_STRING_LENGTH) : value;
      continue;
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      out[key] = value;
      continue;
    }
    if (typeof value === 'boolean') {
      out[key] = value;
    }
  }

  return Object.keys(out).length > 0 ? out : null;
}

export const POST = withOriginValidation(async (request: NextRequest, _context: unknown) => {
  if (!isAnalyticsDbEnabled() || !process.env.DATABASE_URL) {
    return NextResponse.json(
      { success: false, message: 'Analytics ingestion disabled' },
      { status: 202 }
    );
  }

  try {
    const { ip, fingerprint } = resolveClientAddress(request);
    const session = await getSession();
    const rateLimitId = session?.id
      ? `analytics-user:${session.id}`
      : `analytics-ip:${ip !== 'unknown' ? ip : fingerprint}`;

    const rateLimitCheck = checkAnalyticsRateLimit(rateLimitId);
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { success: false, message: 'Too many analytics events' },
        {
          status: 429,
          headers: rateLimitCheck.retryAfter ? { 'Retry-After': rateLimitCheck.retryAfter.toString() } : {},
        }
      );
    }

    const bodyResult = await readJsonBodyWithLimit<AnalyticsPayload>(
      request,
      getMaxRequestSize(request.nextUrl.pathname)
    );
    if (!bodyResult.ok) return bodyResult.response;

    const { eventName, properties, context } = bodyResult.data ?? {};

    if (!eventName || !EVENT_NAME_REGEX.test(eventName)) {
      return NextResponse.json(
        { success: false, message: 'Invalid event name' },
        { status: 400 }
      );
    }

    const sanitizedProperties = sanitizeProperties(properties);
    const sanitizedContext = sanitizeProperties(context);

    await recordAnalyticsEvent({
      eventName,
      userId: session?.id ?? null,
      source: 'client',
      properties: sanitizedProperties,
      context: sanitizedContext,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('[Analytics Ingest] Error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { success: false, message: 'Failed to record analytics event' },
      { status: 500 }
    );
  }
});
