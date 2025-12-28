# MetaDJ Nexus — Analytics Setup Guide

> **Quick start guide for privacy-respecting analytics**

**Last Modified**: 2025-12-28 12:32 EST

## Overview

MetaDJ Nexus now includes comprehensive analytics infrastructure using **Plausible Analytics** - a privacy-first, GDPR-compliant analytics platform with no cookies, no personal data collection, and no cross-site tracking.

## What's Implemented

✅ **Core Infrastructure**:
- Analytics library (`src/lib/analytics.ts`) with typed event tracking functions
- Plausible script integration in layout.tsx
- Environment variable configuration
- Development mode logging for testing

✅ **Event Tracking Functions**:
- **Playback & Queue**: Full coverage for play/pause/seek, shuffle/repeat, skip/completion, and queue lifecycle (including restore/expiry).
- **Discovery & Content**: Collection views/browse events, card interactions, add-to-queue clicks, track info modal lifecycle, and share events.
- **Search & Session**: Prefix search instrumentation, zero-result tracking, session_started metadata, and cinema open/close telemetry.

✅ **Privacy Features**:
- Zero personal data collection
- Anonymous aggregated metrics only
- DNT (Do Not Track) respect
- No cookies or cross-site tracking
- GDPR-compliant by design

## Quick Start

### 1. Set Up Plausible Account

```bash
# Create account at plausible.io
# Add site: metadjnexus.ai
# Note: Free plan includes 10k monthly pageviews
```

### 2. Configure Environment

Add to `.env.local` or `.env`:
```bash
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=metadjnexus.ai

# Optional: Self-hosted instance
# NEXT_PUBLIC_PLAUSIBLE_API_HOST=https://analytics.yourdomain.com
```

### 3. Deploy and Verify

```bash
# Build and deploy
npm run build
npm start

# Visit site and trigger events
# Check Plausible dashboard (events appear in 1-2 minutes)
```

## Integration Status

### ✅ Completed

- [x] Analytics library created (`src/lib/analytics.ts`)
- [x] Plausible script integration with environment-aware host selection
- [x] Environment configuration documented in `.env.example`
- [x] Instrumentation added across player, collections, queue, search, overlays, and sessions
- [x] Documentation refreshed (this file + implementation reference)

### 📋 Ongoing Tasks

1. **Maintain Plausible account**: Add domains, configure teams, rotate access.  
2. **Review Custom Goals**: Map business questions to the production event names listed below.  
3. **Test Events Regularly**: Trigger a known sequence (play → shuffle → queue) after each deployment.  
4. **Update Privacy Notice**: Keep footer language aligned with current tracking scope.  
5. **Extend Instrumentation Carefully**: Use `src/lib/analytics.ts` helpers; never call `window.plausible` directly.

## Key Files

```
src/lib/analytics.ts             # Analytics helpers + event catalog
src/app/layout.tsx               # Plausible script injection
src/app/(experience)/layout.tsx  # Shared Hub/Cinema/Wisdom experience layout
src/components/home/HomePageClient.tsx  # Main client orchestrator + view routing
src/components/session/SessionBootstrap.tsx # Session + search analytics
src/hooks/home/use-queue-*.ts    # Queue action analytics
src/components/player/AudioPlayer.tsx   # Playback + cinema + queue controls
src/components/panels/left-panel/BrowseView.tsx # Discovery/collection browsing analytics (previous CollectionManager removed)
docs/features/analytics-implementation.md        # Reference guide
```

## Event Catalog

### Playback & Queue
- `track_played`, `track_skipped`, `track_completed`
- `playback_control` (play, pause, previous, next, seek, volume)
- `shuffle_toggled`, `repeat_mode_changed`
- `queue_action` (add, remove, reorder, clear)
- `queue_restored`, `queue_expired`

### Discovery & Content
- `collection_viewed`, `collection_browsed`
- `track_card_clicked`, `track_card_hovered`, `add_to_queue_clicked`
- `track_info_icon_clicked`, `track_info_opened`, `track_info_closed`
- `track_shared`

### Search & Session
- `search_performed`, `search_zero_results`
- `session_started`
- `cinema_opened`, `cinema_closed`

## Privacy Commitment

**What We Track**:
- Anonymous play counts and durations
- Collection and feature usage patterns
- Device type (mobile/tablet/desktop)
- Geographic region (country-level only)

**What We DON'T Track**:
- Individual user identities
- IP addresses (anonymized by Plausible)
- Email addresses or personal information
- Search query content
- Cross-site behavior
- Browser fingerprints

**User Rights**:
- No consent required (privacy by design)
- DNT header respected
- No cookies or persistent tracking
- Full GDPR compliance

## Integration Guide

For detailed step-by-step integration instructions, see:

**📖 `3-projects/5-software/metadj-nexus/docs/features/analytics-implementation.md`**

This guide includes:
- Exact code snippets for each component
- Line number references
- Event tracking patterns
- Testing procedures
- Troubleshooting tips

## Dashboard Metrics

### Key Metrics to Monitor

**Engagement**:
- Most played tracks
- Average session duration
- Track completion rate
- Feature adoption (cinema, queue, shuffle)

**Discovery**:
- Popular collections
- Search success rate
- Navigation patterns
- Returning visitor rate

**Audience**:
- New vs. returning visitors
- Device breakdown (mobile/desktop/tablet)
- Geographic distribution
- Peak listening times

### Review Cadence

- **Weekly**: Top tracks, session duration, bounce rate
- **Monthly**: Visitor growth, feature adoption, collection popularity
- **Quarterly**: Retention patterns, seasonal trends, roadmap planning

## Development Testing

### Local Testing
Events log to console in development mode:
```bash
npm run dev
# Open browser console
# Trigger events (play track, switch collections)
# See: [Analytics] track_played { trackId: 'br-005', ... }
```

### Production Testing
```bash
# Deploy with NEXT_PUBLIC_PLAUSIBLE_DOMAIN set
# Visit site and trigger events
# Check Plausible dashboard (1-2 minute delay)
```

## Troubleshooting

**Events not appearing?**
1. Check `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` is set correctly
2. Verify domain added in Plausible dashboard
3. Check browser console for errors
4. Disable ad blockers (can block Plausible)

**Too much noise?**
- Remove optional volume change tracking
- Consolidate similar events
- Increase event debouncing

## Resources

- **Implementation Guide**: `3-projects/5-software/metadj-nexus/docs/features/analytics-implementation.md`
- **Plausible Docs**: https://plausible.io/docs
- **Custom Events**: https://plausible.io/docs/custom-event-goals
- **Privacy Policy**: https://plausible.io/privacy-focused-web-analytics

---

**Next Action**: See `3-projects/5-software/metadj-nexus/docs/features/analytics-implementation.md` for detailed integration steps.
