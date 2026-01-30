# Security Scanning Setup Guide

**Last Modified**: 2026-01-28 16:04 EST

> **Catch vulnerable dependencies before they reach production**

**Status**: Active (CI + weekly schedule)

## Overview

This guide walks through setting up automated security scanning for MetaDJ Nexus's dependencies. Security scanning identifies vulnerable packages, licensing issues, and outdated dependencies—helping maintain a secure codebase.

**Goal**: Proactive vulnerability detection with automated scanning and alerting.

## Why Security Scanning Matters

**Benefits**:
- **Early detection**: Find vulnerabilities before attackers do
- **Automated alerts**: Get notified when new CVEs published
- **Risk assessment**: Understand severity and exploitability
- **Compliance**: Meet security audit requirements
- **Peace of mind**: Sleep well knowing dependencies monitored

**Real-world scenarios**:
- Critical vulnerability in Next.js requires immediate patch
- Malicious package published to npm registry
- Licensing issue with dependency blocks commercial use
- Dependency conflict causes security regression

---

## Security Scanning Tools

### Tool Comparison

| Tool | Cost | Integration | Strengths |
|------|------|-------------|-----------|
| **npm audit** | Free | Built-in | Fast, lightweight, no setup |
| **Snyk** | Free tier | GitHub Actions | Deep analysis, fix PRs |
| **Dependabot** | Free | Native GitHub | Auto PRs, easy setup |

**Recommended Stack**:
- **npm audit**: Run in the security workflow (main + weekly schedule)
- **Snyk**: Weekly deep scans + GitHub integration
- **Dependabot**: Auto PRs for dependency updates

---

## npm audit (Built-in)

### Already Active ✅

npm audit runs automatically in MetaDJ Nexus's security workflow:

**File**: `.github/workflows/security.yml` (existing)

```yaml
jobs:
  quality-checks:
    steps:
      # ... existing steps ...

      - name: Run npm audit
        run: npm audit --audit-level=high --omit=dev
        # Fails security workflow on high/critical findings (prod deps only)
```

**Audit levels**:
- `critical`: Block deployment for critical CVEs
- `high`: Block for high-severity issues
- `moderate`: Allowed in CI (tracked, but not blocking)
- `low`: Most permissive, rarely used

---

### Running Manually

```bash
# Full audit report
npm audit

# Fix vulnerabilities automatically
npm audit fix

# Fix even breaking changes (use with caution)
npm audit fix --force

# Audit specific severity (prod deps only)
npm audit --audit-level=high --omit=dev
```

**Example output**:

```
# npm audit report

lodash  <4.17.21
Severity: high
Prototype Pollution - https://github.com/advisories/GHSA-xxx
fix available via `npm audit fix`
node_modules/lodash

2 vulnerabilities (0 low, 1 moderate, 1 high, 0 critical)

To address all issues, run:
  npm audit fix
```

---

### Interpreting Results

**Vulnerability severity**:

```markdown
Critical (9.0-10.0):
  - Actively exploited
  - Remote code execution
  - Data breach risk
  → Action: Immediate patch required

High (7.0-8.9):
  - Serious security flaw
  - Significant impact
  → Action: Patch within 7 days

Moderate (4.0-6.9):
  - Limited impact
  - Requires specific conditions
  → Action: Patch within 30 days

Low (0.1-3.9):
  - Minimal risk
  - Edge case scenarios
  → Action: Patch on next update cycle
```

---

## Snyk Integration

### Setup Guide

**Step 1: Create Snyk Account**

```markdown
1. Visit: https://snyk.io/
2. Sign up with GitHub account (easiest integration)
3. Authorize Snyk to access repositories
4. Import "metadj-nexus" repository
5. Note your Snyk API token (for GitHub Actions)
```

**Setup time**: 5 minutes

---

**Step 2: Install Snyk CLI** (Optional, for local testing)

```bash
# Global installation
npm install -g snyk

# Authenticate
snyk auth

# Test current project
snyk test

# Monitor project (send results to dashboard)
snyk monitor
```

---

**Step 3: Add GitHub Action**

**File**: `.github/workflows/security.yml` (new file)

```yaml
name: Security Scan

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    # Run weekly on Sundays at midnight UTC
    - cron: '0 0 * * 0'

jobs:
  npm-audit:
    name: npm audit
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20.19.0'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run npm audit
        run: npm audit --audit-level=high --omit=dev

      - name: Generate audit report
        run: npm audit --omit=dev --json > audit-report.json

      - name: Upload audit report
        uses: actions/upload-artifact@v3
        with:
          name: npm-audit-report
          path: audit-report.json

  snyk-scan:
    name: Snyk Security Scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20.19.0'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run Snyk test
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          # Fail build only on high/critical
          args: --severity-threshold=high

      - name: Upload Snyk report
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: snyk-report
          path: snyk-report.json
```

**Key features**:
- Runs on every push and PR
- Weekly scheduled scan (Sunday midnight)
- Separate npm audit and Snyk jobs
- Artifacts uploaded for review
- Configurable severity thresholds

---

**Step 4: Add Snyk Token Secret**

```markdown
1. Navigate to repository Settings
2. Secrets and variables → Actions
3. New repository secret:
   - Name: SNYK_TOKEN
   - Value: <your-snyk-api-token-from-dashboard>
4. Save secret
```

**Security note**: Never commit `SNYK_TOKEN` to repository!

---

### Snyk Dashboard

**Features**:
- Visual dependency tree
- Vulnerability timeline
- Fix recommendations
- Auto-fix pull requests
- License compliance checking

**Accessing dashboard**:
```
https://app.snyk.io/org/your-org/project/<project-id>
```

**Review cadence**:
- **Daily**: Check new vulnerability alerts
- **Weekly**: Review full scan results
- **Monthly**: Audit dependency health score

---

## Dependabot Configuration

### Setup Guide

**Step 1: Enable Dependabot**

```markdown
1. Navigate to repository Settings
2. Security & analysis section
3. Enable:
   - Dependabot alerts
   - Dependabot security updates
   - Dependabot version updates
```

**What this does**:
- **Alerts**: Email when vulnerable dependency detected
- **Security updates**: Auto PRs for security patches
- **Version updates**: Auto PRs for new versions

---

**Step 2: Configure Dependabot**

**File**: `.github/dependabot.yml` (new file)

```yaml
version: 2
updates:
  # npm dependencies
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "09:00"
      timezone: "America/New_York"
    open-pull-requests-limit: 5
    reviewers:
      - "zmetadj"  # Your GitHub username
    labels:
      - "dependencies"
      - "automated"
    commit-message:
      prefix: "chore"
      include: "scope"
    # Version update strategy
    versioning-strategy: increase
    # Group updates by type
    groups:
      dev-dependencies:
        patterns:
          - "@types/*"
          - "eslint*"
          - "vitest"
          - "vite"
        update-types:
          - "minor"
          - "patch"
      production-dependencies:
        patterns:
          - "next"
          - "react"
          - "@sentry/*"
        update-types:
          - "patch"  # Conservative for production deps

  # GitHub Actions
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "monthly"
    commit-message:
      prefix: "ci"
```

**Key configuration decisions**:
- **Weekly updates**: Balance freshness with stability
- **Monday morning**: Review PRs start of week
- **5 PR limit**: Prevent notification overload
- **Grouped updates**: Related packages updated together
- **Conservative strategy**: Patch updates only for production deps

---

### Handling Dependabot PRs

**Review process**:

```markdown
1. Dependabot opens PR (e.g., "chore(deps): bump next from 15.1.5 to 15.1.6")
2. Review changes:
   - Check changelog/release notes
   - Verify CI passes (automated tests)
   - Review breaking changes (if any)
3. Test locally (for major updates):
   git fetch origin
   git checkout dependabot/npm_and_yarn/next-15.1.6
   npm install
   npm run dev  # Test app works
   npm run build  # Verify production build
4. Merge if safe:
   - Click "Squash and merge"
   - Delete branch after merge
5. Monitor deployment:
   - Watch for errors in Sentry
   - Check Plausible for traffic drop
```

**When to hold off merging**:
- ❌ Major version bump during busy period
- ❌ Known breaking changes require code updates
- ❌ CI failing (investigate first)
- ❌ Conflicting dependency updates

---

## Vulnerability Response Process

### Triage Workflow

**Step 1: Assess Severity**

```markdown
Criteria for immediate action:
- Critical severity (CVSS 9.0+)
- Actively exploited in the wild
- Affects production dependencies
- No workaround available
- Public disclosure >7 days old

Criteria for scheduled update:
- High severity but limited impact
- Development dependencies only
- Workaround exists
- Fix available
```

---

**Step 2: Determine Exploitability**

```markdown
Questions to ask:
1. Is the vulnerable code path used in our app?
   - Example: Vulnerable function we never call
   - Result: Lower priority

2. Can an attacker reach the vulnerability?
   - Example: Server-side only, no user input
   - Result: Medium priority

3. What's the attack complexity?
   - High complexity: Lower urgency
   - Low complexity: Higher urgency

4. What's the potential impact?
   - Data exposure: Critical
   - DoS: High
   - Information disclosure: Medium
```

---

**Step 3: Apply Fix**

```bash
# Option 1: Auto-fix (if available)
npm audit fix

# Option 2: Update specific package
npm update <package-name>

# Option 3: Manual update (major version)
npm install <package-name>@latest

# Option 4: Wait for Dependabot PR
# (if update not urgent)

# Verify fix applied
npm audit

# Test thoroughly
npm run test
npm run build
npm run dev  # Manual testing
```

---

**Step 4: Deploy Patch**

```markdown
1. Create branch: git checkout -b security/fix-<cve-id>
2. Apply fix (npm audit fix or manual update)
3. Test locally: npm test && npm run build
4. Commit: git commit -m "security: fix CVE-XXXX-XXXXX"
5. Push: git push origin security/fix-<cve-id>
6. Create PR, get CI approval
7. Merge to main
8. Deploy immediately (don't wait for weekly cycle)
9. Monitor for regressions
10. Update incident log
```

---

## License Compliance

### Tracking Licenses

**Why this matters**:
- Some licenses prohibit commercial use
- Some require attribution
- Some impose copyleft requirements

**Snyk license scanning**:
```bash
# Check licenses (Snyk CLI)
snyk test --org=your-org --all-projects --license

# Generate license report
npm install -g license-checker
license-checker --json > licenses.json
```

**MetaDJ Nexus acceptable licenses**:
- ✅ MIT, Apache 2.0, BSD (permissive)
- ✅ ISC, CC0 (public domain equivalent)
- ⚠️ LGPL (review carefully)
- ❌ GPL, AGPL (avoid for commercial)

---

### License Audit Checklist

```markdown
- [ ] Review all dependencies annually
- [ ] Identify GPL/AGPL packages
- [ ] Add attribution file if required
- [ ] Document license compliance
- [ ] Update .licensesrc if using license scanner
```

---

## Security Monitoring Dashboard

### Key Metrics

**Vulnerability metrics**:
```markdown
- Open vulnerabilities by severity
- Mean time to remediate (MTTR)
- Vulnerability backlog age
- Dependency freshness score
```

**Dependency health**:
```markdown
- Outdated dependencies count
- Major updates pending
- Breaking changes count
- Unmaintained packages
```

**Compliance metrics**:
```markdown
- License compliance score
- Prohibited licenses count
- Attribution requirements
```

---

## Common Vulnerabilities

### Expected MetaDJ Nexus Findings

**next.js**:
```markdown
Vulnerability: Server-side request forgery
Severity: Medium
Impact: Limited (no user-generated API calls)
Action: Update to patched version
Timeline: Next release cycle
```

**react/react-dom**:
```markdown
Vulnerability: XSS via dangerouslySetInnerHTML
Severity: High
Impact: None (we don't use dangerouslySetInnerHTML)
Action: Document non-usage, update on schedule
Timeline: Next major update
```

**@aws-sdk/client-s3**:
```markdown
Vulnerability: AWS SDK advisory
Impact: High (affects R2 media streaming)
Action: Update immediately if advisory issued
Timeline: Same-day hotfix
```

---

## Troubleshooting

### Issue: npm audit shows vulnerabilities but npm audit fix doesn't fix them

**Cause**: Breaking changes required

**Solution**:
```bash
# Check what would be updated
npm audit fix --dry-run

# Review breaking changes
npm view <package-name> versions

# Update manually
npm install <package-name>@latest

# Test thoroughly
npm run test
npm run build
```

---

### Issue: Dependabot PR fails CI

**Cause**: Breaking changes in dependency

**Solution**:
```markdown
1. Check CI failure logs
2. Read dependency changelog
3. Update code if needed:
   - API changes
   - Config changes
   - Type signature changes
4. Test locally first
5. Push fix to Dependabot branch
6. Merge once CI passes
```

---

### Issue: Snyk reports false positive

**Cause**: Vulnerability not applicable to our usage

**Solution**:
```markdown
1. Review Snyk issue details
2. Verify vulnerable code path not used
3. Ignore in Snyk dashboard:
   - Settings → Ignored issues
   - Add reason for ignoring
   - Set expiration date (review quarterly)
4. Document decision in security log
```

---

## Cost Summary

### Free Tier Limits

**npm audit**:
- Cost: $0 (built into npm)
- Limitations: None

**Snyk Free Tier**:
- Cost: $0/month
- Scans: Unlimited
- Projects: Unlimited
- Users: 1
- Fix PRs: Limited to 10/month

**Dependabot**:
- Cost: $0 (built into GitHub)
- Limitations: None

**Total Cost**: $0 for v0.90-v1.0

---

### When to Upgrade

**Snyk Team ($98/month)**:
- Multiple team members
- Unlimited fix PRs
- Advanced reporting
- Custom policies

**Signs you need it**:
- More than 1 developer
- >10 fix PRs needed monthly
- Enterprise compliance required

---

## Checklist

### Initial Setup
- [ ] npm audit running in security workflow (high+ prod deps) ✅ (already active)
- [ ] Snyk account created
- [ ] Snyk GitHub Action configured
- [ ] SNYK_TOKEN secret added
- [ ] Dependabot enabled
- [ ] .github/dependabot.yml configured
- [ ] Tested first Dependabot PR

### Ongoing Maintenance
- [ ] Review Snyk dashboard weekly
- [ ] Merge Dependabot PRs within 7 days
- [ ] Audit licenses quarterly
- [ ] Update security.md annually
- [ ] Test vulnerability fix PRs

---

## Next Steps

After implementing security scanning:

1. **Create post-launch enhancements** → See `3-projects/5-software/metadj-nexus/docs/archive/2025-11-post-launch-enhancements.md`
2. **Document incident response** → Create security incident runbook
3. **Set up security notifications** → Slack/Discord webhooks
4. **Annual security audit** → Schedule external review

---

## Support Resources

**npm audit**:
- Documentation: https://docs.npmjs.com/cli/v9/commands/npm-audit
- CVE database: https://nvd.nist.gov/

**Snyk**:
- Documentation: https://docs.snyk.io/
- Vulnerability database: https://security.snyk.io/
- GitHub Action: https://github.com/snyk/actions

**Dependabot**:
- Documentation: https://docs.github.com/en/code-security/dependabot
- Configuration: https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file

**MetaDJ Nexus Context**:
- Security workflow: `.github/workflows/security.yml`
- Dependencies: `package.json`
- Lock file: `package-lock.json`

---

Remember: Security is not a one-time setup—it's an ongoing practice. The automated scans catch 95% of issues, but human review ensures the right response for the 5% that matter most.
