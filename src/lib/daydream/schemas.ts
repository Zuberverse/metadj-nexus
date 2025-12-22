import { z } from "zod"

// Re-export centralized formatZodError for backward compatibility
export { formatZodError } from "@/lib/validation/format"

/**
 * Daydream Stream Creation Schema
 *
 * Validates payload for creating new streams via the Daydream StreamDiffusion API.
 * Keep this permissive enough to tolerate upstream changes while still catching obvious mistakes.
 */

/**
 * StreamDiffusion params schema (modern shape)
 */
const ControlNetConfigSchema = z
  .object({
    enabled: z.boolean(),
    model_id: z.string().min(1),
    preprocessor: z.string().optional(),
    conditioning_scale: z.number(),
    preprocessor_params: z.record(z.string(), z.unknown()).optional(),
    control_guidance_start: z.number().optional(),
    control_guidance_end: z.number().optional(),
  })
  .passthrough()

const StreamDiffusionParamsSchema = z
  .object({
    model_id: z.string().min(1, "model_id is required"),
    prompt: z.string().min(1, "prompt is required"),
    negative_prompt: z.string().optional(),
    seed: z.number().optional(),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
    num_inference_steps: z.number().int().positive().optional(),
    guidance_scale: z.number().optional(),
    delta: z.number().optional(),
    acceleration: z.enum(["tensorrt", "xformers", "none"]).optional(),
    use_lcm_lora: z.boolean().optional(),
    lcm_lora_id: z.string().nullable().optional(),
    lora_dict: z.record(z.string(), z.unknown()).nullable().optional(),
    ip_adapter: z
      .object({
        scale: z.number(),
        enabled: z.boolean(),
      })
      .optional(),
    use_denoising_batch: z.boolean().optional(),
    do_add_noise: z.boolean().optional(),
    t_index_list: z.array(z.number().int()).optional(),
    normalize_seed_weights: z.boolean().optional(),
    normalize_prompt_weights: z.boolean().optional(),
    seed_interpolation_method: z.enum(["linear", "slerp"]).optional(),
    prompt_interpolation_method: z.enum(["linear", "slerp"]).optional(),
    enable_similar_image_filter: z.boolean().optional(),
    ip_adapter_style_image_url: z.string().url().optional(),
    similar_image_filter_threshold: z.number().optional(),
    similar_image_filter_max_skip_frame: z.number().int().optional(),
    controlnets: z.array(ControlNetConfigSchema).optional(),
  })
  .passthrough()

const StreamDiffusionCreateSchema = z
  .object({
    pipeline: z.literal("streamdiffusion"),
    params: StreamDiffusionParamsSchema,
  })
  .passthrough()

/**
 * Legacy create shape (still supported upstream)
 */
const LegacyCreateSchema = z
  .object({
    pipeline_id: z.string().min(1),
    pipeline_params: z.record(z.string(), z.unknown()),
  })
  .passthrough()

export const CreateStreamSchema = z.union([StreamDiffusionCreateSchema, LegacyCreateSchema])

/**
 * Validated stream creation payload type
 */
export type CreateStreamPayload = z.infer<typeof CreateStreamSchema>

/**
 * Validate and parse stream creation payload
 * Returns parsed data or throws ZodError
 */
export function parseCreateStreamPayload(data: unknown): CreateStreamPayload {
  return CreateStreamSchema.parse(data)
}

/**
 * Safely validate stream creation payload
 * Returns result object with success/error
 */
export function safeParseCreateStreamPayload(data: unknown) {
  return CreateStreamSchema.safeParse(data)
}

