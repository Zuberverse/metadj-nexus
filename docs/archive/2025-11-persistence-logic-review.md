# MetaDJ Nexus - Persistence Logic Review

**Last Modified**: 2025-12-22 13:13 EST

## Current State (November 13, 2025)

### ✅ What's Already Persisted

#### 1. Queue State (`src/lib/queuePersistence.ts`)
- **Storage**: localStorage (`metadj_queue_state`)
- **Expiration**: 7 days
- **What's Saved**:
  - Queue tracks array
  - Manual track IDs
  - Auto-generated queue
  - Queue context (collection vs search)
  - Selected collection ID
  - Active search query
  - Current track ID and index
- **Behavior**: 
  - Saves on every queue change
  - Clears when queue is empty
  - Version-gated (clears on app version mismatch)

#### 2. Player Preferences (`src/contexts/PlayerContext.tsx`)
- **Volume Level**: localStorage (`metadj-volume`)
  - Range: 0.0 to 1.0
  - Default: 1.0 (100%)
- **Repeat Mode**: localStorage (`metadj-repeat-mode`, `metadj-repeat-mode-user-set`)
  - Options: 'queue' | 'none'
  - Default: 'queue' (enabled by default)

#### 3. MetaDJai Chat (`src/lib/storage/metadjAiSessionStorage.ts`)
- **Messages**: localStorage (`metadj.radio.metadjai.messages`)
  - Stores last 40 messages
  - Includes user and assistant messages
  - Persists sources and status
- **Rate Limit Window**: localStorage (`metadj.radio.metadjai.rateLimitWindow`)
  - Tracks 5-minute window for rate limiting
  - Stores start time and count

#### 4. UI Preferences
- **Welcome Modal (auto-open gating)**:
  - localStorage (`metadj-all-access-welcome-shown`) — set the first time the Welcome overlay is shown
  - localStorage (`metadj-all-access-welcome-dismissed`, compatibility) — older “don’t show again” flag (still respected)
  - sessionStorage (`metadj_welcome_shown_session`) — prevents re-opening on refresh during the same session

### 🔧 Navigation Behavior

#### Current State
- **New App Instance**: Loads with empty queue → Shows Featured collection by default
- **Page Refresh**: Next.js handles this automatically (stays on current page)
- **Deep Links**: Not used — navigation is state-driven inside `/` (clean URL).

#### ✅ Already Correct Behavior
The app already does what you want:
1. **New instance** (new tab/window/different browser) → Opens to living collections (Featured)
2. **Refresh** (F5/Cmd+R) → Stays on exact same page
3. **Returning user** → Restores last queue if < 7 days old

## 📋 Recommended Improvements

### 1. ✅ Welcome Overlay Background - FIXED
**Issue**: Background gradients didn't fill scrollable area
**Solution**: Changed from `absolute` to `fixed` positioning and added `min-h-full` to inner gradients

### 2. ✅ MetaDJai Conversation Persistence - ALREADY IMPLEMENTED
**Current**: Already saves last 40 messages to localStorage
**Behavior**: 
- Loads on page load/refresh
- Continues conversation seamlessly
- Clears only on explicit "Refresh Conversation" action

### 3. 🎯 Collection View Preference (Optional Enhancement)
**Current**: Always shows Featured collection on new instance
**Potential**: Could remember last viewed collection
**Decision**: Keep current behavior - Featured is the best "home" experience

### 4. 🎯 Mute State Persistence (Optional Enhancement)
**Current**: Mute state NOT persisted (resets to unmuted on reload)
**Recommendation**: Consider persisting mute state to localStorage
**Implementation**: Add `metadj-muted` key similar to volume

## 🧹 Cleanup Status

### What Gets Cleared
1. Queue state - when queue becomes empty
2. MetaDJai messages - only on explicit "Refresh Conversation"
3. Expired queue state - auto-purged if > 7 days old
4. Version mismatches - auto-purged on app version change

### What Persists Forever
1. Volume level
2. Repeat mode
3. Welcome shown/dismissal flags
4. Active MetaDJai conversations (until manually reset)

## 📊 Storage Usage

### LocalStorage Keys
```
metadj_queue_state                      // Queue persistence
metadj-volume                           // Volume level
metadj-repeat-mode                      // Repeat mode setting
metadj-repeat-mode-user-set             // Whether user explicitly set repeat
metadj-all-access-welcome-shown         // Welcome modal shown flag (auto-open gating)
metadj-all-access-welcome-dismissed     // Welcome modal dismissal flag (compatibility)
metadj.radio.metadjai.messages          // Chat history (last 40 msgs)
metadj.radio.metadjai.rateLimitWindow   // Rate limit tracking
```

## ✅ Conclusion

The app's persistence logic is **well-designed** and already handles your requirements:

1. ✅ **New instance** → Music collections (Featured)
2. ✅ **Refresh** → Stays on current page (Next.js default)
3. ✅ **AI Chat** → Conversation persists until manually reset
4. ✅ **Queue** → Restores for returning users (< 7 days)
5. ✅ **Preferences** → Volume and repeat mode persist forever
6. ✅ **Welcome overlay** → Background scroll issue FIXED

**No major changes needed** - the caching strategy is sound!
