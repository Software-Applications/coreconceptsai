
# Practice Card Cleanup

## Summary
Reorganize the practice quiz card layout so the quiz name appears below the cover image instead of on it, and remove the time estimate.

## Changes

### `src/components/PracticeCard.tsx`

**1. Remove title from the cover overlay**
- Delete lines 47-50 (the title section inside the image overlay)
- Keep the bottom section with question count and difficulty badge

**2. Show quiz name below the cover**
- Replace "Start quiz" / "Retake quiz" text with the actual quiz name (`practice.title`)

**3. Remove time estimate**
- Delete line 61 showing `~{estimatedTime} min`
- Also remove the unused `estimatedTime` variable calculation (line 18)

### Visual Result

**Before:**
```
┌─────────────────────┐
│  Quiz Title         │  ← on cover
│                     │
│  5 questions  Easy  │
└─────────────────────┘
  Start quiz
  ~8 min
  pp. 12-15
```

**After:**
```
┌─────────────────────┐
│                     │  ← no title on cover
│                     │
│  5 questions  Easy  │
└─────────────────────┘
  Quiz Title          ← name below cover
  pp. 12-15
```

## Technical Details

The changes involve:
- Removing the title `<div>` from the overlay (lines 47-50)
- Changing line 60 from conditional "Start/Retake quiz" text to `{practice.title}`
- Removing line 61 (time estimate)
- Removing line 18 (`estimatedTime` variable) as it's no longer needed
