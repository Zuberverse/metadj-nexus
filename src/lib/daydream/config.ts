/**
 * Daydream StreamDiffusion Configuration
 *
 * Default configuration for StreamDiffusion pipeline requests.
 * This is extracted from use-dream.ts for better maintainability.
 */

import type { DaydreamPresentation, DaydreamStreamCreateRequest } from "@/types/daydream.types"

// =============================================================================
// Prompt Configuration
// =============================================================================

/** Base prompt components */
export const DREAM_PROMPT_BASE = "cartoon magical dj blue sparkle"
export const DREAM_PROMPT_DEFAULT_PRESENTATION: DaydreamPresentation = "androgynous"
export const DREAM_PROMPT_DEFAULT = `${DREAM_PROMPT_DEFAULT_PRESENTATION} ${DREAM_PROMPT_BASE}`

/** Negative prompt to avoid common artifacts */
export const DREAM_NEGATIVE_PROMPT = "blurry, low quality, flat, 2d"

// =============================================================================
// Timing Configuration
// =============================================================================

/** Countdown duration before stream starts (seconds) */
// Daydream's StreamDiffusion pipeline needs time to warm up before accepting parameter updates
export const DREAM_COUNTDOWN_SECONDS = 15

/** Interval between status polls (milliseconds) */
export const DREAM_STATUS_POLL_INTERVAL_MS = 2000

/** Maximum attempts to poll for stream status */
export const DREAM_STATUS_POLL_MAX_ATTEMPTS = 15

// =============================================================================
// ControlNet Configuration
// =============================================================================

/**
 * Default ControlNet configuration for multi-modal image conditioning.
 * Each controlnet processes the input image differently to guide generation.
 */
export const DEFAULT_CONTROLNETS = [
  {
    enabled: true,
    model_id: "thibaud/controlnet-sd21-openpose-diffusers",
    preprocessor: "pose_tensorrt",
    conditioning_scale: 0.75,
    preprocessor_params: {},
    control_guidance_end: 1,
    control_guidance_start: 0,
  },
  {
    enabled: true,
    model_id: "thibaud/controlnet-sd21-hed-diffusers",
    preprocessor: "soft_edge",
    conditioning_scale: 0.2,
    preprocessor_params: {},
    control_guidance_end: 1,
    control_guidance_start: 0,
  },
  {
    enabled: true,
    model_id: "thibaud/controlnet-sd21-canny-diffusers",
    preprocessor: "canny",
    conditioning_scale: 0.2,
    preprocessor_params: {
      low_threshold: 100,
      high_threshold: 200,
    },
    control_guidance_end: 1,
    control_guidance_start: 0,
  },
  {
    enabled: true,
    model_id: "thibaud/controlnet-sd21-depth-diffusers",
    preprocessor: "depth_tensorrt",
    conditioning_scale: 0.75,
    preprocessor_params: {},
    control_guidance_end: 1,
    control_guidance_start: 0,
  },
  {
    enabled: true,
    model_id: "thibaud/controlnet-sd21-color-diffusers",
    preprocessor: "passthrough",
    conditioning_scale: 0.2,
    preprocessor_params: {},
    control_guidance_end: 1,
    control_guidance_start: 0,
  },
] as const

// =============================================================================
// Default Stream Request Payload
// =============================================================================

/**
 * Default payload for creating a StreamDiffusion stream.
 * Used by useDream hook when starting a new Dream session.
 */
export const DEFAULT_STREAM_PAYLOAD: DaydreamStreamCreateRequest = {
  pipeline: "streamdiffusion",
  params: {
    seed: 42,
    delta: 0.7,
    width: 512,
    height: 512, // 1:1 SDTurbo default; webcam is cropped to square
    prompt: DREAM_PROMPT_DEFAULT,
    model_id: "stabilityai/sd-turbo",
    controlnets: DEFAULT_CONTROLNETS as unknown as DaydreamStreamCreateRequest["params"]["controlnets"],
    acceleration: "tensorrt",
    do_add_noise: true,
    t_index_list: [12, 20, 24],
    guidance_scale: 1,
    negative_prompt: DREAM_NEGATIVE_PROMPT,
    num_inference_steps: 25,
    use_denoising_batch: true,
    normalize_seed_weights: true,
    normalize_prompt_weights: true,
    seed_interpolation_method: "linear",
    enable_similar_image_filter: true,
    prompt_interpolation_method: "slerp",
    similar_image_filter_threshold: 0.98,
    similar_image_filter_max_skip_frame: 10,
  },
}

/**
 * Creates a stream payload with a custom prompt.
 * Uses DEFAULT_STREAM_PAYLOAD as base and overrides the prompt.
 */
export function createStreamPayload(prompt: string): DaydreamStreamCreateRequest {
  return {
    ...DEFAULT_STREAM_PAYLOAD,
    params: {
      ...DEFAULT_STREAM_PAYLOAD.params,
      prompt,
    },
  }
}

// =============================================================================
// Dynamic Parameter Updates (No Pipeline Reload)
// =============================================================================

/**
 * Per Daydream docs, these parameters can be updated dynamically without
 * triggering a full pipeline reload (~30s):
 * - prompt
 * - guidance_scale
 * - delta
 * - num_inference_steps
 * - t_index_list
 * - seed
 * - controlnets.conditioning_scale
 *
 * All other parameters trigger a full pipeline reload.
 */
export interface DynamicStreamParams {
  pipeline: "streamdiffusion"
  params: {
    model_id: string // REQUIRED by Daydream API
    prompt: string
    guidance_scale?: number
    delta?: number
    num_inference_steps?: number
    t_index_list?: number[]
    seed?: number
  }
}

/**
 * Creates a minimal payload with only dynamic parameters for prompt updates.
 * This avoids triggering pipeline reloads when updating just the prompt.
 *
 * NOTE: model_id is REQUIRED by the Daydream API for PATCH requests,
 * even when only updating dynamic parameters like prompt.
 * Pass an explicit modelId to mirror the stream's active model.
 */
export function createPromptUpdatePayload(prompt: string, seed?: number, modelId?: string): DynamicStreamParams {
  // Per Daydream API: PATCH /v1/streams/{id} expects { pipeline, params }.
  // Per Daydream guidance: send only the params you want to update.
  // `model_id` is required even for simple prompt updates.
  const params: DynamicStreamParams["params"] = {
    model_id: modelId || DEFAULT_STREAM_PAYLOAD.params.model_id,
    prompt,
  }

  if (seed !== undefined) {
    params.seed = seed
  }

  return { pipeline: "streamdiffusion", params }
}
