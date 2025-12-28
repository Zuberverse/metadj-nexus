/**
 * useMetaDjAiChatProps Hook
 *
 * Extracts and memoizes the MetaDJai chat component props configuration
 * from HomePageClient to improve maintainability and reduce component size.
 */

import { useMemo } from "react"
import type { MetaDjAiChatSession } from "@/lib/storage/metadjai-history-storage"
import type { Track } from "@/types"
import type {
  MetaDjAiChatSessionSummary,
  MetaDjAiMessage,
  MetaDjAiPersonalizationState,
  MetaDjAiProvider,
  MetaDjAiRateLimitState,
} from "@/types/metadjai"

interface MetaDjAiWelcomeDetails {
  nowPlayingTitle?: string
  nowPlayingArtist?: string
  collectionTitle?: string
  pageDetails: string
}

interface MetaDjAiSession {
  messages: MetaDjAiMessage[]
  isLoading: boolean
  isStreaming: boolean
  error: string | null
  sendMessage: (message: string) => Promise<void>
  stopStreaming: () => void
  resetConversation: () => void
  startNewSession: (seedMessages?: MetaDjAiMessage[]) => string
  regenerateLastResponse: () => Promise<void>
  retryLastMessage: () => Promise<void>
  switchMessageVersion: (messageId: string, versionIndex: number) => void
  canRetry: boolean
  rateLimit: MetaDjAiRateLimitState
  modelPreference: MetaDjAiProvider
  changeModelPreference: (provider: MetaDjAiProvider) => void
  personalization: MetaDjAiPersonalizationState
  togglePersonalization: (enabled: boolean) => void
  updatePersonalization: (next: Partial<MetaDjAiPersonalizationState>) => void
  sessions: MetaDjAiChatSession[]
  activeSessionId: string
  switchSession: (sessionId: string) => void
  deleteSession: (sessionId: string) => void
}

interface UseMetaDjAiChatPropsParams {
  isMetaDjAiOpen: boolean
  handleMetaDjAiClose: () => void
  metaDjAiSession: MetaDjAiSession
  metaDjAiWelcomeDetails: MetaDjAiWelcomeDetails
  headerHeight: number
  currentTrack: Track | null
}

export function useMetaDjAiChatProps({
  isMetaDjAiOpen,
  handleMetaDjAiClose,
  metaDjAiSession,
  metaDjAiWelcomeDetails,
  headerHeight,
  currentTrack,
}: UseMetaDjAiChatPropsParams) {
  return useMemo(
    () => ({
      isOpen: isMetaDjAiOpen,
      onClose: handleMetaDjAiClose,
      messages: metaDjAiSession.messages,
      isLoading: metaDjAiSession.isLoading,
      isStreaming: metaDjAiSession.isStreaming,
      error: metaDjAiSession.error,
      onSend: metaDjAiSession.sendMessage,
      onStop: metaDjAiSession.stopStreaming,
      onRefresh: metaDjAiSession.resetConversation,
      onNewSession: () => metaDjAiSession.startNewSession(),
      sessions: metaDjAiSession.sessions.map<MetaDjAiChatSessionSummary>((session) => ({
        id: session.id,
        title: session.title,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        messageCount: session.messages.length,
      })),
      activeSessionId: metaDjAiSession.activeSessionId,
      onSelectSession: metaDjAiSession.switchSession,
      onDeleteSession: metaDjAiSession.deleteSession,
      onRegenerate: metaDjAiSession.regenerateLastResponse,
      onSwitchVersion: metaDjAiSession.switchMessageVersion,
      onRetry: metaDjAiSession.retryLastMessage,
      canRetry: metaDjAiSession.canRetry,
      welcomeDetails: metaDjAiWelcomeDetails,
      rateLimit: metaDjAiSession.rateLimit,
      modelPreference: metaDjAiSession.modelPreference,
      onModelPreferenceChange: metaDjAiSession.changeModelPreference,
      personalization: metaDjAiSession.personalization,
      onPersonalizationToggle: metaDjAiSession.togglePersonalization,
      onPersonalizationUpdate: metaDjAiSession.updatePersonalization,
      headerHeight,
      hasTrack: !!currentTrack,
    }),
    [isMetaDjAiOpen, handleMetaDjAiClose, metaDjAiSession, metaDjAiWelcomeDetails, headerHeight, currentTrack]
  )
}
