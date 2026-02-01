
# Fix Double Padding Above Practice Sets Title

## Problem
The space above "Practice Sets" title is larger than above "Videos" title due to cumulative bottom padding from the Videos section:
- Videos scroll area: `pb-4` (16px)
- Videos container: `py-2` bottom (8px)  
- Videos wrapper: `mb-3` (12px)
- **Total: 36px gap**

The Videos section only has `py-2` (8px) from its container above it.

## Solution
Remove redundant bottom padding to create consistent spacing:

### `src/pages/Index.tsx`

**1. Videos Section (line 292-293)**
Change from:
```tsx
<div className="-mx-4 px-4 py-2">
  <div ... className="... pt-2 pb-4 ...">
```
To:
```tsx
<div className="-mx-4 px-4 pt-2">
  <div ... className="... pt-2 pb-2 ...">
```

**2. Practice Section (line 313-314)**
Apply the same change:
```tsx
<div className="-mx-4 px-4 pt-2">
  <div ... className="... pt-2 pb-2 ...">
```

This creates consistent 12px (`mb-3`) spacing between sections, with 8px internal padding for the scroll areas.

## Technical Details
| Element | Before | After |
|---------|--------|-------|
| Container wrapper | `py-2` (top+bottom) | `pt-2` (top only) |
| Scroll area bottom | `pb-4` (16px) | `pb-2` (8px) |
| Section wrapper | `mb-3` (12px) | `mb-3` (unchanged) |
| **Total gap** | ~36px | ~20px |

Both sections will now have identical spacing above their titles.
