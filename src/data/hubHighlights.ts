export interface HubHighlight {
  id: string
  title: string
  summary: string
  type?: "news" | "event" | "note"
  date?: string
}

export const HUB_NEWS_ITEMS: HubHighlight[] = [
  {
    id: "preview-polish-pass",
    title: "Public Preview polish pass",
    summary: "Core experience is being refined for launch clarity and stability.",
    type: "note",
  },
  {
    id: "metadjai-multi-provider",
    title: "MetaDJai multi-provider support",
    summary: "OpenAI, Gemini, Claude, and Grok support with automatic failover.",
    type: "news",
  },
]

export const HUB_EVENT_ITEMS: HubHighlight[] = []
