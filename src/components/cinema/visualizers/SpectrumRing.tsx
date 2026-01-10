"use client"

import { useEffect, useRef } from "react"
import { VISUALIZER_COLORS } from "@/lib/color/visualizer-palette"

interface SpectrumRingProps {
  active?: boolean
  bassLevel: number
  midLevel: number
  highLevel: number
  /** Stable seed for track-scoped visual variation. */
  seed?: number
  performanceMode?: boolean
}

interface RingPalette {
  rgb: [number, number, number][]
}

function seededRandom(seed: number): () => number {
  return function () {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }
}

function clamp01(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.min(1, Math.max(0, value))
}

function hexToRgb(hex: string): [number, number, number] {
  const sanitized = hex.replace("#", "")
  const bigint = parseInt(sanitized, 16)
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255]
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function samplePalette(palette: RingPalette, t: number): [number, number, number] {
  const count = palette.rgb.length
  if (count === 0) return [255, 255, 255]
  const wrapped = ((t % 1) + 1) % 1
  const scaled = wrapped * count
  const idx = Math.floor(scaled)
  const next = (idx + 1) % count
  const frac = scaled - idx
  const [r1, g1, b1] = palette.rgb[idx] ?? palette.rgb[0]
  const [r2, g2, b2] = palette.rgb[next] ?? palette.rgb[0]
  return [lerp(r1, r2, frac), lerp(g1, g2, frac), lerp(b1, b2, frac)]
}

const PALETTE: RingPalette = {
  rgb: [
    hexToRgb(VISUALIZER_COLORS.purple),
    hexToRgb(VISUALIZER_COLORS.cyan),
    hexToRgb(VISUALIZER_COLORS.magenta),
    hexToRgb(VISUALIZER_COLORS.indigo),
  ],
}

export function SpectrumRing({
  active = true,
  bassLevel,
  midLevel,
  highLevel,
  seed,
  performanceMode = false,
}: SpectrumRingProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number | null>(null)
  const sizeRef = useRef({ width: 0, height: 0 })
  const audioRef = useRef({ bass: 0, mid: 0, high: 0 })
  const activeRef = useRef(active)
  const ringNoiseRef = useRef<number[]>([])
  const gradientRef = useRef<CanvasGradient | null>(null)

  audioRef.current.bass = clamp01(bassLevel)
  audioRef.current.mid = clamp01(midLevel)
  audioRef.current.high = clamp01(highLevel)

  useEffect(() => {
    activeRef.current = active
  }, [active])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const baseSeed = (seed ?? 0) >>> 0
    const random = seededRandom(baseSeed ^ 0x1f4b)
    const segmentCount = performanceMode ? 84 : 120
    ringNoiseRef.current = Array.from({ length: segmentCount }, () => random())

    const resize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      const rect = parent.getBoundingClientRect()
      const dpr = performanceMode ? 1 : Math.min(2, window.devicePixelRatio || 1)

      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      sizeRef.current = { width: rect.width, height: rect.height }

      const centerX = rect.width / 2
      const centerY = rect.height / 2
      const radius = Math.min(rect.width, rect.height) * 0.55
      const gradient = ctx.createRadialGradient(centerX, centerY, radius * 0.15, centerX, centerY, radius)
      gradient.addColorStop(0, "rgba(12, 8, 26, 0.95)")
      gradient.addColorStop(0.55, "rgba(5, 12, 24, 0.9)")
      gradient.addColorStop(1, "rgba(0, 0, 0, 0.85)")
      gradientRef.current = gradient
    }

    resize()
    window.addEventListener("resize", resize)

    const draw = (now: number) => {
      if (!activeRef.current) {
        rafRef.current = requestAnimationFrame(draw)
        return
      }

      const { width, height } = sizeRef.current
      if (!width || !height) {
        rafRef.current = requestAnimationFrame(draw)
        return
      }

      ctx.clearRect(0, 0, width, height)
      if (gradientRef.current) {
        ctx.fillStyle = gradientRef.current
        ctx.fillRect(0, 0, width, height)
      }

      const centerX = width / 2
      const centerY = height / 2
      const baseRadius = Math.min(width, height) * 0.28
      const bass = audioRef.current.bass
      const mid = audioRef.current.mid
      const high = audioRef.current.high
      const energy = Math.min(1, bass * 0.7 + mid * 0.35 + high * 0.2)
      const ringPulse = 0.7 + energy * 0.55
      const time = now * 0.00035

      ctx.lineCap = "round"

      ringNoiseRef.current.forEach((noise, index) => {
        const angle = (index / ringNoiseRef.current.length) * Math.PI * 2 + time
        const wobble = Math.sin(time * 2.1 + noise * 6.2) * 0.12
        const length = (12 + noise * 22) * ringPulse * (0.7 + wobble)
        const innerRadius = baseRadius * (0.95 + noise * 0.12)
        const outerRadius = innerRadius + length

        const [r, g, b] = samplePalette(PALETTE, (index / ringNoiseRef.current.length) + time * 0.12)
        const alpha = 0.35 + energy * 0.35

        ctx.strokeStyle = `rgba(${r.toFixed(0)}, ${g.toFixed(0)}, ${b.toFixed(0)}, ${alpha.toFixed(3)})`
        ctx.lineWidth = 1.6 + noise * 1.6

        const x1 = centerX + Math.cos(angle) * innerRadius
        const y1 = centerY + Math.sin(angle) * innerRadius
        const x2 = centerX + Math.cos(angle) * outerRadius
        const y2 = centerY + Math.sin(angle) * outerRadius

        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
      })

      // Inner halo ring
      ctx.beginPath()
      ctx.strokeStyle = `rgba(139, 92, 246, ${0.2 + energy * 0.2})`
      ctx.lineWidth = 1
      ctx.arc(centerX, centerY, baseRadius * (0.85 + energy * 0.08), 0, Math.PI * 2)
      ctx.stroke()

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      window.removeEventListener("resize", resize)
    }
  }, [seed, performanceMode])

  return <canvas ref={canvasRef} className="h-full w-full" aria-hidden />
}
