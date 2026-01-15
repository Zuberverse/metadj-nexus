# Replit Deployment Guide — MetaDJ Nexus

## Overview

MetaDJ Nexus is a platform connecting human vision with AI-driven execution for the Metaverse, optimized for deployment on Replit. It provides a creative and immersive experience without complex server management, leveraging Replit's managed infrastructure and Cloudflare R2 for media streaming. Key capabilities include zero-downtime deployments, S3-compatible media streaming with zero egress fees, automatic HTTPS, and integration with analytics and monitoring.

## User Preferences

- I want iterative development.
- Ask before making major changes.
- Provide detailed explanations for complex concepts.
- I prefer clear and concise communication.

## System Architecture

MetaDJ Nexus is built on a modern web stack for performance and scalability on Replit.

**Platform & Frameworks:**
- **Platform**: Replit
- **Runtime**: Node.js 20.19+
- **Framework**: Next.js 16.1.1 (App Router)
- **Frontend**: React 19.2.0
- **Build Tool**: Next.js (Turbopack/webpack)
- **Package Manager**: npm

**UI/UX Decisions:**
- Focuses on immersive audio and video experiences with features like scrubbing, volume control, and full-screen cinema video.
- **Design System**:
    - **Heading Font**: Cinzel (`font-heading`) for buttons, navigation, headings.
    - **Body Font**: Poppins (`font-sans`) for default text.
    - **Code Font**: JetBrains Mono (`font-mono`).
- **Button Styling**: Consistent use of transparent backgrounds, hover effects, and standardized sizing for icon buttons.
- **Z-Index Hierarchy**: Clearly defined `z-index` values to ensure proper layering of UI elements, with critical alerts and main overlays on top.

**Technical Implementations & Feature Specifications:**
- **Media Streaming**: Supports HTTP 206 Partial Content for efficient audio/video seeking and progressive loading.
- **Caching**: Utilizes aggressive caching (`Cache-Control: public, max-age=31536000, immutable`) for media files with versioned filenames.
- **Data Storage**: PostgreSQL via Drizzle ORM for user data, preferences, and chat history. Content data (music, collections) is managed via versioned JSON files.
- **Authentication**: Cookie-based sessions with HMAC-signed tokens. User accounts in PostgreSQL with PBKDF2 password hashing. Admin access via `ADMIN_PASSWORD` environment variable. Includes rate limiting and origin validation for CSRF protection.
- **Deployment**: Automatic and continuous deployment on Replit with zero-downtime rolling updates.
- **Monitoring**: Integration with Replit's dashboard metrics and internal health endpoints. Recommendations for external monitoring with UptimeRobot, Sentry, and Plausible.
- **Backup & Recovery**: Code is Git-versioned; media on Cloudflare R2; JSON data files versioned with code.
- **AI Integration (MetaDJai)**: Uses Vercel AI SDK best practices for tool-based catalog retrieval, reducing payload size and improving efficiency when users query music data.

## External Dependencies

-   **Cloudflare R2**: Exclusive storage for all media assets (audio, video).
    -   **Required Environment Variables**: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`.
-   **Plausible Analytics**: Optional, privacy-first analytics.
    -   **Required Environment Variable**: `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`.
-   **PostgreSQL Database**: Replit-managed (Neon-backed) for user data, sessions, preferences, chat history, and analytics.
    -   **Required Environment Variable**: `DATABASE_URL`.
    -   **Auth Secrets**: `AUTH_SECRET` or `SESSION_SECRET` (for session signing), `INTERNAL_API_SECRET`.
-   **UptimeRobot**: Recommended for external uptime monitoring.
-   **Sentry**: Recommended for external error tracking.
-   **Logging Webhook**: Optional for server-side logging.
    -   **Optional Environment Variables**: `LOGGING_WEBHOOK_URL`, `LOGGING_SHARED_SECRET`.