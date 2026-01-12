/**
 * MetaDJai Proposal Schema
 *
 * Validates tool proposal payloads before surfacing them in UI.
 */

import { z } from "zod"
import type { MetaDjAiProposal } from "@/types/metadjai.types"

const approvalRequired = z.boolean().optional()

const playbackSchema = z.object({
  type: z.literal("playback"),
  action: z.enum(["play", "pause", "next", "prev", "queue"]),
  trackId: z.string().optional(),
  trackTitle: z.string().optional(),
  trackArtist: z.string().optional(),
  context: z.string().optional(),
  approvalRequired,
})

const uiSchema = z.object({
  type: z.literal("ui"),
  action: z.enum(["openWisdom", "openQueue", "focusSearch", "openMusicPanel"]),
  tab: z.enum(["browse", "queue", "playlists"]).optional(),
  context: z.string().optional(),
  approvalRequired,
})

const queueSetSchema = z.object({
  type: z.literal("queue-set"),
  action: z.literal("set"),
  trackIds: z.array(z.string()),
  trackTitles: z.array(z.string()).optional(),
  mode: z.enum(["replace", "append"]).optional(),
  autoplay: z.boolean().optional(),
  context: z.string().optional(),
  approvalRequired,
})

const playlistSchema = z.object({
  type: z.literal("playlist"),
  action: z.literal("create"),
  name: z.string(),
  trackIds: z.array(z.string()).optional(),
  trackTitles: z.array(z.string()).optional(),
  queueMode: z.enum(["replace", "append", "none"]).optional(),
  autoplay: z.boolean().optional(),
  context: z.string().optional(),
  approvalRequired,
})

const proposalSchema = z.discriminatedUnion("type", [
  playbackSchema,
  uiSchema,
  queueSetSchema,
  playlistSchema,
])

export function parseProposal(result: unknown): MetaDjAiProposal | null {
  const parsed = proposalSchema.safeParse(result)
  if (!parsed.success) return null

  const proposal = parsed.data
  if (proposal.approvalRequired === false) return null

  return {
    ...proposal,
    approvalRequired: proposal.approvalRequired ?? true,
  } as MetaDjAiProposal
}
