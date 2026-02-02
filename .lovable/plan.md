
# Streaming Audio Generation Without Auto-Play

## ✅ IMPLEMENTED

## Problem Summary
Currently, when a user clicks on a topic in the Core Concepts drawer:
1. The system generates transcript and audio in parallel (correct ✓)
2. Audio auto-plays immediately when the first chunk is ready (incorrect ✗) → **FIXED**
3. Clicking play requests TTS generation again instead of using pre-generated audio (incorrect ✗) → **FIXED**

## Solution Implemented

Modified the audio player to:
1. Generate transcript + audio in bite-sized paragraph chunks (already working)
2. Show the player view when first chunk is ready (already working)
3. **Remove auto-play** - audio waits for user interaction ✅
4. **Use pre-generated audio** - clicking play uses the queued audio chunks, not new TTS requests ✅

## Technical Changes Made

### 1. Added `isStreamingPlaying` State
New state variable to track whether streaming audio is actively playing or paused.

### 2. Modified `onFirstChunkAudioReady` Callback
- Stores the first chunk's blob URL in the queue
- Does NOT call `audio.play()` or set `hasStarted`
- Audio remains paused until user interaction

### 3. Updated `handlePlayPause` Function
- Checks if streaming audio chunks are available
- If available, creates Audio element from queued blob URLs and plays immediately
- Falls back to TTS only if no streaming audio exists
- Properly handles pause/resume for streaming audio

### 4. Updated `playNextStreamingChunk` Function
- Added play/pause event listeners to sync `isStreamingPlaying` state
- Sets `isStreamingPlaying(true)` when starting next chunk

### 5. Updated Waveform Animation
- Now respects both TTS playing state and streaming playing state:
  ```typescript
  const waveformShouldAnimate = isPlaying || (isStreamingPlayback && isStreamingPlaying);
  ```

## Flow Diagram

```text
User clicks topic
        ↓
TopicSelectionSheet.handleSelectTopic()
        ↓
DailyDownloadPlayer opens
        ↓
Auto-triggers streamingContent.startStreaming()
        ↓
┌─────────────────────────────────────────┐
│ Parallel Processing (per chunk):       │
│   1. Transcript chunk arrives (SSE)    │
│   2. TTS audio generated immediately   │
│   3. Audio blob stored in queue        │
└─────────────────────────────────────────┘
        ↓
First chunk ready → Show player (no auto-play) ✅
        ↓
User clicks PLAY
        ↓
Use queued audio blob → Start playback instantly ✅
        ↓
On chunk end → Play next queued chunk
        ↓
If next chunk not ready → Show buffering
        ↓
All chunks complete → Show flash summary
```

## Testing Checklist

- [ ] Open Core Concepts drawer and select a topic
- [ ] Verify the player shows loading overlay while generating
- [ ] Verify player view appears when content is ready (audio NOT playing)
- [ ] Click play - verify audio starts immediately without loading spinner
- [ ] Pause and resume - verify streaming audio respects pause/resume
- [ ] Change voice during playback - verify voice change works
- [ ] Test with a new topic that requires generation
- [ ] Test with a cached topic that has pre-existing transcript
