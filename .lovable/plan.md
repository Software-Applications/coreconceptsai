
# Fix: Subject Chips Drag Scroll & Auto-Scroll on Selection

## Problem

Two issues with the subject chips section:
1. **Drag scrolling doesn't work** - The horizontal chip row doesn't respond to drag gestures
2. **Selected chip stays hidden** - When clicking on "Microbiology", it doesn't scroll into view

## Root Cause

- `SubjectChips.tsx` uses a plain `div` with `overflow-x-auto` but doesn't use the existing `useDragScrollHorizontal` hook
- No `scrollIntoView` logic when a subject is selected

---

## Solution

### 1. Use `useDragScrollHorizontal` Hook

The codebase already has a `useDragScrollHorizontal` hook in `src/hooks/useDragScroll.ts` that handles:
- Pointer events (mouse + touch + pen)
- Pointer capture for touch devices
- Proper cursor states (grab/grabbing)

### 2. Add Scroll-Into-View on Selection

When a chip is clicked, find the corresponding DOM element and scroll it into view smoothly.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/SubjectChips.tsx` | Use `useDragScrollHorizontal` hook and add scroll-into-view logic |

---

## Technical Implementation

```tsx
// Import the hook
import { useDragScrollHorizontal } from '@/hooks/useDragScroll';

// Replace manual scrollRef with hook
const scrollRef = useDragScrollHorizontal<HTMLDivElement>();

// Add chipRefs to track each chip element
const chipRefs = useRef<Map<string, HTMLElement>>(new Map());

// Scroll selected chip into view when selection changes
useEffect(() => {
  const chip = chipRefs.current.get(selectedSubjectId);
  if (chip) {
    chip.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }
}, [selectedSubjectId]);

// Add data attribute for drag-scroll identification
<div 
  ref={scrollRef} 
  data-drag-scroll="x"
  className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide cursor-grab"
>
```

### Register Each Chip

```tsx
<motion.div
  key={subject.id}
  ref={(el) => {
    if (el) chipRefs.current.set(subject.id, el);
    else chipRefs.current.delete(subject.id);
  }}
  // ... rest
>
```

---

## Expected Result

- Horizontal dragging works smoothly on both mouse and touch
- When "Microbiology" is clicked, it automatically scrolls to center in the viewport
- Scroll fade indicators update correctly based on scroll position
