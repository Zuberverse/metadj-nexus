"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { WifiOff, RefreshCw, Home } from "lucide-react"
import { trackError } from "@/lib/analytics"
import { logger } from "@/lib/logger"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalRouteError({ error, reset }: ErrorProps) {
  const router = useRouter()

  useEffect(() => {
    // Log error details for debugging
    let context: Record<string, unknown> | undefined
    if (error?.message || error?.digest || error?.stack) {
      context = {}
      if (error?.message) context.message = error.message
      if (error?.digest) context.digest = error.digest
      if (error?.stack) context.stack = error.stack
    }
    context ? logger.error("Route error occurred", context) : logger.error("Route error occurred")

    // Track error in analytics for production monitoring
    try {
      trackError({
        message: error?.message || 'Unknown error',
        digest: error?.digest,
        source: 'route_error_boundary',
        isRouteError: true,
      })
    } catch {
      // Analytics should never break error handling
    }
  }, [error])

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 text-white overflow-hidden">
      {/* Background Ambience */}
      <div className="fixed inset-0 gradient-1 pointer-events-none" />
      <div className="fixed inset-0 bg-(--bg-overlay)/85 backdrop-blur-sm pointer-events-none" />

      <div className="relative z-10 max-w-md w-full text-center glass-radiant rounded-3xl px-8 py-10">
        <div className="mx-auto mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-metadj-purple/20 border border-metadj-purple/30 shadow-glow-primary">
          <WifiOff className="h-10 w-10 text-white" strokeWidth={1.5} />
        </div>

        <h1 className="text-3xl font-heading font-bold text-gradient-hero mb-3 uppercase tracking-wider">
          Signal Interrupted
        </h1>

        <p className="text-white/80 font-sans mb-8 leading-relaxed">
          I&apos;ve encountered a glitch in the stream. Let&apos;s get the vibe back on track.
        </p>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={reset}
            className="group w-full px-6 py-4 rounded-xl border border-(--border-standard) bg-white/5 text-white font-heading font-bold tracking-wide hover:bg-white/10 transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4 group-hover:animate-spin" />
            Retry Connection
          </button>

          <button
            type="button"
            onClick={() => router.push("/")}
            className="w-full px-6 py-4 rounded-xl gradient-4 text-white font-heading font-bold tracking-wide hover:scale-[1.02] hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
          >
            <Home className="w-4 h-4" />
            Return to Hub
          </button>
        </div>

        {error?.digest && (
          <div className="mt-8 pt-6 border-t border-(--border-subtle)">
            <p className="text-xs text-muted-accessible font-mono">Error Reference: {error.digest}</p>
          </div>
        )}
      </div>
    </div>
  )
}
