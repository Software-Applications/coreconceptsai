
# Fix Audio Player Transcript Display

## Issues Identified

1. **Missing "Transcript" Header** - The transcript section has no label/header before the scrollable text area
2. **Transcript Formatting** - The paragraphs may not be displaying with proper visual separation

## Current Code (lines 687-696)

```jsx
{/* Transcript */}
<div 
  ref={transcriptRef}
  className="flex-1 overflow-y-auto pb-8 cursor-grab select-none"
  ...
>
  <div className="space-y-4">
    {paragraphs.map((paragraph, index) => { ... })}
  </div>
</div>
```

## Solution

### 1. Add "Transcript" Section Header

Add a styled section header above the transcript area, matching the design language used elsewhere in the app:

```jsx
{/* Transcript Section */}
<div className="flex items-center gap-2 mb-3 mt-2">
  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
    Transcript
  </h3>
  <div className="flex-1 h-px bg-border" />
</div>
```

### 2. Improve Paragraph Formatting

Increase the spacing between paragraphs for better visual separation and readability:

- Change `space-y-4` to `space-y-6` for more breathing room between paragraphs
- The existing paragraph styling with `text-sm leading-relaxed` is good

## File to Modify

| File | Changes |
|------|---------|
| `src/components/DailyDownloadPlayer.tsx` | Add "Transcript" header (line ~687), increase paragraph spacing (line 696) |

## Visual Result

Before:
```
[Controls]
Lorem ipsum dolor sit amet...
Consectetur adipiscing elit...
```

After:
```
[Controls]
─────── TRANSCRIPT ───────
Lorem ipsum dolor sit amet...

Consectetur adipiscing elit...
```
