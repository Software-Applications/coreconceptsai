

## Fix Remaining Spacing Difference Between Sections

### Root Cause

The remaining visual difference comes from the **Trending Concepts content wrapper** (line 248) which uses `py-2`, adding 8px of top padding before the content. This compounds with the container's `pt-1.5` to create more space above the Trending content than exists above the Saved Cards content.

| Section | Container | Header | Content Wrapper | Total Before Content |
|---------|-----------|--------|-----------------|---------------------|
| My Saved Cards | `pt-1.5` (6px) | `py-1.5` | `pt-2` (8px) | 6 + 6 + 8 = 20px |
| Trending Concepts | `pt-1.5` (6px) | `py-1.5` | `py-2` (8px top) | 6 + 6 + 8 = 20px |

Wait - the math is similar. Let me re-examine. The actual difference is:

The **Saved Cards scroll area** (line 189) has `pb-2` which adds bottom space, but we removed the container bottom padding. However, the **Trending content wrapper** (line 248) uses `py-2` which has both top AND bottom, while Saved Cards uses `pt-2` (top only).

This means Trending has an extra 8px of TOP padding inside the collapsible content that Saved Cards doesn't have.

### Solution

Change the Trending Concepts content wrapper from `py-2` to `pt-2` to match the Saved Cards section:

**Line 248:**
```tsx
// Before
<div className="py-2">

// After
<div className="pt-2">
```

### Files to Modify

| File | Line | Change |
|------|------|--------|
| `src/components/CoreConceptsHub.tsx` | 248 | `py-2` → `pt-2` |

