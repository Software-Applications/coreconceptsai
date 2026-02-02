
# Bypass Cache for Fresh Transcript Generation

## Current Situation

The database query confirms **no topics currently have cached transcripts** - all transcript fields are empty. This means:
- The next time any topic is opened, it will generate fresh content using your updated prompt
- The transcript will then be saved and cached for future requests

## Why You Might Still Want a Force Regenerate Option

Even though the cache is currently empty, transcripts get saved after first generation (lines 484-499). If you update the prompt again in the future, you'll need a way to regenerate without manually clearing the database each time.

## Implementation Plan

### 1. Add `forceRegenerate` Parameter to Edge Function

Update the edge function to accept an optional `forceRegenerate` parameter that bypasses the cache check:

**File:** `supabase/functions/generate-content-stream/index.ts`

```typescript
// Line 174 - Add forceRegenerate to destructured params
const { topicId, topicTitle, topicDescription, subjectName, forceRegenerate } = await req.json();

// Lines 206-207 - Update cache check condition
if (!forceRegenerate && existingTopic?.transcript && existingTopic.transcript.length > 500) {
  // Use cached transcript...
}
```

### 2. Update Frontend Streaming Hook

Add an optional parameter to the streaming content hook so the UI can trigger regeneration:

**File:** `src/hooks/useStreamingContent.ts`

Pass `forceRegenerate: true` when calling the edge function to skip cache.

### 3. Optional: Clear Existing Transcripts via SQL

If you want to ensure a completely fresh start, run this SQL to clear any existing transcripts:

```sql
UPDATE topics SET transcript = NULL WHERE transcript IS NOT NULL;
NOTIFY pgrst, 'reload schema';
```

---

## Summary of Changes

| File | Change |
|------|--------|
| `supabase/functions/generate-content-stream/index.ts` | Accept `forceRegenerate` param, bypass cache when true |
| `src/hooks/useStreamingContent.ts` | Add option to pass `forceRegenerate` to edge function |

This gives you the flexibility to regenerate content on demand whenever you update the prompt, without needing database access.
