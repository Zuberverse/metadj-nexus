# Bug Report Template — MetaDJ Nexus

**Last Modified**: 2025-12-19 11:07 EST

**Use this template for all bug reports to ensure consistent documentation and efficient resolution.**

---

## Bug Report

**Bug ID**: [AUTO-GENERATED] or [MANUAL-###]
**Date Reported**: [YYYY-MM-DD HH:MM]
**Reporter**: [Your Name]
**Status**: 🆕 New | 🔄 In Progress | ✅ Fixed | 🚫 Won't Fix | 📋 Deferred

---

## Priority & Classification

**Priority**: [SELECT ONE]
- **P0 - Critical**: Blocks core functionality, affects all users, immediate fix required
- **P1 - High**: Significant impact, affects many users, fix soon
- **P2 - Medium**: Moderate impact, affects some users, fix when possible
- **P3 - Low**: Minor impact, cosmetic or edge case, fix if time permits

**Category**: [SELECT ONE]
- Audio Playback
- Queue Management
- Playlist System
- Search & Filtering
- Visual Enhancements
- Accessibility
- Performance
- UI/UX
- Cross-Browser Compatibility
- Other: [Specify]

**Type**: [SELECT ONE]
- 🐛 Bug (functional issue)
- 🎨 Visual Issue (design/layout problem)
- ♿ Accessibility Issue (WCAG violation)
- 🚀 Performance Issue (speed/resource problem)
- 📱 Responsive Issue (device-specific problem)
- 🔒 Security Issue (potential vulnerability)

---

## Title

**Concise Description** (50 characters or less):

[Clear, specific title describing the issue]

**Examples**:
- ✅ GOOD: "Audio playback fails on Safari iOS after 30 seconds"
- ✅ GOOD: "Share menu buttons missing contextual ARIA labels"
- ❌ BAD: "Player broken"
- ❌ BAD: "Something wrong with queue"

---

## Environment

**Browser**: [Chrome 120.0.6099.130 / Safari 17.2 / Firefox 121.0 / Edge 120.0]
**OS**: [macOS 14.1 / Windows 11 / iOS 17.2 / Android 14]
**Device**: [Desktop / iPhone 14 Pro / iPad Air / Samsung Galaxy S23]
**Screen Resolution**: [1920×1080 / 390×844 / etc.]
**Network**: [Fast 4G / Slow 3G / WiFi / Offline]
**User**: [Logged In / First-Time Visitor]

**Additional Context**:
- Dark Mode: [Enabled / Disabled]
- Browser Extensions: [List if relevant, e.g., "AdBlock Plus"]
- Screen Reader: [NVDA / VoiceOver / None]

---

## Steps to Reproduce

**Preconditions** (if any):
- [Example: "Queue must have 5+ tracks"]
- [Example: "Audio must be playing for 30+ seconds"]

**Steps**:
1. [First step - be specific]
2. [Second step - include exact clicks/keystrokes]
3. [Third step - note any timing requirements]
4. [Continue as needed]

**Example**:
1. Open MetaDJ Nexus in Safari on iOS
2. Play any track from Featured collection
3. Wait 30 seconds
4. Observe audio cuts out

---

## Expected Behavior

**What SHOULD happen**:

[Describe the correct behavior based on specifications]

**Example**:
- Audio should continue playing smoothly
- Progress bar should advance continuously
- No interruptions or glitches

**Reference** (if applicable):
- [Link to specification: `docs/features/audio-player-standards.md`]
- [WCAG Success Criterion: 2.4.4]
- [Design mockup: Figma link]

---

## Actual Behavior

**What ACTUALLY happens**:

[Describe exactly what you observe, including any error messages]

**Example**:
- Audio stops playing after exactly 30 seconds
- Progress bar freezes at 0:30
- Console shows error: "NotAllowedError: play() failed"

**Frequency**: [SELECT ONE]
- ⚠️ Always (100% reproducible)
- 🔄 Often (75%+ of the time)
- ⏱️ Sometimes (25-75% of the time)
- 🔀 Rarely (< 25% of the time)
- 🎲 Once (unable to reproduce)

---

## Visual Evidence

**Screenshots**:
[Attach or paste screenshot URLs]

**Video Recording** (if applicable):
[Link to screen recording showing the bug]

**Console Errors**:
```javascript
// Paste console errors here
Error: NotAllowedError: The request is not allowed by the user agent or the platform in the current context.
  at HTMLAudioElement.play (audio-player.tsx:123)
```

**Network Logs** (if relevant):
```
Request URL: /api/audio/featured/track-001.mp3
Status: 200 OK
Response Time: 345ms
```

**Performance Issues** (if relevant):
- FPS drops: [60fps → 15fps during animation]
- Memory usage: [Increased from 50MB to 500MB]
- CPU spike: [80% CPU when waveform active]

---

## Impact Assessment

**User Impact**:
- **Affected Users**: [All users / iOS users only / First-time visitors / etc.]
- **Feature Impact**: [Core playback broken / Visual glitch only / etc.]
- **Business Impact**: [Blocks launch / Reduces engagement / Minor annoyance]

**Severity Justification**:
[Explain why this priority was assigned]

**Example**:
"Marked as P0 because audio playback is the core functionality of the platform. This bug makes the site unusable for all iOS Safari users, which represents ~30% of our target audience."

---

## Workaround

**Temporary Solution** (if known):
[Describe any workaround that allows users to proceed]

**Example**:
"Reload page after 30 seconds to restore audio playback. Not ideal, but allows continued listening."

**No Workaround**:
- [ ] Check this box if no workaround exists

---

## Root Cause Analysis

**Suspected Cause** (if known):
[Developer analysis of what's causing the issue]

**Example**:
"Safari iOS requires `Audio.play()` to be called directly from a user gesture. Our async queue loading breaks this requirement."

**Code Location**:
- File: `src/components/player/AudioPlayer.tsx`
- Line: 123-145
- Function: `handlePlay()`

**Related Code**:
```typescript
// Problematic code snippet
const handlePlay = async () => {
  await loadQueue(); // Async operation breaks user gesture chain
  audioRef.current?.play(); // Fails on iOS Safari
};
```

---

## Proposed Solution

**Fix Recommendation**:
[Describe how to fix the issue]

**Example**:
"Call `audioRef.current?.play()` immediately in user gesture handler, then update src and reload when queue is ready."

**Alternative Solutions**:
1. [Alternative 1]
2. [Alternative 2]

**Estimated Effort**: [1 hour / 4 hours / 1 day / 1 week / Unknown]

---

## Testing Notes

**How to Verify Fix**:
1. [Step to verify fix]
2. [Step to verify fix]
3. [Expected result after fix]

**Regression Tests Required**:
- [ ] Audio playback on all browsers
- [ ] Queue loading functionality
- [ ] Other related features: [List]

**Automated Test Coverage**:
- [ ] Unit test added
- [ ] Integration test added
- [ ] E2E test added
- [ ] Manual testing only

---

## Related Issues

**Duplicate Of**: [Bug #XXX] (if this is a duplicate)
**Related To**: [Bug #XXX, Bug #YYY] (if related)
**Blocks**: [Bug #XXX] (if this blocks another issue)
**Blocked By**: [Bug #XXX] (if blocked by another issue)

**Previous Occurrences**:
- [Link to similar historical bugs if applicable]

---

## Additional Notes

**Context**:
[Any additional information that might help with diagnosis or prioritization]

**User Feedback**:
[Direct quotes from users reporting the issue]

**Browser Quirks**:
[Any known browser-specific behaviors relevant to this bug]

---

## Resolution

**Fix Summary**: [Brief description of how bug was fixed]

**Fixed In**: [Version number: v0.9.15]
**Fixed By**: [Developer name]
**Commit**: [Git commit hash: abc123def]
**Pull Request**: [PR #XXX]

**Verification**:
- [ ] Fix verified on original environment
- [ ] Fix verified across all browsers
- [ ] Regression tests passed
- [ ] No new issues introduced

**Release Notes**:
[Text to include in changelog]

---

## Examples

### Example Bug Report 1 (Critical)

**Bug ID**: MDAA-001
**Date Reported**: 2025-11-19 14:30
**Reporter**: QA Team
**Status**: 🔄 In Progress

**Priority**: P0 - Critical
**Category**: Audio Playback
**Type**: 🐛 Bug

**Title**: Audio playback fails on Safari iOS after 30 seconds

**Environment**:
- Browser: Safari 17.2
- OS: iOS 17.2
- Device: iPhone 14 Pro
- Screen: 390×844
- Network: WiFi

**Steps to Reproduce**:
1. Open MetaDJ Nexus in Safari on iPhone 14
2. Play "Metaversal Odyssey" from Featured collection
3. Wait 30 seconds
4. Observe audio stops

**Expected Behavior**:
Audio should continue playing for full track duration (4:32).

**Actual Behavior**:
Audio stops at exactly 30 seconds. Progress bar freezes. Console error: "NotAllowedError: play() failed because the user didn't interact with the document first."

**Frequency**: Always (100%)

**Impact**: All iOS Safari users cannot listen beyond 30 seconds. Blocks core functionality.

**Workaround**: Reload page to resume playback (not sustainable).

**Proposed Solution**: Refactor async queue loading to maintain user gesture chain.

---

### Example Bug Report 2 (Visual)

**Bug ID**: MDAA-002
**Date Reported**: 2025-11-19 15:00
**Reporter**: Designer
**Status**: 🆕 New

**Priority**: P2 - Medium
**Category**: UI/UX
**Type**: 🎨 Visual Issue

**Title**: Collection artwork misaligned on mobile landscape mode

**Environment**:
- Browser: Chrome 120
- OS: Android 14
- Device: Samsung Galaxy S23
- Screen: 360×800 (landscape)
- Network: Fast 4G

**Steps to Reproduce**:
1. Open MetaDJ Nexus on Android
2. Rotate device to landscape mode
3. Play any track
4. Observe collection artwork in player

**Expected Behavior**:
Collection artwork should remain centered and proportionally sized.

**Actual Behavior**:
Artwork is cut off on right side, approximately 20px overflow.

**Frequency**: Always on landscape mobile

**Impact**: Visual polish issue, doesn't affect functionality.

**Workaround**: Use portrait mode.

**Proposed Solution**: Add landscape-specific CSS media query for artwork container.

---

## Template Checklist

Before submitting bug report, verify:

- [ ] **Title is clear and specific** (< 50 chars)
- [ ] **Priority accurately assigned** (P0/P1/P2/P3)
- [ ] **Environment details complete** (browser, OS, device)
- [ ] **Steps to reproduce are clear** (someone else can follow)
- [ ] **Expected vs Actual behavior described**
- [ ] **Visual evidence attached** (screenshot or video)
- [ ] **Console errors included** (if any)
- [ ] **Impact assessment provided**
- [ ] **Reproducibility noted** (Always/Often/Sometimes/Rarely/Once)
- [ ] **Related issues linked** (if applicable)

---

**Template Version**: 1.0
**Last Updated**: 2025-11-19
**Maintained by**: MetaDJ Nexus QA Team
