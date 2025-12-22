# Hub Content Strategy

**Last Modified**: 2025-12-19 10:41 EST

## Overview
This document outlines the content strategy for the MetaDJ Hub page, specifically focusing on the new 3-column layout introduced in the second row ("Platform Pulse" section).

## Layout Structure
The Hub's second row is now divided into three equal columns to provide a broader view of the ecosystem:

1.  **News (Left)**
2.  **Upcoming Events (Center)**
3.  **Platform Pulse (Right)**

## Content Pillars

### 1. News (Curated Updates)
*   **Goal**: Position MetaDJ as a thought leader and central node in the Metaverse/AI music ecosystem.
*   **Content**: Curated news stories relevant to:
    *   Generative AI advancements (music & visual).
    *   Metaverse platform updates (Decentraland, Sandbox, etc.).
    *   Web3 music industry trends.
*   **Status**: Currently a placeholder ("Coming Soon").
*   **Implementation Strategy**:
    *   Phase 1: Manual curation (json file or hardcoded list).
    *   Phase 2: RSS feed integration or CMS-driven updates.

### 2. Upcoming Events
*   **Goal**: Drive engagement and community participation.
*   **Content**:
    *   **MetaDJ Sets**: Scheduled live performances.
    *   **Community Calls**: Feature feedback sessions, town halls.
    *   **Ecosystem Events**: Significant external events (e.g., AI summits, Metaverse festivals).
*   **Status**: Currently a placeholder ("Coming Soon").
*   **Implementation Strategy**:
    *   Phase 1: Hardcoded "Featured Event".
    *   Phase 2: Calendar integration (Google Cal/Luma) or internal Event model.

### 3. Platform Pulse
*   **Goal**: Transparency and feature awareness.
*   **Content**:
    *   Changelog highlights (borrowed from `platformUpdates.ts`).
    *   "Public Preview" notices.
    *   Status indicators (if relevant).
*   **Status**: Live (Migrated from full-width section).
*   **Design**: Compact list view of the latest 2-3 updates.

## Roadmap & TBD

*   [ ] **CMS Selection**: Decide if we need a lightweight CMS (Sanity, Contentful) or if `mdx`/JSON is sufficient for News/Events.
*   [ ] **Event Schema**: Define the data structure for an Event (Date, Time, Link, Description, Type).
*   [ ] **News curation workflow**: Establish who curates news and how often.

## related Files
*   `src/components/hub/HubExperience.tsx` - Layout implementation.
*   `src/data/platformUpdates.ts` - Source for Platform Pulse.
