import type { MetaDjAiMessage } from '@/types/metadjai.types'

const STORAGE_KEYS = {
  messages: 'metadj-nexus.metadjai.messages',
  rateLimitWindow: 'metadj-nexus.metadjai.rateLimitWindow',
} as const

const MAX_STORED_MESSAGES = 40

interface RateLimitWindowPayload {
  startedAt: number
  count: number
}

const getStorage = () => {
  if (typeof window === 'undefined') {
    return null
  }
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export const metadjAiSessionStorage = {
  loadMessages(): MetaDjAiMessage[] {
    const storage = getStorage()
    if (!storage) return []

    const raw = storage.getItem(STORAGE_KEYS.messages)
    if (!raw) return []

    try {
      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed)) return []

      return parsed
        .map(normalizeMessage)
        .filter((message): message is MetaDjAiMessage => Boolean(message))
    } catch {
      return []
    }
  },

  saveMessages(messages: MetaDjAiMessage[]): void {
    const storage = getStorage()
    if (!storage) return

    try {
      const payload = messages.slice(-MAX_STORED_MESSAGES)
      storage.setItem(STORAGE_KEYS.messages, JSON.stringify(payload))
    } catch {
      // Ignore storage failures to avoid breaking the chat experience
    }
  },

  clearMessages(): void {
    const storage = getStorage()
    if (!storage) return

    try {
      storage.removeItem(STORAGE_KEYS.messages)
    } catch {
      // no-op
    }
  },

  loadRateLimitWindow(): RateLimitWindowPayload | null {
    const storage = getStorage()
    if (!storage) return null

    const raw = storage.getItem(STORAGE_KEYS.rateLimitWindow)
    if (!raw) return null

    try {
      const parsed = JSON.parse(raw) as RateLimitWindowPayload
      if (
        !parsed ||
        typeof parsed.startedAt !== 'number' ||
        !Number.isFinite(parsed.startedAt) ||
        typeof parsed.count !== 'number' ||
        !Number.isFinite(parsed.count)
      ) {
        return null
      }
      return parsed
    } catch {
      return null
    }
  },

  saveRateLimitWindow(windowInfo: RateLimitWindowPayload | null): void {
    const storage = getStorage()
    if (!storage) return

    try {
      if (!windowInfo) {
        storage.removeItem(STORAGE_KEYS.rateLimitWindow)
      } else {
        storage.setItem(STORAGE_KEYS.rateLimitWindow, JSON.stringify(windowInfo))
      }
    } catch {
      // no-op
    }
  },

  clearRateLimitWindow(): void {
    const storage = getStorage()
    if (!storage) return

    try {
      storage.removeItem(STORAGE_KEYS.rateLimitWindow)
    } catch {
      // no-op
    }
  },
}

function normalizeMessage(candidate: unknown): MetaDjAiMessage | null {
  if (
    !candidate ||
    typeof candidate !== 'object' ||
    !('id' in candidate) ||
    !('role' in candidate) ||
    !('content' in candidate) ||
    !('createdAt' in candidate)
  ) {
    return null
  }

  const id = typeof (candidate as { id: unknown }).id === 'string' ? (candidate as { id: string }).id : null
  const role = (candidate as { role: unknown }).role
  const content = typeof (candidate as { content: unknown }).content === 'string' ? (candidate as { content: string }).content : null
  const createdAtValue = (candidate as { createdAt: unknown }).createdAt
  const createdAt = Number(createdAtValue)

  if (!id || (role !== 'user' && role !== 'assistant') || content === null || !Number.isFinite(createdAt)) {
    return null
  }

  const status = (candidate as { status?: MetaDjAiMessage['status'] }).status
  const kind = (candidate as { kind?: MetaDjAiMessage['kind'] }).kind
  const mode = (candidate as { mode?: MetaDjAiMessage['mode'] }).mode
  const sources = (candidate as { sources?: MetaDjAiMessage['sources'] }).sources
  const toolsUsed = (candidate as { toolsUsed?: MetaDjAiMessage['toolsUsed'] }).toolsUsed
  const versions = (candidate as { versions?: MetaDjAiMessage['versions'] }).versions
  const currentVersionIndex = (candidate as { currentVersionIndex?: MetaDjAiMessage['currentVersionIndex'] }).currentVersionIndex
  const proposal = (candidate as { proposal?: MetaDjAiMessage['proposal'] }).proposal

  const normalizedKind = kind === 'mode-switch' || kind === 'model-switch' ? kind : undefined

  return {
    id,
    role,
    content,
    createdAt,
    status: status ?? 'complete',
    kind: normalizedKind,
    mode: mode === 'adaptive' || mode === 'explorer' || mode === 'dj' ? mode : undefined,
    sources,
    toolsUsed,
    versions,
    currentVersionIndex,
    proposal,
  }
}
