
# Fix Orange Hover Color in Subject Chips and Topic Cards

## Problem

The app's `accent` color is defined as orange/amber (`38 92% 50%`), which is the same as the `warning` color. This creates jarring orange hover states on:

- **Subject chips** (`SubjectChipWithProgress.tsx`) - uses `hover:bg-accent`
- **Chapter drawer items** (`ChapterDrawer.tsx`) - uses `hover:bg-accent`

This orange color clashes with the navy-blue primary color scheme of the app.

---

## Solution

Update the affected components to use navy-aligned hover colors instead of `hover:bg-accent`. This keeps the orange `accent` color available for intentional accent use cases while fixing the hover state mismatch.

---

## Implementation

### 1. Update Subject Chip Hover (SubjectChipWithProgress.tsx)

Change from:
```typescript
'border border-border bg-card hover:bg-accent'
```

To:
```typescript
'border border-border bg-card hover:bg-primary/5 hover:border-primary/30'
```

This creates a subtle blue-tinted hover that matches the primary color scheme.

---

### 2. Update Chapter Drawer Hover (ChapterDrawer.tsx)

Change from:
```typescript
'bg-card border border-border hover:bg-accent hover:border-primary/20'
```

To:
```typescript
'bg-card border border-border hover:bg-primary/5 hover:border-primary/30'
```

---

## Visual Comparison

| Element | Before (Orange) | After (Navy-aligned) |
|---------|-----------------|----------------------|
| Subject Chip Hover | Orange background flash | Subtle blue tint with blue border |
| Chapter Item Hover | Orange background flash | Subtle blue tint with blue border |

---

## Why This Approach

- **Consistent with existing patterns**: `TopicCard`, `AddSubjectSheet`, and `DailyDownloadCard` already use `primary`-based hover effects
- **Preserves accent color**: The orange `accent` remains available for intentional use (e.g., CTAs that need to stand out)
- **Minimal changes**: Only 2 files need updating
- **Better UX**: The hover state now provides visual feedback aligned with the selection state (both use primary/navy blue)

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/SubjectChipWithProgress.tsx` | Update hover class on line 67 |
| `src/components/ChapterDrawer.tsx` | Update hover class on line 88 |
