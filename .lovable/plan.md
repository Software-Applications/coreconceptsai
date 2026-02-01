
# Fix Topic Card Descriptions

## The Problem

Currently, the topic card descriptions are showing audio transcripts instead of topic summaries. This happens because the `generate-content` edge function overwrites the `description` field with the generated transcript.

Looking at the database:
- **Proper summary**: "How cells extract energy from glucose" (short, helpful)
- **Transcript in description**: "Hello there, and welcome! I am so glad you are joining me today..." (long, not suitable for cards)

## The Solution

Add a separate `transcript` column to the `topics` table, keeping `description` reserved for short summaries. Update the edge function to write transcripts to the new column and generate a separate summary for the description.

## Database Changes

Add a `transcript` column to the `topics` table:

| Column | Type | Purpose |
|--------|------|---------|
| transcript | text | Stores the full audio transcript |

## Edge Function Changes

### `supabase/functions/generate-content/index.ts`

1. Generate a brief topic summary (1-2 sentences) in addition to the transcript
2. Save the transcript to the new `transcript` column
3. Save the summary to the `description` column
4. Only update `description` if it's empty or was previously a transcript

New prompt to add for summary generation:
```
Generate a concise 1-2 sentence summary of this topic that explains what students will learn. Keep it under 150 characters.
```

## Hook Changes

### `src/hooks/useTopics.ts`

Update the query to include the new `transcript` field in the `DailyDownloadTopic` interface, making it available for the audio player while keeping `description` for summaries.

## Component Changes

### `src/components/topic-selection/TopicCard.tsx`

No changes needed - it already uses `topic.description` which will now contain the proper summary instead of transcript.

## Files to Modify

| File | Change |
|------|--------|
| `supabase/migrations/[new].sql` | Add `transcript` column to topics table |
| `supabase/functions/generate-content/index.ts` | Generate summary, save transcript to new column |
| `src/hooks/useTopics.ts` | Add transcript to DailyDownloadTopic interface |

## Data Migration Note

Existing topics that have transcripts stored in `description` will need their descriptions regenerated. The edge function can detect this by checking if the description starts with common transcript openings like "Hello", "Welcome", etc., and regenerate summaries for those.
