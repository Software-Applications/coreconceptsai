
## Goal
Make horizontal scrolling for **Pinned Cards** feel smooth and reliable on **desktop mouse click-and-drag**, without breaking:
- normal click-to-open on a pinned card
- native momentum scrolling on touch devices

## What’s happening now (root cause)
In `useDragScrollHorizontal` (`src/hooks/useDragScroll.ts`) the logic is currently based on **mouse events** (`mousedown/mousemove/...`) and it calls `preventDefault()` on `mousedown`.

Because your cards are `motion.button`s (Framer Motion) and you also added `onPointerDown/onPointerMove` inside `PinnedCardPreview`, browsers often prefer **Pointer Events**; depending on the browser + Framer Motion internals, that can suppress/alter the legacy mouse events chain. Result: the container doesn’t reliably receive the `mousemove` updates needed to scroll, so mouse drag can feel broken.

Also, `snap-x snap-mandatory` can fight with JS-driven scroll updates, causing “sticky/janky” movement unless snap is temporarily disabled during drag.

## Implementation approach (targeted to Pinned Cards first)
### 1) Fix the horizontal drag hook to use Pointer Events (mouse only)
Update `useDragScrollHorizontal` to:
- listen to `pointerdown / pointermove / pointerup / pointercancel`
- **only activate for `pointerType === "mouse"`**
- use `element.setPointerCapture(e.pointerId)` so dragging continues even if the cursor leaves the row
- compute velocity during drag and apply momentum after release (keep what you already built, just move it to pointer events)

Key detail: do **not** call `preventDefault()` immediately on pointerdown. Only do it once the user actually drags past a small threshold.

### 2) Add a small drag threshold so clicks still work
Inside the hook:
- on pointerdown: store start X/time, `isDown=true`, `hasDragged=false`
- on pointermove: if `abs(dx) > 4–6px`, set `hasDragged=true` and begin scrolling
- only when `hasDragged === true`:
  - call `e.preventDefault()` to avoid text selection / drag ghosting
  - update `scrollLeft`

This reduces “click feels blocked” and also prevents accidental tiny movements from engaging drag.

### 3) Temporarily disable CSS scroll snapping while dragging + during momentum
For the pinned cards row you have `snap-x snap-mandatory`.

During active drag (and while momentum is running), temporarily set:
- `element.style.scrollSnapType = "none"`

When momentum ends (or on release if no momentum), restore it back to its original value (or empty string). This prevents the browser snapping engine from fighting your JS scroll updates.

### 4) Scope change to pinned cards first (lowest risk)
Right now `useDragScrollHorizontal` is used by:
- pinnedCardsScrollRef
- videosScrollRef
- practiceScrollRef

To minimize regression risk, we’ll do one of these (I’ll choose the safest after a quick code check when implementing):
- **Option A (recommended):** create a dedicated hook `useDragScrollHorizontalMouse()` and apply it only to pinned cards for now
- **Option B:** update existing `useDragScrollHorizontal` but keep behavior mouse-only and tested; this will fix all three rows at once

Given you specifically asked “for pinned cards”, Option A is safer; we can roll the same fix to Videos/Practice after you confirm it feels right.

### 5) Keep `PinnedCardPreview` click/drag guard (with a small tweak if needed)
Your current `PinnedCardPreview` guard is fine, but if it still blocks scrolling we’ll:
- ensure it does **not** call `stopPropagation()` on pointer events
- optionally increase threshold slightly (5px → 8px) if users commonly “micro-drag” while clicking

(We won’t change this unless needed; most of the fix should be in the scroll hook.)

## Files that will be changed
- `src/hooks/useDragScroll.ts`
  - implement pointer-event-based mouse dragging + pointer capture
  - add drag threshold
  - disable/restore snap during drag/momentum
  - (optionally) export a pinned-only hook variant
- `src/pages/Index.tsx`
  - only if needed: switch pinned cards row to the new pinned-only hook
- `src/components/PinnedCardPreview.tsx`
  - only if needed: adjust threshold or remove any propagation blockers (currently none)

## Testing checklist (what you’ll verify in preview)
1. Desktop: click-and-drag on **Pinned Cards** row scrolls smoothly.
2. Desktop: quick flick drag releases with momentum (not abrupt stop).
3. Desktop: clicking a pinned card still opens the expanded view (no “dead clicks”).
4. Desktop: dragging no longer accidentally opens a card.
5. Touch devices: pinned cards still use native swipe momentum (no custom drag takeover).

## Success criteria
Pinned cards horizontal scrolling feels smooth and reliable on desktop mouse drag, while tap/click behavior remains consistent.

