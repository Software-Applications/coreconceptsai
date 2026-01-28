
# Implementation Plan: Custom Content, Supabase Progress, and AI Audio

## Recommended Implementation Order

```text
┌─────────────────────────────────────────────────────────────────────┐
│  Phase 1: Enable Supabase + Database Schema ✅ COMPLETE             │
│  (Foundation for everything else)                                   │
├─────────────────────────────────────────────────────────────────────┤
│  Phase 2: Custom Content Management ✅ COMPLETE                     │
│  (Subjects, topics, and flash summaries in database)                │
├─────────────────────────────────────────────────────────────────────┤
│  Phase 3: AI-Powered Content Generation ⏳ IN PROGRESS              │
│  (Gemini for summaries, browser TTS for audio)                      │
├─────────────────────────────────────────────────────────────────────┤
│  Phase 4: Authentication (upcoming)                                 │
│  (Email/password login for progress sync)                           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Supabase Backend Setup ✅ COMPLETE

### 1.1 Database Connected
- External Supabase project connected
- RLS policies configured for public content and private user data

### 1.2 Database Schema ✅
All tables created:
- `subjects` - Custom subjects with textbook info
- `chapters` - Chapters within subjects
- `topics` - Daily Download topics with audio fields
- `flash_summaries` - Flash cards linked to topics
- `user_progress` - Listened topics per user
- `pinned_cards` - User's pinned flash cards
- `quiz_attempts` - Quiz scores and attempts

### 1.3 Data Seeded ✅
- 3 subjects (Microbiology, Chemistry, Biology)
- 23 chapters
- 24 topics with flash summaries

---

## Phase 2: Custom Content Management ✅ COMPLETE

### 2.1 Content Data Layer ✅
React Query hooks created:
- `useSubjects.ts` - Fetches subjects with textbook metadata
- `useChapters.ts` - Fetches chapters with subject filtering
- `useTopics.ts` - Fetches topics with flash summaries

### 2.2 Component Migration ✅
Updated to use database data:
- `Index.tsx` - Main page with loading states
- `ChapterDropdown.tsx` - Chapter selection
- `TopicSelectionSheet.tsx` - Topic browsing
- `DailyDownloadPlayer.tsx` - Audio player with transcripts

---

## Phase 3: AI Content Generation ⏳ IN PROGRESS

### 3.1 Edge Functions Created ✅

**`generate-summary`**
- Uses Lovable AI Gateway (Gemini model)
- Generates flash card summaries with:
  - Visual type (diagram/formula/analogy)
  - Visual content (emoji-enhanced)
  - 3 bullet points
  - Difficulty rating
- Saves to `flash_summaries` table

**`generate-transcript`**
- Uses Lovable AI Gateway (Gemini model)
- Creates spoken educational transcripts
- Conversational, engaging format for TTS
- Saves to `topics.description` field

### 3.2 React Hooks Created ✅
- `useGenerateSummary` - Triggers flash card generation
- `useGenerateTranscript` - Triggers audio script generation
- `useGenerateAllContent` - Generates both in sequence

### 3.3 UI Integration ✅
- AI sparkle button in DailyDownloadPlayer header
- Dropdown menu with regeneration options
- Loading states during generation
- Toast notifications on success/error

### 3.4 Audio Strategy
**Current: Browser TTS**
- Uses Web Speech API for audio playback
- Works across devices without API costs
- Generated transcripts optimize for spoken delivery

**Future: ElevenLabs (optional)**
- Can add professional voice synthesis later
- Would require ElevenLabs API key
- Store generated audio in Supabase storage

---

## Phase 4: Authentication (Upcoming)

### 4.1 Auth Page
- Email/password login and signup
- Protected routes for user-specific features

### 4.2 Progress Sync
- Migrate localStorage hooks to Supabase:
  - `useListenedTopics` → `user_progress` table
  - `usePinnedCards` → `pinned_cards` table
  - `useQuizProgress` → `quiz_attempts` table

---

## Technical Notes

### API Keys Used
| Service | Key | Status |
|---------|-----|--------|
| Lovable AI | LOVABLE_API_KEY | ✅ Auto-provisioned |
| ElevenLabs | — | ⏸️ Deferred (using browser TTS) |

### Files Modified in Phase 3
- `supabase/functions/generate-summary/index.ts` (new)
- `supabase/functions/generate-transcript/index.ts` (new)
- `supabase/config.toml` (updated)
- `src/hooks/useAIGeneration.ts` (new)
- `src/components/DailyDownloadPlayer.tsx` (updated)

---

## Next Steps

1. **Test AI generation** - Verify edge functions work end-to-end
2. **Add authentication** - Enable user progress sync
3. **(Optional) Add ElevenLabs** - Professional TTS when ready
