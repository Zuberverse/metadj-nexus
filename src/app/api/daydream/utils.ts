import { NextResponse } from "next/server"
import { logger } from "@/lib/logger"

const DEFAULT_DAYDREAM_BASE = "https://api.daydream.live"
const DEFAULT_TIMEOUT_MS = 30000

/**
 * Trusted Daydream API gateway hostnames.
 * Only these domains are allowed for API requests.
 */
const TRUSTED_API_HOSTS = [
  "api.daydream.live",
  "daydream.live",
  "sdaydream.live",
] as const

/**
 * Validates a Daydream API gateway URL.
 *
 * @param urlString - The URL to validate
 * @returns The validated URL or null if invalid
 */
function validateGatewayUrl(urlString: string): string | null {
  try {
    const url = new URL(urlString)

    // Must be HTTPS in production
    if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
      logger.error("Daydream API gateway must use HTTPS in production", {
        url: urlString,
        protocol: url.protocol,
      })
      return null
    }

    // Must be a trusted hostname
    if (!TRUSTED_API_HOSTS.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`))) {
      logger.error("Daydream API gateway hostname not in trusted list", {
        hostname: url.hostname,
        trustedHosts: TRUSTED_API_HOSTS,
      })
      return null
    }

    // Remove trailing slashes
    return url.origin
  } catch (error) {
    logger.error("Invalid Daydream API gateway URL", {
      url: urlString,
      error: error instanceof Error ? error.message : String(error),
    })
    return null
  }
}

export function getDaydreamConfig() {
  // Access env directly - bypass validation layer due to Next.js 16 Turbopack loading timing
  const apiKey = process.env.DAYDREAM_API_KEY || ""
  const publicFlag = process.env.DAYDREAM_PUBLIC_ENABLED
  const publicEnabled =
    publicFlag === "true" ||
    (process.env.NODE_ENV !== "production" && publicFlag !== "false")

  // Validate the gateway URL
  const rawGateway = process.env.DAYDREAM_API_GATEWAY
  let base = DEFAULT_DAYDREAM_BASE

  if (rawGateway) {
    const validated = validateGatewayUrl(rawGateway)
    if (validated) {
      base = validated
    } else {
      // Fall back to default on validation failure
      logger.warn("Falling back to default Daydream gateway due to validation failure")
    }
  }

  const allowedHosts = (process.env.DAYDREAM_WHIP_ALLOWED_HOSTS || "").split(",").map((h) => h.trim()).filter(Boolean)
  const allowDevWhip = process.env.DAYDREAM_WHIP_ALLOW_DEV === "true"
  return { apiKey, base, allowedHosts, allowDevWhip, publicEnabled }
}

export async function daydreamFetch(path: string, init: RequestInit = {}, timeoutMs: number = DEFAULT_TIMEOUT_MS) {
  const { apiKey, base } = getDaydreamConfig()
  if (!apiKey) {
    throw new Error("DAYDREAM_API_KEY not configured")
  }

  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`
  const headers = new Headers(init.headers)
  headers.set("Authorization", `Bearer ${apiKey}`)
  headers.set("Accept", "application/json")
  headers.set("X-Requested-By", "MetaDJ Nexus")
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, {
      ...init,
      headers,
      cache: "no-store",
      signal: controller.signal,
    })
    return response
  } finally {
    clearTimeout(timeout)
  }
}

export async function parseJson(response: Response) {
  const text = await response.text()
  try {
    return text ? JSON.parse(text) : {}
  } catch {
    return { raw: text }
  }
}

export function jsonError(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status })
}
