import { MAX_PERSONALIZATION_LENGTH } from "@/lib/ai/limits"
import type {
  MetaDjAiPersonalization,
  MetaDjAiPersonalizationProfileId,
  MetaDjAiResponseFormat,
  MetaDjAiResponseLength,
  MetaDjAiTonePreference,
  MetaDjAiPersonalizationState,
} from "@/types/metadjai"

export interface MetaDjAiPersonalizationProfile {
  id: MetaDjAiPersonalizationProfileId
  label: string
  description: string
  prompt: string
}

export const PERSONALIZATION_PROFILES: MetaDjAiPersonalizationProfile[] = [
  {
    id: "default",
    label: "Balanced",
    description: "Clear, grounded, and practical.",
    prompt: "Stay clear and grounded. Use short paragraphs, practical steps, and ask one clarifying question when needed.",
  },
  {
    id: "creative",
    label: "Creative Director",
    description: "Bold taste, expressive direction.",
    prompt: "Lead with bold creative direction and taste-led options. Offer 2–3 distinct angles when it helps.",
  },
  {
    id: "mentor",
    label: "Mentor",
    description: "Supportive guidance and next steps.",
    prompt: "Be supportive and direct. Prioritize clear guidance, next steps, and gentle accountability.",
  },
  {
    id: "dj",
    label: "DJ Focus",
    description: "Music-first, vibe-driven.",
    prompt: "When music comes up, focus on vibe, sequencing, and listening suggestions.",
  },
  {
    id: "custom",
    label: "Custom",
    description: "Your own guidance.",
    prompt: "",
  },
]

export const PERSONALIZATION_LENGTH_OPTIONS: Array<{
  id: MetaDjAiResponseLength
  label: string
  description: string
}> = [
  { id: "concise", label: "Concise", description: "Short and direct responses." },
  { id: "balanced", label: "Balanced", description: "Clear with enough detail." },
  { id: "expansive", label: "Expansive", description: "Go deeper and explore more." },
]

export const PERSONALIZATION_FORMAT_OPTIONS: Array<{
  id: MetaDjAiResponseFormat
  label: string
  description: string
}> = [
  { id: "bullets", label: "Bullets", description: "Tight, scannable lists." },
  { id: "steps", label: "Steps", description: "Sequenced, actionable flow." },
  { id: "paragraphs", label: "Paragraphs", description: "Narrative, flowing text." },
  { id: "mixed", label: "Mixed", description: "Blend as needed." },
]

export const PERSONALIZATION_TONE_OPTIONS: Array<{
  id: MetaDjAiTonePreference
  label: string
  description: string
}> = [
  { id: "direct", label: "Direct", description: "Straight to the point." },
  { id: "warm", label: "Warm", description: "Supportive and encouraging." },
  { id: "visionary", label: "Visionary", description: "Future-forward, big picture." },
  { id: "technical", label: "Technical", description: "Precise and systematic." },
]

const profileMap = PERSONALIZATION_PROFILES.reduce<Record<MetaDjAiPersonalizationProfileId, MetaDjAiPersonalizationProfile>>(
  (acc, profile) => {
    acc[profile.id] = profile
    return acc
  },
  {
    default: PERSONALIZATION_PROFILES[0],
    creative: PERSONALIZATION_PROFILES[1],
    mentor: PERSONALIZATION_PROFILES[2],
    dj: PERSONALIZATION_PROFILES[3],
    custom: PERSONALIZATION_PROFILES[4],
  }
)

export const DEFAULT_PERSONALIZATION_STATE: MetaDjAiPersonalizationState = {
  enabled: false,
  profileId: "default",
  responseLength: "balanced",
  responseFormat: "mixed",
  tone: "warm",
  displayName: "",
  interests: "",
  currentProjects: "",
  customInstructions: "",
}

export function getPersonalizationProfile(
  profileId: MetaDjAiPersonalizationProfileId
): MetaDjAiPersonalizationProfile {
  return profileMap[profileId] ?? profileMap.default
}

export function normalizePersonalizationState(candidate: unknown): MetaDjAiPersonalizationState {
  if (!candidate || typeof candidate !== "object") {
    return DEFAULT_PERSONALIZATION_STATE
  }

  const record = candidate as Record<string, unknown>
  const enabled = Boolean(record.enabled)
  const profileId = typeof record.profileId === "string" ? record.profileId : DEFAULT_PERSONALIZATION_STATE.profileId
  const responseLength = typeof record.responseLength === "string" ? record.responseLength : DEFAULT_PERSONALIZATION_STATE.responseLength
  const responseFormat = typeof record.responseFormat === "string" ? record.responseFormat : DEFAULT_PERSONALIZATION_STATE.responseFormat
  const tone = typeof record.tone === "string" ? record.tone : DEFAULT_PERSONALIZATION_STATE.tone
  const displayName = typeof record.displayName === "string" ? record.displayName : DEFAULT_PERSONALIZATION_STATE.displayName
  const interests = typeof record.interests === "string" ? record.interests : DEFAULT_PERSONALIZATION_STATE.interests
  const currentProjects = typeof record.currentProjects === "string" ? record.currentProjects : DEFAULT_PERSONALIZATION_STATE.currentProjects
  const customInstructions =
    typeof record.customInstructions === "string" ? record.customInstructions : DEFAULT_PERSONALIZATION_STATE.customInstructions

  const normalizedProfileId = Object.prototype.hasOwnProperty.call(profileMap, profileId)
    ? (profileId as MetaDjAiPersonalizationProfileId)
    : DEFAULT_PERSONALIZATION_STATE.profileId

  const normalizedLength = PERSONALIZATION_LENGTH_OPTIONS.some((option) => option.id === responseLength)
    ? (responseLength as MetaDjAiResponseLength)
    : DEFAULT_PERSONALIZATION_STATE.responseLength

  const normalizedFormat = PERSONALIZATION_FORMAT_OPTIONS.some((option) => option.id === responseFormat)
    ? (responseFormat as MetaDjAiResponseFormat)
    : DEFAULT_PERSONALIZATION_STATE.responseFormat

  const normalizedTone = PERSONALIZATION_TONE_OPTIONS.some((option) => option.id === tone)
    ? (tone as MetaDjAiTonePreference)
    : DEFAULT_PERSONALIZATION_STATE.tone

  return {
    enabled,
    profileId: normalizedProfileId,
    responseLength: normalizedLength,
    responseFormat: normalizedFormat,
    tone: normalizedTone,
    displayName: displayName.trim().slice(0, 80),
    interests: interests.trim().slice(0, 240),
    currentProjects: currentProjects.trim().slice(0, 240),
    customInstructions: customInstructions.trim().slice(0, MAX_PERSONALIZATION_LENGTH),
  }
}

export function buildPersonalizationPayload(
  state: MetaDjAiPersonalizationState
): MetaDjAiPersonalization | null {
  if (!state.enabled) return null

  const profile = getPersonalizationProfile(state.profileId)
  const lengthLabel = PERSONALIZATION_LENGTH_OPTIONS.find((option) => option.id === state.responseLength)?.label ?? "Balanced"
  const formatLabel = PERSONALIZATION_FORMAT_OPTIONS.find((option) => option.id === state.responseFormat)?.label ?? "Mixed"
  const toneLabel = PERSONALIZATION_TONE_OPTIONS.find((option) => option.id === state.tone)?.label ?? "Warm"

  const styleSentence = `Style: ${lengthLabel} length, ${formatLabel} format, ${toneLabel} tone.`
  const profileDetails: string[] = []

  if (state.displayName) {
    profileDetails.push(`Name: ${state.displayName}.`)
  }
  if (state.interests) {
    profileDetails.push(`Interests: ${state.interests}.`)
  }
  if (state.currentProjects) {
    profileDetails.push(`Current projects: ${state.currentProjects}.`)
  }

  const custom = state.customInstructions.trim()
  const segments = [
    profile.prompt,
    styleSentence,
    custom,
    profileDetails.length > 0 ? `Profile: ${profileDetails.join(" ")}` : "",
  ].filter(Boolean)

  const combined = segments.join(" ").trim().slice(0, MAX_PERSONALIZATION_LENGTH)
  if (!combined) return null

  return {
    enabled: true,
    profileId: profile.id,
    profileLabel: profile.label,
    instructions: combined,
  }
}
