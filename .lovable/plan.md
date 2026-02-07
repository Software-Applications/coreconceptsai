

# Equalize Spacing Between Saved Cards and Trending Sections

## Current Spacing Analysis

| Section | Container Padding | Visual Effect |
|---------|-------------------|---------------|
| Saved Cards | `pt-3 pb-1.5` (12px top, 6px bottom) | More space above |
| Trending Topics | `py-1.5` (6px top, 6px bottom) | Less space above |

This creates an asymmetric look where Saved Cards has 12px gap from the Core Concepts card, but Trending Topics only has 6px gap from Saved Cards.

---

## Solution

Make both sections use the same padding pattern for visual consistency:

**Option A (Recommended)**: Use `pt-3 pb-1.5` for both sections
- Gives each section 12px of breathing room from the element above
- Matches the existing memory standard: "Saved Cards section uses pt-3 (12px) top padding for separation"

---

## Implementation

### File: `src/components/CoreConceptsHub.tsx`

**Change line 221** from:
```tsx
<div className="px-3 py-1.5">
```

**To:**
```tsx
<div className="px-3 pt-3 pb-1.5">
```

This single change makes the Trending Topics section match the Saved Cards section spacing.

---

## Visual Result

- Both sections will have 12px top padding (separation from element above)
- Both sections will have 6px bottom padding (tight internal spacing)
- Consistent visual rhythm throughout the CoreConceptsHub

