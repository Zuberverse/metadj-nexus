/**
 * Axe-core accessibility validation for development
 *
 * This module integrates axe-core for runtime accessibility auditing
 * in development mode only. It will not run in production builds.
 *
 * Installation required: npm install --save-dev @axe-core/react
 *
 * Usage: Import this file in the root layout to enable automatic
 * accessibility checks in development.
 */

let hasInitialized = false;

export async function initAxe() {
  // Only run in development, in browser, and only initialize once
  if (process.env.NODE_ENV !== 'development' || typeof window === 'undefined' || hasInitialized) {
    return;
  }

  try {
    const React = await import('react');
    const ReactDOM = await import('react-dom');
    const axe = await import('@axe-core/react');

    hasInitialized = true;

    // Initialize axe with 1 second delay for better performance
    await axe.default(React.default, ReactDOM.default, 1000, {
      rules: [
        // Enable all WCAG 2.1 AA rules
        { id: 'color-contrast', enabled: true },
        { id: 'label', enabled: true },
        { id: 'button-name', enabled: true },
        { id: 'link-name', enabled: true },
        { id: 'image-alt', enabled: true },
        { id: 'input-button-name', enabled: true },
        { id: 'form-field-multiple-labels', enabled: true },
      ],
    });
  } catch (error) {
    // Silently fail if axe-core is not installed
    // Error details available in dev tools if needed
  }
}
