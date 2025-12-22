"use client"

import { Component, ReactNode } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { logger } from "@/lib/logger"

/**
 * App-Level Error Boundary
 *
 * Catches unhandled errors in the React component tree and displays
 * a user-friendly fallback UI. Prevents full app crashes from propagating.
 */

interface AppErrorBoundaryProps {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

class AppErrorBoundary extends Component<AppErrorBoundaryProps, State> {
  constructor(props: AppErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error for debugging, could send to error tracking in production
    logger.error('App Error Boundary caught error', { error: error.message, stack: error.stack, componentStack: errorInfo.componentStack })
  }

  handleReload = () => {
    // Full page reload to reset app state
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
          <div className="max-w-md w-full text-center">
            {/* Error icon */}
            <div className="mx-auto w-16 h-16 rounded-full bg-(--metadj-red)/20 flex items-center justify-center mb-6">
              <AlertTriangle className="w-8 h-8 text-(--metadj-red)" />
            </div>

            {/* Error message */}
            <h1 className="text-xl font-heading font-semibold text-gradient-hero mb-2">
              Signal Interrupted
            </h1>
            <p className="text-white/60 text-sm mb-8">
              I hit a glitch in the stream. Refresh to get back in.
            </p>

            {/* Reload button */}
            <button
              onClick={this.handleReload}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl brand-gradient text-white font-semibold transition-all duration-150 border border-white/25 neon-glow"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>

            {/* Technical details for development */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-8 text-left">
                <summary className="text-white/40 text-xs cursor-pointer hover:text-white/60">
                  Technical Details
                </summary>
                <pre className="mt-2 p-4 rounded-lg bg-black/50 text-red-400 text-xs overflow-auto max-h-48">
                  {this.state.error.message}
                  {'\n\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export { AppErrorBoundary }
