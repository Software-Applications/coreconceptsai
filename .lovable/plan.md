
# Streaming Audio Generation Without Auto-Play

## Problem Summary
Currently, when a user clicks on a topic in the Core Concepts drawer:
1. The system generates transcript and audio in parallel (correct ✓)
2. Audio auto-plays immediately when the first chunk is ready (incorrect ✗)
3. Clicking play requests TTS generation again instead of using pre-generated audio (incorrect ✗)

## Solution Overview

Modify the audio player to:
1. Generate transcript + audio in bite-sized paragraph chunks (already working)
2. Show the player view when first chunk is ready (already working)
3. **Remove auto-play** - audio waits for user interaction
4. **Use pre-generated audio** - clicking play uses the queued audio chunks, not new TTS requests

## Technical Changes

### 1. DailyDownloadPlayer.tsx - Remove Auto-Play Behavior

**Location**: `onFirstChunkAudioReady` callback (lines 161-190)

**Current behavior**: 
- Creates audio element and calls `audio.play()` automatically
- Sets `hasStarted` and `isStreamingPlayback` to true

**New behavior**:
- Store the first chunk's blob URL in the queue
- Set `firstChunkReady` state (for UI to know content is ready)
- Do NOT call `audio.play()` or set `hasStarted`
- Audio remains paused until user interaction

```typescript
// Before:
onFirstChunkAudioReady: (blobUrl) => {
  ...
  setHasStarted(true);
  setIsStreamingPlayback(true);
  audio.play().catch(console.error);  // ← Remove this
}

// After:
onFirstChunkAudioReady: (blobUrl) => {
  streamingAudioQueueRef.current[0] = blobUrl;
  currentStreamingChunkRef.current = 0;
  setCurrentStreamingChunkIndex(0);
  setIsWaitingForNextChunk(false);
  // Audio is ready but NOT playing - wait for user interaction
}
```

### 2. DailyDownloadPlayer.tsx - Modify Play/Pause Handler

**Location**: `handlePlayPause` function (lines 624-639)

**Current behavior**: 
- Calls `speak(fullTranscriptText, voiceId)` which requests new TTS

**New behavior**:
- Check if streaming audio chunks are available
- If available, create Audio element from queued blob URLs and play
- Fall back to TTS only if no streaming audio exists

```typescript
const handlePlayPause = () => {
  mediumTap();
  
  // Check if we have pre-generated streaming audio
  const hasStreamingAudio = streamingAudioQueueRef.current.length > 0 && 
                            streamingAudioQueueRef.current[0];
  
  if (!hasStarted) {
    setHasStarted(true);
    setShowResumePrompt(false);
    
    if (hasStreamingAudio) {
      // Use pre-generated streaming audio
      setIsStreamingPlayback(true);
      const audio = new Audio(streamingAudioQueueRef.current[0]);
      audio.playbackRate = streamingPlaybackRate;
      streamingAudioRef.current = audio;
      
      audio.addEventListener('ended', () => {
        if (streamingAudioQueueRef.current[1]) {
          playNextStreamingChunk();
        } else {
          setIsWaitingForNextChunk(true);
        }
      });
      
      audio.play().catch(console.error);
    } else {
      // Fallback to TTS generation (for non-streaming content)
      speak(fullTranscriptText, voiceId);
    }
  } else if (isStreamingPlayback) {
    // Handle streaming playback pause/resume
    if (streamingAudioRef.current) {
      if (streamingAudioRef.current.paused) {
        streamingAudioRef.current.play().catch(console.error);
      } else {
        streamingAudioRef.current.pause();
      }
    }
  } else if (isPlaying) {
    pause();
  } else if (isPaused) {
    resume();
  } else {
    speak(fullTranscriptText, voiceId);
  }
};
```

### 3. DailyDownloadPlayer.tsx - Track Streaming Playback State

Add state to track when streaming audio is playing vs paused:

```typescript
const [isStreamingPlaying, setIsStreamingPlaying] = useState(false);
```

Update the audio event listeners to sync this state:
- `audio.onplay` → `setIsStreamingPlaying(true)`
- `audio.onpause` → `setIsStreamingPlaying(false)`
- `audio.onended` → `setIsStreamingPlaying(false)`

### 4. Update UI to Reflect Ready State

The GeneratingOverlay should hide when first chunk audio is ready (currently works via `firstChunkReady` flag). The play button should be enabled and show the play icon.

Update the waveform animation condition:
```typescript
const waveformShouldAnimate = isPlaying || (isStreamingPlayback && isStreamingPlaying);
```

Update the play button icon logic:
```typescript
const showPauseIcon = isPlaying || (isStreamingPlayback && isStreamingPlaying);
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
First chunk ready → Show player (no auto-play)
        ↓
User clicks PLAY
        ↓
Use queued audio blob → Start playback
        ↓
On chunk end → Play next queued chunk
        ↓
If next chunk not ready → Show buffering
        ↓
All chunks complete → Show flash summary
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/DailyDownloadPlayer.tsx` | Remove auto-play, update handlePlayPause to use streaming queue, add streaming play state |

## Testing Plan

1. Open Core Concepts drawer and select a topic
2. Verify the player shows loading overlay while generating
3. Verify player view appears when content is ready (audio NOT playing)
4. Click play - verify audio starts immediately without loading spinner
5. Pause and resume - verify streaming audio respects pause/resume
6. Change voice during playback - verify voice change works
7. Test with a new topic that requires generation
8. Test with a cached topic that has pre-existing transcript
