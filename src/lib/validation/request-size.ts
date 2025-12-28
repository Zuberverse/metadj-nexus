import { NextRequest, NextResponse } from 'next/server';

const KB = 1024;
const MB = 1024 * KB;

export const MAX_REQUEST_SIZE = {
  '/api/log': 10 * KB,
  '/api/health': 1 * KB,
  '/api/metadjai/transcribe': 12 * MB,
  '/api/metadjai/stream': 600 * KB,
  '/api/metadjai': 600 * KB,
  default: 100 * KB,
} as const;

export function getMaxRequestSize(path: string): number {
  for (const [route, size] of Object.entries(MAX_REQUEST_SIZE)) {
    if (route !== 'default' && path.startsWith(route)) {
      return size;
    }
  }
  return MAX_REQUEST_SIZE.default;
}

export function buildPayloadTooLargeResponse(maxBytes: number): NextResponse {
  return new NextResponse(
    JSON.stringify({
      error: 'Payload Too Large',
      message: `Request body exceeds maximum size of ${Math.round(maxBytes / KB)} KB`,
    }),
    {
      status: 413,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

type BodyReadResult =
  | { ok: true; body: string; size: number }
  | { ok: false; response: NextResponse };

function concatChunks(chunks: Uint8Array[], totalLength: number): Uint8Array {
  const combined = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return combined;
}

export async function readRequestBodyWithLimit(
  request: NextRequest,
  maxBytes: number
): Promise<BodyReadResult> {
  const contentLength = request.headers.get('content-length');
  if (contentLength) {
    const size = Number.parseInt(contentLength, 10);
    if (!Number.isNaN(size) && size > maxBytes) {
      return { ok: false, response: buildPayloadTooLargeResponse(maxBytes) };
    }
  }

  if (!request.body) {
    return { ok: true, body: '', size: 0 };
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;

    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      return { ok: false, response: buildPayloadTooLargeResponse(maxBytes) };
    }
    chunks.push(value);
  }

  if (!chunks.length) {
    return { ok: true, body: '', size };
  }

  const combined = concatChunks(chunks, size);
  const body = new TextDecoder().decode(combined);
  return { ok: true, body, size };
}

type JsonBodyResult<T> = { ok: true; data: T } | { ok: false; response: NextResponse };

export async function readJsonBodyWithLimit<T>(
  request: NextRequest,
  maxBytes: number,
  options?: { allowEmpty?: boolean }
): Promise<JsonBodyResult<T>> {
  const bodyResult = await readRequestBodyWithLimit(request, maxBytes);
  if (!bodyResult.ok) {
    return bodyResult;
  }

  const trimmed = bodyResult.body.trim();
  if (!trimmed) {
    if (options?.allowEmpty) {
      return { ok: true, data: null as T };
    }
    return {
      ok: false,
      response: NextResponse.json({ error: 'Invalid request body' }, { status: 400 }),
    };
  }

  try {
    const data = JSON.parse(trimmed) as T;
    return { ok: true, data };
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Invalid request body' }, { status: 400 }),
    };
  }
}
