import { NextResponse } from "next/server"

const DEFAULT_DAYDREAM_BASE = "https://api.daydream.live"
const DEFAULT_TIMEOUT_MS = 30000

export function getDaydreamConfig() {
  // Access env directly - bypass validation layer due to Next.js 16 Turbopack loading timing
  const apiKey = process.env.DAYDREAM_API_KEY || ""
  const base = (process.env.DAYDREAM_API_GATEWAY || DEFAULT_DAYDREAM_BASE).replace(/\/+$/, "")
  const allowedHosts = (process.env.DAYDREAM_WHIP_ALLOWED_HOSTS || "").split(",").map((h) => h.trim()).filter(Boolean)
  const allowDevWhip = process.env.DAYDREAM_WHIP_ALLOW_DEV === "true"
  return { apiKey, base, allowedHosts, allowDevWhip }
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
