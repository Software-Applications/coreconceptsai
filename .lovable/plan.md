
# Increase Chip Padding for Better Touch Targets

## Overview
Increase the padding on both recent search chips and suggestion chips in the Core Concepts drawer to improve mobile touch targets and visual balance.

---

## Changes

### File: `src/components/TopicSelectionSheet.tsx`

**1. Update Recent Search Chips (line 295)**
- Current: `pl-2.5 pr-1.5 py-1`
- New: `pl-3 pr-2 py-2`

**2. Update Suggestion Chips (line 326)**  
- Current: `px-3 py-1.5`
- New: `px-4 py-2`

---

## Visual Impact
- Chips will be taller (~36-40px vs ~28-32px currently)
- Easier to tap on mobile devices (closer to 44px touch target guideline)
- More visually balanced and less cramped
- Consistent vertical padding across both chip types

---

## Technical Details

The changes are minimal CSS class updates:

```tsx
// Recent search chips - line 295
className="flex items-center gap-1 pl-3 pr-2 py-2 text-xs font-medium..."

// Suggestion chips - line 326  
className="px-4 py-2 text-xs font-medium..."
```

Both changes maintain all existing functionality while improving the touch experience.
