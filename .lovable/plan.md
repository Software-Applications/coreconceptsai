
## Fix Unequal Spacing Above Section Headers

### Root Cause Identified

When comparing the visual gap **above** each header row (when both sections are collapsed):

| Gap | Components | Total |
|-----|------------|-------|
| Above "My Saved Cards" | Container `pt-1.5` (6px) | **6px** |
| Above "Trending Concepts" | My Saved Cards header `py-1.5` bottom (6px) + Trending container `pt-1.5` (6px) | **12px** |

The "Trending Concepts" header has **double the gap** because the collapsible header button above it uses `py-1.5` (vertical padding), which adds 6px of bottom padding that stacks with Trending's own container top padding.

### Visual Breakdown (Collapsed State)

```text
┌─────────────────────────────────┐
│   Core Concepts AI Card         │
└─────────────────────────────────┘
   ↓ 6px (Saved Cards container pt-1.5)
┌─────────────────────────────────┐
│ My Saved Cards header (py-1.5)  │  ← 6px top, 6px bottom padding
└─────────────────────────────────┘
   ↓ 6px (header bottom) + 6px (Trending container pt-1.5) = 12px
┌─────────────────────────────────┐
│ Trending Concepts header        │
└─────────────────────────────────┘
```

### Solution

Remove the top padding from the Trending Concepts container since the vertical gap is already provided by the header button's bottom padding:

**Line 219:**
```tsx
// Before
<div className="px-3 pt-1.5">

// After
<div className="px-3">
```

This makes both gaps equal at 6px:
- Above My Saved Cards: 6px from container `pt-1.5`
- Above Trending Concepts: 6px from My Saved Cards header `py-1.5` bottom padding

### Files to Modify

| File | Line | Change |
|------|------|--------|
| `src/components/CoreConceptsHub.tsx` | 219 | Remove `pt-1.5` from class |
