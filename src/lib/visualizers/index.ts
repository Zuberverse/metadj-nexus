/**
 * Visualizer Utilities
 *
 * Seed generation, helpers, and draw utilities for visualizers.
 *
 * @module lib/visualizers
 */

export { hashSeed, combineSeeds, type SeedInput } from "./seed"

// EightBitAdventure helpers - re-exported for convenience
export {
  // Types
  type EnemyKind,
  type IntensityMode,
  type PropKind,
  type Star,
  type Cloud,
  type Prop,
  type Coin,
  type Enemy,
  type PowerUp,
  type Particle,
  type Slash,
  type Hero,
  type AdventureBackground,
  // Color utilities
  hexToRgb,
  PALETTE_RGB,
  lerp,
  clamp01,
  samplePalette,
  mixRgb,
  // Spawners
  seededRandom,
  createStars,
  createClouds,
  createProps,
  spawnDustBurst,
  spawnSparkBurst,
  // Draw functions
  drawPixelDisc,
  drawTree,
  drawTower,
  drawSign,
  drawLantern,
  drawCrystal,
  drawShrine,
  drawHero,
  drawEnemy,
  drawCoin,
  drawSlash,
  drawPowerUp,
} from "./eight-bit-helpers"
