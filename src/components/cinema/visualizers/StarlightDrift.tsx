"use client"

import { useEffect, useRef } from "react"
import { VISUALIZER_COLORS } from "@/lib/color/visualizer-palette"

interface StarlightDriftProps {
  active?: boolean
  bassLevel: number
  midLevel: number
  highLevel: number
  /** Stable seed for track-scoped visual variation. */
  seed?: number
  performanceMode?: boolean
}

interface Star {
  x: number
  y: number
  size: number
  speed: number
  alpha: number
  twinkle: number
  tint: [number, number, number]
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

const STAR_TINTS: [number, number, number][] = [
  hexToRgb(VISUALIZER_COLORS.cyan),
  hexToRgb(VISUALIZER_COLORS.purple),
  hexToRgb(VISUALIZER_COLORS.magenta),
  hexToRgb(VISUALIZER_COLORS.cyanTintLight),
]

export function StarlightDrift({
  active = true,
  bassLevel,
  midLevel,
  highLevel,
  seed,
  performanceMode = false,
}: StarlightDriftProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number | null>(null)
  const sizeRef = useRef({ width: 0, height: 0 })
  const starsRef = useRef<Star[]>([])
  const activeRef = useRef(active)
  const audioRef = useRef({ bass: 0, mid: 0, high: 0 })
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
    const random = seededRandom(baseSeed ^ 0x2b77)
    const starCount = performanceMode ? 90 : 150

    const resetStars = (width: number, height: number) => {
      starsRef.current = Array.from({ length: starCount }, () => {
        const tint = STAR_TINTS[Math.floor(random() * STAR_TINTS.length)] || STAR_TINTS[0]
        return {
          x: random() * width,
          y: random() * height,
          size: 0.6 + random() * 1.8,
          speed: 0.08 + random() * 0.22,
          alpha: 0.25 + random() * 0.6,
          twinkle: 0.6 + random() * 1.2,
          tint,
        }
      })
    }

    const resize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      const rect = parent.getBoundingClientRect()
      const dpr = performanceMode ? 1 : Math.min(2, window.devicePixelRatio || 1)

      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      sizeRef.current = { width: rect.width, height: rect.height }
      resetStars(rect.width, rect.height)

      const gradient = ctx.createRadialGradient(
        rect.width * 0.5,
        rect.height * 0.45,
        0,
        rect.width * 0.5,
        rect.height * 0.45,
        Math.max(rect.width, rect.height) * 0.9
      )
      gradient.addColorStop(0, "rgba(12, 8, 28, 0.95)")
      gradient.addColorStop(0.5, "rgba(4, 8, 18, 0.9)")
      gradient.addColorStop(1, "rgba(0, 0, 0, 0.9)")
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

      const bass = audioRef.current.bass
      const mid = audioRef.current.mid
      const high = audioRef.current.high
      const energy = Math.min(1, bass * 0.65 + mid * 0.3 + high * 0.2)
      const speedBoost = 0.5 + energy * 1.1

      starsRef.current.forEach((star) => {
        star.y += star.speed * speedBoost
        if (star.y > height + 4) {
          star.y = -4
          star.x = random() * width
        }

        const flicker = 0.7 + Math.sin(now * 0.0015 * star.twinkle + star.x) * 0.3
        const alpha = star.alpha * flicker * (0.75 + energy * 0.35)
        ctx.fillStyle = `rgba(${star.tint[0]}, ${star.tint[1]}, ${star.tint[2]}, ${alpha.toFixed(3)})`
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size + energy * 0.8, 0, Math.PI * 2)
        ctx.fill()
      })

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
