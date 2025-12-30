/**
 * Custom Actions Hook
 *
 * Manages custom quick actions for MetaDJai chat.
 * Handles creation, deletion, persistence, and validation.
 *
 * @module hooks/use-custom-actions
 */

import { useCallback, useEffect, useState } from 'react'
import { getValue, setValue, STORAGE_KEYS } from '@/lib/storage'

// ============================================================================
// Types
// ============================================================================

export interface CustomAction {
  id: string
  title: string
  description: string
  prompt: string
  createdAt: number
}

export interface UseCustomActionsReturn {
  /** Current list of custom actions */
  customActions: CustomAction[]
  /** Add a new custom action */
  addAction: (title: string, description: string, prompt: string) => boolean
  /** Remove a custom action by ID */
  removeAction: (id: string) => void
  /** Whether max actions limit is reached */
  isAtLimit: boolean
  /** Maximum number of custom actions allowed */
  maxActions: number
}

// ============================================================================
// Constants
// ============================================================================

export const MAX_CUSTOM_ACTIONS = 12
export const MAX_CUSTOM_ACTION_TITLE = 40
export const MAX_CUSTOM_ACTION_DESCRIPTION = 80
export const MAX_CUSTOM_ACTION_PROMPT = 600

// ============================================================================
// Utilities
// ============================================================================

/**
 * Generate a unique action ID
 */
function createActionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `action-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

/**
 * Clamp text to max length with ellipsis
 */
function clampText(value: string, max: number): string {
  if (value.length <= max) return value
  const safeMax = Math.max(0, max - 3)
  return `${value.slice(0, safeMax)}...`
}

/**
 * Derive a description from the prompt if not provided
 */
function deriveActionDescription(prompt: string): string {
  const cleaned = prompt.replace(/\s+/g, ' ').trim()
  return cleaned || 'Custom prompt'
}

/**
 * Normalize and validate custom actions from storage
 */
function normalizeCustomActions(value: unknown): CustomAction[] {
  if (!Array.isArray(value)) return []
  const seen = new Set<string>()
  const normalized: CustomAction[] = []

  for (const entry of value) {
    if (!entry || typeof entry !== 'object') continue
    const record = entry as Partial<CustomAction>
    const title = typeof record.title === 'string' ? record.title.trim() : ''
    const prompt = typeof record.prompt === 'string' ? record.prompt.trim() : ''
    if (!title || !prompt) continue

    const descriptionRaw = typeof record.description === 'string' ? record.description.trim() : ''
    const id = typeof record.id === 'string' && record.id.trim() ? record.id.trim() : createActionId()
    if (seen.has(id)) continue
    seen.add(id)

    const createdAt = typeof record.createdAt === 'number' && Number.isFinite(record.createdAt)
      ? record.createdAt
      : Date.now()

    normalized.push({
      id,
      title: clampText(title, MAX_CUSTOM_ACTION_TITLE),
      description: clampText(descriptionRaw || deriveActionDescription(prompt), MAX_CUSTOM_ACTION_DESCRIPTION),
      prompt: prompt.length > MAX_CUSTOM_ACTION_PROMPT ? prompt.slice(0, MAX_CUSTOM_ACTION_PROMPT) : prompt,
      createdAt,
    })

    if (normalized.length >= MAX_CUSTOM_ACTIONS) break
  }

  return normalized
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for managing custom quick actions
 *
 * Provides CRUD operations for custom actions with automatic persistence
 * to localStorage. Handles validation and deduplication.
 *
 * @returns Custom actions state and operations
 *
 * @example
 * ```tsx
 * const { customActions, addAction, removeAction, isAtLimit } = useCustomActions()
 *
 * // Add a new action
 * const success = addAction('My Action', 'Description', 'Do something...')
 *
 * // Remove an action
 * removeAction('action-id')
 * ```
 */
export function useCustomActions(): UseCustomActionsReturn {
  const [customActions, setCustomActions] = useState<CustomAction[]>([])

  // Load custom actions from localStorage on mount
  useEffect(() => {
    const stored = getValue(STORAGE_KEYS.METADJAI_ACTIONS, [])
    setCustomActions(normalizeCustomActions(stored))
  }, [])

  // Persist custom actions to localStorage when they change
  useEffect(() => {
    if (customActions.length > 0) {
      setValue(STORAGE_KEYS.METADJAI_ACTIONS, customActions)
    }
  }, [customActions])

  /**
   * Add a new custom action
   * @returns true if action was added, false if at limit or invalid
   */
  const addAction = useCallback((title: string, description: string, prompt: string): boolean => {
    const trimmedTitle = title.trim()
    const trimmedPrompt = prompt.trim()

    // Validation
    if (!trimmedTitle || !trimmedPrompt) return false

    setCustomActions(prev => {
      if (prev.length >= MAX_CUSTOM_ACTIONS) return prev

      const newAction: CustomAction = {
        id: createActionId(),
        title: clampText(trimmedTitle, MAX_CUSTOM_ACTION_TITLE),
        description: clampText(
          description.trim() || deriveActionDescription(trimmedPrompt),
          MAX_CUSTOM_ACTION_DESCRIPTION
        ),
        prompt: trimmedPrompt.length > MAX_CUSTOM_ACTION_PROMPT
          ? trimmedPrompt.slice(0, MAX_CUSTOM_ACTION_PROMPT)
          : trimmedPrompt,
        createdAt: Date.now(),
      }

      // Prepend new action so most recent appears first
      return [newAction, ...prev]
    })

    return true
  }, [])

  /**
   * Remove a custom action by ID
   */
  const removeAction = useCallback((id: string) => {
    setCustomActions(prev => {
      const updated = prev.filter(action => action.id !== id)
      // If all actions removed, clear storage
      if (updated.length === 0) {
        setValue(STORAGE_KEYS.METADJAI_ACTIONS, [])
      }
      return updated
    })
  }, [])

  return {
    customActions,
    addAction,
    removeAction,
    isAtLimit: customActions.length >= MAX_CUSTOM_ACTIONS,
    maxActions: MAX_CUSTOM_ACTIONS,
  }
}
