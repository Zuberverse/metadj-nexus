# Post-Launch Enhancement Guide

> **Strategic improvements to implement after v0.90 launch for v1.0 and beyond**

**Last Modified**: 2025-12-28 13:48 EST
**Version**: 0.90
**Status**: Planning document (Implement after successful v0.90 launch)

## Overview

This guide outlines enhancements to implement after MetaDJ All Access v0.90 launches successfully. These improvements focus on performance optimization, code quality, and maintainability—building on the stable foundation established in v0.90.

**Strategy**: Ship v0.90, gather user feedback, then systematically improve based on real-world usage.

## Implementation Timeline

### Immediate Post-Launch (Week 1-2)
- Monitor analytics and error rates
- Gather user feedback
- Identify critical issues
- Document improvement priorities

### v0.91-v0.95 (Months 1-3)
- Mobile cinema video optimization
- Dependency updates
- E2E test suite
- Code refactoring

### v1.0 (Month 4+)
- Polish and refinement
- Performance optimization
- Documentation updates
- Public launch preparation

---

## Enhancement 0: CI Hardening (Without Over-Engineering)

### Current State (Public Preview)

- CI runs `npm ci`, `npm run lint`, `npm run type-check`, `npm test`, `npm run build:ci`
- Coverage exists but is **not gated** during Public Preview (see `vitest.config.mjs`)

### Roadmap Expansion

**Phase 1 (Post-launch, low risk)**
- Upload unit-test coverage as a CI artifact (no gating)
- Add a scheduled workflow (nightly) for `npm run test:coverage` + dependency audit
- Increment Vitest thresholds gradually (ex: 10% → 20% → 30%+) as coverage grows

**Phase 2 (Pre v1.0)**
- Add Playwright smoke E2E in CI (Chromium-only on PRs; full matrix nightly)
- Gate merges on E2E smoke + build

**Phase 3 (v1.0+)**
- Add security automation (Dependabot + review rules + optional SAST)
- Add visual regression testing for key panels (Hub/Music/Cinema/Wisdom/MetaDJai)

## Enhancement 1: Mobile-Optimized Cinema Video

### Problem Statement

**Current state**:
- Cinema video: 119 MB H.264 MP4 (1280×720, 60fps)
- Load time: 30-60 seconds on 3G networks
- Mobile data consumption: Significant

**Target state**:
- Mobile video: 20-30 MB WebM (960×540, 30fps)
- Load time: <10 seconds on 3G
- Desktop users: Keep high-quality version

---

### Implementation Steps

**Step 1: Create Mobile-Optimized Video**

Install FFmpeg (if not already):
```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt install ffmpeg

# Windows
# Download from https://ffmpeg.org/download.html
```

Generate mobile-optimized version:
```bash
# Mobile version: VP9 WebM, 540p, 30fps, lower bitrate
ffmpeg -i "MetaDJ Performance Loop - MetaDJ All Access.mp4" \
  -vf scale=960:540,fps=30 \
  -c:v libvpx-vp9 -crf 40 -b:v 0 -row-mt 1 -threads 8 -speed 2 \
  -c:a libopus -b:a 64k \
  "MetaDJ Performance Loop - MetaDJ All Access - Mobile.webm"

# Expected output: ~20-30 MB (80% size reduction)
# Encoding time: ~10-15 minutes on modern hardware
```

**Quality settings breakdown**:
- `scale=960:540`: Half resolution (still HD quality on mobile)
- `fps=30`: Half frame rate (smoother than 15fps, lighter than 60fps)
- `crf 40`: Higher compression (acceptable quality for mobile screens)
- `libopus -b:a 64k`: Low audio bitrate (video is muted anyway)

---

**Step 2: Upload to Replit App Storage**

```bash
# Upload mobile version
replit storage upload \
  video-files/metadj-avatar/MetaDJ\ Performance\ Loop\ -\ MetaDJ\ Radio\ -\ Mobile.webm \
  ./MetaDJ\ Performance\ Loop\ -\ MetaDJ\ Radio\ -\ Mobile.webm

# Verify upload
replit storage list video-files/metadj-avatar/
```

---

**Step 3: Update Cinema Component**

**File**: `src/components/cinema/CinemaOverlay.tsx`

```typescript
import { useEffect, useRef, useState } from 'react';

// Add device detection hook
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check viewport width
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

export function CinemaOverlay({ isPlaying, onClose }: CinemaOverlayProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isMobile = useIsMobile();

  // Select video source based on device
  const videoSrc = isMobile
    ? '/api/video/metadj-avatar/MetaDJ Performance Loop - MetaDJ All Access - Mobile.webm'
    : '/api/video/metadj-avatar/MetaDJ Performance Loop - MetaDJ All Access.mp4';

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <video
        ref={videoRef}
        src={videoSrc}
        className="w-full h-full object-cover"
        loop
        muted
        playsInline
        preload="metadata"
      />
      {/* ... rest of component */}
    </div>
  );
}
```

**Alternative: Media queries in video element**:
```tsx
<video
  ref={videoRef}
  className="w-full h-full object-cover"
  loop
  muted
  playsInline
  preload="metadata"
>
  <source
    src="/api/video/metadj-avatar/MetaDJ Performance Loop - MetaDJ All Access - Mobile.webm"
    type="video/webm"
    media="(max-width: 767px)"
  />
  <source
    src="/api/video/metadj-avatar/MetaDJ Performance Loop - MetaDJ All Access.mp4"
    type="video/mp4"
  />
</video>
```

---

**Step 4: Test Across Devices**

**Testing checklist**:
- [ ] Mobile iOS (Safari): Video loads in <10s on 3G
- [ ] Mobile Android (Chrome): Video loads and plays
- [ ] Tablet (iPad): Verify which version loads
- [ ] Desktop: Confirm high-quality version still used
- [ ] Network throttling: Test 3G speeds in DevTools
- [ ] Quality check: Mobile video acceptable on small screens

**Tools for testing**:
```markdown
Chrome DevTools:
1. Open DevTools (F12)
2. Network tab → Throttling → Slow 3G
3. Open cinema, monitor video load time
4. Network tab → Check video file size downloaded
```

---

### Rollout Strategy

**Phase 1: Staging test** (1 day)
- Deploy to staging environment
- Test mobile loading across devices
- Verify quality acceptable

**Phase 2: Canary release** (1 week)
- 10% of mobile users get new video
- Monitor analytics for bounce rate
- Check error logs for issues

**Phase 3: Full rollout** (after validation)
- All mobile users get optimized video
- Desktop users unchanged
- Monitor data usage metrics

---

### Expected Impact

**Before**:
- Mobile cinema load: 30-60s on 3G
- Data usage: 119 MB per session
- User drop-off: High (estimated 40%)

**After**:
- Mobile cinema load: <10s on 3G
- Data usage: 20-30 MB per session (75% reduction)
- User drop-off: Low (estimated 10%)

**Priority**: HIGH
**Effort**: 2-3 hours (encode, upload, test)
**Timeline**: Implement in v0.91 (first post-launch update)

---

## Enhancement 2: Major Dependency Updates

### Goal

Update to latest major versions:
- Tailwind CSS 3.4 → 4.x
- Vite 5.4 → 7.x
- Vitest 2.1 → 4.x

**Why this matters**:
- Security patches
- Performance improvements
- New features
- Long-term maintainability

---

### Pre-Update Research

**Phase 1: Read Migration Guides** (1 hour)

Required reading:
- Tailwind CSS 4.0: https://tailwindcss.com/docs/upgrade-guide
- Vite 7.0: https://vitejs.dev/guide/migration.html
- Vitest 4.0: https://vitest.dev/guide/migration.html

**Document breaking changes**:
```markdown
Tailwind CSS 4.0:
- [ ] New JIT compiler changes
- [ ] Removed deprecated utilities
- [ ] Color palette updates
- [ ] Plugin API changes

Vite 7.0:
- [ ] Node.js 18+ required
- [ ] CJS support changes
- [ ] Plugin API updates
- [ ] Build optimizations

Vitest 4.0:
- [ ] Test API changes
- [ ] Coverage provider updates
- [ ] Configuration changes
```

---

### Migration Strategy

**Phase 2: Create Migration Branch**

```bash
# Create feature branch
git checkout -b chore/dependency-updates

# Ensure clean working directory
git status
```

---

**Phase 3: Update One Dependency at a Time**

### Tailwind CSS 3.4 → 4.x

```bash
# Update Tailwind and plugins
npm install tailwindcss@latest @tailwindcss/typography@latest autoprefixer@latest postcss@latest

# Check for breaking changes
npm run dev
# Test: Visual inspection of all pages
# Test: Mobile responsive layouts
# Test: Gradients and effects
```

**Potential issues**:
```markdown
Issue: Custom gradient utilities broken
Fix: Update tailwind.config.ts with new gradient syntax

Issue: Glass morphism effects changed
Fix: Review backdrop-blur-sm utilities, adjust if needed

Issue: Color palette changes
Fix: Verify OKLCH colors still work correctly
```

**Testing checklist**:
- [ ] All gradients render correctly
- [ ] Glass morphism effects intact
- [ ] Mobile/desktop responsive layouts work
- [ ] Typography styles preserved
- [ ] No visual regressions
- [ ] Build succeeds
- [ ] Bundle size acceptable

---

### Vite 5.4 → 7.x

```bash
# Update Vite and plugins
npm install vite@latest @vitejs/plugin-react@latest vite-tsconfig-paths@latest

# Test dev server
npm run dev
# Verify HMR (Hot Module Replacement) works

# Test production build
npm run build
# Check bundle size, verify optimization
```

**Potential issues**:
```markdown
Issue: Dev server won't start
Fix: Check Node.js version (must be 18+)
Fix: Review vite.config.js for deprecated options

Issue: Build fails
Fix: Update plugin syntax per migration guide

Issue: HMR broken
Fix: Check plugin compatibility
```

**Testing checklist**:
- [ ] Dev server starts successfully
- [ ] HMR works (edit file, see instant update)
- [ ] Production build succeeds
- [ ] Bundle size unchanged or improved
- [ ] No console errors

---

### Vitest 2.1 → 4.x

```bash
# Update Vitest and related tools
npm install vitest@latest @vitejs/plugin-react@latest @vitest/ui@latest

# Run test suite
npm test
# Verify all 105+ tests pass

# Check coverage (after reinstalling @vitest/coverage-v8)
vitest run --coverage
# Reintroduce a npm script once coverage provider is restored
```

**Potential issues**:
```markdown
Issue: Tests fail with new API
Fix: Update test syntax per Vitest 4.0 docs

Issue: Coverage provider changed
Fix: Update vitest.config.mjs coverage settings

Issue: Mock API changes
Fix: Review vi.mock() usage, update if needed
```

**Testing checklist**:
- [ ] All tests pass
- [ ] Coverage reporting works
- [ ] Coverage UI accessible
- [ ] Test performance improved (check run time)
- [ ] No deprecation warnings

---

**Phase 4: Full Integration Test**

```bash
# Run all quality checks
npm run lint
npm run type-check
npm test
npm run build

# Start dev server and manual test
npm run dev
# Test all features: playback, cinema, wisdom, search
```

**Manual testing checklist**:
- [ ] Audio playback works
- [ ] Video cinema loads
- [ ] Search functions correctly
- [ ] Queue operations work
- [ ] Analytics firing
- [ ] Mobile responsive
- [ ] No console errors
- [ ] No visual regressions

---

**Phase 5: Deploy to Staging**

```bash
# Push to staging branch
git push origin chore/dependency-updates

# Deploy in Replit (staging environment)
# Test thoroughly in staging
```

**Staging validation** (24-48 hours):
- Monitor error rates (Sentry if configured)
- Check analytics (no drop in engagement)
- Verify performance metrics (Lighthouse >90)
- Test cross-browser compatibility

---

**Phase 6: Merge & Deploy to Production**

```bash
# Create PR
gh pr create --title "chore: Update major dependencies (Tailwind 4.x, Vite 7.x, Vitest 4.x)" \
  --body "Updates major dependencies with full testing and validation."

# After review and CI pass, merge
git checkout main
git merge chore/dependency-updates
git push origin main

# Deploy in Replit
# Monitor production for 48 hours
```

---

### Rollback Plan

**If issues discovered post-deployment**:

```bash
# Option 1: Revert commit
git revert HEAD
git push origin main

# Option 2: Rollback via Replit Deployments
# Use Replit UI to promote previous deployment

# Option 3: Force push to last stable version
git reset --hard <last-stable-commit>
git push origin main --force
```

---

### Expected Impact

**Benefits**:
- Security patches applied
- Performance improvements
- Latest features available
- Reduced technical debt

**Risks**:
- Breaking changes require code updates
- Visual regressions
- Test failures

**Priority**: MEDIUM
**Effort**: 8-12 hours (research, migrate, test)
**Timeline**: v0.92-v0.93 (after initial stability proven)

---

## Enhancement 3: End-to-End (E2E) Test Suite

### Goal

Add Playwright E2E tests for critical user flows:
- Audio playback
- Collection navigation
- Cinema experience
- Search functionality
- Queue management
- Mobile responsive behavior

**Why Playwright?**
- ✅ Cross-browser testing (Chromium, Firefox, WebKit)
- ✅ Mobile device emulation
- ✅ Screenshot and video recording
- ✅ Network interception
- ✅ Parallel test execution

---

### Installation & Setup

**Step 1: Install Playwright**

```bash
# Install Playwright test package
npm install -D @playwright/test

# Install browsers (Chromium, Firefox, WebKit)
npx playwright install chromium firefox webkit

# Install system dependencies (if needed)
npx playwright install-deps
```

---

**Step 2: Create Configuration**

**File**: `playwright.config.ts` (new file)

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Test directory
  testDir: './tests/e2e',

  // Run tests in parallel
  fullyParallel: true,

  // Fail fast in CI
  forbidOnly: !!process.env.CI,

  // Retry failed tests in CI
  retries: process.env.CI ? 2 : 0,

  // Workers (parallel execution)
  workers: process.env.CI ? 1 : undefined,

  // Reporter
  reporter: [
    ['html'], // HTML report for local viewing
    ['list'], // Console output
    ['github'], // GitHub Actions annotations (if in CI)
  ],

  // Global test settings
  use: {
    // Base URL for tests
    baseURL: 'http://localhost:8100',

    // Screenshots on failure
    screenshot: 'only-on-failure',

    // Videos on failure
    video: 'retain-on-failure',

    // Traces on first retry
    trace: 'on-first-retry',

    // Viewport size
    viewport: { width: 1280, height: 720 },
  },

  // Test projects (browsers/devices)
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // Development server
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:8100',
    reuseExistingServer: !process.env.CI,
    timeout: 120000, // 2 minutes to start
  },
});
```

---

**Step 3: Create Test Directory Structure**

```bash
tests/
├── e2e/
│   ├── playback.spec.ts       # Audio playback tests
│   ├── collections.spec.ts    # Collection navigation
│   ├── cinema.spec.ts         # Cinema experience
│   ├── search.spec.ts         # Search functionality
│   ├── queue.spec.ts          # Queue management
│   └── mobile.spec.ts         # Mobile responsive tests
```

---

### Example Test Suites

**File**: `tests/e2e/playback.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Audio Playback', () => {
  test('should load and play featured track', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');

    // Wait for featured tracks to load
    await page.waitForSelector('[data-testid="featured-track"]');

    // Click first featured track
    await page.click('[data-testid="featured-track"]:first-child');

    // Verify track loads into player
    const trackTitle = page.locator('[data-testid="current-track-title"]');
    await expect(trackTitle).toBeVisible();
    await expect(trackTitle).not.toBeEmpty();

    // Click play button
    await page.click('[data-testid="play-button"]');

    // Wait for audio to start (check playing state)
    const player = page.locator('[data-testid="audio-player"]');
    await expect(player).toHaveAttribute('data-playing', 'true');

    // Verify progress bar updates
    await page.waitForTimeout(2000); // Wait 2 seconds
    const progress = await page.locator('[data-testid="progress-bar"]').getAttribute('aria-valuenow');
    expect(parseInt(progress || '0')).toBeGreaterThan(0);
  });

  test('should pause and resume playback', async ({ page }) => {
    await page.goto('/');

    // Start playback
    await page.click('[data-testid="featured-track"]:first-child');
    await page.click('[data-testid="play-button"]');

    // Wait for playback to start
    await page.waitForTimeout(1000);

    // Pause
    await page.click('[data-testid="pause-button"]');
    const player = page.locator('[data-testid="audio-player"]');
    await expect(player).toHaveAttribute('data-playing', 'false');

    // Resume
    await page.click('[data-testid="play-button"]');
    await expect(player).toHaveAttribute('data-playing', 'true');
  });

  test('should skip to next track', async ({ page }) => {
    await page.goto('/');

    // Play first track
    await page.click('[data-testid="featured-track"]:first-child');
    const firstTrackTitle = await page.locator('[data-testid="current-track-title"]').textContent();

    // Click next button
    await page.click('[data-testid="next-button"]');

    // Verify track changed
    await page.waitForTimeout(500);
    const secondTrackTitle = await page.locator('[data-testid="current-track-title"]').textContent();
    expect(secondTrackTitle).not.toBe(firstTrackTitle);
  });
});
```

---

**File**: `tests/e2e/cinema.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Cinema Experience', () => {
  test('should open and close cinema overlay', async ({ page }) => {
    await page.goto('/');

    // Click cinema button
    await page.click('[data-testid="cinema-button"]');

    // Verify cinema overlay visible
    const cinema = page.locator('[data-testid="cinema-overlay"]');
    await expect(cinema).toBeVisible();

    // Verify video element present
    const video = page.locator('video');
    await expect(video).toBeVisible();

    // Close cinema (Escape key)
    await page.keyboard.press('Escape');

    // Verify cinema closed
    await expect(cinema).not.toBeVisible();
  });

  test('should continue audio playback in cinema', async ({ page }) => {
    await page.goto('/');

    // Start playback
    await page.click('[data-testid="featured-track"]:first-child');
    await page.click('[data-testid="play-button"]');
    await page.waitForTimeout(1000);

    // Open cinema
    await page.click('[data-testid="cinema-button"]');

    // Verify audio still playing
    const player = page.locator('[data-testid="audio-player"]');
    await expect(player).toHaveAttribute('data-playing', 'true');

    // Close cinema
    await page.keyboard.press('Escape');

    // Verify audio still playing
    await expect(player).toHaveAttribute('data-playing', 'true');
  });
});
```

---

**File**: `tests/e2e/mobile.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Mobile Experience', () => {
  // Use mobile viewport
  test.use({ viewport: { width: 390, height: 844 } }); // iPhone 12/13/14

  test('should switch Music panel tabs', async ({ page }) => {
    await page.goto('/');

    // Open Music overlay (mobile)
    await page.getByRole('button', { name: 'Music' }).click();

    // Switch tabs inside the Music panel (Library / Playlists / Queue)
    await page.getByRole('tab', { name: 'Library' }).click();
    await page.getByRole('tab', { name: 'Playlists' }).click();
    await page.getByRole('tab', { name: 'Queue' }).click();

    // Verify Queue content is visible
    await expect(page.getByText('Up Next')).toBeVisible();
  });

  test('should display mobile-optimized cinema video', async ({ page }) => {
    await page.goto('/');

    // Open cinema
    await page.click('[data-testid="cinema-button"]');

    // Get video src
    const videoSrc = await page.locator('video').getAttribute('src');

    // Verify mobile version loaded
    expect(videoSrc).toContain('Mobile.webm');
  });

  test('should handle mobile touch interactions', async ({ page }) => {
    await page.goto('/');

    // Tap featured track (mobile touch)
    await page.tap('[data-testid="featured-track"]:first-child');

    // Verify track loaded
    await expect(page.locator('[data-testid="current-track-title"]')).toBeVisible();

    // Tap play button
    await page.tap('[data-testid="play-button"]');

    // Verify playback started
    await expect(page.locator('[data-testid="audio-player"]')).toHaveAttribute('data-playing', 'true');
  });
});
```

---

### Add Test Scripts

**File**: `package.json`

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:chromium": "playwright test --project=chromium",
    "test:e2e:mobile": "playwright test --project='Mobile Chrome'",
    "test:e2e:report": "playwright show-report"
  }
}
```

**Usage**:
```bash
# Run all E2E tests
npm run test:e2e

# Run with UI mode (interactive)
npm run test:e2e:ui

# Run in debug mode (step through)
npm run test:e2e:debug

# Run specific browser
npm run test:e2e:chromium

# View last test report
npm run test:e2e:report
```

---

### CI Integration

**File**: `.github/workflows/e2e.yml` (new file)

```yaml
name: E2E Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  e2e-tests:
    runs-on: ubuntu-latest
    timeout-minutes: 60
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

---

### Expected Benefits

**Before** (v0.90):
- Unit/integration tests only (105 tests)
- No browser testing
- Manual QA for features
- Risk of browser-specific bugs

**After** (v0.91+):
- Full E2E coverage (30+ tests)
- Cross-browser validation
- Mobile testing automated
- Catch regressions before production

**Priority**: MEDIUM
**Effort**: 8-12 hours (setup + write tests)
**Timeline**: v0.93-v0.94 (after dependency updates stable)

---

## Enhancement 4: Hook Refactoring

### Problem Statement

**Current**: `useQueueControls` hook is 400+ lines with complex dependencies:
- 5 useEffect hooks with interdependencies
- Complex state synchronization logic
- Difficult to test in isolation
- Hard to reason about data flow

**Target**: Cleaner, more maintainable architecture with clear separation of concerns.

---

### Refactoring Options

### Option 1: Split into Smaller Hooks

**File structure**:
```
hooks/queue/
├── useQueueSync.ts         # Syncs queue with collection/search
├── useQueueOperations.ts   # Add, remove, reorder operations
├── useShuffleLogic.ts      # Shuffle state and transformations
├── useQueuePersistence.ts  # LocalStorage save/load
└── use-queue-controls.ts   # Orchestrates all sub-hooks
```

**Example**: `hooks/queue/useQueueSync.ts`

```typescript
import { useEffect } from 'react';
import { Track } from '@/lib/music/types';

export function useQueueSync(
  selectedCollection: string,
  collectionTracks: Track[],
  searchQuery: string,
  searchResults: Track[],
  onSync: (tracks: Track[], context: 'collection' | 'search') => void
) {
  // Sync with collection
  useEffect(() => {
    if (!searchQuery && collectionTracks.length > 0) {
      onSync(collectionTracks, 'collection');
    }
  }, [selectedCollection, collectionTracks, searchQuery, onSync]);

  // Sync with search
  useEffect(() => {
    if (searchQuery && searchResults.length > 0) {
      onSync(searchResults, 'search');
    }
  }, [searchQuery, searchResults, onSync]);
}
```

**Benefits**:
- Each hook has single responsibility
- Easier to test in isolation
- Clear dependencies
- Reusable sub-hooks

**Trade-offs**:
- More files to maintain
- Orchestration complexity in parent hook
- Requires careful prop drilling

---

### Option 2: useReducer Pattern (Recommended)

**Advantages**:
- Centralized state management
- Predictable state updates
- Easier debugging (action log)
- Better testability

**Implementation**:

**File**: `src/hooks/home/use-queue-controls.ts` (current)

```typescript
import { useReducer, useEffect } from 'react';
import { Track } from '@/lib/music/types';

// State interface
interface QueueState {
  autoQueue: Track[];
  manualQueue: Track[];
  isShuffled: boolean;
  queueContext: 'collection' | 'search' | 'featured';
}

// Action types
type QueueAction =
  | { type: 'SYNC_COLLECTION'; tracks: Track[] }
  | { type: 'SYNC_SEARCH'; tracks: Track[]; query: string }
  | { type: 'ADD_MANUAL'; track: Track }
  | { type: 'REMOVE_TRACK'; trackId: string }
  | { type: 'REORDER'; fromIndex: number; toIndex: number }
  | { type: 'TOGGLE_SHUFFLE' }
  | { type: 'CLEAR_MANUAL' }
  | { type: 'LOAD_STATE'; state: QueueState };

// Reducer function
function queueReducer(state: QueueState, action: QueueAction): QueueState {
  switch (action.type) {
    case 'SYNC_COLLECTION':
      return {
        ...state,
        autoQueue: action.tracks,
        queueContext: 'collection',
        isShuffled: false, // Reset shuffle on collection change
      };

    case 'SYNC_SEARCH':
      return {
        ...state,
        autoQueue: action.tracks,
        queueContext: 'search',
      };

    case 'ADD_MANUAL':
      // Avoid duplicates
      if (state.manualQueue.some((t) => t.id === action.track.id)) {
        return state;
      }
      return {
        ...state,
        manualQueue: [...state.manualQueue, action.track],
      };

    case 'REMOVE_TRACK':
      return {
        ...state,
        manualQueue: state.manualQueue.filter((t) => t.id !== action.trackId),
      };

    case 'REORDER':
      const queue = [...state.manualQueue];
      const [removed] = queue.splice(action.fromIndex, 1);
      queue.splice(action.toIndex, 0, removed);
      return {
        ...state,
        manualQueue: queue,
      };

    case 'TOGGLE_SHUFFLE':
      return {
        ...state,
        isShuffled: !state.isShuffled,
        // Shuffle logic here or in selector
      };

    case 'CLEAR_MANUAL':
      return {
        ...state,
        manualQueue: [],
      };

    case 'LOAD_STATE':
      return action.state;

    default:
      return state;
  }
}

// Initial state
const initialState: QueueState = {
  autoQueue: [],
  manualQueue: [],
  isShuffled: false,
  queueContext: 'collection',
};

// Hook
export function useQueueControls() {
  const [state, dispatch] = useReducer(queueReducer, initialState);

  // Persistence (single effect)
  useEffect(() => {
    const saved = localStorage.getItem('metadj-queue-state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        dispatch({ type: 'LOAD_STATE', state: parsed });
      } catch {
        // Ignore invalid state
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('metadj-queue-state', JSON.stringify(state));
  }, [state]);

  // Public API
  return {
    // State
    autoQueue: state.autoQueue,
    manualQueue: state.manualQueue,
    isShuffled: state.isShuffled,
    queueContext: state.queueContext,

    // Actions
    syncCollection: (tracks: Track[]) =>
      dispatch({ type: 'SYNC_COLLECTION', tracks }),
    syncSearch: (tracks: Track[], query: string) =>
      dispatch({ type: 'SYNC_SEARCH', tracks, query }),
    addToQueue: (track: Track) =>
      dispatch({ type: 'ADD_MANUAL', track }),
    removeTrack: (trackId: string) =>
      dispatch({ type: 'REMOVE_TRACK', trackId }),
    reorderQueue: (fromIndex: number, toIndex: number) =>
      dispatch({ type: 'REORDER', fromIndex, toIndex }),
    toggleShuffle: () =>
      dispatch({ type: 'TOGGLE_SHUFFLE' }),
    clearManualQueue: () =>
      dispatch({ type: 'CLEAR_MANUAL' }),
  };
}
```

**Testing** becomes straightforward:

```typescript
// tests/hooks/useQueueControls.test.ts
import { renderHook, act } from '@testing-library/react';
import { useQueueControls } from '@/hooks/useQueueControls';

describe('useQueueControls', () => {
  it('should add track to manual queue', () => {
    const { result } = renderHook(() => useQueueControls());

    act(() => {
      result.current.addToQueue({ id: 'track-1', title: 'Test Track' });
    });

    expect(result.current.manualQueue).toHaveLength(1);
    expect(result.current.manualQueue[0].id).toBe('track-1');
  });

  it('should prevent duplicate tracks', () => {
    const { result } = renderHook(() => useQueueControls());

    act(() => {
      result.current.addToQueue({ id: 'track-1', title: 'Test Track' });
      result.current.addToQueue({ id: 'track-1', title: 'Test Track' });
    });

    expect(result.current.manualQueue).toHaveLength(1);
  });

  // ... more tests
});
```

---

### Migration Plan

**Phase 1: Create new hook (parallel)** (2 hours)
- Write new `useQueueControls` with useReducer
- Add comprehensive tests
- Don't touch existing code yet

**Phase 2: Feature flag rollout** (1 hour)
```typescript
const USE_NEW_QUEUE_HOOK = process.env.NEXT_PUBLIC_USE_NEW_QUEUE === 'true';

const queueControls = USE_NEW_QUEUE_HOOK
  ? useQueueControlsV2()
  : useQueueControls();
```

**Phase 3: Test in staging** (1 week)
- Deploy to staging with new hook enabled
- Verify functionality identical
- Monitor for edge cases

**Phase 4: Production rollout** (1 day)
- Enable for all users
- Monitor error rates
- Keep old hook for 1 week (safety)

**Phase 5: Cleanup** (30 min)
- Remove old hook
- Remove feature flag
- Update documentation

---

### Expected Impact

**Before**:
- 400+ line hook
- 5 interdependent effects
- Hard to test
- Fragile refactoring

**After**:
- 150 line hook (useReducer)
- 2 simple effects (persistence)
- Easy to test (pure reducer function)
- Clear action flow

**Priority**: LOW (works well, not urgent)
**Effort**: 6-8 hours (write, test, migrate)
**Timeline**: v0.95-v1.0 (code quality improvement)

---

## Summary & Priorities

### Recommended Implementation Order

**v0.91** (Month 1):
1. ✅ Mobile-optimized cinema video (HIGH priority)
2. ⏳ Monitor analytics and errors
3. ⏳ Gather user feedback

**v0.92** (Month 2):
1. ⏳ Dependency updates (Tailwind, Vite, Vitest)
2. ⏳ Performance optimization based on real data
3. ⏳ Fix any bugs discovered in v0.90

**v0.93** (Month 3):
1. ⏳ E2E test suite (Playwright)
2. ⏳ Cross-browser validation
3. ⏳ Mobile testing automation

**v0.94-v0.95** (Month 4):
1. ⏳ Hook refactoring (useQueueControls)
2. ⏳ Code quality improvements
3. ⏳ Documentation updates

**v1.0** (Month 5+):
1. ⏳ Final polish and refinement
2. ⏳ Performance audits
3. ⏳ Public launch preparation

---

## Success Metrics

**Mobile video optimization**:
- Load time: <10s on 3G (from 30-60s)
- Data usage: <30MB per session (from 119MB)
- Cinema engagement: +20% on mobile

**Dependency updates**:
- Zero visual regressions
- Build time: Improved or unchanged
- Bundle size: Reduced or unchanged
- Security vulnerabilities: 0 critical/high

**E2E test coverage**:
- 30+ E2E tests covering critical flows
- Cross-browser: 3 browsers (Chrome, Firefox, Safari)
- Mobile: 2 devices (iPhone, Android)
- Test execution time: <5 minutes

**Code quality**:
- Hook complexity: Reduced by 60% (400 → 150 lines)
- Test coverage: Improved to 80%+
- TypeScript strict mode: No errors
- ESLint warnings: 0

---

Remember: These enhancements build on v0.90's stable foundation. Ship first, optimize second. Let real user data guide priorities. Maintain the discipline of testing, measuring, and iterating—that's how good software becomes great.
