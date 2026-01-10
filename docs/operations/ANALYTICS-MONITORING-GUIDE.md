# MetaDJ Nexus — Analytics Monitoring Guide

**Last Modified**: 2026-01-09 19:49 EST

**Purpose**: Transform MetaDJ Nexus analytics data into actionable insights that validate positioning, guide feature development, and foster deeper fan engagement.

**Context**: MetaDJ Nexus positions as an exclusive listening experience for the dedicated fanbase—not a discovery platform, not a casual streaming service. Every metric should validate whether we're successfully building depth of connection with fans who already love the music.

---

## 1. Dashboard Setup Instructions

### Initial Plausible Configuration

**Step 1: Add Domain**
1. Log into Plausible Analytics account
2. Navigate to **Settings → Sites**
3. Click **Add Website**
4. Enter domain:
   - **Production**: `metadjnexus.ai`
   - **Development**: Use `metadjnexus.ai` only if you provision a staging environment; otherwise leave it out
5. Select timezone: **Your local timezone** (for accurate daily/weekly reports)
6. Click **Add Site**

**Step 2: Verify Script Integration**
- Confirm `src/lib/analytics.ts` exports the helper you need
- Confirm script tag in `src/app/layout.tsx` or root layout
- Test event firing with browser DevTools (Network tab, filter `plausible`)
- Verify first page view registers in Plausible dashboard (may take 1-2 minutes)

**Step 3: Configure Custom Event Goals**

Navigate to **Settings → Goals** for your site and add these custom events:

**Playback & Queue Events**
- `track_played` — Track started playing
- `track_skipped` — Track exited before completion
- `track_completed` — Listener played within five seconds of the end
- `playback_control` — Play, pause, previous, next, seek, or volume actions
- `shuffle_toggled` — Shuffle enabled/disabled
- `repeat_mode_changed` — Repeat state cycled
- `queue_action` — Add, remove, reorder, or clear events
- `queue_restored` / `queue_expired` — Persistence lifecycle checkpoints

**Navigation & Discovery Events**
- `collection_viewed` — Collection tab selection changed
- `collection_browsed` — Tracks rendered for a collection view
- `track_card_clicked` — Listener selected a track card
- `track_card_hovered` — Desktop hover signal
- `add_to_queue_clicked` — Manual queue additions
- `track_info_icon_clicked` — Track Info icon clicked (opens Track Insight panel)
- `track_info_opened` / `track_info_closed` — Modal lifecycle
- `track_shared` — Share button used

**Search & Session Events**
- `search_performed` — Search executed (prefix matching)
- `search_zero_results` — Search returned no results
- `session_started` — Session initialised (device + returning flag)
- `cinema_opened` / `cinema_closed` — Visual console lifecycle

**Activation Events**
- `activation_first_play` — First playback milestone
- `activation_first_chat` — First MetaDJai message
- `activation_first_guide` — First guide open
- `activation_first_playlist` — First playlist creation

**Step 4: Create Custom Segments**

Segments help analyze different user groups:

**By Device**:
- Mobile users (iOS + Android)
- Desktop users (macOS + Windows + Linux)
- Tablet users

**By Collection**:
- Featured-only listeners (never switched tabs)
- Collection explorers (switched tabs 2+ times)
- Completionists (played 5+ tracks from one collection)

**By Engagement Level**:
- New visitors (first session)
- Returning visitors (2-5 sessions)
- Superfans (6+ sessions)

**By Behavior**:
- Cinema lovers (opened fullscreen 2+ times)
- Sharers (clicked share button 1+ times)
- Queue builders (manually added tracks to queue)

---

## 2. Key Metrics to Monitor

### Daily Dashboard (Check Every Morning — 5 Minutes)

**Core Engagement**:
- **Unique visitors** (new vs. returning split)
- **Total sessions** (how many listening experiences today?)
- **Average session duration** (aim for >5 minutes)
- **Bounce rate** (one-track sessions, target <30%)

**Top Content**:
- **Top 5 most-played tracks** (what's resonating right now?)
- **Collection split** (Featured vs. Majestic vs. Bridging percentages)
- **Track completion rate** (% of tracks played to 90%+)

**Feature Adoption**:
- **Cinema open rate** (sessions with `cinema_opened`)
- **Track detail engagement** (unique sessions with `track_info_icon_clicked` / `track_info_opened`)
- **Share clicks** (`track_shared` events per 100 sessions)
 - **Activation rate** (sessions with any activation milestone)

**Red Flags to Watch**:
- Session duration drops below 3 minutes suddenly
- Bounce rate exceeds 40% (positioning mismatch?)
- Zero shares for 48+ hours (feature not discoverable?)
- Specific track has >60% skip rate (curation issue?)

---

### Weekly Report (Every Monday — 30 Minutes)

**Week-over-Week Comparison**:
- **Top 10 most-played tracks** (compare to previous week)
  - Which tracks gained momentum?
  - Which tracks lost steam?
  - Any surprise breakouts?

**Collection Performance**:
- **Featured vs. Majestic vs. Bridging split** (%)
  - Is Featured dominating too much? (Target: 40-50%)
  - Are deeper collections getting love? (Target: 25-30% each)
  - Are users exploring beyond Featured?

**Track Completion Behavior**:
- **Average completion rate** across all tracks (target >70%)
- Tracks with highest completion (fans love these)
- Tracks with lowest completion (skip or curation issue?)

**Feature Usage Trends**:
- **Cinema adoption** (% of sessions with `cinema_opened`, target >30%)
- **Queue usage** (% of sessions emitting `queue_action`, target >15%)
- **Search vs. browse** (`search_performed` vs. `collection_viewed`)
- **Share button clicks** (`track_shared` events per 100 sessions)

**User Journey Analysis**:
- **First-time user path**: Featured → collection switch → share?
- **Returning user path**: Deeper collection exploration? More shares?
- **Session progression**: Are long sessions increasing week-over-week?

---

### Monthly Deep Dive (End of Month — 2 Hours)

**Retention & Loyalty**:
- **Returning visitor rate** (% of users who come back within 7 days, target >20%)
- **Superfan identification** (users with 6+ sessions in 30 days)
- **Cohort retention** (do users from Week 1 come back in Week 4?)
- **Churn patterns** (when do users drop off?)

**Content Performance**:
- **Top 20 tracks** (most plays across entire month)
- **Average plays per track** across each collection
- **Track diversity** (are users exploring broadly or focusing on hits?)
- **Collection completion rate** (% of tracks in collection played by any user)

**Device & Context**:
- **Mobile vs. desktop split** (what's the primary listening context?)
- **Time-of-day patterns** (when are fans listening most?)
- **Session length by device** (longer on desktop or mobile?)
- **Geographic distribution** (if relevant for event planning)

**Feature Evolution**:
- **Cinema adoption trend** (growing or plateauing?)
- **Modal engagement trend** (are users learning about tracks?)
- **Share button trend** (organic advocacy growing?)
- **Queue feature trend** (power users adopting advanced features?)

**Conversion Funnel**:
- **First play → Collection explore** (% who switch tabs after first track)
- **Collection explore → Share** (% who share after discovering deeper cuts)
- **Cinema open → Long session** (does cinema correlate with engagement?)

**Listener Segmentation**:
- **Casual explorers** (1-2 tracks, then leave)
- **Focused listeners** (5-10 tracks, stay in one collection)
- **Deep divers** (10+ tracks, explore multiple collections)
- **Superfans** (repeat sessions, shares, long durations)

---

## 3. Critical Insights to Track

### Track Performance

**Questions to Answer**:
- **Which 5 tracks are getting the most love?**
  - Validate curation decisions
  - Identify "gateway tracks" that hook new listeners
  - Understand what resonates with the fanbase

- **Which tracks have lowest completion rate?**
  - Are they being skipped intentionally (doesn't fit mood)?
  - Are they in wrong position in queue (too early/late)?
  - Do they need reconsideration for Featured tab?

- **Is there a "gateway track" that leads to collection exploration?**
  - Track the journey: Track X played → Collection switch → Deeper exploration
  - Use this insight to feature high-conversion tracks prominently
  - Optimize queue order based on conversion patterns

- **Do featured tracks get disproportionate plays?**
  - Healthy: 50-60% of plays in Featured, 40-50% in deeper collections
  - Unhealthy: >80% in Featured = poor discoverability for deeper cuts
  - Unhealthy: <30% in Featured = Featured tab not compelling enough

**Action Framework**:
- High skip rate on specific track: Consider repositioning or removing
- Gateway track identified: Feature prominently, use in promotional clips
- Featured dominance: Improve collection descriptions, add "Next collection" CTAs
- Low Featured engagement: Recurate Featured tab with more hooks

---

### Collection Performance

**Questions to Answer**:
- **Featured vs. Majestic vs. Bridging split—what's the 80/20?**
  - Measure distribution: X% Featured, Y% Majestic, Z% Bridging
  - Identify imbalances and opportunities
  - Track trends over time (is Majestic gaining traction?)

- **Do users who explore one collection explore the other?**
  - Track cross-collection journeys
  - Identify natural progression paths (Featured → Majestic → Bridging?)
  - Understand if collections feel distinct or similar

- **Collection completion rate (% of tracks in collection played by any user)**
  - 100% completion = entire collection has been heard by someone
  - <50% completion = some tracks never discovered
  - Use to identify hidden gems that need surfacing

**Action Framework**:
- One collection dominates: Add CTAs to explore others ("If you love this, try...")
- Low cross-collection exploration: Improve collection differentiation and descriptions
- Low completion rate: Shuffle queue order, highlight undiscovered tracks
- High completion rate: Validates collection depth and fan engagement

---

### Feature Adoption

**Questions to Answer**:
- **Cinema: % of sessions opening fullscreen (target >30%)**
  - Measure adoption trend week-over-week
  - Correlate with session duration (does cinema drive longer sessions?)
  - Identify device split (mobile vs. desktop adoption)

- **Track details modal: % of users clicking info icon (target >20%)**
  - Are users curious about track context?
  - Does modal engagement correlate with shares?
  - Track which tracks get most info clicks (curiosity signal)

- **Social share: Shares per 100 sessions (establish benchmark)**
  - Baseline metric for organic advocacy
  - Track growth over time
  - Identify which tracks get shared most (amplification candidates)

- **Queue: % of sessions using manual queue operations**
  - Power user signal
  - Measure adoption of advanced features
  - Correlate with superfan status

**Action Framework**:
- Low cinema adoption (<20%): Make it more discoverable, add onboarding hint
- Low modal engagement (<10%): Redesign info icon, add preview tooltip
- Low share rate (<1 per 100 sessions): Add social proof, incentivize sharing
- Low queue usage (<5%): Feature tutorial or "Pro tip" hint

---

### User Behavior

**Questions to Answer**:
- **First-time user journey: Featured → collection → share?**
  - Map the ideal path for new listeners
  - Identify drop-off points (where do they leave?)
  - Optimize onboarding experience based on successful journeys

- **Repeat users: Deeper collection exploration? More shares?**
  - Do returning users dig deeper into catalog?
  - Are superfans the primary sharers?
  - Track behavior evolution over sessions

- **Session duration trends: Are long sessions increasing?**
  - Measure average session length week-over-week
  - Identify factors that correlate with long sessions (cinema, queue, collections)
  - Track retention impact of long sessions (do they come back?)

- **Mobile vs. desktop: Different behavior patterns?**
  - Session length by device
  - Feature adoption by device (cinema usage on mobile vs. desktop)
  - Collection exploration by device
  - Share behavior by device

**Action Framework**:
- High first-session drop-off: Improve onboarding, clarify value proposition
- Returning users don't go deeper: Add personalized recommendations ("Based on your plays...")
- Long sessions not increasing: Experiment with queue features, improve transitions
- Mobile behavior differs: Optimize mobile UX for touch, simplify navigation

---

## 4. Benchmarks & Goals (First 30 Days)

**Goal**: Establish baseline metrics to understand normal behavior and set improvement targets.

### Engagement Benchmarks

**Average Session Duration**:
- **Target**: >5 minutes per session
- **Rationale**: Exclusive fanbase should engage deeply, not casually browse
- **Action if below**: Analyze track transitions, queue flow, onboarding experience

**Cinema Open Rate**:
- **Target**: >25% of sessions
- **Rationale**: Visual amplification is a differentiator, should resonate with fans
- **Action if below**: Improve discoverability, add onboarding hint, test different entry points

**Collection Exploration Rate**:
- **Target**: >40% of users explore second collection
- **Rationale**: Fans who love the music should want to explore deeper catalog
- **Action if below**: Improve collection CTAs, add "Next collection" suggestions, enhance descriptions

**Repeat Visitor Rate (7-day window)**:
- **Target**: >15% of users return within 7 days
- **Rationale**: Exclusive experience should create habit formation
- **Action if below**: Email campaign, exclusive content, community building

**Shares per 100 Sessions**:
- **Target**: Establish baseline in first 30 days (likely 1-5 shares per 100 sessions)
- **Rationale**: Organic advocacy from superfans should drive awareness
- **Action if below**: Add social proof, improve share UX, incentivize sharing

### Content Performance Benchmarks

**Track Completion Rate**:
- **Target**: >70% of tracks played to 90%+ completion
- **Rationale**: Fans should want to hear full tracks, not skip frequently
- **Action if below**: Analyze skip patterns, recurate queue order, test different featured tracks

**Collection Split**:
- **Target**: 40-50% Featured, 25-35% Majestic, 25-35% Bridging
- **Rationale**: Balanced distribution shows healthy exploration beyond initial hooks
- **Action if imbalanced**: Adjust Featured curation, improve collection discoverability, test collection ordering

**Bounce Rate** (one-track sessions):
- **Target**: <30% of sessions
- **Rationale**: Exclusive positioning should attract engaged fans, not casual browsers
- **Action if above**: Analyze first track drop-off, improve positioning/messaging, optimize initial experience

### Feature Usage Benchmarks

**Queue Manual Operations**:
- **Target**: >10% of sessions
- **Rationale**: Power users should adopt advanced features for personalized experiences
- **Action if below**: Add tutorial, feature "Pro tip" hints, improve queue UX

**Track Details Modal**:
- **Target**: >15% of users click info icon
- **Rationale**: Fans curious about music context should engage with track details
- **Action if below**: Redesign icon, add preview tooltip, test different placements

---

## 5. Red Flags to Watch

**Critical Issues** (Immediate Attention Required):

**Session Duration <2 Minutes**:
- **Signal**: Users leaving too quickly, UX friction or content mismatch
- **Action**: Emergency UX audit, check for technical issues, analyze first-track drop-off
- **Hypothesis**: Positioning not matching expectations, onboarding unclear, or technical bug

**<20% Opening Cinema**:
- **Signal**: Feature not resonating or not discoverable
- **Action**: A/B test entry points, improve onboarding, add tutorial hint
- **Hypothesis**: Users don't know it exists or don't see value

**0 Shares in First Week**:
- **Signal**: No organic advocacy, feature not working or not compelling
- **Action**: Test share button functionality, improve UX, add incentive
- **Hypothesis**: Fans love music but don't feel compelled to share publicly

**<10% Exploring Second Collection**:
- **Signal**: Poor discoverability or collection not differentiated enough
- **Action**: Redesign collection navigation, improve descriptions, add CTAs
- **Hypothesis**: Users don't understand collection differences or don't see reason to explore

**>50% Bounce Rate**:
- **Signal**: Positioning mismatch, attracting wrong audience
- **Action**: Review marketing messaging, clarify exclusive positioning, audit onboarding
- **Hypothesis**: Casual browsers finding site, not dedicated fanbase

**High Skip Rate on Specific Tracks (>60%)**:
- **Signal**: Curation issue or track placement problem
- **Action**: Analyze track context, test different queue position, consider removing
- **Hypothesis**: Track doesn't fit mood, wrong placement in flow, or quality issue

---

## 6. Action Framework (Pattern-Based Responses)

### If Specific Track Has High Skip Rate:

**Investigation**:
1. Check if track is in Featured tab (might need recuration)
2. Analyze completion rate vs. other tracks in collection
3. Review queue position (is it too early or too late in session?)
4. Compare to similar tempo/mood tracks (pattern or outlier?)

**Actions**:
- **High skip in Featured**: Remove from Featured, replace with better hook
- **High skip in deep collection**: Acceptable if track is experimental or niche
- **High skip in specific position**: Reorder queue, test different placement
- **High skip universally**: Consider removing or marking "Acquired Taste"

---

### If Collection Exploration Is Low:

**Investigation**:
1. Check collection descriptions for clarity and differentiation
2. Analyze Featured tab dominance (is it too compelling?)
3. Review collection navigation UX (is it discoverable?)
4. Track user journeys (where do they drop off?)

**Actions**:
- **Featured dominance**: Add "Next collection" CTA after 3-5 tracks in Featured
- **Poor descriptions**: Rewrite collection descriptions with mood/vibe context
- **Navigation unclear**: Add visual cues, improve tab design, test different placements
- **Drop-off after first collection**: Add personalized suggestions ("Based on your plays, try Majestic")

---

### If Cinema Adoption Is Low:

**Investigation**:
1. Check mobile vs. desktop split (is it a device issue?)
2. Review auto-hide timeout (is it too fast?)
3. Analyze entry point discoverability (do users know it exists?)
4. Test cinema quality on different devices

**Actions**:
- **Mobile issue**: Optimize mobile cinema UX, simplify controls
- **Auto-hide too fast**: Increase timeout, add manual toggle
- **Not discoverable**: Add onboarding hint, highlight button, test pulsing animation
- **Quality issue**: Upgrade cinema effects, test different styles

---

### If Social Sharing Is Low:

**Investigation**:
1. Ensure share button is visible and intuitive
2. Check share UX (how many clicks to complete?)
3. Analyze which tracks get shared (if any pattern)
4. Review share copy (does it compel action?)

**Actions**:
- **Not visible**: Redesign button, test different placements, add color/animation
- **Too many clicks**: Simplify share flow, reduce friction
- **No pattern**: Add social proof ("X people shared this track")
- **Copy not compelling**: Rewrite share copy with more context and urgency
- **No incentive**: Test "Share to unlock exclusive content" or early access

---

### If Repeat Visitor Rate Is Low:

**Investigation**:
1. Check email capture strategy (are we building list?)
2. Analyze reasons users might not return (content exhaustion?)
3. Review new content cadence (fresh music regularly?)
4. Track superfan vs. casual split (who comes back?)

**Actions**:
- **No email capture**: Add subtle email signup for exclusive updates
- **Content exhaustion**: Increase rotation frequency, add new tracks monthly
- **No reminders**: Email campaign highlighting new features or tracks
- **Casual dominance**: Focus marketing on dedicated fanbase, not casual discovery
- **Superfan retention**: Offer exclusive drops, early listening windows, or behind-the-scenes content

---

## 7. Review Cadence & Stakeholders

### Weekly Review (15 Minutes — Every Monday Morning)

**Attendees**: MetaDJ (creator) + core team (if applicable)

**Agenda**:
1. **Quick Wins**: What's trending this week? (Top tracks, collection split)
2. **Anomalies**: Any red flags or unexpected patterns?
3. **Technical Health**: Any bugs, load issues, or error spikes?
4. **Action Items**: 1-2 quick improvements to test this week

**Output**:
- Short summary of key trends
- 1-2 action items for the week (feature tweaks, content updates, UX improvements)
- Note any blockers or concerns for deeper analysis

---

### Monthly Review (1 Hour — End of Month)

**Attendees**: MetaDJ + strategic advisors (if applicable)

**Agenda**:
1. **Strategic Performance**: Are we validating positioning? (Engagement, retention, shares)
2. **Feature Usage**: What's working? What's not? (Cinema, modal, queue)
3. **Content Strategy**: Track performance insights (what resonates, what doesn't)
4. **User Behavior**: Cohort analysis (new vs. returning, superfans vs. casual)
5. **Growth Opportunities**: What untapped potential exists? (feature enhancements, content expansion)

**Output**:
- Monthly report with key metrics, trends, and insights
- Feature roadmap updates (prioritize based on usage data)
- Content strategy adjustments (recuration, rotation, new collections)
- Growth plan for next month (marketing, community, exclusive content)

---

### Quarterly Review (2 Hours — Every 3 Months)

**Attendees**: MetaDJ + full team + stakeholders

**Agenda**:
1. **Strategic Reassessment**: Is positioning still accurate? (Exclusive vs. discovery)
2. **Long-Term Trends**: 90-day view of engagement, retention, advocacy
3. **Feature Evolution**: What should we build next? (Based on usage patterns)
4. **Content Roadmap**: Collection release planning, collection expansion, exclusive drops
5. **Community Building**: How to deepen fan relationships? (Discord, events, memberships)
6. **Monetization Opportunities**: Membership tiers, exclusive access, events

**Output**:
- Quarterly strategic report with recommendations
- Feature roadmap for next quarter (prioritized by impact)
- Content calendar for next 90 days
- Community building initiatives
- Monetization experiments to test

---

## 8. Privacy & Data Governance

**Plausible Privacy Principles**:
- **No personal data collected**: Plausible Analytics is GDPR, CCPA, and PECR compliant
- **No cookies or cross-site tracking**: Respects user privacy
- **Anonymized metrics**: All data aggregated, no individual tracking
- **User opt-out honored**: Respects Do Not Track (DNT) browser headers
- **Zero third-party access**: Data stays private, never sold or shared

**Data Retention Policy**:
- **Plausible retention**: 1 year by default (configurable)
- **Monthly backups**: Export CSV from dashboard for long-term analysis
- **Archive location**: Store monthly exports in `storage/analytics/` directory
- **Backup cadence**: First day of each month, export previous month's data

**Governance Standards**:
- **Access control**: Only MetaDJ and designated team members have dashboard access
- **Data usage**: Analytics used exclusively for product improvement and strategic decisions
- **Transparency**: Users informed of analytics via privacy policy (if public)
- **Compliance**: Adheres to all applicable privacy regulations

---

## 9. Future Enhancements (Post-v1.0)

**Advanced Analytics Capabilities** (When Ready):

**Cohort Analysis**:
- Compare behavior of different user segments (new vs. returning, mobile vs. desktop)
- Track retention by acquisition source (social media, email, direct)
- Identify superfan characteristics (what behaviors predict long-term engagement?)

**Funnel Analysis**:
- Conversion from discovery → share
- Progression from Featured → deep collection exploration
- Journey from first session → repeat visitor → superfan

**A/B Testing Framework**:
- Test different featured selections (which tracks convert best?)
- Experiment with collection ordering (optimal discovery path)
- Optimize share CTAs (which copy drives most advocacy?)

**User Segmentation**:
- **Superfans**: 6+ sessions, long durations, frequent shares
- **Casual explorers**: 1-3 sessions, moderate engagement
- **Power users**: Advanced features (queue, cinema), deep collection exploration
- **Evangelists**: High share rate, community advocates

**Predictive Analytics**:
- **Churn risk**: Identify users likely to stop engaging (preventive outreach)
- **High-value users**: Predict which users will become superfans (nurture them)
- **Content performance**: Forecast which tracks will resonate based on early signals

---

## 10. Quick Reference: Metrics Cheat Sheet

### Daily Metrics (5 min):
- Unique visitors (new/returning)
- Average session duration
- Top 5 tracks
- Bounce rate
- Cinema open rate

### Weekly Metrics (30 min):
- Top 10 tracks week-over-week
- Collection split (Featured/Majestic/Bridging)
- Track completion rate
- Feature adoption trends
- User journey analysis

### Monthly Metrics (2 hours):
- Returning visitor rate (7-day window)
- Superfan identification (6+ sessions)
- Content performance (top 20 tracks, avg plays)
- Device & context analysis
- Feature evolution trends
- Conversion funnel analysis

### Red Flags (Immediate Action):
- Session duration <2 min
- Cinema adoption <20%
- 0 shares in 7 days
- Collection exploration <10%
- Bounce rate >50%
- Track skip rate >60%

---

**Remember**: MetaDJ Nexus analytics should validate whether we're building depth of connection with the dedicated fanbase. Every metric should answer: "Are fans engaging deeply with the music they already love, or are we attracting casual browsers?" Optimize for depth, not breadth. Technology amplifies; humans orchestrate.
