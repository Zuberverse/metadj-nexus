/**
 * Daydream/StreamDiffusion Type Definitions
 *
 * Types for real-time AI visual generation via Daydream/Livepeer integration.
 * Used by useDream hook and Daydream API routes.
 */

/** Current state of the Daydream stream lifecycle */
export type DaydreamStreamStatus = "idle" | "connecting" | "streaming" | "error"

/** Persona presentation style affecting generated visuals */
export type DaydreamPresentation = "androgynous" | "female" | "male"

/**
 * Response from Daydream API stream operations.
 * Contains connection URLs, playback info, and error details.
 */
export interface DaydreamStreamResponse {
  /** Unique stream identifier */
  id: string
  /** WebRTC WHIP URL for video ingest */
  whip_url?: string
  /** Livepeer playback identifier */
  playback_id?: string
  /** Direct playback URL for iframe embedding */
  playback_url?: string
  /** Alternative playback ID for output stream */
  output_playback_id?: string
  /** HLS/DASH stream URL */
  stream_url?: string
  /** Stream status from Daydream API */
  status?: string
  /** Reason for current status (e.g., error description) */
  status_reason?: string
  /** Error message (from rate limiter or API errors) */
  error?: string
  /** ID of conflicting active stream (for rate limit responses) */
  activeStreamId?: string
  /** Seconds until retry allowed (rate limiting) */
  retryAfter?: number
}

/**
 * Request body for creating a new Daydream stream.
 * Configures the StreamDiffusion pipeline and generation parameters.
 */
export interface DaydreamStreamCreateRequest {
  /** Pipeline type (currently only "streamdiffusion" supported) */
  pipeline: "streamdiffusion"
  params: {
    /** Diffusion model ID (e.g., "stabilityai/sd-turbo") */
    model_id: string
    /** Generation prompt describing desired output */
    prompt: string
    /** Elements to avoid in generation */
    negative_prompt: string
    /** Random seed for reproducibility */
    seed: number
    /** Output width in pixels (typically 512) */
    width: number
    /** Output height in pixels (typically 512) */
    height: number
    /** Denoising steps (fewer = faster, lower quality) */
    num_inference_steps: number
    /** Prompt adherence strength (higher = more literal) */
    guidance_scale: number
    /** Frame interpolation delta for temporal smoothness */
    delta: number
    /** Hardware acceleration mode */
    acceleration: "tensorrt" | "xformers" | "none"
    /** Enable LCM-LoRA for faster inference */
    use_lcm_lora?: boolean
    /** LCM-LoRA model identifier */
    lcm_lora_id?: string | null
    /** Additional LoRA weights to apply */
    lora_dict?: Record<string, unknown> | null
    /** IP-Adapter configuration for style transfer */
    ip_adapter?: {
      /** Influence strength (0.0-1.0) */
      scale: number
      /** Enable/disable IP-Adapter */
      enabled: boolean
    }
    /** Enable batched denoising for throughput */
    use_denoising_batch: boolean
    /** Add noise to input frames */
    do_add_noise: boolean
    /** Timestep indices for denoising schedule */
    t_index_list: number[]
    /** Normalize seed blend weights */
    normalize_seed_weights: boolean
    /** Normalize prompt blend weights */
    normalize_prompt_weights: boolean
    /** Seed interpolation method between frames */
    seed_interpolation_method: "linear" | "slerp"
    /** Prompt interpolation method for transitions */
    prompt_interpolation_method: "linear" | "slerp"
    /** Skip similar consecutive frames */
    enable_similar_image_filter?: boolean
    /** URL for IP-Adapter style reference image */
    ip_adapter_style_image_url?: string
    /** Similarity threshold for frame filtering */
    similar_image_filter_threshold?: number
    /** Max frames to skip when filtering similar */
    similar_image_filter_max_skip_frame?: number
    /** ControlNet configurations for guided generation */
    controlnets?: ControlNetConfig[]
  }
}

/**
 * ControlNet configuration for guided image generation.
 * Provides structural guidance from pose, edges, depth, etc.
 */
export interface ControlNetConfig {
  /** Enable this ControlNet */
  enabled: boolean
  /** ControlNet model identifier (e.g., "openpose", "canny", "depth") */
  model_id: string
  /** Preprocessing method for input conditioning */
  preprocessor?: string
  /** Influence strength (0.0-1.0, higher = more control) */
  conditioning_scale: number
  /** Parameters for the preprocessor */
  preprocessor_params?: Record<string, unknown>
  /** When to start applying control (0.0-1.0 of timesteps) */
  control_guidance_start?: number
  /** When to stop applying control (0.0-1.0 of timesteps) */
  control_guidance_end?: number
}

/**
 * Client-side Daydream status returned by useDream hook.
 * Tracks stream lifecycle and connection state.
 */
export interface DaydreamStatus {
  /** Current stream status */
  status: DaydreamStreamStatus
  /** Active stream identifier */
  streamId?: string
  /** Playback identifier for viewing output */
  playbackId?: string
  /** Direct URL for playback iframe */
  playbackUrl?: string
  /** WebRTC WHIP URL for video ingest */
  whipUrl?: string
  /** Human-readable status message */
  message?: string
  /** Seconds remaining in warm-up countdown */
  countdownRemaining?: number
}
