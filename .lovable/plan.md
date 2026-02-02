

# Fix Timer and Transcript Highlighting for Streaming Playback

## Problem Summary

When audio plays using the streaming playback mode, two UI elements are broken:

1. **Timer stuck at 0:00** - The elapsed time display never updates
2. **Word highlighting not moving** - Within the active paragraph, individual words don't highlight as they're spoken

Both issues share the same root cause: the streaming audio system doesn't track character-level progress.

## Root Cause

The component has two playback modes:
- **TTS mode**: Uses `useGoogleTTS` hook which provides `currentCharIndex` 
- **Streaming mode**: Uses a queue of pre-generated audio chunks

During streaming playback:
- The timer calculates elapsed time from `currentCharIndex` → always 0
- Word highlighting within segments uses `currentCharIndex` → always 0

## Solution Overview

Add character-level progress tracking to streaming playback by:
1. Creating a `streamingCharIndex` state that calculates position based on:
   - Which chunk is playing (0, 1, 2...)
   - Progress within that chunk (from `audio.currentTime / audio.duration`)
2. Using `streamingCharIndex` for timer and word highlighting when in streaming mode

## Technical Changes

### 1. Add Streaming Character Index State

Add new state and update it in the progress tracking interval:

```typescript
const [streamingCharIndex, setStreamingCharIndex] = useState(0);

const updateStreamingProgress = useCallback(() => {
  const audio = streamingAudioRef.current;
  const totalChunks = totalChunksRef.current || 1;
  const currentChunk = currentStreamingChunkRef.current;
  
  if (audio && audio.duration && !isNaN(audio.duration)) {
    const chunkProgress = (audio.currentTime / audio.duration);
    const totalProgress = ((currentChunk + chunkProgress) / totalChunks) * 100;
    setPlaybackProgress(Math.min(99, totalProgress));
    
    // Calculate character index for streaming mode
    const totalChars = fullTranscriptTextRef.current.length;
    const charIndex = Math.floor((totalProgress / 100) * totalChars);
    setStreamingCharIndex(charIndex);
  }
}, []);
```

### 2. Add Ref for Full Transcript Text

Since `updateStreamingProgress` is a callback, it needs a ref to access the current transcript text:

```typescript
const fullTranscriptTextRef = useRef<string>('');

// Keep ref in sync
useEffect(() => {
  fullTranscriptTextRef.current = fullTranscriptText;
}, [fullTranscriptText]);
```

### 3. Create Combined Character Index

Add a derived value that uses the appropriate source based on playback mode:

```typescript
const combinedCharIndex = isStreamingPlayback ? streamingCharIndex : currentCharIndex;
```

### 4. Update Timer Calculation

Modify `currentSeconds` to use the combined index:

```typescript
const currentSeconds = useMemo(() => {
  if (fullTranscriptText.length === 0) return 0;
  const charIndex = isStreamingPlayback ? streamingCharIndex : currentCharIndex;
  return (charIndex / fullTranscriptText.length) * estimatedDuration;
}, [streamingCharIndex, currentCharIndex, fullTranscriptText.length, estimatedDuration, isStreamingPlayback]);
```

### 5. Update Active Word Calculation

Modify `activeWordIndex` to use the combined index:

```typescript
const activeWordIndex = useMemo(() => {
  if (activeSegmentIndex < 0) return -1;
  const segment = transcript[activeSegmentIndex];
  if (!segment) return -1;
  
  const effectiveCharIndex = isStreamingPlayback ? streamingCharIndex : currentCharIndex;
  
  // Calculate character offset within this segment
  let prevCharsCount = 0;
  for (let i = 0; i < activeSegmentIndex; i++) {
    prevCharsCount += transcript[i].text.length + 1;
  }
  const charInSegment = effectiveCharIndex - prevCharsCount;
  
  // Find which word we're on
  let charCount = 0;
  for (let i = 0; i < segment.words.length; i++) {
    const wordLength = segment.words[i].word.length + 1;
    if (charInSegment < charCount + wordLength) {
      return i;
    }
    charCount += wordLength;
  }
  return segment.words.length - 1;
}, [activeSegmentIndex, currentCharIndex, streamingCharIndex, transcript, isStreamingPlayback]);
```

### 6. Reset Streaming State on Stop/End

Ensure `streamingCharIndex` resets when playback ends or is stopped:

```typescript
// In handleSpeechEnd callback
setStreamingCharIndex(0);

// When closing player or switching topics
setStreamingCharIndex(0);
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/DailyDownloadPlayer.tsx` | Add `streamingCharIndex` state, `fullTranscriptTextRef`, update `updateStreamingProgress`, `currentSeconds`, and `activeWordIndex` |

## Expected Behavior After Fix

1. **Timer**: Updates smoothly from 0:00 as audio plays, showing correct elapsed time
2. **Word highlighting**: Individual words in the active paragraph highlight in sequence as they're spoken
3. **Both modes work**: Fix applies to streaming playback while TTS mode continues working as before

## Testing Plan

1. Open a topic and let content generate
2. Click play - verify timer starts counting up
3. Verify words in the active paragraph highlight progressively
4. Skip forward/backward - verify timer and highlighting update correctly
5. Pause and resume - verify timer and highlighting stop/resume
6. Complete playback - verify timer shows full duration at end

