import { NextResponse } from "next/server"
import { getDaydreamConfig } from "../utils"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/daydream/config
 * Check if Daydream API is configured (has API key) without creating streams
 */
export async function GET() {
  const { apiKey, publicEnabled } = getDaydreamConfig()
  const configured = Boolean(apiKey && publicEnabled)
  return NextResponse.json({ configured, enabled: publicEnabled })
}
