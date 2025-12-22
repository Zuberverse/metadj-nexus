import { BookOpen, Loader2 } from "lucide-react"

export default function GuideLoading() {
  return (
    <div
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading User Guide"
    >
      <div className="pointer-events-none fixed inset-0 gradient-1 opacity-95" aria-hidden="true" />
      <div
        className="pointer-events-none fixed inset-0 bg-(--bg-overlay)/92 backdrop-blur-3xl"
        aria-hidden="true"
      />

      <div className="relative z-10 flex items-center gap-3 rounded-2xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white/80 shadow-2xl backdrop-blur-xl">
        <BookOpen className="h-5 w-5 text-purple-300" aria-hidden="true" />
        <span className="font-medium">Loading User Guide…</span>
        <Loader2 className="h-5 w-5 animate-spin text-purple-300" aria-hidden="true" />
      </div>
    </div>
  )
}
