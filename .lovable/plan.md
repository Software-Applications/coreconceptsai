

# Fix Transcript Formatting & Highlighting Sync

## Root Cause Analysis

### Issue 1: Missing Paragraphs

The transcript returned from the API is wrapped in `<transcript>` tags:
```
<transcript>
Think about the last time...

An action potential is...
</transcript>
```

The `stripTags` function (lines 106-112) only removes `[PAUSE]` and `[DIRECTION]` style bracketed tags - it does NOT strip the XML-style `<transcript>` tags. As a result:

1. The text still contains `<transcript>` at the start and `</transcript>` at the end
2. More critically, line 110 replaces all sequences of 2+ spaces with a single space: `.replace(/\s{2,}/g, ' ')` 
3. **This also replaces `\n\n` (which regex treats as 2 whitespace chars) with a single space**, destroying all paragraph breaks

### Issue 2: Slow Transcript Highlighting

The current sync relies on **linear interpolation** (line 154):
```js
const progress = currentTimeMs / durationMs;
return Math.floor(progress * fullTranscriptText.length);
```

This assumes every character takes the same time to speak, but:
- Speech naturally varies in pace (pauses between sentences, emphasis, etc.)
- The actual TTS audio may not perfectly match this linear model
- The audio `durationMs` may not exactly correspond to the visual text length

The `requestAnimationFrame` loop IS running at 60fps, but the calculated position is inherently lagging because linear interpolation underestimates the current position when speech is naturally front-loaded or has variations.

## Solution

### Fix 1: Update `stripTags` to Remove XML Tags and Preserve Newlines

1. Strip `<transcript>` and `</transcript>` XML tags
2. Preserve paragraph breaks by NOT collapsing `\n\n` into a single space
3. Only collapse multiple spaces on the same line

### Fix 2: Improve Sync Accuracy with Slight Lead

Apply a small time offset (e.g., 150-200ms ahead) to the `currentTimeMs` used for character calculation. This compensates for:
- Natural human perception delay
- Slight audio buffering latency
- The fact that we want highlighting to feel "in sync" which often means slightly anticipating

This is a common technique in karaoke/lyrics sync apps.

## Implementation

| File | Changes |
|------|---------|
| `src/components/DailyDownloadPlayer.tsx` | Update `stripTags` to remove `<transcript>` tags and preserve `\n\n`; add time offset to character calculation |

### Code Changes

**Fix stripTags (around line 106):**

```typescript
const stripTags = useCallback((text: string): string => {
  return text
    // Remove XML-style transcript wrapper tags
    .replace(/<\/?transcript>/gi, '')
    // Remove pause/direction bracketed tags
    .replace(/\[PAUSE:\s*\d+\s*(?:Seconds?|s)\]/gi, '')
    .replace(/\[(?:PROMPT|PAUSE|NOTE|DIRECTION)[^\]]*\]/gi, '')
    // Collapse multiple spaces (but NOT newlines) into single space
    .replace(/[ \t]+/g, ' ')
    // Normalize multiple newlines to exactly two (paragraph break)
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}, []);
```

**Fix character calculation with time offset (around line 152):**

```typescript
// Apply a slight lead (anticipation) for better perceived sync
const HIGHLIGHT_LEAD_MS = 180;

const currentCharIndex = useMemo(() => {
  if (!durationMs || !fullTranscriptText.length) return 0;
  // Add lead time for better perceived synchronization
  const adjustedTimeMs = Math.min(currentTimeMs + HIGHLIGHT_LEAD_MS, durationMs);
  const progress = adjustedTimeMs / durationMs;
  return Math.floor(progress * fullTranscriptText.length);
}, [currentTimeMs, durationMs, fullTranscriptText.length]);
```

## Expected Results

1. **Paragraphs visible**: The transcript will properly split on `\n\n` and display with `space-y-6` spacing
2. **Faster highlighting**: The 180ms lead will make highlighting feel more "in sync" or even slightly ahead of the audio, which feels more natural to users

## Technical Notes

- The 180ms offset is configurable; common values in karaoke apps range from 100-300ms
- The `\n\n` preservation is critical because the AI prompt explicitly asks for paragraph breaks with double newlines
- This fix works for both cached and freshly generated transcripts

