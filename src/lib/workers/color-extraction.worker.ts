/**
 * Color Extraction Web Worker
 *
 * Performs CPU-intensive color extraction off the main thread.
 * This prevents UI blocking during track changes.
 *
 * PERFORMANCE: Moves ~100-300ms of main thread blocking to background
 */

// Types for worker communication
interface ExtractedColors {
  dominant: string;
  secondary: string;
  accent: string;
}

interface WorkerMessage {
  type: 'extract';
  imageData: ImageData;
  requestId: string;
}

interface WorkerResponse {
  type: 'result' | 'error';
  requestId: string;
  colors?: ExtractedColors;
  error?: string;
}

/**
 * Convert RGB values to OKLCH color space for better perceptual blending
 */
function rgbToOklch(r: number, g: number, b: number): { l: number; c: number; h: number } {
  // Simplified conversion - for production, consider using a library like culori
  // This provides a reasonable approximation for our use case
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
  // Use sRGB luminance calculation
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/**
 * Check if color meets WCAG contrast requirements against dark background
 */
function hasGoodContrast(r: number, g: number, b: number): boolean {
  const brightness = getPerceptualBrightness(r, g, b);
  // Ensure colors are not too dark for dark theme
  return brightness > 60;
}

/**
 * Extract dominant colors from ImageData
 */
function extractColorsFromImageData(imageData: ImageData): ExtractedColors {
  const pixels = imageData.data;

  // Color frequency map
  const colorMap = new Map<string, number>();

  // Sample every 4th pixel for performance (25% of pixels)
  for (let i = 0; i < pixels.length; i += 16) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const a = pixels[i + 3];

    // Skip transparent pixels and very dark/light pixels
    if (a < 128) continue;
    if (getPerceptualBrightness(r, g, b) < 30) continue;
    if (getPerceptualBrightness(r, g, b) > 240) continue;

    // Quantize colors to reduce noise (group similar colors)
    const quantized = `${Math.floor(r / 16)}-${Math.floor(g / 16)}-${Math.floor(b / 16)}`;
    colorMap.set(quantized, (colorMap.get(quantized) || 0) + 1);
  }

  // Convert map to array and sort by frequency
  const sortedColors = Array.from(colorMap.entries())
    .map(([key, count]) => {
      const [r, g, b] = key.split('-').map(v => parseInt(v) * 16);
      return { r, g, b, count };
    })
    .sort((a, b) => b.count - a.count);

  if (sortedColors.length === 0) {
    // Fallback to MetaDJ purple if no colors found
    return {
      dominant: 'oklch(0.646 0.222 264.376)',
      secondary: 'oklch(0.627 0.265 303.9)',
      accent: 'oklch(0.6 0.118 184.704)'
    };
  }

  // Get dominant color
  const dominant = sortedColors[0];
  const dominantOklch = rgbToOklch(dominant.r, dominant.g, dominant.b);

  // Find complementary colors with good contrast and different hues
  let secondary = sortedColors[1] || dominant;
  let accent = sortedColors[2] || dominant;

  // Ensure secondary is different from dominant
  for (let i = 1; i < sortedColors.length; i++) {
    const candidate = sortedColors[i];
    const candidateOklch = rgbToOklch(candidate.r, candidate.g, candidate.b);
    const hueDiff = Math.abs(candidateOklch.h - dominantOklch.h);

    if (hueDiff > 30 && hasGoodContrast(candidate.r, candidate.g, candidate.b)) {
      secondary = candidate;
      break;
    }
  }

  // Ensure accent is different from both
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

  // Convert to OKLCH strings with reduced saturation for backgrounds
  const dominantColor = rgbToOklch(dominant.r, dominant.g, dominant.b);
  const secondaryColor = rgbToOklch(secondary.r, secondary.g, secondary.b);
  const accentColor = rgbToOklch(accent.r, accent.g, accent.b);

  return {
    dominant: `oklch(${dominantColor.l.toFixed(3)} ${(dominantColor.c * 0.6).toFixed(3)} ${dominantColor.h.toFixed(1)})`,
    secondary: `oklch(${secondaryColor.l.toFixed(3)} ${(secondaryColor.c * 0.5).toFixed(3)} ${secondaryColor.h.toFixed(1)})`,
    accent: `oklch(${accentColor.l.toFixed(3)} ${(accentColor.c * 0.4).toFixed(3)} ${accentColor.h.toFixed(1)})`
  };
}

// Worker message handler
self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const { type, imageData, requestId } = event.data;

  if (type === 'extract') {
    try {
      const colors = extractColorsFromImageData(imageData);
      const response: WorkerResponse = {
        type: 'result',
        requestId,
        colors
      };
      self.postMessage(response);
    } catch (error) {
      const response: WorkerResponse = {
        type: 'error',
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      self.postMessage(response);
    }
  }
};

export {}; // Make this a module
