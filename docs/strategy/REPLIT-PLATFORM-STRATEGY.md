# Replit Platform Strategy — MetaDJ Nexus

**Last Modified**: 2026-01-05 18:06 EST
**Project**: MetaDJ Nexus
**Version**: v0.8.0
**Platform**: Replit (Production)
**Status**: Strategy Documentation (Future Implementation)
**Last Updated**: 2026-01-05 18:06 EST

---

## Overview

This document outlines the strategic approach for leveraging Replit's native platform capabilities for MetaDJ Nexus, specifically focusing on authentication and database integration when the time comes for implementation. Replit is the primary target platform for v0–v1; alternative hosting (Vercel or multi-instance deployments) is roadmap-only.

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
  - `STORAGE_PROVIDER=r2`
  - `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`

**Replit App Storage** (Fallback):
- **Purpose**: Optional fallback media storage
- **Status**: Available when `STORAGE_PROVIDER=replit`
- **Buckets**:
  - `MUSIC_BUCKET_ID`: Audio files (320 kbps MP3)
  - `VISUALS_BUCKET_ID`: Cinema video files (H.264 MP4)

**Replit Secrets** (Environment Variables):
- **Purpose**: Secure API key storage
- **Current Keys**:
  - `OPENAI_API_KEY`: Required OpenAI access for chat + transcription (defaults: `gpt-5.2-chat-latest`, `gpt-4o-mini-transcribe-2025-12-15`)
  - `PRIMARY_AI_MODEL`: Optional override for chat model (defaults to `gpt-5.2-chat-latest`)
  - `OPENAI_TRANSCRIBE_MODEL`: Optional override for speech-to-text (defaults to `gpt-4o-mini-transcribe-2025-12-15`)
  - `STORAGE_PROVIDER`: Storage selection (set to `r2` in production)
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

### **1. Replit Database (Neon PostgreSQL Integration)**

**When to Implement**: When JSON file approach limits growth (estimated ~200+ tracks, or when user-specific features needed)

**Strategic Approach**:
- **Native Integration**: Replit provides built-in Neon PostgreSQL database
- **Zero Configuration**: Database automatically provisioned and managed
- **Connection String**: Available via `DATABASE_URL` environment variable
- **Benefits**: No external service setup, automatic backups, Replit-managed scaling

**Implementation Plan** (Future):

1. **Enable Replit Database**:
   - Navigate to Replit project → Tools → Database
   - Enable Neon PostgreSQL database (automatic provisioning)
   - Connection string automatically added to Secrets as `DATABASE_URL`

2. **Choose ORM**:
   - **Option A: Prisma** (Recommended for TypeScript safety)
     - Strong type generation from schema
     - Excellent Next.js integration
     - Robust migration system
   - **Option B: Drizzle ORM** (Lightweight alternative)
     - Lighter bundle size
     - SQL-like syntax
     - Good performance

3. **Schema Design** (Example):
   ```prisma
   model Track {
     id          String   @id @default(cuid())
     title       String
     artist      String
     collection  String?
     duration    Int
     audioUrl    String
     artworkUrl  String?
     genre       String[]
     releaseDate DateTime?
     createdAt   DateTime @default(now())
     updatedAt   DateTime @updatedAt
   }

   model Collection {
     id          String   @id @default(cuid())
     name        String   @unique
     slug        String   @unique
     description String?
     tracks      Track[]
     createdAt   DateTime @default(now())
   }

   // Future: User-specific features
   model User {
     id          String   @id @default(cuid())
     email       String   @unique
     favorites   Track[]
     playlists   Playlist[]
     createdAt   DateTime @default(now())
   }

   model Playlist {
     id          String   @id @default(cuid())
     name        String
     userId      String
     user        User     @relation(fields: [userId], references: [id])
     tracks      Track[]
     createdAt   DateTime @default(now())
     updatedAt   DateTime @updatedAt
   }
   ```

4. **Migration Strategy**:
   - Write migration script to transfer `src/data/music.json` → PostgreSQL
   - Validate data integrity (all tracks, metadata, artwork URLs)
   - Keep JSON files as backup during transition
   - Test locally before production migration

5. **Data Access Layer**:
   - Create `src/lib/db/` directory for database utilities
   - Abstract database calls behind repository pattern
   - Maintain existing API surface (minimal breaking changes)

**Estimated Effort**: 24-32 hours (schema design, migration, testing)

---

### **2. Replit Authentication (User Management)**

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

### ✅ **No Authentication Yet**

**Rationale**:
- Current features don't require user accounts
- Simplifies initial launch and user onboarding
- Reduces privacy compliance requirements (no user data)
- Can add later without breaking existing features

**Monitoring Trigger Points** (When to add auth):
- User requests for playlists or favorites
- Need to personalize experience (recommendations)
- Revenue features requiring user accounts (subscriptions)
- Community features (sharing, comments)

---

## Migration Readiness Checklist

**When ready to implement database + auth**:

### Pre-Migration
- [ ] Current track count documented
- [ ] JSON data validated and backed up
- [ ] User feedback indicates need for user features
- [ ] Development time allocated (40-50 hours estimated)

### Database Migration
- [ ] Replit Database enabled (Neon provisioned)
- [ ] ORM chosen and installed (Prisma or Drizzle)
- [ ] Schema designed and reviewed
- [ ] Migration script written and tested locally
- [ ] Data integrity validation complete
- [ ] API layer updated to use database
- [ ] Tests updated for database access patterns
- [ ] JSON files archived (keep as backup)

### Authentication Implementation
- [ ] Auth provider chosen (Replit Auth or NextAuth.js)
- [ ] User schema designed and implemented
- [ ] Protected routes middleware created
- [ ] Session management tested
- [ ] User-specific features implemented (playlists, favorites)
- [ ] Privacy policy updated (if collecting user data)
- [ ] GDPR compliance reviewed (if applicable)

### Post-Migration Validation
- [ ] All tracks accessible via database
- [ ] No data loss or corruption
- [ ] Performance benchmarks meet targets
- [ ] User authentication flows tested
- [ ] Rollback plan documented (if needed)

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
- Migrate storage to a shared object store (S3/R2) and external Postgres
- Preserve Replit as the primary dev sandbox and a fallback deployment
- Only move once we have repeatable build + deploy automation and verified parity

---

## External Resources

**Replit Documentation**:
- [Replit Database (Neon)](https://docs.replit.com/hosting/databases/neon-postgres)
- [Replit Auth](https://docs.replit.com/hosting/authentication)
- [App Storage](https://docs.replit.com/hosting/app-storage)
- [Environment Variables](https://docs.replit.com/programming-ide/workspace-features/secrets)

**Recommended Tools**:
- [Prisma ORM](https://www.prisma.io/docs)
- [NextAuth.js](https://next-auth.js.org/getting-started/introduction)
- [Drizzle ORM](https://orm.drizzle.team/docs/overview) (lightweight alternative)

---

## Decision Log

**Why Document Now, Implement Later?**

This strategy document serves as a **decision capture** and **future guidance** for when the platform grows to require database and authentication. By documenting the approach now:

1. **Context Preservation**: Strategic thinking captured while fresh
2. **Decision Framework**: Clear criteria for when to implement
3. **Reduced Future Friction**: Implementation path already defined
4. **Platform Alignment**: Ensures Replit-native approach maintained
5. **Cognitive Load Management**: Future self has clear roadmap

**When to Revisit This Document**:
- Track count approaches 150-200
- User requests for personalized features increase
- Revenue features requiring user accounts are prioritized
- Quarterly platform capability reviews

---

**Document Status**: Strategy documentation complete. Implementation deferred until trigger points met.

**Next Review**: Q2 2025 or when track count exceeds 150
