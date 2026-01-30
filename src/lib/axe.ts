/**
 * Axe-core accessibility automation for development mode.
 *
 * Dynamically imports @axe-core/react so the ~250KB library
 * is never bundled into production. Violations are logged to
 * the browser console as warnings with WCAG rule references.
 *
 * Call once from a client-side useEffect; subsequent calls are no-ops.
 */

let initialized = false;

export async function initAxe(): Promise<void> {
  if (initialized) return;
  if (process.env.NODE_ENV !== 'development') return;
  if (typeof window === 'undefined') return;

  initialized = true;

  try {
    const React = await import('react');
    const ReactDOM = await import('react-dom');
    const axe = await import('@axe-core/react');

    // Wait for initial render to complete before scanning
    setTimeout(() => {
      axe.default(React.default, ReactDOM, 1000);
    }, 1000);
  } catch {
    // Silently skip if axe-core is not available (CI, production, etc.)
  }
}
