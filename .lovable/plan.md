
## Summary of what’s causing the clipping (why the last fix didn’t work)
Right now the “extra hover room” was added on wrapper divs using a pattern like `-my-2 py-2`. That *looks* like it should add space, but because the negative margin and padding are equal, the card row ends up in almost the exact same vertical position as before.

So when a card lifts on hover (`y: -2` + `scale: 1.02`), there still isn’t real clearance where it matters: inside (or above) the element that visually bounds the row.

In the pinned-cards section there’s an additional culprit:
- `CollapsibleContent` currently has `overflow-hidden`, which can clip anything that tries to render outside its top edge during hover.

## Goal
Ensure Pinned Cards, Videos, and Practice Sets have true “hover padding” so hover lift/scale never gets visually clipped.

## Implementation approach
### A) Move hover clearance to the actual horizontal scroller (the element that contains the cards)
Instead of relying on `-my-* py-*` wrappers, add real top padding to the scrolling row itself (the `div` with `overflow-x-auto`).

This gives the cards physical room to lift upward while still staying inside the row’s visible area.

Concretely in `src/pages/Index.tsx`:
- For each horizontal scroller (`pinnedCardsScrollRef`, `videosScrollRef`, `practiceScrollRef`):
  - Add `pt-2` (or `py-2` if needed) to the scroller `className`.

Example target pattern:
- Before (scroller):
  - `className="flex ... overflow-x-auto pb-4 ..."`
- After (scroller):
  - `className="flex ... overflow-x-auto pt-2 pb-4 ..."`

Why this helps:
- Cards start slightly lower in the row
- When they hover-lift by ~2–4px effective, they stay within the row instead of crossing its top boundary

### B) Remove (or reduce) the vertical negative margin wrappers that cancel the padding
Update the wrapper divs around those scrollers to stop “netting out” the hover room.

In `src/pages/Index.tsx`, for the three wrapper divs currently like:
- `className="-mx-4 px-4 -my-2 py-2"`

Change to something that keeps the horizontal full-bleed but doesn’t cancel vertical padding, e.g.:
- `className="-mx-4 px-4 py-2"`
or (if you want less added vertical spacing):
- `className="-mx-4 px-4 pt-2"`

We’ll use the same wrapper pattern for:
- Pinned cards wrapper
- Videos wrapper
- Practice wrapper

### C) Pinned Cards only: prevent `CollapsibleContent` from clipping hover when open
Pinned cards are inside:
- `<CollapsibleContent ... overflow-hidden>`

To avoid clipping once the section is open, update it to:
- keep `overflow-hidden` while animating/closed
- switch to visible overflow when open

For example:
- `className="... overflow-hidden data-[state=open]:overflow-visible"`

This is a safe Radix pattern because `CollapsibleContent` exposes `data-state="open|closed"`.

## Files to change
- `src/pages/Index.tsx`
  1) Add top padding to the three horizontal scroller divs (`pt-2`)
  2) Adjust the three wrapper divs to remove `-my-*` (or reduce it)
  3) Update pinned cards `CollapsibleContent` to `data-[state=open]:overflow-visible` (so hover isn’t clipped when open)

## Testing checklist (you can verify in Preview)
1. Hover on a pinned card: top edge should no longer be cut off.
2. Hover on a video card: no clipping at the top; card should lift cleanly.
3. Hover on a practice card: same.
4. Expand/collapse “My Pinned Cards”: animation should still work, and hover while open should not clip.
5. Confirm the row spacing still looks good (we may slightly tweak `pt-2` vs `py-2` if you want less added height).

## Notes / fallback options (if any clipping still remains)
If a particular row still clips in some browsers, we can additionally:
- add `overflow-y-visible` to the horizontal scroller divs (keeping `overflow-x-auto`)
- slightly increase row top padding from `pt-2` to `pt-3`
