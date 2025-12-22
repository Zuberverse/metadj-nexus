// Vitest setup file with React Testing Library configuration
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Mock browser APIs not available in jsdom
global.MediaMetadata = class MediaMetadata {
  title: string;
  artist: string;
  album: string;
  artwork: { src: string; sizes: string; type: string }[];

  constructor(metadata: { title: string; artist: string; album: string; artwork: { src: string; sizes: string; type: string }[] }) {
    this.title = metadata.title;
    this.artist = metadata.artist;
    this.album = metadata.album;
    this.artwork = metadata.artwork;
  }
} as unknown as typeof globalThis.MediaMetadata;

// Mock window.scrollTo (used by useBodyScrollLock hook)
window.scrollTo = vi.fn();

// Mock window.matchMedia (used by responsive hooks and components)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Automatically cleanup after each test
afterEach(() => {
  cleanup();
});
