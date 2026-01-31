

# Align Practice Card Title Spacing with Video Card

## Summary
Adjust the practice card title section to have consistent visual balance with the video card.

## Changes

### `src/components/PracticeCard.tsx`

**Current state:**
- Practice card uses `mt-2` with just text
- Video card uses `mt-2` with avatar (28px) + text, creating more visual weight

**Solution:**
Change `mt-2` to `mt-2` with `flex items-center` layout to match video card structure, ensuring consistent vertical rhythm:

```tsx
// Before (line 69)
<div className="mt-2">
  <p className="font-medium text-foreground text-xs line-clamp-2">{practice.title}</p>
</div>

// After
<div className="flex items-center gap-2 mt-2">
  <div className="min-w-0">
    <p className="font-medium text-foreground text-xs line-clamp-2">{practice.title}</p>
  </div>
</div>
```

This matches the exact structure of VideoCard (line 56-61), ensuring:
- Same `flex items-center gap-2 mt-2` container
- Same `min-w-0` wrapper for text truncation
- Consistent visual spacing between cards in the same row

