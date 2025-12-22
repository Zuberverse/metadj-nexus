"use client"

import { type FC } from "react"

interface WisdomFooterProps {
  /** Optional override for the sign-off. Defaults to MetaDJ. */
  signedBy?: "MetaDJ"
}

/**
 * Shared footer component for Wisdom content articles.
 * Provides consistent sign-off styling across Thoughts, Guides, and Reflections.
 */
export const WisdomFooter: FC<WisdomFooterProps> = ({ signedBy = "MetaDJ" }) => {
  return (
    <footer className="mt-8 pt-6 border-t border-white/10">
      <p className="text-sm text-white/70 text-center italic">
        With that, I rest my mic. — {signedBy}
      </p>
    </footer>
  )
}
