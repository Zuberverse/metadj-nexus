# Replit Platform Strategy — MetaDJ Nexus

**Last Modified**: 2026-01-14 19:59 EST
**Project**: MetaDJ Nexus
**Version**: v0.8.0
**Platform**: Replit (Production)
**Status**: Strategy Documentation (Active)
**Last Updated**: 2026-01-14 19:59 EST

---

## Overview

This document outlines the strategic approach for leveraging Replit's native platform capabilities for MetaDJ Nexus, focusing on the current Neon database, media storage, and deployment patterns. Replit is the primary target platform for v0–v1; alternative hosting (Vercel or multi-instance deployments) is roadmap-only.

**Strategic Principle**: Maximize Replit's built-in features rather than adding external dependencies. This reduces complexity, improves platform integration, and maintains the solo founder's ability to manage the full stack.

---

## Current Platform Usage

### ✅ **Already Leveraging Replit**

**Cloudflare R2** (Production):
- **Purpose**: Media hosting for audio and video files
- **Implementation**:
  - Audio streaming: `/api/audio/[...path]` proxy to R2 `music/` prefix
  - Video streaming: `/api/video/[...path]` proxy to R2 `visuals/` prefix
- **Status**: Primary storage provider
- **Environment**:
  - `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`

**Replit Database (Neon PostgreSQL)**:
- **Purpose**: Auth, admin data, feedback, and MetaDJai conversation history
- **Status**: Active (Neon provisioned via Replit)
- **Environment**:
  - `DATABASE_URL` (Neon connection string)
- **Implementation**:
  - Drizzle ORM (`shared/schema.ts`, `server/db.ts`, `server/storage.ts`)
  - Auth + feedback routes read/write via `server/storage.ts`

**Replit Secrets** (Environment Variables):
- **Purpose**: Secure API key storage
- **Current Keys**:
  - `OPENAI_API_KEY`: Required OpenAI access for chat + transcription (defaults: `gpt-5.2-chat-latest`, `gpt-4o-mini-transcribe-2025-12-15`)
  - `PRIMARY_AI_MODEL`: Optional override for chat model (defaults to `gpt-5.2-chat-latest`)
  - `OPENAI_TRANSCRIBE_MODEL`: Optional override for speech-to-text (defaults to `gpt-4o-mini-transcribe-2025-12-15`)
  - `DATABASE_URL`: Neon/Postgres connection string
  - `R2_ACCOUNT_ID`: R2 account ID
  - `R2_ACCESS_KEY_ID`: R2 access key
  - `R2_SECRET_ACCESS_KEY`: R2 secret
  - `R2_BUCKET`: R2 bucket name
  - `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`: Analytics domain
- **Status**: Working well, secure setup

**Replit Deployment**:
- **Port**: 5000 (production), 8100 (development)
- **Build**: Next.js production build with Turbopack
- **Status**: Stable deployment

---

## Future Replit-Native Features

### **1. Replit Authentication (User Management)**

**When to Implement**: When user-specific features needed (playlists, favorites, listening history, personalized recommendations)

**Strategic Approach**:
- **Replit Auth**: Native authentication system (OAuth with Replit account)
- **Alternative**: Replit supports standard auth libraries (NextAuth.js, Clerk, Auth0)
- **Recommendation**: Start with **Replit Auth** for simplicity, add external providers later if needed

**Implementation Plan** (Future):

1. **Replit Auth Setup**:
   - Enable Replit Auth in project settings
   - Automatic session management via Replit SDK
   - User data available via `@replit/auth` package

2. **Alternative: NextAuth.js** (More flexible):
   ```typescript
   // Example NextAuth.js configuration
   import NextAuth from "next-auth"
   import GoogleProvider from "next-auth/providers/google"
   import { PrismaAdapter } from "@next-auth/prisma-adapter"
   import { prisma } from "@/lib/db/prisma"

   export default NextAuth({
     adapter: PrismaAdapter(prisma),
     providers: [
       GoogleProvider({
         clientId: process.env.GOOGLE_CLIENT_ID!,
         clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
       }),
       // Add more providers as needed
     ],
     callbacks: {
       session: async ({ session, user }) => {
         session.userId = user.id
         return session
       },
     },
   })
   ```

3. **Protected Routes**:
   - Middleware for `/api/playlists/*` routes
   - Session validation for user-specific features
   - Graceful degradation (public features still work without auth)

4. **User Features** (Once Auth Implemented):
   - Save custom playlists
   - Favorite tracks
   - Listening history
   - Personalized recommendations (AI-driven based on history)
   - Cross-device sync (queue, preferences)

**Estimated Effort**: 16-20 hours (auth setup, protected routes, user features)

---

## Platform-First Decision Framework

**When evaluating new features, ask**:

1. **Does Replit offer this natively?**
   - ✅ Use Replit's built-in feature (simpler, less maintenance)
   - ⚠️ Evaluate if external service provides significant advantage

2. **Will this create deployment complexity?**
   - ✅ Prefer solutions that work seamlessly on Replit
   - ⚠️ Avoid dependencies requiring custom deployment setup

3. **Can a solo founder manage this?**
   - ✅ Choose tools with clear documentation and minimal configuration
   - ⚠️ Avoid overengineering that increases cognitive load

4. **Does this introduce vendor lock-in?**
   - ✅ Acceptable if Replit provides migration path
   - ⚠️ Document migration strategy if critical dependency

---

## Current Architecture Decisions (Maintained)

### ✅ **Keeping JSON Files for Now**

**Rationale**:
- Simple, version-controlled data management
- Sufficient for current scale (~50-100 tracks)
- Zero database complexity or cost
- Easy to migrate later when needed

**Monitoring Trigger Points** (When to migrate to database):
- Track count exceeds 150-200 (performance concerns)
- Need for user-specific features (playlists, favorites)
- Real-time collaboration requirements
- Complex querying needs (search by multiple dimensions)

### ✅ **Authentication (Current)**

**Current stack**:
- Email/password auth backed by Neon (`users` table).
- Admin login via `ADMIN_PASSWORD`.
- Registration gated by `AUTH_REGISTRATION_ENABLED`.

**Future option**: Evaluate Replit Auth or third-party providers if social login becomes a priority.

---

## Replit Platform Advantages

**Why Platform-Native Approach Makes Sense**:

1. **Zero Configuration**: Database and auth provisioned automatically
2. **Integrated Management**: All platform features in one dashboard
3. **Automatic Scaling**: Replit handles infrastructure concerns
4. **Cost Optimization**: Bundled pricing, no separate service fees
5. **Solo Founder Friendly**: Minimal DevOps overhead
6. **Migration Path**: Replit supports standard tools (can migrate if needed)

**Trade-offs Accepted**:
- Some platform lock-in (mitigated by using standard tools like Prisma/NextAuth)
- Less control over infrastructure (acceptable for solo founder context)
- Dependent on Replit roadmap (historically stable platform)

---

## Roadmap: Optional Multi-Instance / Vercel

Replit remains the canonical production target for v0–v1. A multi-instance or Vercel deployment is only a roadmap option, triggered by clear scale signals (global latency, uptime requirements, enterprise integrations, or multi-tenant growth).

**If/when we pursue this**:
- Keep OpenAI via the Vercel AI SDK (no Replit AI integrations)
- Validate R2 + Neon for multi-instance scaling (pooling, rate limiting, cache)
- Preserve Replit as the primary dev sandbox and a fallback deployment
- Only move once we have repeatable build + deploy automation and verified parity

---

## External Resources

**Replit Documentation**:
- [Replit Database (Neon)](https://docs.replit.com/hosting/databases/neon-postgres)
- [Replit Auth](https://docs.replit.com/hosting/authentication)
- [Environment Variables](https://docs.replit.com/programming-ide/workspace-features/secrets)

**Recommended Tools**:
- [Prisma ORM](https://www.prisma.io/docs)
- [NextAuth.js](https://next-auth.js.org/getting-started/introduction)
- [Drizzle ORM](https://orm.drizzle.team/docs/overview) (lightweight alternative)

---

## Decision Log

**Why Document Now?**

This strategy document captures the **current Replit-first architecture** (Neon + R2 + custom auth) and defines the guardrails for scaling without drifting from the platform-native approach. It keeps trade-offs explicit so future changes stay intentional.

**When to Revisit This Document**:
- Multi-instance deployment becomes necessary
- Neon/R2 performance constraints appear
- Replit Auth becomes a priority
- Quarterly platform capability reviews

---

**Document Status**: Strategy documentation current. Review quarterly or when platform scope changes.

**Next Review**: Q2 2026 or at the next major scaling milestone
