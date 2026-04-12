

# Fix Progress Bar Width & Resume Icon

## Issues
1. **Progress bar spans full card width** — it's absolutely positioned with `left-0 right-0`, ignoring the icon and chevron gutters. It should align with the text content area only.
2. **Resume icon (`RotateCcw`)** — a "rotate/undo" arrow isn't the best metaphor for resuming playback. A `Play` or `PlayCircle` icon better communicates "continue listening."

## Changes

### `src/components/topic-selection/TopicCard.tsx`
1. Move the progress bar from absolute positioning to inside the text content `div` (the `flex-1 min-w-0` container), so it naturally matches the width of the title/description area. Place it as the last child with a small top margin.
2. Replace `RotateCcw` icon with `PlayCircle` from lucide-react for the resume state — this clearly signals "continue playing."

### Inline topic cards in `src/components/TopicSelectionSheet.tsx`
Apply the same two fixes to any inline card renderings that have the progress bar.

