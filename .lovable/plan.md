
# Edge Functions Rebuild Plan

## Summary

This plan rebuilds the three core edge functions (Transcript Generator, Flashcard Summary Generator, and Text-to-Speech Generator) according to your specified rules. The current combined `generate-content-stream` and `generate-content` functions will be deleted and replaced with three modular, decoupled edge functions that follow your exact specifications.

---

## Current vs. New Architecture

### Current State (Problems)

| Function | Issues |
|----------|--------|
| `generate-content-stream` | Combined transcript + flashcard in one function; no proper cache validation |
| `generate-content` | Overwrites topic description field; also combined function |
| `google-tts` | Mostly compliant, needs refinement for your pause marker regex |

### New Architecture

```text
Frontend (DailyDownloadPlayer)
         │
         ▼
┌────────────────────────────┐
│  1. generate-transcript    │  ← Check cache first (length > 750, has "Summary")
│     - Never overwrite desc │     If cache invalid, generate via Gemini
│     - 3 retries (1s,2s,5s) │     Save to topics.transcript only
└────────────┬───────────────┘
             │ On Success
             ▼
┌────────────────────────────┐
│  2. generate-flashcard     │  ← Only triggers if transcript succeeded
│     - Check cache first    │     Title = Topic Name (never override)
│     - 3 bullet points      │     Save to flash_summaries table
│     - Never touch topics   │
└────────────┬───────────────┘
             │ On Success
             ▼
┌────────────────────────────┐
│  3. google-tts             │  ← Only triggers if transcript succeeded
│     - Ignore XML tags      │     Parse [PAUSE:\s*(\d+)\s*(?:Seconds?] regex
│     - Paragraph breaks 2s  │     XML escape (&, <, >, ", ')
│     - Resume on voice swap │     3 retries (1s,2s,5s)
└────────────────────────────┘
```

---

## Edge Functions to Create

### 1. Transcript Generator (`generate-transcript`)

**Purpose**: Generate educational transcript for a topic

**API**: Google Gemini (via `GOOGLE_API_KEY`)

**Rules Implementation**:

| Rule | Requirement | Implementation |
|------|-------------|----------------|
| 1 | Check cache first - length > 750, must have "Summary" keyword | Query `topics.transcript`, validate with both conditions |
| 1a | If cache valid, stream cached content (`forceRegenerate: false`) | Return cached transcript immediately |
| 2 | If cache invalid, use API to generate | Call Gemini, save to `topics.transcript` column |
| 3 | Never overwrite topic description field | Only update `transcript` column, never touch `description` |
| 4 | Mark fulfilled ONLY if conditions met | Return `status: "fulfilled"` or `status: "failed"` |
| 5 | Retry logic: 3 attempts (1s, 2s, 5s delays) | Exponential backoff implementation |
| 6 | Ask for API code (Gemini) | Uses `GOOGLE_API_KEY` |
| 7 | Follow prompt rules | Ask for new prompt |

**Cache Validation Logic**:
```text
function isValidCachedTranscript(transcript):
    IF transcript is null/empty → INVALID
    IF transcript.length <= 750 → INVALID
    IF transcript does NOT contain "summary" (case-insensitive) → INVALID
    RETURN VALID
```

**Response Format**:
```typescript
{
  success: boolean;
  status: "cached" | "generated" | "failed";
  transcript?: string;
  error?: string;
}
```

---

### 2. Flashcard Summary Generator (`generate-flashcard`)

**Purpose**: Generate flashcard summary based on transcript

**API**: Google Gemini (via `GOOGLE_API_KEY`)

**Rules Implementation**:

| Rule | Requirement | Implementation |
|------|-------------|----------------|
| 1 | Triggers immediately after Transcript Generator fulfilled | Called by frontend only after transcript success |
| 2 | Do NOT trigger if Transcript Generator failed | Frontend guards this check |
| 3 | Check cache first - if exists, stream cached content | Query `flash_summaries` table by `topic_id` |
| 4 | Structure: Title = Topic Name, Body = API output, 3 bullets | Structured JSON output with schema |
| 5 | Save output to database | Insert to `flash_summaries` table |
| 6 | Never overwrite topic description or topic name | Does not touch `topics` table at all |
| 7 | Retry logic: 3 attempts (1s, 2s, 5s delays) | Exponential backoff implementation |
| 8 | Ask for API code (Gemini) | Uses `GOOGLE_API_KEY` |
| 9 | Follow prompt rules | Ask for new prompt |

**Response Format**:
```typescript
{
  success: boolean;
  status: "cached" | "generated" | "failed";
  flashSummary?: {
    id: string;
    topic_id: string;
    visual_type: "diagram" | "formula" | "analogy";
    visual_content: string;
    bullet_points: string[]; // exactly 3
    difficulty: "easy" | "medium" | "hard";
    ai_generated: boolean;
  };
  error?: string;
}
```

---

### 3. Text-to-Speech Generator (`google-tts`)

**Purpose**: Convert transcript to audio with SSML pause handling

**API**: Google Cloud TTS (via `GOOGLE_API_KEY`)

**Rules Implementation**:

| Rule | Requirement | Implementation |
|------|-------------|----------------|
| 1 | Triggers immediately after Transcript Generator fulfilled | Called by frontend only after transcript success |
| 2 | Do NOT trigger if Transcript Generator failed | Frontend guards this check |
| 3 | Ignore XML tags | Strip `<transcript>` and similar tags before processing |
| 4 | Parse pause markers | Extract `[PAUSE:X Seconds]` patterns |
| 5 | Parse newlines `/n` or `\n` | Split on `\n\n+` for paragraphs |
| 6 | Paragraph pauses: insert `<break time="2s"/>` | Add between paragraphs in SSML |
| 7 | Pause marker regex: `/[PAUSE:\s*(\d+)\s*(?:Seconds?/` | Pattern: `/\[PAUSE:\s*(\d+)\s*(?:Seconds?|s)\]/gi` |
| 8 | XML escaping: `&`, `<`, `>`, `"`, `'` | `escapeXmlChars()` function |
| 9 | Resume on voice change | Frontend handles position tracking (already implemented) |
| 10 | Mark fulfilled if conditions met | Return `success: true/false` |
| 11 | Retry logic: 3 attempts (1s, 2s, 5s delays) | Exponential backoff for API calls |
| 12 | Follow prompt rules | SSML wrapping with `<speak>` tags |
| 13 | Ask for API code (Google TTS) | Uses `GOOGLE_API_KEY` |

**SSML Preprocessing Pipeline**:
```text
Input Text
    │
    ▼
Strip <transcript> tags
    │
    ▼
Split by \n\n+ (paragraphs)
    │
    ▼
For each paragraph:
    ├── Extract [PAUSE:\s*(\d+)\s*(?:Seconds?|s)] markers
    ├── Replace with placeholders
    ├── XML escape remaining text (&, <, >, ", ')
    ├── Replace placeholders with <break time="Xs"/>
    └── Add <break time="2s"/> between paragraphs
    │
    ▼
Wrap in <speak>...</speak>
    │
    ▼
Send to Google TTS API
```

---

## Frontend Changes

### Updated Hook: `useStreamingContent.ts`

The hook will be refactored to:

1. **Call transcript generator first** (`generate-transcript`)
2. **On transcript success**: Call flashcard generator (`generate-flashcard`) AND TTS generator (`google-tts`) in parallel
3. **On transcript failure**: Show error modal with "Retry" button
4. **Track step-by-step status** for UI feedback

**Key Changes**:
- Replace single `generate-content-stream` call with sequential/parallel calls
- Add `retryGeneration()` method for retry functionality
- Track individual step failures

### New Component: `RetryErrorModal.tsx`

A modal component that appears when transcript generation fails:

- **Message**: "Failed to stream content"
- **Retry button**: Re-calls `startGeneration()`
- **Cancel button**: Closes modal and player

**UI Behavior**:
```text
Generation Error
    │
    ▼
┌─────────────────────────────┐
│  Failed to stream content   │
│                             │
│  [Retry]      [Cancel]      │
└─────────────────────────────┘
```

### Updated Component: `DailyDownloadPlayer.tsx`

- Import and integrate `RetryErrorModal`
- Show modal when `streamingContent.error` is set
- Handle retry and cancel actions

---

## Files to Delete

| File | Reason |
|------|--------|
| `supabase/functions/generate-content-stream/index.ts` | Replaced by `generate-transcript` |
| `supabase/functions/generate-content/index.ts` | Replaced by `generate-transcript` |

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `supabase/functions/generate-transcript/index.ts` | Create | New transcript generator with cache validation |
| `supabase/functions/generate-flashcard/index.ts` | Create | New flashcard generator (decoupled) |
| `supabase/functions/google-tts/index.ts` | Modify | Refine pause regex, ensure proper SSML |
| `supabase/config.toml` | Modify | Update function registrations |
| `src/hooks/useStreamingContent.ts` | Modify | Call new endpoints, add error/retry handling |
| `src/components/RetryErrorModal.tsx` | Create | Error modal with Retry button |
| `src/components/DailyDownloadPlayer.tsx` | Modify | Integrate RetryErrorModal |

---

## Technical Details

### Retry Logic Implementation (All Functions)

```text
RETRY_DELAYS = [1000, 2000, 5000]  // 1s, 2s, 5s

function withRetry(fn, maxAttempts = 3):
    lastError = null
    
    for attempt = 0 to maxAttempts - 1:
        try:
            return fn()
        catch error:
            lastError = error
            log("Attempt {attempt + 1}/{maxAttempts} failed: {error}")
            
            if attempt < maxAttempts - 1:
                sleep(RETRY_DELAYS[attempt])
    
    throw lastError
```

### Transcript Cache Validation

```text
function isValidCachedTranscript(transcript):
    if not transcript:
        return false
    if length(transcript) <= 750:
        return false
    if not contains_case_insensitive(transcript, "summary"):
        return false
    return true
```

### SSML Pause Marker Regex

```text
Pattern: /\[PAUSE:\s*(\d+)\s*(?:Seconds?|s)\]/gi

Matches:
- [PAUSE: 5 Seconds]
- [PAUSE:5Seconds]
- [PAUSE: 10 s]
- [PAUSE:3s]
```

### XML Escape Function

```text
function escapeXmlChars(text):
    text = replace(text, "&", "&amp;")
    text = replace(text, "<", "&lt;")
    text = replace(text, ">", "&gt;")
    text = replace(text, '"', "&quot;")
    text = replace(text, "'", "&apos;")
    return text
```

---

## Updated Config.toml

```toml
project_id = "uzlkbqfxlamwetmvpqsi"

[functions.generate-transcript]
verify_jwt = false

[functions.generate-flashcard]
verify_jwt = false

[functions.google-tts]
verify_jwt = false

[functions.generate-textbook-cover]
verify_jwt = false
```

---

## API Keys Required

| Function | Required Secrets | Status |
|----------|-----------------|--------|
| `generate-transcript` | `GOOGLE_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Already configured |
| `generate-flashcard` | `GOOGLE_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Already configured |
| `google-tts` | `GOOGLE_API_KEY` | Already configured |

---

## Implementation Order

1. Create `generate-transcript` edge function
2. Create `generate-flashcard` edge function
3. Refine `google-tts` edge function with updated pause regex
4. Update `supabase/config.toml`
5. Delete old `generate-content-stream` and `generate-content` functions
6. Create `RetryErrorModal` component
7. Update `useStreamingContent` hook to call new endpoints
8. Update `DailyDownloadPlayer` to show retry modal on error
9. Deploy and test end-to-end
