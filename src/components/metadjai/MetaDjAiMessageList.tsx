"use client"

import { useRef, type Ref } from "react"
import clsx from "clsx"
import { MetaDjAiMessageItem } from "@/components/metadjai/MetaDjAiMessageItem"
import { useCspStyle } from "@/hooks/use-csp-style"
import type { MetaDjAiMessage } from "@/types/metadjai.types"

interface MetaDjAiMessageListProps {
  messages: MetaDjAiMessage[]
  latestUserMessageId: string | null
  runwayHeight?: number | null
  restingRunwayPadding?: number | null
  listRef?: Ref<HTMLDivElement>
  onCopy: (content: string) => void
  onRegenerate?: () => void
  onSwitchVersion?: (messageId: string, versionIndex: number) => void
  isConversationStreaming?: boolean
}

/**
 * MetaDjAiMessageList - Renders conversation message history
 *
 * Displays all messages with proper role formatting (user/assistant),
 * handles copy functionality for assistant messages, and manages
 * scroll reference for latest user message.
 */
export function MetaDjAiMessageList({
  messages,
  latestUserMessageId,
  runwayHeight,
  restingRunwayPadding,
  listRef,
  onCopy,
  onRegenerate,
  onSwitchVersion,
  isConversationStreaming = true,
}: MetaDjAiMessageListProps) {
  const latestUserMessageRef = useRef<HTMLDivElement | null>(null)
  const basePadding = 24
  const runwayPadding =
    isConversationStreaming && runwayHeight && runwayHeight > 0
      ? runwayHeight
      : undefined
  const useRunwayFallback = isConversationStreaming && !runwayPadding
  const restingPadding =
    !isConversationStreaming && restingRunwayPadding && restingRunwayPadding > 1
      ? basePadding + restingRunwayPadding
      : undefined
  const paddingBottomValue =
    !useRunwayFallback && (runwayPadding ?? restingPadding)
      ? `${(runwayPadding ?? restingPadding) ?? basePadding}px`
      : ""
  const paddingStyleId = useCspStyle({
    paddingBottom: paddingBottomValue || undefined,
  })
  const visibleMessages = messages.filter((message) => message.kind !== "mode-switch")

  // Find the last assistant message index for regenerate button
  const lastAssistantMessageIndex = visibleMessages.reduce(
    (lastIndex, msg, idx) =>
      msg.role === "assistant" && msg.kind !== "model-switch" ? idx : lastIndex,
    -1
  )

  // Check if last visible message is a model-switch indicator (minimal height, needs less padding)
  const lastMessage = visibleMessages[visibleMessages.length - 1]
  const endsWithModelSwitch = lastMessage?.kind === "model-switch"

  return (
    // Runway padding keeps the latest user message near the top while streaming.
    // aria-live="polite" announces new messages to screen readers
    // aria-atomic="false" ensures only new content is announced, not the entire region
    <div
      ref={listRef}
      className={clsx(
        "space-y-4 sm:space-y-6 max-w-2xl mx-auto w-full",
        useRunwayFallback ? "pb-[40vh]" : endsWithModelSwitch ? "pb-2" : "pb-6"
      )}
      data-csp-style={paddingStyleId}
      aria-live="polite"
      aria-atomic="false"
      aria-relevant="additions"
    >
      {visibleMessages.map((message, index) => {
        const isLatestUserMessage = message.role === "user" && message.id === latestUserMessageId
        const isLastAssistantMessage = message.role === "assistant" && index === lastAssistantMessageIndex
        return (
          <MetaDjAiMessageItem
            key={message.id}
            ref={isLatestUserMessage ? latestUserMessageRef : undefined}
            message={message}
            onCopy={message.role === "assistant" ? onCopy : undefined}
            onRegenerate={isLastAssistantMessage ? onRegenerate : undefined}
            onSwitchVersion={message.role === "assistant" ? onSwitchVersion : undefined}
            isLastAssistantMessage={isLastAssistantMessage}
            isConversationStreaming={isConversationStreaming}
          />
        )
      })}
    </div>
  )
}
