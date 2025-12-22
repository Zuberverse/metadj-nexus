"use client"

/**
 * Mood Channel Icons
 *
 * Custom SVG icons for mood channels with brand-consistent styling.
 * Each icon is designed to represent the mood/energy of its channel
 * while maintaining visual consistency with the MetaDJ aesthetic.
 */

import type { SVGProps } from "react"

interface MoodIconProps extends SVGProps<SVGSVGElement> {
  size?: number
}

/**
 * Deep Focus Icon - Concentric circles representing concentration
 */
export function DeepFocusIcon({ size = 24, className = "", ...props }: MoodIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.3" />
      <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.6" />
      <circle cx="12" cy="12" r="2.5" fill="currentColor" />
    </svg>
  )
}

/**
 * Energy Boost Icon - Lightning bolt with motion lines
 */
export function EnergyBoostIcon({ size = 24, className = "", ...props }: MoodIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path
        d="M13 2L4.5 14H11L10 22L19.5 10H13L13 2Z"
        fill="currentColor"
        fillOpacity="0.2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Motion lines */}
      <path d="M3 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.5" />
      <path d="M2 12H5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.5" />
    </svg>
  )
}

/**
 * Creative Flow Icon - Flowing wave pattern representing ideas
 */
export function CreativeFlowIcon({ size = 24, className = "", ...props }: MoodIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Flowing curves */}
      <path
        d="M3 12C5 8 7 8 9 12C11 16 13 16 15 12C17 8 19 8 21 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Sparkle accent */}
      <circle cx="18" cy="6" r="1.5" fill="currentColor" />
      <path d="M18 3V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M18 8V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M15.5 6H16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M19.5 6H20.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

/**
 * Map mood channel IDs to their icon components
 */
export const MOOD_CHANNEL_ICONS: Record<string, React.FC<MoodIconProps>> = {
  "deep-focus": DeepFocusIcon,
  "energy-boost": EnergyBoostIcon,
  "creative-flow": CreativeFlowIcon,
}

/**
 * Get the icon component for a mood channel
 */
export function getMoodChannelIcon(channelId: string): React.FC<MoodIconProps> | null {
  return MOOD_CHANNEL_ICONS[channelId] || null
}
