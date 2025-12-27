/**
 * Zod Error Formatting Tests
 *
 * Tests for Zod validation error formatting utilities.
 */

import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { formatZodError, formatZodErrorString } from '@/lib/validation/format'

// Helper to create a ZodError
function getZodError(schema: z.ZodType, data: unknown) {
  const result = schema.safeParse(data)
  if (!result.success) {
    return result.error
  }
  throw new Error('Expected validation to fail')
}

describe('formatZodError', () => {
  it('formats single field error', () => {
    const schema = z.object({ email: z.string().email() })
    const error = getZodError(schema, { email: 'invalid' })

    const result = formatZodError(error)

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      field: 'email',
      message: 'Invalid email address',
    })
  })

  it('formats multiple field errors', () => {
    const schema = z.object({
      email: z.string().email(),
      name: z.string().min(1),
    })
    const error = getZodError(schema, { email: 'invalid', name: '' })

    const result = formatZodError(error)

    expect(result).toHaveLength(2)
    expect(result.some((e) => e.field === 'email')).toBe(true)
    expect(result.some((e) => e.field === 'name')).toBe(true)
  })

  it('formats nested field paths', () => {
    const schema = z.object({
      user: z.object({
        email: z.string().email(),
      }),
    })
    const error = getZodError(schema, { user: { email: 'invalid' } })

    const result = formatZodError(error)

    expect(result[0].field).toBe('user.email')
  })

  it('uses "payload" for root-level errors', () => {
    const schema = z.string()
    const error = getZodError(schema, 123)

    const result = formatZodError(error)

    expect(result[0].field).toBe('payload')
  })

  it('handles array index paths', () => {
    const schema = z.object({
      items: z.array(z.string().min(1)),
    })
    const error = getZodError(schema, { items: ['valid', ''] })

    const result = formatZodError(error)

    expect(result[0].field).toBe('items.1')
  })
})

describe('formatZodErrorString', () => {
  it('formats single error as string', () => {
    const schema = z.object({ email: z.string().email() })
    const error = getZodError(schema, { email: 'invalid' })

    const result = formatZodErrorString(error)

    expect(result).toBe('email: Invalid email address')
  })

  it('formats multiple errors with default separator', () => {
    const schema = z.object({
      email: z.string().email(),
      age: z.number().min(0),
    })
    const error = getZodError(schema, { email: 'invalid', age: -1 })

    const result = formatZodErrorString(error)

    expect(result).toContain('email: Invalid email')
    expect(result).toContain(', ')
  })

  it('uses custom separator', () => {
    const schema = z.object({
      a: z.string().min(1),
      b: z.string().min(1),
    })
    const error = getZodError(schema, { a: '', b: '' })

    const result = formatZodErrorString(error, ' | ')

    expect(result).toContain(' | ')
  })

  it('handles nested paths in string format', () => {
    const schema = z.object({
      user: z.object({
        profile: z.object({
          name: z.string().min(1),
        }),
      }),
    })
    const error = getZodError(schema, { user: { profile: { name: '' } } })

    const result = formatZodErrorString(error)

    expect(result).toContain('user.profile.name:')
  })
})
