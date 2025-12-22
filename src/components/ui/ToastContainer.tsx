"use client"

import { type FC } from "react"
import { useToast } from "@/contexts/ToastContext"
import { Toast } from "./Toast"

export const ToastContainer: FC = () => {
  const { toasts, dismissToast } = useToast()

  if (toasts.length === 0) {
    return null
  }

  return (
    <div
      className="fixed z-100 flex flex-col gap-2 pointer-events-none right-4 bottom-[calc(9rem_+_env(safe-area-inset-bottom))] md:right-6 md:bottom-6"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            id={toast.id}
            message={toast.message}
            variant={toast.variant}
            duration={toast.duration}
            action={toast.action}
            onDismiss={dismissToast}
            collapseCount={toast._collapseCount}
          />
        </div>
      ))}
    </div>
  )
}
