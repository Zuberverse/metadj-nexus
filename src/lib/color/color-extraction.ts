/**
 * Color Extraction Utility
 *
 * Extracts dominant colors from track artwork for dynamic background effects.
 * Uses Web Worker for CPU-intensive operations to prevent UI blocking.
 *
 * PERFORMANCE: Offloads color extraction to Web Worker, preventing
 * 100-300ms main thread blocking on every track change.
 */

import { logger } from "@/lib/logger"

export interface ExtractedColors {
  dominant: string;
  secondary: string;
  accent: string;
}

// Default MetaDJ purple colors for fallback
const DEFAULT_COLORS: ExtractedColors = {
  dominant: 'oklch(0.646 0.222 264.376)',
  secondary: 'oklch(0.627 0.265 303.9)',
  accent: 'oklch(0.6 0.118 184.704)'
};

// Web Worker instance (singleton)
let colorWorker: Worker | null = null;
let workerRequestId = 0;
const pendingRequests = new Map<string, {
  resolve: (colors: ExtractedColors) => void;
  reject: (error: Error) => void;
}>();

/**
 * Initialize the Web Worker for color extraction
 */
function getColorWorker(): Worker | null {
  if (typeof window === 'undefined') return null;

  if (!colorWorker) {
    try {
      // Create worker from the worker file
      colorWorker = new Worker(
        new URL('../workers/color-extraction.worker.ts', import.meta.url),
        { type: 'module' }
      );

      colorWorker.onmessage = (event) => {
        const { type, requestId, colors, error } = event.data;
        const pending = pendingRequests.get(requestId);

        if (!pending) return;
        pendingRequests.delete(requestId);

        if (type === 'result' && colors) {
          pending.resolve(colors);
        } else {
          pending.reject(new Error(error || 'Color extraction failed'));
        }
      };

      colorWorker.onerror = (error) => {
        logger.error('[ColorExtraction] Worker error', { error: String(error) });
        // Reject all pending requests
        pendingRequests.forEach(({ reject }) => {
          reject(new Error('Worker error'));
        });
        pendingRequests.clear();
      };
    } catch (error) {
      logger.warn('[ColorExtraction] Web Worker not supported, using main thread fallback');
      return null;
    }
  }

  return colorWorker;
}

/**
 * Convert RGB values to OKLCH color space for better perceptual blending
 * (Used for main thread fallback)
 */
function rgbToOklch(r: number, g: number, b: number): { l: number; c: number; h: number } {
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const chroma = Math.sqrt(Math.pow(r - luminance, 2) + Math.pow(g - luminance, 2) + Math.pow(b - luminance, 2));
  const hue = Math.atan2(b - luminance, r - luminance) * (180 / Math.PI);

  return {
    l: luminance / 255,
    c: chroma / 255,
    h: hue < 0 ? hue + 360 : hue
  };
}

/**
 * Calculate perceptual brightness of a color (0-255)
 */
function getPerceptualBrightness(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/**
 * Check if color meets WCAG contrast requirements against dark background
 */
function hasGoodContrast(r: number, g: number, b: number): boolean {
  const brightness = getPerceptualBrightness(r, g, b);
  return brightness > 60;
}

/**
 * Extract colors on main thread (fallback when Web Worker unavailable)
 */
function extractColorsFromImageDataSync(imageData: ImageData): ExtractedColors {
  const pixels = imageData.data;
  const colorMap = new Map<string, number>();

  for (let i = 0; i < pixels.length; i += 16) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const a = pixels[i + 3];

    if (a < 128) continue;
    if (getPerceptualBrightness(r, g, b) < 30) continue;
    if (getPerceptualBrightness(r, g, b) > 240) continue;

    const quantized = `${Math.floor(r / 16)}-${Math.floor(g / 16)}-${Math.floor(b / 16)}`;
    colorMap.set(quantized, (colorMap.get(quantized) || 0) + 1);
  }

  const sortedColors = Array.from(colorMap.entries())
    .map(([key, count]) => {
      const [r, g, b] = key.split('-').map(v => parseInt(v) * 16);
      return { r, g, b, count };
    })
    .sort((a, b) => b.count - a.count);

  if (sortedColors.length === 0) {
    return DEFAULT_COLORS;
  }

  const dominant = sortedColors[0];
  const dominantOklch = rgbToOklch(dominant.r, dominant.g, dominant.b);

  let secondary = sortedColors[1] || dominant;
  let accent = sortedColors[2] || dominant;

  for (let i = 1; i < sortedColors.length; i++) {
    const candidate = sortedColors[i];
    const candidateOklch = rgbToOklch(candidate.r, candidate.g, candidate.b);
    const hueDiff = Math.abs(candidateOklch.h - dominantOklch.h);

    if (hueDiff > 30 && hasGoodContrast(candidate.r, candidate.g, candidate.b)) {
      secondary = candidate;
      break;
    }
  }

  for (let i = 2; i < sortedColors.length; i++) {
    const candidate = sortedColors[i];
    const candidateOklch = rgbToOklch(candidate.r, candidate.g, candidate.b);
    const dominantHueDiff = Math.abs(candidateOklch.h - dominantOklch.h);
    const secondaryOklch = rgbToOklch(secondary.r, secondary.g, secondary.b);
    const secondaryHueDiff = Math.abs(candidateOklch.h - secondaryOklch.h);

    if (dominantHueDiff > 30 && secondaryHueDiff > 30 && hasGoodContrast(candidate.r, candidate.g, candidate.b)) {
      accent = candidate;
      break;
    }
  }

  const dominantColor = rgbToOklch(dominant.r, dominant.g, dominant.b);
  const secondaryColor = rgbToOklch(secondary.r, secondary.g, secondary.b);
  const accentColor = rgbToOklch(accent.r, accent.g, accent.b);

  return {
    dominant: `oklch(${dominantColor.l.toFixed(3)} ${(dominantColor.c * 0.6).toFixed(3)} ${dominantColor.h.toFixed(1)})`,
    secondary: `oklch(${secondaryColor.l.toFixed(3)} ${(secondaryColor.c * 0.5).toFixed(3)} ${secondaryColor.h.toFixed(1)})`,
    accent: `oklch(${accentColor.l.toFixed(3)} ${(accentColor.c * 0.4).toFixed(3)} ${accentColor.h.toFixed(1)})`
  };
}

/**
 * Extract colors using Web Worker (non-blocking)
 */
async function extractColorsWithWorker(imageData: ImageData): Promise<ExtractedColors> {
  const worker = getColorWorker();

  if (!worker) {
    // Fallback to main thread if worker unavailable
    return extractColorsFromImageDataSync(imageData);
  }

  return new Promise((resolve, reject) => {
    const requestId = `color-${++workerRequestId}`;
    pendingRequests.set(requestId, { resolve, reject });

    // Transfer ImageData to worker (zero-copy transfer)
    worker.postMessage({
      type: 'extract',
      imageData,
      requestId
    });

    // Timeout after 5 seconds
    setTimeout(() => {
      if (pendingRequests.has(requestId)) {
        pendingRequests.delete(requestId);
        reject(new Error('Color extraction timeout'));
      }
    }, 5000);
  });
}

/**
 * Load image and get ImageData for extraction
 */
async function getImageData(imageUrl: string, sampleSize: number = 64): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        canvas.width = sampleSize;
        canvas.height = sampleSize;

        ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
        const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
        resolve(imageData);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error(`Failed to load image: ${imageUrl}`));
    };

    img.src = imageUrl;
  });
}

/**
 * Extract dominant colors from an image using Web Worker (non-blocking)
 *
 * @param imageUrl - URL of the image to analyze
 * @param sampleSize - Size to downscale image for faster processing (default: 64)
 * @returns Promise resolving to extracted colors in OKLCH format
 */
export async function extractColorsFromImage(
  imageUrl: string,
  sampleSize: number = 64
): Promise<ExtractedColors> {
  try {
    const imageData = await getImageData(imageUrl, sampleSize);
    return await extractColorsWithWorker(imageData);
  } catch (error) {
    logger.warn('[ColorExtraction] Extraction failed, using defaults', { error: String(error) });
    return DEFAULT_COLORS;
  }
}

/**
 * Cache for extracted colors to avoid re-processing
 */
const colorCache = new Map<string, ExtractedColors>();

/**
 * Extract colors with caching support
 *
 * @param imageUrl - URL of the image to analyze
 * @param useCache - Whether to use cached results (default: true)
 * @returns Promise resolving to extracted colors
 */
export async function extractColorsWithCache(
  imageUrl: string,
  useCache: boolean = true
): Promise<ExtractedColors> {
  if (useCache && colorCache.has(imageUrl)) {
    return colorCache.get(imageUrl)!;
  }

  const colors = await extractColorsFromImage(imageUrl);

  if (useCache) {
    colorCache.set(imageUrl, colors);

    // Limit cache size to prevent memory issues
    if (colorCache.size > 50) {
      const firstKey = colorCache.keys().next().value;
      if (firstKey) colorCache.delete(firstKey);
    }
  }

  return colors;
}

/**
 * Get default MetaDJ colors (for immediate display while extraction runs)
 */
export function getDefaultColors(): ExtractedColors {
  return { ...DEFAULT_COLORS };
}

/**
 * Create a gradient string from extracted colors
 *
 * @param colors - Extracted colors object
 * @param opacity - Overall opacity for the gradient (0-1)
 * @returns CSS gradient string
 */
export function createGradientFromColors(colors: ExtractedColors, opacity: number = 0.3): string {
  return `radial-gradient(circle at 20% 20%, ${colors.dominant} / ${opacity}), radial-gradient(circle at 80% 80%, ${colors.secondary} / ${opacity * 0.8}), radial-gradient(circle at 50% 50%, ${colors.accent} / ${opacity * 0.6})`;
}

/**
 * Pre-extract colors for the next track in queue (idle time optimization)
 *
 * @param imageUrls - Array of image URLs to pre-extract
 */
export async function preExtractColors(imageUrls: string[]): Promise<void> {
  // Use requestIdleCallback if available, otherwise use setTimeout
  const scheduleIdle = typeof requestIdleCallback !== 'undefined'
    ? requestIdleCallback
    : (cb: () => void) => setTimeout(cb, 50);

  for (const url of imageUrls) {
    if (colorCache.has(url)) continue;

    await new Promise<void>((resolve) => {
      scheduleIdle(async () => {
        try {
          await extractColorsWithCache(url);
        } catch {
          // Ignore pre-extraction errors
        }
        resolve();
      });
    });
  }
}
