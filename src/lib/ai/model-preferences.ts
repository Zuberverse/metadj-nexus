import type { MetaDjAiProvider } from "@/types/metadjai.types"

export const MODEL_OPTIONS: Array<{ value: MetaDjAiProvider; label: string }> = [
  { value: "openai", label: "GPT" },
  { value: "google", label: "Gemini" },
  { value: "anthropic", label: "Claude" },
  { value: "xai", label: "Grok" },
  { value: "moonshotai", label: "Kimi" },
]

export const MODEL_LABELS: Record<MetaDjAiProvider, string> = {
  openai: "GPT",
  google: "Gemini",
  anthropic: "Claude",
  xai: "Grok",
  moonshotai: "Kimi",
}
