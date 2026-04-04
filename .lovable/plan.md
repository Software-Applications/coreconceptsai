

# Fix TopicSelectionSheet Drawer Overlapping Header

## Problem

The drawer uses `h-[85vh]` (line 297), which calculates 85% of the **browser viewport** height — not the mobile frame container. On desktop, the mobile frame is capped at ~932px, but 85vh of a 1247px viewport is ~1060px, causing the drawer to extend well past the top of the mobile frame, overlapping the Dynamic Island/header and making filter chips inaccessible.

## Solution

Change the drawer height from `h-[85vh]` to `h-[85%]`. Since the drawer is absolutely positioned within the mobile frame content container (which has `position: relative`), using percentage-based height will correctly reference the frame's height rather than the browser viewport.

## Change

**File**: `src/components/TopicSelectionSheet.tsx`, line 297

From:
```tsx
className="absolute bottom-0 left-0 right-0 z-50 bg-background rounded-t-3xl h-[85vh] overflow-hidden flex flex-col"
```

To:
```tsx
className="absolute bottom-0 left-0 right-0 z-50 bg-background rounded-t-3xl h-[85%] overflow-hidden flex flex-col"
```

Single-line change. The drawer will now occupy 85% of the mobile frame height, keeping the header and Dynamic Island visible and filter chips accessible.

