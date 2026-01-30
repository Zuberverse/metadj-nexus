'use client';

import { useEffect } from 'react';

/**
 * Development-only accessibility reporter using @axe-core/react.
 * Logs WCAG violations to the browser console during development.
 * Renders nothing and is completely tree-shaken from production builds.
 */
export function AxeDevReporter() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    import('@/lib/axe').then(({ initAxe }) => {
      initAxe();
    });
  }, []);

  return null;
}
