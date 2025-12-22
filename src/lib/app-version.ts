/**
 * Single source of truth for the UI-facing app version.
 *
 * When NEXT_PUBLIC_APP_VERSION is provided (e.g., in Replit secrets) it takes
 * precedence. Otherwise we fall back to the package.json version that shipped
 * with this build. Update the fallback whenever package.json bumps.
 */
const rawVersion =
  process.env.NEXT_PUBLIC_APP_VERSION ||
  (process.env.npm_package_version as string | undefined) ||
  '0.8.0';

const DECIMAL_VERSION_REGEX = /^\d+\.\d{2}$/;

function toDisplayVersion(version: string): string {
  if (DECIMAL_VERSION_REGEX.test(version)) {
    return version;
  }

  const [major = '0', minor = '0', patch = '0'] = version.split('.');
  const minorInt = Number.parseInt(minor, 10);
  const patchInt = Number.parseInt(patch, 10);
  const safeMinor = Number.isFinite(minorInt) ? minorInt : 0;
  const safePatch = Number.isFinite(patchInt) ? patchInt : 0;

  // Preserve full semver when patch versions exceed a single digit to avoid ambiguous decimals
  if (safePatch >= 10 || safeMinor >= 10) {
    return `${major}.${safeMinor}.${safePatch}`;
  }

  const decimalValue = safeMinor * 10 + safePatch;
  const decimalString = decimalValue.toString().padStart(2, '0');

  return `${major}.${decimalString}`;
}

/**
 * Human-facing version (major + two-digit decimal)
 * Examples:
 *  - 0.9.0 → 0.90
 *  - 0.8.0 → 0.80
 *  - 0.7.1 → 0.71
 */
export const APP_VERSION = toDisplayVersion(rawVersion);

/**
 * Raw semver pulled from package.json (useful for tooling that expects x.y.z)
 */
export const RAW_APP_VERSION = rawVersion;
