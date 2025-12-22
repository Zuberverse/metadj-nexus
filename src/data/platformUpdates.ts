/**
 * Platform Updates
 *
 * Lightweight, human-curated pulse of what's new in MetaDJ Nexus.
 * This is intentionally small and easy to maintain for solo-founder cadence.
 */

export interface PlatformUpdate {
  id: string
  title: string
  date: string
  summary: string
  type?: "added" | "improved" | "fixed" | "note"
}

export const PLATFORM_UPDATES: PlatformUpdate[] = [
  {
    id: "unified-experience-layout",
    title: "Unified experience layout",
    date: "2025-12-11",
    summary: "Hub, Cinema, and Wisdom now share a persistent layout—so playback keeps going as you explore.",
    type: "improved",
  },
  {
    id: "motion-utilities-restored",
    title: "Motion system restored",
    date: "2025-12-11",
    summary: "Glow and pulse transitions are back for smoother navigation and clearer focus.",
    type: "fixed",
  },
  {
    id: "queue-hydration-fix",
    title: "Queue hydration fixed",
    date: "2025-12-11",
    summary: "Your queue now reliably restores when you return.",
    type: "fixed",
  },
]
