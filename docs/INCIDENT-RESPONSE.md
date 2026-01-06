# Incident Response Runbook

> Quick reference for handling production incidents in MetaDJ Nexus.

**Last Modified**: 2026-01-05 18:06 EST

## Severity Levels

| Level | Description | Response Time | Examples |
|-------|-------------|---------------|----------|
| **P1 - Critical** | Service completely down | Immediate | Site unreachable, data loss |
| **P2 - High** | Major feature broken | < 1 hour | Audio playback fails, AI not responding |
| **P3 - Medium** | Feature degraded | < 4 hours | Slow performance, partial functionality |
| **P4 - Low** | Minor issue | Next business day | Visual glitch, non-blocking bug |

## Incident Response Steps

### 1. Identify & Assess

```
Check status:
1. Open site: https://metadjnexus.ai
2. Check browser console for errors
3. Check Replit deployment status
4. Review recent deployments/changes
```

**Quick Health Checks:**
- Homepage loads? `/`
- Music plays? Click any track
- AI responds? Open MetaDJai panel
- Cinema works? Open Cinema feature

### 2. Triage

Determine severity based on:
- User impact (how many affected?)
- Feature criticality (core vs. secondary)
- Data risk (any data loss/corruption?)

### 3. Communicate

**Internal:**
- Document incident in issue tracker
- Note start time and symptoms

**External (if P1/P2):**
- Update status page if available
- Prepare brief user communication

### 4. Investigate

**Common Investigation Commands:**

```bash
# Check application logs (Replit)
# Navigate to Replit console and check logs

# Check for recent deploys
git log --oneline -10

# Verify environment variables
# Check Replit Secrets configuration

# Test API endpoints
curl https://metadjnexus.ai/api/health
```

**Key Files to Check:**
- `src/app/api/` - API route handlers
- `src/lib/` - Core utilities
- `.env` - Environment configuration

### 5. Resolve

**Rollback Procedure:**
```bash
# If recent deploy caused issue
git revert HEAD
git push origin main
# Monitor Replit for auto-deploy
```

**Hotfix Procedure:**
```bash
git checkout -b hotfix/incident-YYYYMMDD
# Make minimal fix
git commit -m "fix: [brief description]"
git push origin hotfix/incident-YYYYMMDD
# Create PR and merge after verification
```

### 6. Post-Incident

- [ ] Document timeline and root cause
- [ ] Update monitoring/alerts if needed
- [ ] Create follow-up issues for improvements
- [ ] Share learnings

---

## Common Incidents

### Audio Playback Fails

**Symptoms:** Tracks don't play, loading spinner stuck

**Check:**
1. Browser console for errors
2. Network tab for failed requests
3. Cloudflare R2 bucket status (or Replit App Storage if fallback)

**Resolution:**
- Clear browser cache
- Verify `STORAGE_PROVIDER` and `R2_*` credentials
- If fallback is active, verify `MUSIC_BUCKET_ID` and Replit storage quotas

### MetaDJai Not Responding

**Symptoms:** AI panel shows error, no responses

**Check:**
1. OpenAI API status: https://status.openai.com
2. API key validity

**Resolution:**
- Verify `OPENAI_API_KEY`
- Check rate limits in OpenAI dashboard

### Cinema/Dream Feature Fails

**Symptoms:** Stream won't start, WHIP connection fails

**Check:**
1. Daydream API status
2. Browser permissions (camera)
3. Network connectivity

**Resolution:**
- Verify `DAYDREAM_API_KEY`
- Check browser camera permissions
- Ensure HTTPS (required for WebRTC)
- If WHIP returns 403 (Forbidden host), add the WHIP domain to `DAYDREAM_WHIP_ALLOWED_HOSTS` (common: `livepeer.cloud`, `lp-playback.studio`)

### High Error Rate

**Symptoms:** Multiple 500 errors in logs

**Check:**
1. Recent deployments
2. Environment variable changes
3. External API status

**Resolution:**
- Rollback if recent deploy
- Check all required env vars
- Review error logs for stack traces

### Performance Degradation

**Symptoms:** Slow page loads, unresponsive UI

**Check:**
1. Network waterfall in DevTools
2. Bundle size changes
3. External service latency

**Resolution:**
- Check for memory leaks
- Verify caching headers
- Review recent dependency updates

---

## Monitoring Checklist

### Daily
- [ ] Quick site health check
- [ ] Review error logs

### Weekly
- [ ] Review analytics for error patterns
- [ ] Check dependency security alerts
- [ ] Verify backup status

### Monthly
- [ ] Review and update this runbook
- [ ] Test incident response procedures
- [ ] Update contact information

---

## Contacts & Resources

**Resources:**
- Replit Dashboard: [Replit Project URL]
- OpenAI Dashboard: https://platform.openai.com
- Daydream: https://daydream.live

**Documentation:**
- API Documentation: `docs/API.md`
- Security Guide: `docs/SECURITY.md`
- Testing Guide: `docs/TESTING.md`

---

## Incident Template

```markdown
## Incident Report: [Brief Title]

**Date:** YYYY-MM-DD
**Severity:** P1/P2/P3/P4
**Duration:** Start - End (total time)
**Status:** Resolved/Ongoing

### Summary
[1-2 sentence description]

### Timeline
- HH:MM - Incident detected
- HH:MM - Investigation started
- HH:MM - Root cause identified
- HH:MM - Fix deployed
- HH:MM - Incident resolved

### Root Cause
[What caused the incident]

### Resolution
[How it was fixed]

### Action Items
- [ ] Follow-up task 1
- [ ] Follow-up task 2

### Lessons Learned
[What can be improved]
```
