"use client"

/**
 * Enhanced Player Integration Example
 *
 * Demonstrates how to integrate Phase 3 visual enhancements:
 * - DynamicBackground with artwork-based colors
 * - WaveformVisualizer synchronized with playback
 * - CollectionArtwork with loading states
 *
 * This example shows the integration pattern. To use in production:
 * 1. Import these components into HomePageClient or player layouts
 * 2. Pass appropriate props from player context
 * 3. Enable/disable features via user preferences
 */

import { CollectionArtwork } from '@/components/player/CollectionArtwork';
import { DynamicBackground } from '@/components/visuals';
import type { Track } from '@/types';

interface EnhancedPlayerExampleProps {
  track: Track | null;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  audioRef: React.RefObject<HTMLAudioElement>;
  /** Enable dynamic background (default: true) */
  enableDynamicBackground?: boolean;
}

/**
 * Example integration of visual enhancements
 *
 * Usage in HomePageClient:
 * ```tsx
 * import { DynamicBackground } from '@/components/visuals';
 *
 * // Add to component return:
 * <DynamicBackground
 *   artworkUrl={currentTrack?.artworkUrl}
 *   enabled={preferences.dynamicBackground}
 * />
 * ```
 *
 * Usage in ControlPanelOverlay:
 * ```tsx
 * import WaveformVisualizer from '@/components/visuals/WaveformVisualizer';
 * import CollectionArtwork from '@/components/player/CollectionArtwork';
 *
 * // Replace existing Image component:
 * <CollectionArtwork
 *   src={track.artworkUrl}
 *   alt={`${track.title} artwork`}
 *   size="large"
 *   priority
 * />
 *
 * // Add waveform below progress bar:
 * <WaveformVisualizer
 *   audioRef={audioRef}
 *   currentTime={currentTime}
 *   duration={duration}
 *   isPlaying={isPlaying}
 *   height={80}
 * />
 * ```
 */
export function EnhancedPlayerExample({
  track,
  enableDynamicBackground = true,
}: EnhancedPlayerExampleProps) {
  return (
    <>
      {/* Dynamic Background - renders at app root level */}
      {enableDynamicBackground && (
        <DynamicBackground
          artworkUrl={track?.artworkUrl}
          enabled={enableDynamicBackground}
          opacity={0.25}
          transitionDuration={1500}
        />
      )}

      {/* Player UI with visual enhancements */}
      <div className="space-y-4 p-6">
        {/* Collection Artwork with improved loading states */}
        <div className="flex justify-center">
          <CollectionArtwork
            src={track?.artworkUrl}
            alt={track ? `${track.title} by ${track.artist}` : 'No track playing'}
            size="large"
            priority
            showLoading
          />
        </div>

      {/* Track info */}
      {track && (
        <div className="text-center space-y-1">
            <h2 className="text-xl font-heading font-semibold text-heading-solid">
              {track.title}
            </h2>
            <p className="text-sm text-white/70">{track.artist}</p>
          </div>
        )}
      </div>
    </>
  );
}
