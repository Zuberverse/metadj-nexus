# Performance Benchmarks & Guidelines

> Performance targets and measurement guidelines for MetaDJ Nexus.

**Last Modified**: 2025-12-28 13:48 EST

## Core Web Vitals Targets

| Metric | Target | Description |
|--------|--------|-------------|
| **LCP** | < 2.5s | Largest Contentful Paint - main content visible |
| **FID** | < 100ms | First Input Delay - time to interactivity |
| **CLS** | < 0.1 | Cumulative Layout Shift - visual stability |
| **FCP** | < 1.8s | First Contentful Paint - first content rendered |
| **TTI** | < 3.9s | Time to Interactive - fully interactive |
| **TBT** | < 200ms | Total Blocking Time - main thread blocking |

## Bundle Size Budgets

### JavaScript
| Bundle | Budget | Current |
|--------|--------|---------|
| Main bundle | < 150KB | Monitor |
| First load JS | < 100KB | Monitor |
| Per-route chunks | < 50KB | Monitor |

### Images
| Type | Budget | Format |
|------|--------|--------|
| Hero images | < 200KB | WebP |
| Thumbnails | < 20KB | WebP |
| Icons | SVG preferred | - |

## Runtime Performance

### Audio Playback
| Metric | Target |
|--------|--------|
| Time to first play | < 2s |
| Track transition gap | < 500ms |
| Buffer underruns | 0 |

### API Response Times
| Endpoint | Target |
|----------|--------|
| `/api/metadjai/*` | < 2s (streaming start) |
| `/api/daydream/*` | < 3s |
| Static assets | < 100ms |

### Client-Side
| Metric | Target |
|--------|--------|
| React render time | < 16ms (60fps) |
| State updates | < 50ms |
| Animation jank | None (60fps) |

## Measurement Tools

### Lighthouse
```bash
# Run Lighthouse audit
npx lighthouse https://metadjnexus.ai --view

# CI/CD integration
npx lighthouse-ci autorun
```

### Web Vitals
Runtime Web Vitals reporting is not wired by default. Use Lighthouse/DevTools for measurement, or add a client-side `web-vitals` reporter if you need analytics telemetry.

### Bundle Analysis
```bash
# Analyze bundle size
npm run build
npx @next/bundle-analyzer
```

### Performance Profiling
1. Chrome DevTools > Performance tab
2. Record page load or interaction
3. Analyze flame chart and metrics

## Optimization Strategies

### Code Splitting
- Use dynamic imports for heavy components
- Route-based splitting (automatic in Next.js)
- Lazy load below-fold content
- Avoid `ssr: false` for above-the-fold shells; it forces skeleton-only HTML on refresh and can increase CLS (prefer SSR + lightweight, stable fallbacks).

```typescript
// Example: Lazy load heavy components
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
})
```

### Adaptive View Mounting
- Home surfaces use capability-based mounting (`src/hooks/home/use-view-mounting.ts`).
- **Eager tier**: Keep Hub/Wisdom/Journal mounted for no-flicker switching.
- **Balanced tier**: Mount active view + Hub, then idle-mount Wisdom/Journal to warm navigation.
- **Lazy tier**: Mount Hub + active view; Wisdom/Journal mount on demand to reduce initial CPU/memory.

### Image Optimization
- Use Next.js `<Image>` component
- Specify width/height to prevent CLS
- Use appropriate format (WebP/AVIF)
- Implement lazy loading

```typescript
import Image from 'next/image'

<Image
  src="/collection-art.webp"
  width={300}
  height={300}
  alt="Collection artwork"
  priority={isAboveFold}
/>
```

### Caching Strategy
| Resource | Cache Duration |
|----------|----------------|
| Static assets | 1 year (immutable) |
| API responses | Varies by endpoint |
| Audio files | 1 week |
| Page data | 1 hour (revalidate) |

### Memory Management
- Clean up event listeners
- Dispose Three.js resources
- Clear intervals/timeouts
- Manage WebRTC connections

## Monitoring

### What to Monitor
1. **Core Web Vitals** - User experience metrics
2. **Error rates** - JavaScript errors, API failures
3. **API latency** - Response times by endpoint
4. **Bundle size** - Track over time
5. **Memory usage** - Client-side memory

### Alerting Thresholds
| Metric | Warning | Critical |
|--------|---------|----------|
| LCP | > 3s | > 5s |
| Error rate | > 1% | > 5% |
| API p95 | > 3s | > 10s |

## Performance Checklist

### Before Deploy
- [ ] Bundle size within budget
- [ ] No render-blocking resources
- [ ] Images optimized
- [ ] Lighthouse score > 90

### Weekly Review
- [ ] Check Core Web Vitals trends
- [ ] Review error rates
- [ ] Monitor bundle size growth

### Monthly Audit
- [ ] Full Lighthouse audit
- [ ] Dependency size review
- [ ] Performance profiling session

## Known Performance Considerations

### Cinema Rendering (Three.js + HTML canvas)
- Heavy GPU usage during Cinema visualization
- Implement quality settings for low-end devices
- Pause rendering when Cinema is not visible

### Audio Streaming
- Preload next track in queue
- Use appropriate buffer sizes
- Handle network interruptions gracefully

### AI Features
- Streaming responses for perceived speed
- Rate limiting to manage costs
- Graceful degradation on slow connections

## Improvement Roadmap

### Quick Wins
- [ ] Enable static asset compression
- [ ] Optimize font loading (font-display: swap)
- [ ] Add resource hints (preconnect, prefetch)

### Medium-Term
- [ ] Implement service worker for offline support
- [ ] Add edge caching for static content
- [ ] Optimize Three.js initialization

### Long-Term
- [ ] Progressive Web App (PWA) support
- [ ] WebAssembly for compute-heavy tasks
- [ ] Advanced caching strategies

---

## Appendix: Testing Commands

```bash
# Build and analyze
npm run build

# Run Lighthouse
npx lighthouse https://metadjnexus.ai --output html --output-path ./lighthouse-report.html

# Check bundle size
npx source-map-explorer .next/static/chunks/*.js

# Profile memory
# Use Chrome DevTools > Memory tab
```
