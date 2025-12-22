"use client"

import { useId } from "react"
import type { LucideIcon, LucideProps } from "lucide-react"

type BrandGradientIconProps = Omit<LucideProps, "color"> & {
  icon: LucideIcon
}

export function BrandGradientIcon({
  icon: Icon,
  children,
  ...iconProps
}: BrandGradientIconProps) {
  const rawId = useId()
  const safeId = rawId.replace(/:/g, "")
  const gradientId = `brand-gradient-${safeId}`

  const hasA11y =
    Boolean(iconProps["aria-label"]) ||
    Boolean(iconProps["aria-labelledby"])

  const ariaHidden = iconProps["aria-hidden"] ?? (hasA11y ? false : true)

  return (
    <Icon
      {...iconProps}
      aria-hidden={ariaHidden}
      color={`url(#${gradientId})`}
    >
      <defs>
        {/* gradientUnits="userSpaceOnUse" ensures seamless gradient across entire icon */}
        <linearGradient
          id={gradientId}
          x1="0"
          y1="0"
          x2="24"
          y2="24"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="50%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#D946EF" />
        </linearGradient>
      </defs>
      {children}
    </Icon>
  )
}

