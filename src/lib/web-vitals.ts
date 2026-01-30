/**
 * Web Vitals Reporting
 *
 * Captures Core Web Vitals (LCP, CLS, INP) and reports them
 * through the existing logger infrastructure which forwards
 * to /api/log in production.
 *
 * Metrics are only reported once per page load to avoid noise.
 */

import { onCLS, onINP, onLCP, type Metric } from 'web-vitals';
import { logger } from '@/lib/logger';

function reportMetric(metric: Metric): void {
  logger.info(`[Web Vitals] ${metric.name}`, {
    name: metric.name,
    value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
    rating: metric.rating,
    navigationType: metric.navigationType,
  });
}

/**
 * Initialize web vitals collection.
 * Call once from a client component mounted in the root layout.
 */
export function initWebVitals(): void {
  onLCP(reportMetric);
  onCLS(reportMetric);
  onINP(reportMetric);
}
