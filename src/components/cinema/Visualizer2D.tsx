"use client"

import dynamic from "next/dynamic"
import type { VisualizerStyle } from "@/data/scenes"

interface Visualizer2DProps {
  active?: boolean
  bassLevel: number
  midLevel: number
  highLevel: number
  style: VisualizerStyle
  /** Stable seed for track-scoped visual variation. */
  seed?: number
  /** Optional performance mode for future 2D tuning. */
  performanceMode?: boolean
}

type Visualizer2DRendererProps = Omit<Visualizer2DProps, "style">

const PixelParadise = dynamic<Visualizer2DRendererProps>(
  () => import("./visualizers/PixelParadise").then((mod) => mod.PixelParadise),
  { ssr: false, loading: () => null },
)

const EightBitAdventure = dynamic<Visualizer2DRendererProps>(
  () => import("./visualizers/EightBitAdventure").then((mod) => mod.EightBitAdventure),
  { ssr: false, loading: () => null },
)

const SynthwaveHorizon = dynamic<Visualizer2DRendererProps>(
  () => import("./visualizers/SynthwaveHorizon").then((mod) => mod.SynthwaveHorizon),
  { ssr: false, loading: () => null },
)

const SpectrumRing = dynamic<Visualizer2DRendererProps>(
  () => import("./visualizers/SpectrumRing").then((mod) => mod.SpectrumRing),
  { ssr: false, loading: () => null },
)

const StarlightDrift = dynamic<Visualizer2DRendererProps>(
  () => import("./visualizers/StarlightDrift").then((mod) => mod.StarlightDrift),
  { ssr: false, loading: () => null },
)

export function Visualizer2D({ active = true, bassLevel, midLevel, highLevel, style, seed, performanceMode }: Visualizer2DProps) {
  const sharedProps = { active, bassLevel, midLevel, highLevel, seed, performanceMode }

  if (style.type === "pixel-paradise") {
    return (
      <PixelParadise
        {...sharedProps}
      />
    )
  }

  if (style.type === "eight-bit-adventure") {
    return (
      <EightBitAdventure
        {...sharedProps}
      />
    )
  }

  if (style.type === "synthwave-horizon") {
    return (
      <SynthwaveHorizon
        {...sharedProps}
      />
    )
  }

  if (style.type === "spectrum-ring") {
    return (
      <SpectrumRing
        {...sharedProps}
      />
    )
  }

  if (style.type === "starlight-drift") {
    return (
      <StarlightDrift
        {...sharedProps}
      />
    )
  }

  return null
}
