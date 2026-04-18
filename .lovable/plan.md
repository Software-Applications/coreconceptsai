

The user wants a new product story for "Core Concepts AI" based on what the app actually does — not the aspirational doc they uploaded (which references things like "Active Prompting" pauses, "Visual Anchors" mnemonic cards, "Swipe Decision" review board, and "Daily Commute Study Habit" that don't exist in the codebase).

## What the app actually is (from the code)

From the codebase I can see:
- **Core Concepts AI Hub** — tagline already in product: "Complex topics, simplified in AI audio"
- **AI-generated audio explanations** of complex topics, organized by Subject → Chapter → Topic
- **3-stage generation pipeline**: Architect (blueprint) → Script Writer (transcript) → Audio Engineer (SSML for TTS) — per the memory note
- **Google TTS with multiple voice options** (Oliver, Marcus, James, Aria, Emma, Sophia) — `useVoicePreference.ts`
- **Streaming audio player** with playback speed (1x–2x), skip 15s, scrubbing — `useAudioPlayer.ts`, `DailyDownloadPlayer.tsx`
- **Resume playback** — `useAudioProgress.ts` saves char index per topic for 7 days
- **Listened tracking** — `useListenedTopics.ts`, `topic_listens` table, unlistened badge counter
- **Trending Concepts** — `useTrendingTopics.ts`, collapsible carousel
- **Topic search & request** — users can search and request new topics (`useTopicRequest.ts`)
- **Exam-aware highlighting** — `useExams.ts`, "🔥 N topics match your upcoming exam" pill
- **Practice quizzes** per chapter — `PracticeQuizSheet.tsx`, `useQuizProgress.ts`
- **Topic durations** (now populated from transcript word count)
- **Mobile-first PWA** with Capacitor config, haptics, bottom nav, sheet UIs
- **NO** flashcards / mnemonic cards / swipe review on the frontend (memory: "visual summary and flashcard system has been completely removed")
- **NO** in-audio active-prompting pauses / quiz-the-listener mechanic

## What's false in the user's doc
- "Active Prompting" pauses inside audio — not implemented
- "Visual Anchors" mnemonic cards — explicitly removed
- "Swipe Decision" mechanic on a Review Board — not implemented
- "Spaced repetition" — not implemented

## Plan

This is a **writing task**, not a code change. I'll produce a rewritten product story grounded only in what the app actually does, keeping the same section structure (Summary, Rationale, Mapped OKRs, Target Users, Hypothesis Statements, Key Metrics) so it's a drop-in replacement for their doc. I'll deliver it inline in chat (markdown) — no file generation needed unless the user asks for a .docx/.pdf.

If the user later wants this as a downloadable Word/PDF, I can generate it then.

