import { describe, expect, it } from 'vitest'
import { createPromptUpdatePayload, DEFAULT_STREAM_PAYLOAD } from '@/lib/daydream/config'

describe('Daydream config', () => {
  describe('createPromptUpdatePayload', () => {
    it('returns a minimal StreamDiffusion PATCH payload', () => {
      const prompt = 'female neon dragon'
      const payload = createPromptUpdatePayload(prompt)

      expect(payload).toEqual({
        pipeline: 'streamdiffusion',
        params: {
          model_id: DEFAULT_STREAM_PAYLOAD.params.model_id,
          prompt,
        },
      })
    })

    it('uses provided model_id when supplied', () => {
      const prompt = 'cyan circuit cathedral'
      const modelId = 'stabilityai/sd-turbo-v2'
      const payload = createPromptUpdatePayload(prompt, undefined, modelId)

      expect(payload).toEqual({
        pipeline: 'streamdiffusion',
        params: {
          model_id: modelId,
          prompt,
        },
      })
    })

    it('includes seed when provided', () => {
      const prompt = 'androgynous reroll'
      const payload = createPromptUpdatePayload(prompt, 123)

      expect(payload).toEqual({
        pipeline: 'streamdiffusion',
        params: {
          model_id: DEFAULT_STREAM_PAYLOAD.params.model_id,
          prompt,
          seed: 123,
        },
      })
    })
  })
})
