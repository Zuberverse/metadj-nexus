/**
 * Feedback Storage
 *
 * PostgreSQL-backed feedback storage via Drizzle.
 * Uses server/storage.ts for database operations.
 */

import 'server-only';

import {
  createFeedback as createFeedbackDb,
  getFeedbackById as getFeedbackByIdDb,
  getAllFeedback as getAllFeedbackDb,
  getPaginatedFeedback as getPaginatedFeedbackDb,
  updateFeedback as updateFeedbackDb,
  deleteFeedback as deleteFeedbackDb,
  getFeedbackStats as getFeedbackStatsDb,
} from '../../../server/storage';
import type {
  FeedbackItem,
  FeedbackType,
  FeedbackStatus,
  FeedbackSeverity,
  CreateFeedbackInput,
  UpdateFeedbackInput,
  FeedbackStats,
} from './types';
import type { Feedback } from '../../../shared/schema';

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toFeedbackItem(record: Feedback): FeedbackItem {
  return {
    id: record.id,
    type: record.type as FeedbackType,
    title: record.title,
    description: record.description,
    severity: (record.severity as FeedbackSeverity) ?? undefined,
    status: record.status as FeedbackStatus,
    userId: record.userId ?? undefined,
    userEmail: record.userEmail ?? undefined,
    createdAt: toIso(record.createdAt),
    updatedAt: toIso(record.updatedAt),
  };
}

/**
 * Create new feedback
 */
export async function createFeedback(
  input: CreateFeedbackInput,
  userId?: string,
  userEmail?: string
): Promise<FeedbackItem> {
  const created = await createFeedbackDb({
    ...input,
    userId,
    userEmail,
  });

  return toFeedbackItem(created);
}

/**
 * Get feedback by ID
 */
export async function getFeedbackById(id: string): Promise<FeedbackItem | null> {
  const item = await getFeedbackByIdDb(id);
  return item ? toFeedbackItem(item) : null;
}

/**
 * Get all feedback with optional filters
 */
export async function getAllFeedback(filters?: {
  type?: FeedbackType;
  status?: FeedbackStatus;
  userId?: string;
}): Promise<FeedbackItem[]> {
  const items = await getAllFeedbackDb(filters);
  return items.map(toFeedbackItem);
}

/**
 * Get paginated feedback with totals
 */
export async function getPaginatedFeedback(options: {
  page?: number;
  limit?: number;
  type?: FeedbackType;
  status?: FeedbackStatus;
  userId?: string;
}): Promise<{ feedback: FeedbackItem[]; total: number }> {
  const result = await getPaginatedFeedbackDb({
    page: options.page,
    limit: options.limit,
    type: options.type,
    status: options.status,
    userId: options.userId,
  });

  return {
    feedback: result.feedback.map(toFeedbackItem),
    total: result.total,
  };
}

/**
 * Update feedback
 */
export async function updateFeedback(
  id: string,
  input: UpdateFeedbackInput
): Promise<FeedbackItem | null> {
  const updated = await updateFeedbackDb(id, input);
  return updated ? toFeedbackItem(updated) : null;
}

/**
 * Delete feedback
 */
export async function deleteFeedback(id: string): Promise<boolean> {
  return deleteFeedbackDb(id);
}

/**
 * Get feedback statistics
 */
export async function getFeedbackStats(): Promise<FeedbackStats> {
  const stats = await getFeedbackStatsDb();

  return {
    total: stats.total,
    byType: {
      bug: stats.byType.bug ?? 0,
      feature: stats.byType.feature ?? 0,
      idea: stats.byType.idea ?? 0,
      feedback: stats.byType.feedback ?? 0,
    },
    byStatus: {
      new: stats.byStatus.new ?? 0,
      reviewed: stats.byStatus.reviewed ?? 0,
      'in-progress': stats.byStatus['in-progress'] ?? 0,
      resolved: stats.byStatus.resolved ?? 0,
      closed: stats.byStatus.closed ?? 0,
    },
  };
}
