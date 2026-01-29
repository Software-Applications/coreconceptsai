# Real-Time AI Content Generation with Google AI Studio

## Status: ✅ Implemented

## Overview

This plan replaced the Lovable AI gateway integration with **direct calls to Google's Generative Language API**, allowing the app to generate transcripts and flash summaries on-the-fly when a user selects a topic.

## Architecture

```text
User selects topic → Taps "Generate AI Content" button
        │
        ▼
┌──────────────────┐      ┌─────────────────────────────┐
│  Frontend        │      │  Supabase Edge Functions    │
│  (React)         │─────▶│                             │
│                  │      │  ┌─────────────────────┐    │
│  DailyDownload   │      │  │ generate-content    │    │
│  Player          │      │  │                     │    │
└──────────────────┘      │  │ 1. Call Gemini API  │    │
                          │  │    (transcript)     │    │
                          │  │                     │    │
                          │  │ 2. Call Gemini API  │    │
                          │  │    (flash summary)  │    │
                          │  │                     │    │
                          │  │ 3. Save to DB       │    │
                          │  │ 4. Return results   │    │
                          │  └─────────────────────┘    │
                          └─────────────────────────────┘
                                       │
                                       ▼
                          ┌─────────────────────────────┐
                          │  Google Generative AI API   │
                          │  generativelanguage.        │
                          │  googleapis.com             │
                          │                             │
                          │  • gemini-2.0-flash-lite    │
                          │    (transcripts)            │
                          │  • gemini-2.0-flash         │
                          │    (flash summaries)        │
                          └─────────────────────────────┘
```

## What Was Implemented

### 1. Unified Edge Function (`supabase/functions/generate-content/index.ts`)
- Single function that generates both transcript and flash summary
- Uses Google Generative AI API with your configured prompts
- Saves results to database (topics.description + flash_summaries table)
- Returns both transcript and flash summary to frontend

### 2. Updated Frontend Hook (`src/hooks/useAIGeneration.ts`)
- Simplified to single `useGenerateContent()` hook
- Calls the unified edge function
- Invalidates queries on success to refresh UI

### 3. Updated Player (`src/components/DailyDownloadPlayer.tsx`)
- Single "Generate AI Content" button in header
- Creates both transcript and flash card in one click
- Loading state while generating

### 4. Deleted Old Functions
- `supabase/functions/generate-summary/index.ts` - removed
- `supabase/functions/generate-transcript/index.ts` - removed

## Models Used

| Purpose | Model | Notes |
|---------|-------|-------|
| Transcript | `gemini-2.0-flash-lite` | Fast, good for conversational content |
| Flash Summary | `gemini-2.0-flash` | Structured JSON output with responseSchema |

## Agent Prompts

The system prompts from your AI Studio agents are embedded in the edge function:

1. **Transcript Agent** - Creates podcast-style educational content with active prompting
2. **Flash Summary Agent** - Creates structured flashcard with visual_type, visual_content, bullet_points, difficulty

## User Experience Flow

1. User opens Topic Selection Sheet
2. User taps a topic → DailyDownloadPlayer opens
3. User taps the sparkle (✨) button in header
4. "Generate AI Content" option appears
5. Click → Shows loading spinner
6. After ~5-10 seconds, transcript and flash card are generated
7. Content is cached in database for future visits

## Secrets Required

- `GOOGLE_API_KEY` - Added to Supabase secrets ✅
