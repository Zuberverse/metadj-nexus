'use client';

import { cn } from '@/lib/utils';

// ============================================================================
// PlayingIndicator Component
// ============================================================================
// Animated bars indicator showing audio playback state
// Consolidates duplicate implementations across TrackListItem and RecentlyPlayedRail

export interface PlayingIndicatorProps {
  /** Whether audio is actively playing */
  isPlaying: boolean;
  /** Visual size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Custom className for the container */
  className?: string;
  /** Color of the bars */
  color?: 'white' | 'purple' | 'cyan';
}

const sizeStyles = {
  sm: {
    container: 'h-2.5 gap-0.5',
    bar: 'w-0.5',
    heights: ['h-[50%]', 'h-[80%]', 'h-[35%]'] as const,
  },
  md: {
    container: 'h-3 gap-0.5',
    bar: 'w-0.5',
    heights: ['h-[60%]', 'h-[100%]', 'h-[40%]'] as const,
  },
  lg: {
    container: 'h-4 gap-1',
    bar: 'w-1',
    heights: ['h-[60%]', 'h-[100%]', 'h-[45%]'] as const,
  },
};

const colorStyles = {
  white: 'bg-white',
  purple: 'bg-(--metadj-purple)',
  cyan: 'bg-(--metadj-cyan)',
};

/**
 * PlayingIndicator - Animated audio bars visualization
 *
 * Shows three animated bars when playing, or a static dot when paused.
 * Used to indicate current track playback state.
 *
 * @example
 * ```tsx
 * // Active playback
 * <PlayingIndicator isPlaying={true} size="md" />
 *
 * // Paused state (shows dot)
 * <PlayingIndicator isPlaying={false} />
 * ```
 */
export function PlayingIndicator({
  isPlaying,
  size = 'md',
  className,
  color = 'white',
}: PlayingIndicatorProps) {
  const sizeConfig = sizeStyles[size];
  const barColor = colorStyles[color];

  if (!isPlaying) {
    // Paused state - show nothing (no dot overlay)
    return null;
  }

  // Playing state - animated bars
  return (
    <div
      className={cn(
        'flex items-end',
        sizeConfig.container,
        className
      )}
      aria-label="Now playing"
    >
      <span
        className={cn(
          sizeConfig.bar,
          sizeConfig.heights[0],
          barColor,
          'rounded-full motion-safe:animate-[pulse_1s_ease-in-out_infinite]'
        )}
      />
      <span
        className={cn(
          sizeConfig.bar,
          sizeConfig.heights[1],
          barColor,
          'rounded-full motion-safe:animate-[pulse_1.2s_ease-in-out_infinite_0.1s]'
        )}
      />
      <span
        className={cn(
          sizeConfig.bar,
          sizeConfig.heights[2],
          barColor,
          'rounded-full motion-safe:animate-[pulse_0.8s_ease-in-out_infinite_0.2s]'
        )}
      />
    </div>
  );
}
