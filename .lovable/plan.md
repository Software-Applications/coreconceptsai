

# Show Duration in Topic List — Data Is Missing

## Problem
The duration labels don't appear because all topics in the database have `duration = NULL`. The display code is already implemented and correct — it just needs data.

## Solution Options

### Option A: Compute duration from audio files (recommended)
Write a migration or edge function that calculates the actual audio duration from the `audio_url` / `generated_audio_url` fields and updates the `duration` column. This gives accurate values.

### Option B: Show a fallback when duration is unknown
Change the condition to show "—" or a placeholder when duration is null, so users at least see the field exists. This is a quick UI-only fix.

### Option C: Populate estimated durations from transcript length
Estimate duration based on transcript word count (~150 words/min for spoken audio) and write those values to the `duration` column.

## Recommendation
**Option C** is the fastest to implement and gives reasonable estimates. A one-time SQL update:
```sql
UPDATE topics 
SET duration = 
  FLOOR(array_length(string_to_array(transcript, ' '), 1) / 150) || ':' ||
  LPAD((array_length(string_to_array(transcript, ' '), 1) % 150 * 60 / 150)::text, 2, '0')
WHERE duration IS NULL AND transcript IS NOT NULL;
```

## Changes
1. **Migration**: Add a SQL migration to populate `duration` from transcript word count for all topics where it's currently null
2. **Fallback UI** (optional): In `TopicCard.tsx` and `TopicSelectionSheet.tsx`, show "~X min" as estimated if exact duration is unavailable

