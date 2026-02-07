
## Remove Bottom Padding from Saved Cards Content

### The Issue

The gap between "My Saved Cards" and "Trending Concepts" comes from the inner content wrappers that still have bottom padding:

| State | Line | Current | Bottom Padding |
|-------|------|---------|----------------|
| Cards exist | 185 | `py-2` | 8px |
| Empty state | 202 | `py-3` | 12px |

### Solution

Change these to use **top-only padding** so there's no extra space before the next section:

**Line 185** (cards exist):
```tsx
// Before
<div className="py-2">

// After
<div className="pt-2">
```

**Line 202** (empty state):
```tsx
// Before
<div className="py-3">

// After
<div className="pt-3">
```

### Files to Modify

| File | Lines | Change |
|------|-------|--------|
| `src/components/CoreConceptsHub.tsx` | 185 | `py-2` → `pt-2` |
| `src/components/CoreConceptsHub.tsx` | 202 | `py-3` → `pt-3` |
