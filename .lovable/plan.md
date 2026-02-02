
# Fix: Prevent Description Overwriting During Transcript Generation

## Problem Summary
When users open a topic in the "Core Concepts" audio view, the system generates a transcript and **incorrectly overwrites the curated topic description** with an AI-generated summary. This has corrupted descriptions for topics like:
- "Homeostatic Feedback" → now shows "Students" instead of the original
- "Signal Transduction" → now shows "Learn how" instead of the original

## Root Cause
The `generate-content-stream` edge function unconditionally overwrites the `description` field whenever it generates a new transcript (lines 488-496). The AI summary generation can also fail silently, resulting in truncated/partial text.

## Solution: Preserve Original Descriptions

The fix ensures that **topic descriptions are never overwritten during transcript generation**, since they are curated content that should remain stable.

### Changes Required

**1. Edge Function: `supabase/functions/generate-content-stream/index.ts`**

Remove the description update logic entirely. The transcript should be saved, but the description should never be touched:

- **Remove lines 454-483**: Delete the entire "Generate topic summary for description" block
- **Simplify lines 488-491**: Change from:
  ```typescript
  const updateData: { transcript: string; description?: string } = { 
    transcript: fullTranscript.trim() 
  };
  if (topicSummary) updateData.description = topicSummary;
  ```
  To:
  ```typescript
  const updateData = { transcript: fullTranscript.trim() };
  ```

**2. Database: Fix Corrupted Descriptions**

Run a one-time SQL update to restore the corrupted descriptions for affected topics:

```sql
UPDATE topics SET description = 'The mechanisms that maintain stable internal conditions through feedback loops involving sensors, control centers, and effectors.' WHERE id = '8a7a6405-bc64-43cf-89db-3b1d7094a7cb';

UPDATE topics SET description = 'The process by which cells receive and respond to external signals through receptor proteins and intracellular signaling cascades.' WHERE id = 'f7007245-7d25-4c9c-9a80-3264f5de289a';
```

**3. Optional Cleanup: `supabase/functions/regenerate-summaries/index.ts`**

This function was created as a workaround to fix corrupted descriptions. After applying the main fix, this function can be deprecated or removed since it will no longer be needed.

---

## Technical Details

### Current Flow (Problematic)
```text
User opens topic → Transcript generated → Description OVERWRITTEN → Corrupted UI
```

### Fixed Flow
```text
User opens topic → Transcript generated → Only transcript saved → Description preserved
```

### Files Modified
| File | Change |
|------|--------|
| `supabase/functions/generate-content-stream/index.ts` | Remove description update logic (~35 lines removed) |
| Database | One-time fix for 2 corrupted topics |

### Testing Plan
1. Open a topic that hasn't been played before
2. Verify transcript generates correctly
3. Verify the original description remains unchanged in the UI
4. Verify the "Homeostatic Feedback" and "Signal Transduction" topics show proper descriptions after the database fix
