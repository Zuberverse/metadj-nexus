"use client"

import { useEffect } from "react"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"
import { logger } from "@/lib/logger"
import "./globals.css"

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalAppError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    logger.error('Global application error occurred', {
      message: error.message,
      digest: error.digest,
      stack: error.stack
    })
  }, [error])

  return (
    <html lang="en">
      <body className="bg-black text-white antialiased">
        <div className="relative min-h-screen flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center border border-(--border-subtle) rounded-3xl bg-card/40 backdrop-blur-xl px-8 py-10 shadow-[0_25px_60px_rgba(41,12,90,0.55)]">
            <div className="mx-auto mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl gradient-2-tint border border-(--border-subtle) shadow-lg shadow-purple-900/20">
              <AlertTriangle className="h-10 w-10 text-white" strokeWidth={1.5} />
            </div>
            
            <h1 className="text-3xl font-heading font-bold text-gradient-hero mb-3 uppercase tracking-wider">
              Critical Signal Failure
            </h1>
            
            <p className="text-white/80 font-sans mb-8 leading-relaxed">
              The connection has been completely severed. A full system reboot is required to restore the vibe.
            </p>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => reset()}
                className="group w-full px-6 py-4 rounded-xl border border-(--border-standard) bg-white/5 text-white font-heading font-bold tracking-wide hover:bg-white/10 transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4 group-hover:animate-spin" />
                Retry System Load
              </button>
              
              <button
                type="button"
                onClick={() => window.location.href = "/"}
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
      </body>
    </html>
  )
}
