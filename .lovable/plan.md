

# Fix: Move Close Icon to Top Right on Audio Screen

## Problem

The audio screen (`DailyDownloadPlayer`) has its close button (X) positioned on the **top left**, while the topic selection sheet has it on the **top right**. This creates an inconsistent user experience.

## Current Layout Comparison

| Screen | Close Position | Expected |
|--------|---------------|----------|
| TopicSelectionSheet | Top Right | Correct |
| DailyDownloadPlayer | Top Left | Needs Fix |
| VideoPlayerSheet | Top Left | Same pattern as audio |

## Solution

Modify the header in `DailyDownloadPlayer.tsx` to move the close button from left to right, matching the topic selection sheet pattern.

### Changes to `DailyDownloadPlayer.tsx`

**Current header structure (lines 485-499):**
```jsx
<header className="flex items-center justify-between p-4 pt-8">
  <button onClick={...}>           {/* Close on LEFT */}
    <X />
  </button>
  <div className="text-center">    {/* Title in CENTER */}
    ...
  </div>
  <div className="w-10" />          {/* Empty spacer on RIGHT */}
</header>
```

**New header structure:**
```jsx
<header className="flex items-center justify-between p-4 pt-8">
  <div className="w-10" />          {/* Empty spacer on LEFT */}
  <div className="text-center">    {/* Title in CENTER */}
    ...
  </div>
  <button onClick={...}>           {/* Close on RIGHT */}
    <X />
  </button>
</header>
```

## File to Modify

| File | Change |
|------|--------|
| `src/components/DailyDownloadPlayer.tsx` | Swap close button and spacer div positions in header |

