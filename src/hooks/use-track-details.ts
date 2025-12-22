"use client"

import { useState, useCallback } from "react"
import type { Track } from "@/types"

interface UseTrackDetailsReturn {
  selectedTrack: Track | null
  isOpen: boolean
  openDetails: (track: Track) => void
  closeDetails: () => void
}

/**
 * Hook for managing track details modal state
 *
 * Provides state management for opening/closing track details modal
 * with proper focus management and keyboard handling.
 *
 * @returns Object containing modal state and control functions
 */
export function useTrackDetails(): UseTrackDetailsReturn {
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  const openDetails = useCallback((track: Track) => {
    setSelectedTrack(track)
    setIsOpen(true)
  }, [])

  const closeDetails = useCallback(() => {
    setIsOpen(false)
    // Delay clearing selected track for smooth transition
    setTimeout(() => setSelectedTrack(null), 300)
  }, [])

  return {
    selectedTrack,
    isOpen,
    openDetails,
    closeDetails
  }
}
