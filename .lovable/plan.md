

## Fix Flashcard Display Issues

### Problems Identified

1. **Visual content too long**: Cached flashcards in the database have `visual_content` ranging from 119 to 233 characters, far exceeding the intended 60-character limit. The recent edge function update only affects new generations.

2. **Duplicate action buttons**: The `FlashSummaryCard` component has built-in "Got it" / "Pin for review" buttons, but `DailyDownloadPlayer.tsx` also renders a separate "Done" / "Pin Card" button set below it, causing the visual duplication you see.

3. **Font size too large**: The `visualContent` uses `text-3xl` (30px font), which is excessive for long content.

### Solution

#### Part 1: Remove Duplicate Buttons from Player

**File: `src/components/DailyDownloadPlayer.tsx`**

Remove lines 868-884 (the outer button set), keeping only the buttons inside `FlashSummaryCard`:

```tsx
// REMOVE THIS BLOCK (lines 868-884):
<div className="flex gap-3 mt-6 w-full max-w-sm">
  <motion.button onClick={handleDismissFlashCard} ...>Done</motion.button>
  <motion.button onClick={handlePinFlashCard} ...>Pin Card</motion.button>
</div>
```

#### Part 2: Auto-Regenerate Cached Flashcards

**File: `supabase/functions/generate-flashcard/index.ts`**

When returning a cached flashcard, check if `visual_content` exceeds 80 characters. If so, delete the cached entry and regenerate:

```typescript
// After fetching existing summary (around line 275)
if (existingSummary) {
  // Check if cached content is too long (needs regeneration)
  if (existingSummary.visual_content && existingSummary.visual_content.length > 80) {
    console.log(`[Flashcard] Cached content too long (${existingSummary.visual_content.length} chars), regenerating...`);
    
    // Delete the old entry
    await supabase
      .from("flash_summaries")
      .delete()
      .eq("id", existingSummary.id);
    
    // Continue to regeneration (don't return cached)
  } else {
    console.log("[Flashcard] Returning cached flashcard");
    // Return cached as before
  }
}
```

#### Part 3: Responsive Font Size for Visual Content

**File: `src/components/FlashSummaryCard.tsx`**

Change the font size to be smaller and use line clamping for long content:

```tsx
// Before (line 96):
<p className="text-3xl font-bold text-foreground mb-2">

// After:
<p className="text-lg font-bold text-foreground mb-2 line-clamp-3 leading-snug">
```

### Files to Change

| File | Change |
|------|--------|
| `src/components/DailyDownloadPlayer.tsx` | Remove duplicate "Done" / "Pin Card" buttons |
| `supabase/functions/generate-flashcard/index.ts` | Auto-regenerate cached flashcards that exceed 80 chars |
| `src/components/FlashSummaryCard.tsx` | Reduce visual content font size from `text-3xl` to `text-lg` |

### Expected Result

| Issue | Before | After |
|-------|--------|-------|
| Visual content length | 100-230 chars | ≤60 chars (regenerated) |
| Duplicate buttons | Two button sets visible | Single button set inside card |
| Font size | 30px (`text-3xl`) | 18px (`text-lg`) with line clamping |

