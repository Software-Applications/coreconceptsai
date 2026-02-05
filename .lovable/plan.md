
# Fix Slow Transcript Highlighting

## Problem Analysis

The transcript highlighting appears slow/lagging behind the audio because the current implementation uses a **linear time-to-character mapping** that doesn't account for:

1. **Non-uniform speech rate** - Words aren't spoken at a constant character-per-second rate
2. **Pause markers in audio** - The audio contains pauses (`[PAUSE: 3s]`, `[PAUSE: 5s]`) that consume time but correspond to no characters in the stripped transcript
3. **Word boundary effects** - Longer words take more time relative to their character count

### Current Flow

```text
Audio Time (ms) → Linear Interpolation → Character Index → Word Index
     │                    │                    │             │
     └── Accurate ───────└── Inaccurate ──────└── Cascading error
```

The linear interpolation assumes:
```
charIndex = (currentTime / totalDuration) * totalCharacters
```

This fails because 50% through the audio does NOT mean 50% through the transcript text.

---

## Solution: Use Word-Level Timing Estimation

Instead of linear character interpolation, we'll use **word-level time estimation** that:
1. Accounts for pause markers in the original transcript
2. Uses average word duration for more accurate positioning
3. Pre-computes word timing offsets for O(1) lookup

### New Approach

```text
┌─────────────────────────────────────────────────────────────┐
│  1. Parse transcript with pause markers                      │
│  2. Compute cumulative time offset per word                  │
│     - Each word: avgWordDuration (based on character count)  │
│     - Each [PAUSE: Xs]: add X seconds to offset              │
│  3. At runtime: binary search for current word by time       │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Details

### Step 1: Parse Pause Markers Before Stripping

Currently, pause markers are stripped early:
```typescript
const stripTags = useCallback((text: string): string => {
  return text
    .replace(/<\/?transcript>/gi, '')
    .replace(/\[(?:PAUSE|PROMPT|NOTE|DIRECTION)[^\]]*\]/gi, '')
    // ...
```

**Change**: Extract pause durations BEFORE stripping to build a timing map.

### Step 2: Pre-compute Word Timing Array

Create a new `useMemo` that builds word timing information:

```typescript
interface WordTiming {
  word: string;
  paragraphIndex: number;
  wordIndexInParagraph: number;
  startTimeMs: number;
  endTimeMs: number;
}
```

**Algorithm**:
1. Parse raw transcript, finding all words and `[PAUSE: X Seconds]` markers
2. For each word, estimate duration: `wordDuration = (word.length / avgCharsPerSecond) * 1000`
3. For each pause marker, add pause duration to cumulative time
4. Store `startTimeMs` for each word

**Constants** (tunable):
- Average speaking rate: ~12-15 characters per second at 1x speed
- Pause marker regex: `/\[PAUSE:\s*(\d+)\s*(?:Seconds?|s)\]/gi`

### Step 3: Binary Search for Active Word

Replace the current linear calculation with a binary search:

```typescript
const findActiveWord = (currentTimeMs: number, wordTimings: WordTiming[]) => {
  // Binary search for the word whose startTimeMs <= currentTimeMs < endTimeMs
  let low = 0;
  let high = wordTimings.length - 1;
  
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (wordTimings[mid].endTimeMs <= currentTimeMs) {
      low = mid + 1;
    } else if (wordTimings[mid].startTimeMs > currentTimeMs) {
      high = mid - 1;
    } else {
      return wordTimings[mid];
    }
  }
  return wordTimings[low] || wordTimings[wordTimings.length - 1];
};
```

### Step 4: Update Rendering Logic

The `activeSegmentIndex` and `activeWordIndex` will come directly from the binary search result:

```typescript
const activeWord = useMemo(() => {
  if (!hasStarted || wordTimings.length === 0) return null;
  return findActiveWord(currentTimeMs * playbackRate, wordTimings);
}, [currentTimeMs, playbackRate, wordTimings, hasStarted]);

const activeSegmentIndex = activeWord?.paragraphIndex ?? -1;
const activeWordIndex = activeWord?.wordIndexInParagraph ?? -1;
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/DailyDownloadPlayer.tsx` | Add pause parsing, word timing computation, and binary search lookup |

---

## New Constants

```typescript
// Average characters per second at 1x playback speed
const AVG_CHARS_PER_SECOND = 14;

// Pause marker regex
const PAUSE_MARKER_REGEX = /\[PAUSE:\s*(\d+)\s*(?:Seconds?|s)\]/gi;
```

---

## Performance Considerations

- **Pre-computation**: Word timings are computed once via `useMemo` when transcript changes
- **O(log n) lookup**: Binary search is fast even for long transcripts (1000+ words)
- **No re-renders**: The existing 60fps `requestAnimationFrame` continues to update `currentTimeMs`, but the lookup is now accurate

---

## Edge Cases Handled

1. **No pause markers**: Falls back to pure word-duration estimation
2. **Playback rate changes**: Multiply timing by playback rate
3. **Seek operations**: Binary search finds correct position instantly
4. **Empty transcript**: Returns -1 for active indices (no highlighting)

---

## Visual Result

Before: Highlighting lags ~2-5 seconds behind spoken word

After: Highlighting advances word-by-word in sync with audio, accounting for pauses
