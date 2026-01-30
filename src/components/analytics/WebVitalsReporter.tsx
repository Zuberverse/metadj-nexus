'use client';

import { useEffect } from 'react';

/**
 * Reports Core Web Vitals (LCP, CLS, INP) to the logger.
 * Mount once in the root layout. Runs only in the browser.
 */
export function WebVitalsReporter() {
  useEffect(() => {
    import('@/lib/web-vitals').then(({ initWebVitals }) => {
      initWebVitals();
    });
  }, []);

  return null;
}
