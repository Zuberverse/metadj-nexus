import { NextResponse } from "next/server"
import { daydreamFetch, parseJson, jsonError } from "../../../utils"
import type { NextRequest } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ streamId: string }> },
) {
  try {
    const { streamId } = await params
    if (!streamId) {
      return NextResponse.json({ error: "Missing streamId" }, { status: 400 })
    }

    const upstream = await daydreamFetch(`/v1/streams/${encodeURIComponent(streamId)}/status`, {
      method: "GET",
    })
    const body = await parseJson(upstream)

    if (!upstream.ok) {
      return NextResponse.json(
        { error: "Failed to fetch Daydream status", details: body },
        { status: upstream.status },
      )
    }

    return NextResponse.json(body)
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return jsonError("Daydream status request timed out", 504)
    }
    const message = error instanceof Error ? error.message : "Unexpected error"
    return jsonError(message, 500)
  }
}
