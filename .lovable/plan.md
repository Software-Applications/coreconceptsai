

## Equalize Spacing Above Section Headers

### The Problem

The "Trending Concepts" header has more visual space above it than the "My Saved Cards" header because of different container padding:

| Section | Container Class | Top Padding |
|---------|-----------------|-------------|
| My Saved Cards | `px-3 pt-1.5` | 6px |
| Trending Concepts | `px-3 py-1.5` | 6px + inherited spacing |

The `py-1.5` on Trending Concepts adds both top AND bottom padding, while My Saved Cards uses only `pt-1.5`. This creates an asymmetry.

### Solution

Change the Trending Concepts container from `py-1.5` to `pt-1.5` to match the My Saved Cards section:

**Line 219:**
```tsx
// Before
<div className="px-3 py-1.5">

// After  
<div className="px-3 pt-1.5">
```

### Files to Modify

| File | Line | Change |
|------|------|--------|
| `src/components/CoreConceptsHub.tsx` | 219 | `py-1.5` → `pt-1.5` |

