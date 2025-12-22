import React from 'react'

interface GalaxyProps {
  className?: string
}

export function Galaxy({ className = 'h-4 w-4' }: GalaxyProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.3" />
      <path d="M12 2C6.5 4 4 8 4 12c0 4 2.5 8 8 10" />
      <path d="M12 2c5.5 2 8 6 8 10 0 4-2.5 8-8 10" />
      <path d="M2 12c2-5.5 6-8 10-8 4 0 8 2.5 10 8" opacity="0.6" />
      <path d="M2 12c2 5.5 6 8 10 8 4 0 8-2.5 10-8" opacity="0.6" />
      <circle cx="7" cy="8" r="1" fill="currentColor" opacity="0.7" />
      <circle cx="17" cy="16" r="1" fill="currentColor" opacity="0.7" />
      <circle cx="16" cy="7" r="0.8" fill="currentColor" opacity="0.5" />
      <circle cx="8" cy="16" r="0.8" fill="currentColor" opacity="0.5" />
    </svg>
  )
}
