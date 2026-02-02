
# Audio Player Simplification and Fixes

## Overview

You want to make three key changes to the audio player:

1. **Resume on voice change**: When changing the audio speaker, resume from the current position instead of restarting from the beginning
2. **Remove chunking**: Eliminate transcript and audio chunking - show the audio player only after the entire transcript and audio is fully generated
3. **Fix transcript highlighting sync**: Ensure word highlighting is properly synchronized with audio playback

## Current Architecture Issues

### 1. Voice Change Problem
The current `handleVoiceChange` function in `DailyDownloadPlayer.tsx` (lines 371-463) regenerates audio with the new voice but doesn't properly track and restore the current playback position. It saves the chunk index but doesn't account for the position *within* the chunk being played.

### 2. Chunking Complexity
The current architecture has:
- **Streaming content hook** (`useStreamingContent.ts`): Generates transcript in chunks and TTS for each chunk separately
- **Edge function** (`generate-content-stream`): Streams transcript chunks via SSE
- **Player component**: Manages a queue of audio blobs for each chunk, auto-plays next chunk when current ends

This creates complexity in:
- Progress tracking across multiple audio elements
- Character index calculation for highlighting
- Buffering states between chunks

### 3. Highlighting Sync Problem
The `streamingCharIndex` calculation in `updateStreamingProgress` (lines 118-141) estimates character position using:
```
charIndex = (totalProgress / 100) * totalChars
```

This is inaccurate because:
- Audio duration per chunk varies based on content (pauses, speaking rate)
- The calculation assumes linear character distribution across audio time
- Word highlighting uses this flawed character index

## Technical Solution

### Strategy: Simplify to Single Audio + Accurate Timing

Instead of chunked streaming, we'll:
1. Wait for **full transcript** to be generated
2. Generate **one complete audio file** for the entire transcript
3. Use **actual audio.currentTime** for progress tracking
4. Calculate character index based on **proportion of audio played**

---

### 1. Update `generate-content-stream` Edge Function

**File**: `supabase/functions/generate-content-stream/index.ts`

Remove chunk streaming - instead, buffer the full transcript and send it all at once:

- Remove the chunk-by-chunk SSE emission during AI generation
- Collect the full transcript first, then send as a single event
- Keep the flash summary generation as-is
- Remove the `splitIntoChunks` function and chunk-related logic

---

### 2. Simplify `useStreamingContent` Hook

**File**: `src/hooks/useStreamingContent.ts`

Simplify to generate a single audio blob for the complete transcript:

- Remove chunk-by-chunk audio generation
- Wait for full transcript from edge function
- Generate one TTS request for the complete transcript
- Return a single audio blob URL instead of an array

New interface:
```typescript
interface UseStreamingContentReturn {
  isGenerating: boolean;          // True while transcript is being generated
  isAudioGenerating: boolean;     // True while TTS is running
  transcriptReady: boolean;       // True when transcript is complete
  audioReady: boolean;            // True when audio is ready to play
  audioBlobUrl: string | null;    // Single audio URL
  fullTranscript: string;
  flashSummary: FlashSummary | null;
  error: string | null;
  audioDurationMs: number;        // Actual audio duration
  startGeneration: (params) => void;
  cancel: () => void;
  regenerateAudioWithVoice: (voiceId, speakingRate, currentTimeMs?) => Promise<void>;
}
```

---

### 3. Update `DailyDownloadPlayer` Component

**File**: `src/components/DailyDownloadPlayer.tsx`

Major simplifications:

#### A. Remove Streaming Chunk Management
- Remove `streamingAudioQueueRef`, `currentStreamingChunkRef`, `currentStreamingChunkIndex`
- Remove `playNextStreamingChunk` callback
- Remove `isWaitingForNextChunk` state
- Simplify to a single `audioRef` for the complete audio

#### B. Show Player Only When Ready
- Update the `GeneratingOverlay` to show until both transcript AND audio are fully ready
- The play button only appears when `audioReady === true`

#### C. Fix Voice Change with Resume
```typescript
const handleVoiceChange = useCallback(async (newVoiceId: string) => {
  setVoiceId(newVoiceId);
  
  // Save current playback position
  const savedTimeMs = audioRef.current ? audioRef.current.currentTime * 1000 : 0;
  const wasPlaying = audioRef.current && !audioRef.current.paused;
  
  // Pause current audio
  if (audioRef.current) {
    audioRef.current.pause();
  }
  
  // Regenerate audio with new voice
  await streamingContent.regenerateAudioWithVoice(newVoiceId, 1.0, savedTimeMs);
  
  // When new audio is ready, seek to saved position and resume if was playing
  // (handled in the audio ready callback)
}, [...]);
```

#### D. Accurate Transcript Highlighting
Use actual audio element timing instead of estimated chunk-based progress:

```typescript
// In timeupdate handler:
const currentTimeMs = audio.currentTime * 1000;
const totalDurationMs = audio.duration * 1000;
const progress = (currentTimeMs / totalDurationMs) * 100;

// Character index based on proportional time
const charIndex = Math.floor((progress / 100) * fullTranscriptText.length);
setCurrentCharIndex(charIndex);
```

This provides accurate sync because:
- Uses real audio timing, not estimates
- Works correctly with pauses (SSML breaks)
- Single audio means no inter-chunk calculation errors

---

### 4. Update `google-tts` Edge Function

**File**: `supabase/functions/google-tts/index.ts`

Add support for returning actual audio duration:

- After concatenating audio chunks, return the estimated total duration
- The TTS function already handles long text by chunking internally for the API, then concatenates

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/generate-content-stream/index.ts` | Remove chunk-by-chunk streaming, send full transcript in one event |
| `src/hooks/useStreamingContent.ts` | Remove chunk management, generate single audio blob, add `regenerateAudioWithVoice` with resume position support |
| `src/components/DailyDownloadPlayer.tsx` | Remove chunk queue logic, simplify audio playback to single element, fix voice change to preserve position, show player only when audio ready |

---

## Expected Behavior After Changes

1. **Generation Flow**:
   - User opens topic → "Generating" overlay appears
   - Full transcript generates → Audio generates
   - Overlay disappears, Play button becomes active
   
2. **Voice Change**:
   - User changes voice mid-playback (e.g., at 2:30)
   - Loading indicator briefly appears
   - Audio resumes at 2:30 with new voice
   
3. **Transcript Highlighting**:
   - Active paragraph is highlighted
   - Within active paragraph, current word is highlighted
   - Highlighting moves smoothly and accurately with audio

---

## Benefits of This Approach

| Before (Chunked) | After (Single Audio) |
|------------------|----------------------|
| Complex chunk queue management | Single audio element |
| Estimated character progress | Accurate time-based progress |
| "Loading next segment" buffering | No buffering between segments |
| Voice change restarts from chunk 0 | Voice change preserves position |
| Highlighting often out of sync | Highlighting synced with actual audio time |

