"use client"

import { Component, ReactNode, Suspense } from "react"
import { Loader2, AlertCircle, XCircle } from "lucide-react"

/**
 * TrackDetailsModalErrorBoundary
 *
 * Specialized error boundary for the TrackDetailsModal.
 *
 * **Why a separate component?**
 * The base ErrorBoundary (src/components/ui/ErrorBoundary.tsx) now supports
 * `maxRetries` and `onClose` props, but this component exists because:
 * 1. Modal-specific positioning (fixed bottom with safe-area-inset)
 * 2. Built-in Suspense wrapper for lazy-loaded modal content
 * 3. Custom radiant-panel styling matching modal design language
 *
 * For non-modal error boundaries, use the base ErrorBoundary with
 * `maxRetries` and `onClose` props instead.
 */

/**
 * Maximum number of retry attempts before showing permanent error state
 */
const MAX_RETRY_COUNT = 3

interface TrackDetailsModalErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  /** Called when user clicks Close/Cancel to dismiss the error state */
  onClose?: () => void
}

interface State {
  hasError: boolean
  error: Error | null
  retryCount: number
}

class TrackDetailsModalErrorBoundary extends Component<TrackDetailsModalErrorBoundaryProps, State> {
  constructor(props: TrackDetailsModalErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null, retryCount: 0 }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      retryCount: prevState.retryCount + 1
    }))
  }

  handleClose = () => {
    // Reset state and call onClose callback
    this.setState({ hasError: false, error: null, retryCount: 0 })
    if (this.props.onClose) {
      this.props.onClose()
    }
  }

  render() {
    const hasReachedMaxRetries = this.state.retryCount >= MAX_RETRY_COUNT

    if (this.state.hasError) {
      return (
        <div className="fixed inset-x-0 bottom-[calc(10.5rem+env(safe-area-inset-bottom))] z-150 flex justify-center px-3 sm:px-5">
          <div className="pointer-events-auto radiant-panel relative overflow-hidden rounded-[28px] border border-white/12 bg-(--bg-modal) w-full max-w-3xl shadow-[0_35px_80px_rgba(3,5,20,0.75)]">
            <div className="relative z-10 px-6 py-8 text-center">
              {hasReachedMaxRetries ? (
                <XCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              ) : (
                <AlertCircle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
              )}
              <h3 className="text-lg font-semibold text-white mb-2">
                {hasReachedMaxRetries
                  ? "Unable to Load Track Details"
                  : "Failed to Load Track Details"}
              </h3>
              <p className="text-sm text-white/70 mb-6">
                {hasReachedMaxRetries
                  ? "We've tried multiple times but couldn't load the track details. Please try again later."
                  : this.state.retryCount > 0
                    ? `We're having trouble loading the track details. (Attempt ${this.state.retryCount + 1} of ${MAX_RETRY_COUNT})`
                    : "There was an issue loading the track details."}
              </p>
              <div className="flex justify-center gap-3">
                {!hasReachedMaxRetries && (
                  <button
                    onClick={this.handleRetry}
                    className="inline-flex items-center px-4 py-2 rounded-full border border-white/20 bg-white/10 text-white hover:bg-white/20 transition-colors focus-ring-glow"
                  >
                    Try Again
                  </button>
                )}
                <button
                  onClick={this.handleClose}
                  className="inline-flex items-center px-4 py-2 rounded-full border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-colors focus-ring-glow"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return (
      <Suspense
        fallback={
          <div className="fixed inset-0 z-100 flex items-center justify-center overflow-hidden">
            <div className="pointer-events-none absolute inset-0 gradient-1 opacity-95" />
            <div className="pointer-events-none absolute inset-0 bg-(--bg-overlay)/85 backdrop-blur-3xl" />
            <Loader2 className="relative z-10 h-12 w-12 animate-spin text-purple-400" />
          </div>
        }
      >
        {this.props.children}
      </Suspense>
    )
  }
}

export { TrackDetailsModalErrorBoundary }
