# Journal Feature

**Last Modified**: 2025-12-28 11:02 EST

Added in v0.9.46

The **Journal** is a private, local-first space for users to capture ideas, dreams, and reflections directly within the MetaDJ Nexus platform. It resides as a top-level tab alongside Hub, Cinema, and Wisdom.

## Core Functionality

### 1. Privacy First
- **Local Storage**: All entries are stored in the user's browser `localStorage` under the key `metadj_wisdom_journal_entries`.
- **No Server Sync**: Journal data never leaves the user's device. It is not synced to the cloud or any database.
- **Persistence**: Data persists across sessions and page reloads but will be lost if the user clears their browser data.

### 2. Management (CRUD)
- **Create**: Users can create unlimited new entries.
- **Read**: Entries are displayed in a grid layout with title, excerpt, and last updated date.
- **Update**: Tap any entry to edit its title or content.
- **Delete**: Remove entries with a confirmed "Delete Forever" action to prevent accidental loss.

### 3. Speech-to-Text (STT)
- **Voice Input**: Integrated microphone button in the editor allows users to dictate entries.
- **Transcription**: Uses the [`/api/metadjai/transcribe`](../../api/metadjai/transcribe/route.ts) endpoint with OpenAI GPT-4o transcription (`gpt-4o-mini-transcribe-2025-12-15` by default).
- **Seamless Editing**: Transcribed text appends to the end of the entry for a reliable voice-first flow.
- **Centered Access**: Voice input sits centered just below the writing surface for quick dictation.
- **Limits**: 60‑second client cap; 10MB server cap (OpenAI file upload guidance allows up to 25MB).
- **Best‑practice defaults**: `language=en` is set server‑side; no `prompt` is sent to avoid prompt‑echo in short dictation.

### 4. Session Continuity
- **View restoration**: Refresh returns to the last view (list or open editor).
- **Draft retention**: Unsaved title/body drafts persist per entry or new draft, so users continue where they left off.

### 5. Focused Writing Surface
- **Markdown-first editor**: Formatting toolbar inserts Markdown tokens (headings, lists, quotes, links, code blocks, dividers).
- **Preview toggle**: Markdown preview renders inline (GFM) for quick visual checks without leaving the editor.
- **Full-height editor**: Writing surface spans most of the viewport for long-form entries.
- **Fixed container**: Editor stays a consistent height even when empty; content scrolls inside the surface when it exceeds the available space.
- **Clean edges**: Taller surface with no external drop shadow for a tighter glass frame.

## Technical Implementation

### Components
- **`src/components/wisdom/Journal.tsx`**: The main container handling list view, editor state, and persistence logic.
- **`src/hooks/home/use-view-management.ts`**: Manages the `journal` view state, ensuring correct overlay behavior (closing Wisdom/Cinema/Music when Journal is active).

### Navigation
- **Desktop**: "Journal" tab added to the main `AppHeader` center navigation.
- **Mobile**: "Journal" icon added to the persistent `MobileBottomNav`.

### Storage Schema
Array of `JournalEntry` objects:
```typescript
interface JournalEntry {
  id: string         // UUID
  title: string      // Optional title
  content: string    // Main text content
  createdAt: string  // ISO date string
  updatedAt: string  // ISO date string
}
```

**View + Draft Keys**:
- `metadj_wisdom_journal_last_view` — `list` or `editing`
- `metadj_wisdom_journal_last_entry_id` — active entry id (if editing)
- `metadj_wisdom_journal_draft_entry_id` — entry id or `new`
- `metadj_wisdom_journal_draft_title` — unsaved title buffer
- `metadj_wisdom_journal_draft_content` — unsaved body buffer

## Future Enhancements (Planned)
- **Export/Import**: Allow users to backup their journal to a JSON file.
- **Encryption**: Optional password protection for journal entries.
- **Rich Text**: Basic formatting support (bold, list, etc.).
