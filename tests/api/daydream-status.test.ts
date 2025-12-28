import { NextRequest, NextResponse } from "next/server"
import { describe, it, expect, beforeEach, vi } from "vitest"
import { GET as statusGet } from "@/app/api/daydream/streams/[streamId]/status/route"

const daydreamFetchMock = vi.hoisted(() => vi.fn())
const parseJsonMock = vi.hoisted(() => vi.fn())
const getClientIdentifierMock = vi.hoisted(() => vi.fn())
const getActiveStreamMock = vi.hoisted(() => vi.fn())

vi.mock("@/app/api/daydream/utils", () => ({
  daydreamFetch: daydreamFetchMock,
  parseJson: parseJsonMock,
  jsonError: (message: string, status: number) =>
    NextResponse.json({ error: message }, { status }),
}))

vi.mock("@/lib/daydream/stream-limiter", () => ({
  getClientIdentifier: getClientIdentifierMock,
  getActiveStream: getActiveStreamMock,
}))

describe("Daydream status route", () => {
  beforeEach(() => {
    daydreamFetchMock.mockReset()
    parseJsonMock.mockReset()
    getClientIdentifierMock.mockReset()
    getActiveStreamMock.mockReset()
  })

  it("rejects status checks for non-owned streams", async () => {
    getClientIdentifierMock.mockReturnValue({ id: "client-1" })
    getActiveStreamMock.mockReturnValue(null)

    const request = new NextRequest(
      "http://localhost/api/daydream/streams/stream-123/status"
    )
    const response = await statusGet(request, {
      params: Promise.resolve({ streamId: "stream-123" }),
    })

    expect(response.status).toBe(403)
  })

  it("proxies status when stream is owned", async () => {
    getClientIdentifierMock.mockReturnValue({ id: "client-1" })
    getActiveStreamMock.mockReturnValue({
      streamId: "stream-123",
      createdAt: 0,
      expiresAt: Date.now() + 30_000,
    })
    daydreamFetchMock.mockResolvedValue({ ok: true, status: 200 })
    parseJsonMock.mockResolvedValue({ state: "active" })

    const request = new NextRequest(
      "http://localhost/api/daydream/streams/stream-123/status"
    )
    const response = await statusGet(request, {
      params: Promise.resolve({ streamId: "stream-123" }),
    })

    expect(daydreamFetchMock).toHaveBeenCalledWith(
      "/v1/streams/stream-123/status",
      expect.objectContaining({ method: "GET" })
    )
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ state: "active" })
  })
})
