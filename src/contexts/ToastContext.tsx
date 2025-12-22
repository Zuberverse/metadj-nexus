"use client"

import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from "react"
import { type ToastVariant } from "@/types"

// Time window for collapsing similar toasts (ms)
const COLLAPSE_WINDOW_MS = 2000

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface Toast {
  id: string
  message: string
  variant?: ToastVariant
  duration?: number
  action?: ToastAction
  /** Optional key for collapsing similar toasts. Toasts with same collapseKey within 2s are merged. */
  collapseKey?: string
  /** Internal: count of collapsed toasts */
  _collapseCount?: number
}

interface ToastContextValue {
  toasts: Toast[]
  showToast: (toast: Omit<Toast, "id">) => void
  dismissToast: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  // Track collapse keys with their toast IDs and timestamps
  const collapseMapRef = useRef<Map<string, { id: string; timestamp: number }>>(new Map())

  const showToast = useCallback((toast: Omit<Toast, "id">) => {
    const now = Date.now()
    const id = `toast-${now}-${Math.random()}`

    // Check if this toast should collapse with an existing one
    if (toast.collapseKey) {
      const existing = collapseMapRef.current.get(toast.collapseKey)

      if (existing && now - existing.timestamp < COLLAPSE_WINDOW_MS) {
        // Collapse: update existing toast with incremented count
        collapseMapRef.current.set(toast.collapseKey, { id: existing.id, timestamp: now })

        setToasts((prev) => {
          return prev.map((t) => {
            if (t.id === existing.id) {
              const newCount = (t._collapseCount ?? 1) + 1
              return {
                ...t,
                _collapseCount: newCount,
                // Update message to show count (caller can handle this in message)
              }
            }
            return t
          })
        })
        return
      }

      // New collapse group - register it
      collapseMapRef.current.set(toast.collapseKey, { id, timestamp: now })
    }

    setToasts((prev) => {
      // Limit to 3 toasts, removing oldest if needed
      const MAX_TOASTS = 3;
      const newToasts = [...prev, { ...toast, id, _collapseCount: 1 }];
      if (newToasts.length > MAX_TOASTS) {
        return newToasts.slice(newToasts.length - MAX_TOASTS);
      }
      return newToasts;
    })
  }, [])

  const dismissToast = useCallback((id: string) => {
    // Clean up collapse map entry for this toast
    collapseMapRef.current.forEach((value, key) => {
      if (value.id === id) {
        collapseMapRef.current.delete(key)
      }
    })
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within ToastProvider")
  }
  return context
}
