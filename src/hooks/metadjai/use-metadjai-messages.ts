"use client"

/**
 * MetaDJai Messages Hook
 *
 * Extracted from use-metadjai to manage message state:
 * - Message array state and refs
 * - Session storage persistence
 * - Hydration handling
 * - Message ID generation
 */

	import { useCallback, useEffect, useRef, useState } from 'react'
	import { metadjAiHistoryStorage, type MetaDjAiChatSession } from '@/lib/storage/metadjai-history-storage'
	import { metadjAiSessionStorage } from '@/lib/storage/metadjai-session-storage'
	import type { MetaDjAiMessage } from '@/types/metadjai.types'

interface UseMetaDjAiMessagesReturn {
  /** Current messages array */
  messages: MetaDjAiMessage[]
  /** Ref to current messages (avoids stale closures) */
  messagesRef: React.MutableRefObject<MetaDjAiMessage[]>
  /** Whether session storage has been loaded */
  hasHydrated: boolean
  /** All stored chat sessions (most recent first) */
  sessions: MetaDjAiChatSession[]
  /** Active session id */
  activeSessionId: string
  /** Set messages with automatic ref sync and persistence */
  setMessages: React.Dispatch<React.SetStateAction<MetaDjAiMessage[]>>
  /** Update messages with automatic ref sync */
  updateMessages: (updater: (prev: MetaDjAiMessage[]) => MetaDjAiMessage[]) => void
  /** Clear all messages */
  clearMessages: () => void
  /** Start a new empty session (keeps history) */
  startNewSession: (seedMessages?: MetaDjAiMessage[]) => string
  /** Switch to an existing session */
  switchSession: (sessionId: string) => void
  /** Delete a session from history */
  deleteSession: (sessionId: string) => void
  /** Generate unique message ID */
  createMessageId: () => string
}

/**
 * Hook for managing MetaDJai message state with persistence
 *
 * Handles:
 * - Loading messages from session storage on mount
 * - Persisting messages to session storage on changes
 * - Providing ref for avoiding stale closures in async operations
 */
export function useMetaDjAiMessages(): UseMetaDjAiMessagesReturn {
  const [messages, setMessages] = useState<MetaDjAiMessage[]>([])
  const [hasHydrated, setHasHydrated] = useState(false)
  const [sessions, setSessions] = useState<MetaDjAiChatSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string>("")
  const messagesRef = useRef<MetaDjAiMessage[]>([])
  const sessionsRef = useRef<MetaDjAiChatSession[]>([])

  // Keep ref in sync with state
  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  // Keep sessions ref in sync
  useEffect(() => {
    sessionsRef.current = sessions
  }, [sessions])

  // Load sessions on mount (migrate previous single-session messages if present)
  useEffect(() => {
    const storedSessions = metadjAiHistoryStorage.loadSessions()
    const storedActiveId = metadjAiHistoryStorage.loadActiveSessionId()

    if (storedSessions.length === 0) {
      const previousMessages = metadjAiSessionStorage.loadMessages()
      const seed = previousMessages.length > 0 ? previousMessages : []
      const initialSession = metadjAiHistoryStorage.createSession(seed)
      const nextSessions = [initialSession]
      setSessions(nextSessions)
      sessionsRef.current = nextSessions
      setActiveSessionId(initialSession.id)
      metadjAiHistoryStorage.saveSessions(nextSessions)
      metadjAiHistoryStorage.saveActiveSessionId(initialSession.id)
      setMessages(initialSession.messages)
      messagesRef.current = initialSession.messages
      setHasHydrated(true)
      return
    }

    const resolvedActiveId =
      storedActiveId && storedSessions.some((s) => s.id === storedActiveId)
        ? storedActiveId
        : storedSessions[0].id

    setSessions(storedSessions)
    sessionsRef.current = storedSessions
    setActiveSessionId(resolvedActiveId)
    metadjAiHistoryStorage.saveActiveSessionId(resolvedActiveId)

    const activeSession = storedSessions.find((s) => s.id === resolvedActiveId)
    const activeMessages = activeSession?.messages ?? []
    setMessages(activeMessages)
    messagesRef.current = activeMessages
    setHasHydrated(true)
  }, [])

  // Persist active session messages on changes
  useEffect(() => {
    if (!hasHydrated) return
    if (!activeSessionId) return

    setSessions((prev) => {
      const now = Date.now()
      const next = prev.map((session) => {
        if (session.id !== activeSessionId) return session
        const nextMessages = messages.slice(-80)
        return {
          ...session,
          messages: nextMessages,
          updatedAt: now,
          title: session.title === "New chat" ? metadjAiHistoryStorage.deriveTitle(nextMessages) : session.title,
        }
      })

      metadjAiHistoryStorage.saveSessions(next)
      return next
    })
  }, [hasHydrated, messages, activeSessionId])

  // Persist active session id changes
  useEffect(() => {
    if (!hasHydrated || !activeSessionId) return
    metadjAiHistoryStorage.saveActiveSessionId(activeSessionId)
  }, [hasHydrated, activeSessionId])

  // Update messages with automatic ref sync
  const updateMessages = useCallback(
    (updater: (prev: MetaDjAiMessage[]) => MetaDjAiMessage[]) => {
      setMessages((prev) => {
        const next = updater(prev)
        messagesRef.current = next
        return next
      })
    },
    []
  )

  // Clear all messages
  const clearMessages = useCallback(() => {
    setMessages([])
    messagesRef.current = []
  }, [])

  const startNewSession = useCallback((seedMessages: MetaDjAiMessage[] = []) => {
    const newSession = metadjAiHistoryStorage.createSession(seedMessages)
    setSessions((prev) => {
      const next = [newSession, ...prev].slice(0, 20)
      metadjAiHistoryStorage.saveSessions(next)
      return next
    })
    setActiveSessionId(newSession.id)
    setMessages(seedMessages)
    messagesRef.current = seedMessages
    metadjAiHistoryStorage.saveActiveSessionId(newSession.id)
    return newSession.id
  }, [])

  const switchSession = useCallback((sessionId: string) => {
    const target = sessionsRef.current.find((s) => s.id === sessionId)
    if (!target) return
    setActiveSessionId(sessionId)
    setMessages(target.messages)
    messagesRef.current = target.messages
    metadjAiHistoryStorage.saveActiveSessionId(sessionId)
  }, [])

  const deleteSession = useCallback((sessionId: string) => {
    setSessions((prev) => {
      const next = prev.filter((s) => s.id !== sessionId)
      if (next.length === 0) {
        const fresh = metadjAiHistoryStorage.createSession()
        metadjAiHistoryStorage.saveSessions([fresh])
        metadjAiHistoryStorage.saveActiveSessionId(fresh.id)
        setActiveSessionId(fresh.id)
        setMessages([])
        messagesRef.current = []
        return [fresh]
      }

      metadjAiHistoryStorage.saveSessions(next)

      if (activeSessionId === sessionId) {
        const fallback = next[0]
        setActiveSessionId(fallback.id)
        setMessages(fallback.messages)
        messagesRef.current = fallback.messages
        metadjAiHistoryStorage.saveActiveSessionId(fallback.id)
      }

      return next
    })
  }, [activeSessionId])

  return {
    messages,
    messagesRef,
    hasHydrated,
    sessions,
    activeSessionId,
    setMessages,
    updateMessages,
    clearMessages,
    startNewSession,
    switchSession,
    deleteSession,
    createMessageId,
  }
}

/**
 * Generate unique message ID using crypto.randomUUID or fallback
 */
export function createMessageId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}
