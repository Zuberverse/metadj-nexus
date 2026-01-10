"use client"

import { EightBitAdventure } from "./visualizers/EightBitAdventure"
import { PixelParadise } from "./visualizers/PixelParadise"
import { SpectrumRing } from "./visualizers/SpectrumRing"
import { StarlightDrift } from "./visualizers/StarlightDrift"
import { SynthwaveHorizon } from "./visualizers/SynthwaveHorizon"
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

export function Visualizer2D({ active = true, bassLevel, midLevel, highLevel, style, seed, performanceMode }: Visualizer2DProps) {
  if (style.type === "pixel-paradise") {
    return (
      <PixelParadise
        active={active}
        bassLevel={bassLevel}
        midLevel={midLevel}
        highLevel={highLevel}
        seed={seed}
        performanceMode={performanceMode}
      />
    )
  }

  if (style.type === "eight-bit-adventure") {
    return (
      <EightBitAdventure
        active={active}
        bassLevel={bassLevel}
        midLevel={midLevel}
        highLevel={highLevel}
        seed={seed}
        performanceMode={performanceMode}
      />
    )
  }

  if (style.type === "synthwave-horizon") {
    return (
      <SynthwaveHorizon
        active={active}
        bassLevel={bassLevel}
        midLevel={midLevel}
        highLevel={highLevel}
        seed={seed}
        performanceMode={performanceMode}
      />
    )
  }

  if (style.type === "spectrum-ring") {
    return (
      <SpectrumRing
        active={active}
        bassLevel={bassLevel}
        midLevel={midLevel}
        highLevel={highLevel}
        seed={seed}
        performanceMode={performanceMode}
      />
    )
  }

  if (style.type === "starlight-drift") {
    return (
      <StarlightDrift
        active={active}
        bassLevel={bassLevel}
        midLevel={midLevel}
        highLevel={highLevel}
        seed={seed}
        performanceMode={performanceMode}
      />
    )
  }

  return null
}
