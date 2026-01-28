
# Implementation Plan: Custom Content, Supabase Progress, and AI Audio

## Recommended Implementation Order

```text
┌─────────────────────────────────────────────────────────────────────┐
│  Phase 1: Enable Lovable Cloud + Database Schema                    │
│  (Foundation for everything else)                                   │
├─────────────────────────────────────────────────────────────────────┤
│  Phase 2: Custom Content Management                                 │
│  (Subjects, topics, and flash summaries in database)                │
├─────────────────────────────────────────────────────────────────────┤
│  Phase 3: AI-Powered Content Generation                             │
│  (Gemini for summaries + ElevenLabs for audio)                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Supabase Backend Setup

### 1.1 Enable Lovable Cloud
- Activate Lovable Cloud for database, authentication, and edge functions
- This provides the Supabase backend automatically

### 1.2 Database Schema

**Tables to create:**

| Table | Purpose |
|-------|---------|
| `subjects` | Custom subjects (replacing hardcoded array) |
| `chapters` | Chapters within subjects |
| `topics` | Daily Download topics with content |
| `flash_summaries` | Flash cards linked to topics |
| `user_progress` | Listened topics per user |
| `pinned_cards` | User's pinned flash cards |
| `quiz_attempts` | Quiz scores and attempts |

**Schema Design:**
```sql
-- Subjects table
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT DEFAULT 'bg-navy-800',
  image_url TEXT,
  textbook_title TEXT,
  textbook_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Topics table
CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  chapter_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  duration TEXT,
  audio_url TEXT,
  generated_audio_url TEXT, -- AI-generated audio
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Flash summaries table
CREATE TABLE flash_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
  visual_type TEXT CHECK (visual_type IN ('diagram', 'formula', 'analogy')),
  visual_content TEXT,
  bullet_points TEXT[], -- Array of 3 bullet points
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  ai_generated BOOLEAN DEFAULT false
);

-- User progress table
CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE NOT NULL,
  listened_at TIMESTAMPTZ DEFAULT now(),
  progress_percentage INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  UNIQUE(user_id, topic_id)
);

-- Pinned cards table
CREATE TABLE pinned_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  flash_summary_id UUID REFERENCES flash_summaries(id) ON DELETE CASCADE NOT NULL,
  pinned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, flash_summary_id)
);
```

### 1.3 Authentication
- Add simple email/password login page
- Protect progress tracking behind authentication
- Guest mode can still browse content (read-only)

### 1.4 Migrate Hooks to Supabase
Update these hooks to use Supabase instead of localStorage:
- `useListenedTopics.ts` → Query `user_progress` table
- `usePinnedCards.ts` → Query `pinned_cards` table
- `useQuizProgress.ts` → Query `quiz_attempts` table

---

## Phase 2: Custom Content Management

### 2.1 Content Data Layer
- Create React Query hooks to fetch subjects/topics from Supabase
- Replace imports from `dailyDownloadData.ts` with database queries
- Keep TypeScript interfaces for type safety

### 2.2 Admin Interface (Optional)
- Simple form to add/edit subjects
- Topic creation form with flash summary fields
- Could be a separate `/admin` route (protected)

### 2.3 Seed Initial Data
- Provide SQL migration to seed your custom subjects/topics
- Or build import functionality from JSON/CSV

---

## Phase 3: AI Content Generation with Gemini

### 3.1 Content Summary Generation
**Edge Function: `generate-summary`**
- Uses Lovable AI Gateway (Gemini model)
- Input: Topic title and description
- Output: Flash summary with bullet points

```typescript
// Example request to Lovable AI Gateway
const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${LOVABLE_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "google/gemini-3-flash-preview",
    messages: [
      { role: "system", content: "Generate educational flash card content..." },
      { role: "user", content: `Create a flash summary for: ${topicTitle}` }
    ],
    tools: [{ /* structured output schema */ }]
  }),
});
```

### 3.2 Audio Generation
**Edge Function: `generate-audio`**
- Uses ElevenLabs TTS API (not Gemini - Gemini doesn't generate audio)
- Converts topic transcript to natural speech
- Stores generated audio URL in `topics.generated_audio_url`

**Why ElevenLabs instead of browser TTS?**
- Professional, natural-sounding voices
- Consistent quality across devices
- Can cache generated audio for replay

### 3.3 User Flow
1. User selects a topic
2. If no generated audio exists:
   - Call `generate-summary` edge function (Gemini)
   - Call `generate-audio` edge function (ElevenLabs)
   - Store results in database
3. Play audio from stored URL (or fall back to browser TTS)

---

## Technical Notes

### API Keys Required
| Service | Key | Purpose |
|---------|-----|---------|
| Lovable AI | Auto-provisioned | Gemini content generation |
| ElevenLabs | User must provide | Professional TTS audio |

### Files to Modify

**Phase 1:**
- Create auth page (`/auth`)
- Add Supabase client integration
- Create database migrations
- Update all progress hooks

**Phase 2:**
- Create `src/hooks/useSubjects.ts` (React Query)
- Create `src/hooks/useTopics.ts` (React Query)
- Update `Index.tsx` to use database queries

**Phase 3:**
- Create `supabase/functions/generate-summary/index.ts`
- Create `supabase/functions/generate-audio/index.ts`
- Update `DailyDownloadPlayer.tsx` for AI audio playback

---

## Estimated Effort

| Phase | Complexity | Description |
|-------|------------|-------------|
| Phase 1 | Medium | Database setup, auth, hook migration |
| Phase 2 | Low-Medium | Content queries, optional admin UI |
| Phase 3 | Medium | Edge functions, AI integration |

---

## Ready to Start?

I recommend starting with **Phase 1** to establish the foundation. Would you like me to:
1. Enable Lovable Cloud and create the database schema
2. Add authentication
3. Migrate the localStorage hooks to Supabase

This will set up everything needed for Phases 2 and 3.
