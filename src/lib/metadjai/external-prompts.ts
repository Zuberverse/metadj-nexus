export interface MetaDjAiExternalPromptDetail {
  prompt: string
  newSession?: boolean
}

export const META_DJAI_PROMPT_EVENT = "metadjai:prompt"

/**
 * Dispatch an external MetaDJai prompt from anywhere in the UI.
 * HomePageClient listens for this event and routes it into the active MetaDJai session.
 */
export function dispatchMetaDjAiPrompt(detail: MetaDjAiExternalPromptDetail) {
  if (typeof window === "undefined") return
  if (!detail?.prompt) return
  window.dispatchEvent(new CustomEvent<MetaDjAiExternalPromptDetail>(META_DJAI_PROMPT_EVENT, { detail }))
}

