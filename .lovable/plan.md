

# DailyDownloadPlayer.tsx Cleanup & Optimization

## Current Issues Identified

| Issue | Description | Impact |
|-------|-------------|--------|
| **Redundant state** | `showGeneratingOverlay` computed inline but uses already-tracked states | Minimal clutter |
| **Duplicate calculations** | Character offset calculated twice (in `activeSegmentIndex` and `activeWordIndex`) | Repeated loops |
| **Unnecessary wrapper div** | Each paragraph wrapped in `<div key={index}><p>...</p></div>` when `<p key={index}>` suffices | Extra DOM nodes |
| **Magic numbers** | `HIGHLIGHT_LEAD_MS = 180`, paragraph split threshold `500`, chunk size `400` undocumented | Harder to tune |
| **Inefficient paragraph offset** | Loops through all paragraphs every time to find character offset | O(n) per render |
| **Waveform regenerated** | `waveformBars` uses `useMemo(() => ..., [])` but randomizes on mount | Regenerates on remount |

## Optimization Plan

### 1. Precompute Paragraph Character Offsets

Instead of looping through paragraphs on every render to find character positions, compute an offset array once when `paragraphs` changes:

```typescript
const paragraphOffsets = useMemo(() => {
  let offset = 0;
  return paragraphs.map((p) => {
    const start = offset;
    offset += p.length + 2; // +2 for paragraph break
    return { start, end: offset };
  });
}, [paragraphs]);
```

Then use binary search or simple lookup:

```typescript
const activeSegmentIndex = useMemo(() => {
  if (!hasStarted || !fullTranscriptText) return -1;
  return paragraphOffsets.findIndex(
    ({ start, end }) => currentCharIndex >= start && currentCharIndex < end
  ) ?? paragraphs.length - 1;
}, [paragraphOffsets, currentCharIndex, hasStarted, fullTranscriptText]);
```

### 2. Consolidate Character Position Logic

Create a single derived value for both segment index and word index:

```typescript
const { activeSegmentIndex, activeWordIndex, charInParagraph } = useMemo(() => {
  if (!hasStarted || !fullTranscriptText || paragraphOffsets.length === 0) {
    return { activeSegmentIndex: -1, activeWordIndex: -1, charInParagraph: 0 };
  }
  
  const segIdx = paragraphOffsets.findIndex(
    ({ start, end }) => currentCharIndex >= start && currentCharIndex < end
  );
  const idx = segIdx === -1 ? paragraphs.length - 1 : segIdx;
  const charPos = currentCharIndex - paragraphOffsets[idx].start;
  
  // Find word index
  const words = paragraphs[idx]?.split(/\s+/) || [];
  let count = 0;
  let wordIdx = words.length - 1;
  for (let i = 0; i < words.length; i++) {
    count += words[i].length + 1;
    if (charPos < count) {
      wordIdx = i;
      break;
    }
  }
  
  return { activeSegmentIndex: idx, activeWordIndex: wordIdx, charInParagraph: charPos };
}, [paragraphOffsets, paragraphs, currentCharIndex, hasStarted, fullTranscriptText]);
```

### 3. Remove Unnecessary Wrapper Divs

Change paragraph rendering from:

```tsx
<div key={index}>
  <p ref={...} className={...}>
    ...
  </p>
</div>
```

To:

```tsx
<p key={index} ref={...} className={...}>
  ...
</p>
```

### 4. Extract Constants to Top of File

```typescript
// Configuration constants
const HIGHLIGHT_LEAD_MS = 180;
const PARAGRAPH_MIN_LENGTH = 500;
const SENTENCE_CHUNK_SIZE = 400;
const PLAYBACK_RATES = [0.75, 1.0, 1.25, 1.5, 1.75, 2.0] as const;
const WAVEFORM_BAR_COUNT = 40;
const PROGRESS_SAVE_INTERVAL_MS = 5000;
```

### 5. Stabilize Waveform Bars

Move waveform generation outside component or use a seeded random:

```typescript
// Outside component
const WAVEFORM_BARS = Array.from({ length: 40 }, (_, i) => ({
  height: 20 + (Math.sin(i * 0.7) + 1) * 30 + (Math.cos(i * 1.3) + 1) * 15,
  delay: i * 0.02
}));
```

### 6. Simplify `stripTags` with Single Regex Chain

```typescript
const stripTags = useCallback((text: string): string => {
  return text
    .replace(/<\/?transcript>/gi, '')
    .replace(/\[(?:PAUSE|PROMPT|NOTE|DIRECTION)[^\]]*\]/gi, '')
    .replace(/\n\n+/g, '\u0000')     // Use null char as temp marker
    .replace(/\n/g, ' ')
    .replace(/\u0000/g, '\n\n')
    .replace(/ {2,}/g, ' ')
    .trim();
}, []);
```

### 7. Remove Unused Imports

`Loader2` is imported but not used in the rendered output.

## File Changes Summary

| File | Changes |
|------|---------|
| `src/components/DailyDownloadPlayer.tsx` | Precompute paragraph offsets, consolidate active segment/word logic, remove wrapper divs, extract constants, stabilize waveform, simplify stripTags, remove unused imports |

## Expected Improvements

1. **Performance**: O(1) paragraph lookup instead of O(n) loop per frame
2. **Readability**: Constants documented at top, single source of truth for position logic
3. **Bundle size**: Fewer DOM nodes, removed unused import
4. **Maintainability**: Easier to tune timing values from constants

