

# Transcript Caching Architecture

## Overview

Implement a database-first caching strategy where transcripts are only persisted for user-requested topics. When a topic is opened, the system first checks the database for an existing transcript before triggering AI generation.

---

## Current State

| Component | Current Behavior |
|-----------|------------------|
| `topics` table | All rows have `transcript = null` |
| `generate-content-stream` | Always generates new transcript, saves to DB |
| `DailyDownloadPlayer` | Checks `needsAIContent` based on description length, always generates |
| Audio cache | IndexedDB stores audio blobs, not transcripts |

---

## Proposed Flow

```text
User opens topic
       │
       ▼
┌──────────────────────────────────────┐
│  1. Check database for transcript    │
│     SELECT transcript FROM topics    │
│     WHERE id = topicId               │
└──────────────────────────────────────┘
       │
       ├─── Transcript exists ───────────────────────┐
       │                                             ▼
       │                              ┌──────────────────────────────┐
       │                              │  Use cached transcript       │
       │                              │  Generate audio chunks       │
       │                              │  (TTS only, no AI call)      │
       │                              └──────────────────────────────┘
       │
       ├─── No transcript ─────────────────────────────────────────┐
       │                                                           ▼
       ▼                                            ┌────────────────────────────┐
┌──────────────────────────────────────┐            │  Call generate-content-    │
│  2. Call AI to generate transcript   │◀───────────│  stream edge function      │
│     Stream in 30-sec chunks          │            └────────────────────────────┘
└──────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  3. Was this a user-requested topic? │
│     Check topic_requests table       │
└──────────────────────────────────────┘
       │
       ├─── Yes (user requested) ────────────────────┐
       │                                             ▼
       │                              ┌──────────────────────────────┐
       │                              │  SAVE transcript to DB       │
       │                              │  topics.transcript = content │
       │                              │  Update topic_requests.status│
       │                              └──────────────────────────────┘
       │
       └─── No (default topic) ──────────────────────┐
                                                     ▼
                                      ┌──────────────────────────────┐
                                      │  DO NOT save transcript      │
                                      │  Content generated on-demand │
                                      │  each time                   │
                                      └──────────────────────────────┘
```

---

## Implementation Plan

### Phase 1: Data Cleanup

**One-time database operation:**
- Clear all `transcript` fields in the `topics` table
- Clear all `generated_audio_url` fields
- This starts fresh with no cached content

```sql
UPDATE topics SET transcript = NULL, generated_audio_url = NULL;
```

**Client-side cleanup:**
- Run `clearAllAppData()` to clear IndexedDB audio cache

---

### Phase 2: Edge Function Updates

**File: `supabase/functions/generate-content-stream/index.ts`**

Add logic at the beginning to check for cached transcript:

```typescript
// 1. Check if transcript exists in database
const { data: existingTopic } = await supabase
  .from('topics')
  .select('transcript, description')
  .eq('id', topicId)
  .single();

if (existingTopic?.transcript && existingTopic.transcript.length > 500) {
  // Stream pre-existing transcript in chunks
  const chunks = splitIntoChunks(existingTopic.transcript, WORDS_PER_30_SEC);
  for (let i = 0; i < chunks.length; i++) {
    sendEvent('chunk', { 
      index: i, 
      text: chunks[i], 
      isLast: i === chunks.length - 1,
      cached: true 
    });
  }
  sendEvent('done', { fullTranscript: existingTopic.transcript, fromCache: true });
  return;
}

// 2. No cached transcript - generate via AI (existing logic)
```

Modify the save logic at the end:

```typescript
// Only save transcript if this is a user-requested topic
const { data: topicRequest } = await supabase
  .from('topic_requests')
  .select('id')
  .eq('query', topicTitle)  // Match by title
  .maybeSingle();

if (topicRequest) {
  // Save transcript for user-requested topics
  await supabase
    .from('topics')
    .update({ transcript: fullTranscript.trim(), description: topicSummary })
    .eq('id', topicId);
    
  // Mark request as fulfilled
  await supabase
    .from('topic_requests')
    .update({ status: 'fulfilled' })
    .eq('id', topicRequest.id);
} else {
  // Don't save transcript for default topics - generate on-demand each time
  console.log('[Stream] Not saving transcript - not a user-requested topic');
}
```

---

### Phase 3: Client Updates

**File: `src/hooks/useStreamingContent.ts`**

Add handling for cached transcript chunks:

```typescript
if (data.cached) {
  console.log(`[StreamContent] Using cached chunk ${data.index}`);
}
```

**File: `src/components/DailyDownloadPlayer.tsx`**

Update `needsAIContent` check to always trigger streaming (which will handle cache internally):

```typescript
const needsAIContent = useMemo(() => {
  if (!topic) return false;
  // Always go through streaming flow - edge function handles caching
  return true;
}, [topic]);
```

---

### Phase 4: Topic Request Linking

**Enhancement to link topic requests to actual topics:**

When a user makes a topic request via search:
1. Check if a topic with that title already exists
2. If yes, associate the request with that topic
3. When the topic is opened, the edge function will see the request and save the transcript

**File: `src/hooks/useTopicRequest.ts`**

```typescript
// After inserting request, check if matching topic exists
const { data: matchingTopic } = await supabase
  .from('topics')
  .select('id, title')
  .ilike('title', query.trim())
  .maybeSingle();

if (matchingTopic) {
  // Update request with topic reference (optional - can use title matching)
}
```

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `supabase/functions/generate-content-stream/index.ts` | Edit | Add cache check at start, conditional save at end |
| `src/hooks/useStreamingContent.ts` | Edit | Handle cached chunks in SSE events |
| `src/components/DailyDownloadPlayer.tsx` | Edit | Simplify needsAIContent to always stream |
| Database | Migration | Clear existing transcripts |

---

## Edge Cases

| Scenario | Handling |
|----------|----------|
| Same topic opened multiple times | Edge function returns cached transcript if available |
| User requests topic then opens it | First open generates and saves transcript |
| Default topic opened | Generates but doesn't save - re-generates each time |
| Topic request matches existing topic | Uses title matching in edge function |

---

## Expected Behavior After Implementation

| Topic Type | First Open | Subsequent Opens |
|------------|------------|------------------|
| Default topic | AI generates, does NOT save | AI generates again |
| User-requested topic | AI generates, SAVES to DB | Uses cached transcript |

---

## Technical Details

### Chunk Splitting for Cached Transcripts

```typescript
function splitIntoChunks(text: string, wordsPerChunk: number): string[] {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let currentChunk = '';
  let currentWords = 0;
  
  for (const sentence of sentences) {
    const sentenceWords = sentence.split(/\s+/).length;
    if (currentWords + sentenceWords > wordsPerChunk && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
      currentWords = sentenceWords;
    } else {
      currentChunk += ' ' + sentence;
      currentWords += sentenceWords;
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}
```

### Database Check Query

The edge function will check for cached content first:

```sql
SELECT transcript 
FROM topics 
WHERE id = $1 
  AND transcript IS NOT NULL 
  AND length(transcript) > 500
```

### Topic Request Matching

Match requests to topics by normalized title:

```sql
SELECT id FROM topic_requests 
WHERE LOWER(TRIM(query)) = LOWER(TRIM($topicTitle))
LIMIT 1
```

