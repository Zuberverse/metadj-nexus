/**
 * Color Utilities
 *
 * Centralized exports for color extraction and visualizer palettes.
 *
 * @module lib/color
 */

export {
  extractColorsFromImage,
  extractColorsWithCache,
  getDefaultColors,
  createGradientFromColors,
  preExtractColors,
  type ExtractedColors,
} from "./color-extraction"

export { VISUALIZER_COLORS, VISUALIZER_SRGB } from "./visualizer-palette"
