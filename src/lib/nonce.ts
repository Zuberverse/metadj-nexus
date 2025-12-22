/**
 * CSP nonce utilities.
 *
 * Middleware runs in the Edge runtime, so avoid Node-only APIs.
 */
export function generateNonce(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)

  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64")
  }

  if (typeof btoa === "function") {
    let binary = ""
    for (const byte of bytes) {
      binary += String.fromCharCode(byte)
    }
    return btoa(binary)
  }

  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
}

