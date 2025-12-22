import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";

/**
 * Resolve the most trustworthy client identifier available for rate limiting and logging.
 * Uses trusted proxy headers (Next.js 15+ removed request.ip).
 * Falls back to "unknown" when no signal is available.
 */
export function resolveClientAddress(request: NextRequest): {
  ip: string;
  fingerprint: string;
} {
  // Next.js 15+ removed request.ip, use headers instead
  const realIp = request.headers.get("x-real-ip")?.trim();
  const forwarded = request.headers.get("x-forwarded-for");
  const forwardedIp = forwarded ? forwarded.split(",")[0]?.trim() : undefined;

  const resolved =
    realIp && realIp !== ""
      ? realIp
      : forwardedIp && forwardedIp !== ""
      ? forwardedIp
      : "unknown";

  const fingerprint = createHash("sha256").update(resolved).digest("hex");

  return {
    ip: resolved,
    fingerprint,
  };
}
