
# Save Transcripts for ALL Topics

## Summary

Update the caching logic so that every topic's transcript is saved to the database after first generation, not just user-requested ones. This means once a user listens to any topic, subsequent plays will load instantly from cache.

---

## Current Behavior

The edge function currently checks the `topic_requests` table (lines 462-507) to decide whether to save:

```text
Topic Generated
     |
     v
Check topic_requests table
     |
     +-- Match found --> Save transcript to DB
     |
     +-- No match --> Only save description (transcript discarded)
```

**Result**: Default topics regenerate every single time they're opened.

---

## New Behavior

```text
Topic Generated
     |
     v
Always save transcript + description to DB
     |
     +-- If topic_requests match --> Also mark request as fulfilled
```

**Result**: All topics cache after first generation, instant playback on subsequent opens.

---

## Implementation

### File: `supabase/functions/generate-content-stream/index.ts`

**Location**: Lines 462-507

Replace the conditional save logic with unconditional saving:

**Before** (current logic):
```typescript
// Check if this is a user-requested topic
const { data: topicRequest } = await supabase
  .from("topic_requests")
  .select("id")
  .ilike("query", topicTitle.trim())
  .eq("status", "pending")
  .maybeSingle();

if (topicRequest) {
  // Save transcript for user-requested topics only
  await supabase.from("topics").update({ transcript, description }).eq("id", topicId);
  await supabase.from("topic_requests").update({ status: "fulfilled" }).eq("id", topicRequest.id);
} else {
  // Only save description, discard transcript
  if (topicSummary) {
    await supabase.from("topics").update({ description: topicSummary }).eq("id", topicId);
  }
}
```

**After** (new logic):
```typescript
// Always save transcript for all topics
console.log("[Stream] Saving transcript to database for caching");

const updateData: { transcript: string; description?: string } = { 
  transcript: fullTranscript.trim() 
};
if (topicSummary) updateData.description = topicSummary;

const { error: topicError } = await supabase
  .from("topics")
  .update(updateData)
  .eq("id", topicId);

if (topicError) {
  console.error("[Stream] Topic update error:", topicError);
}

// If this was a user-requested topic, also mark the request as fulfilled
const { data: topicRequest } = await supabase
  .from("topic_requests")
  .select("id")
  .ilike("query", topicTitle.trim())
  .eq("status", "pending")
  .maybeSingle();

if (topicRequest) {
  await supabase
    .from("topic_requests")
    .update({ status: "fulfilled" })
    .eq("id", topicRequest.id);
  console.log("[Stream] Request marked as fulfilled");
}
```

---

## Changes Summary

| File | Lines | Change |
|------|-------|--------|
| `supabase/functions/generate-content-stream/index.ts` | 462-507 | Save transcript unconditionally, keep topic_requests fulfillment as secondary step |

---

## Behavior After Implementation

| Topic Type | First Open | Subsequent Opens |
|------------|------------|------------------|
| Default topic | AI generates, **SAVES to DB** | **Loads from cache** (instant) |
| User-requested topic | AI generates, SAVES to DB, marks fulfilled | Loads from cache (instant) |

---

## Technical Notes

- No database migration needed - the `transcript` column already exists
- No client-side changes needed - the streaming hook already handles cached content
- The cache check logic (lines 184-224) remains unchanged and will correctly detect saved transcripts
- Flash summaries are already saved unconditionally (lines 509-545)
