import { NextResponse } from "next/server"
import { getDaydreamConfig } from "../utils"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/daydream/config
 * Check if Daydream API is configured (has API key) without creating streams
 */
export async function GET() {
  const { apiKey } = getDaydreamConfig()
  return NextResponse.json({ configured: Boolean(apiKey) })
}
