import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ControlPanelOverlay } from '@/components/player/ControlPanelOverlay';
import { ToastProvider } from '@/contexts/ToastContext';
import type { Track } from '@/lib/music';
import type React from 'react';

// Mock player context (only audioRef is used)
vi.mock('@/contexts/PlayerContext', () => ({
  usePlayer: () => ({ audioRef: { current: null } }),
}));

// Simplify heavy child components
vi.mock('@/components/search/SearchBar', () => ({
  SearchBar: ({ onResultsChange, onValueChange }: any) => (
    <div>
      <input
        aria-label="Search"
        onChange={(e) => {
          onValueChange?.(e.target.value);
          onResultsChange?.([]);
        }}
      />
    </div>
  ),
}));

vi.mock('@/components/share-button', () => ({
  __esModule: true,
  default: () => <div aria-label="Share button" />,
}));

vi.mock('@/components/visuals', () => ({
  WaveformVisualizer: () => <div aria-label="Waveform" />,
}));

vi.mock('@/components/player/CollectionArtwork', () => ({
  CollectionArtwork: ({ alt }: { alt?: string }) => <div aria-label={alt || "Collection artwork"} />,
}));

const track: Track = {
  id: 't1',
  title: 'Test Track',
  artist: 'MetaDJ',
  collection: 'Test Collection',
  duration: 180,
  releaseDate: '2025-01-01',
  audioUrl: '/audio/test.mp3',
  artworkUrl: '/art/test.jpg',
  genres: ['Electronic', 'Ambient'],
};

const minimalProps = {
  isOpen: true,
  headerHeight: 56,
  track,
  queueItems: [],
  allTracks: [track],
  currentCollectionTitle: 'Test Collection',
  hasQueue: false,
  isPlaying: false,
  isLoading: false,
  isShuffleEnabled: false,
  repeatMode: 'none' as const,
  currentTime: 0,
  duration: 180,
  onSeek: vi.fn(),
  onPlayPause: vi.fn(),
};

function renderWithProviders(ui: React.ReactNode) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

describe('ControlPanelOverlay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows queue header and empty state when no items are queued', () => {
    renderWithProviders(<ControlPanelOverlay {...minimalProps} />);

    expect(screen.getByText('Queue')).toBeInTheDocument();
    expect(screen.getByText('0 tracks')).toBeInTheDocument();
    expect(screen.getByText(/No tracks queued yet/)).toBeInTheDocument();
  });

  it('shows fallback messaging when no track is selected', () => {
    renderWithProviders(<ControlPanelOverlay {...minimalProps} track={null} queueItems={[]} hasQueue={false} />);

    expect(screen.getByText(/Select a track to start a session/)).toBeInTheDocument();
  });
});
