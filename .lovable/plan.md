

# Audio Player Screen Bug Fixes

## Issues Identified

### Issue 1: Summary Button Should Be Removed
The "Skip to Summary" button is currently shown on lines 1083-1107. This button appears after `hasStarted` is true and allows users to skip directly to the flash card summary. You want this removed.

### Issue 2: Play/Pause Button Not Reflecting Audio Status
The play/pause button logic on lines 1046-1052 only checks `isPlaying` state (from TTS), but doesn't account for the streaming playback state (`isStreamingPlaying`):

```typescript
// Current problematic code (lines 1046-1052):
{isTTSLoading ? (
  <Loader2 className="w-8 h-8 animate-spin" />
) : isPlaying ? (          // ← Only checks TTS isPlaying!
  <Pause className="w-8 h-8" />
) : (
  <Play className="w-8 h-8 ml-1" />
)}
```

When streaming audio is playing (`isStreamingPlayback && isStreamingPlaying`), the button should show Pause, but currently it still shows Play because `isPlaying` is false (that's the TTS state, not the streaming state).

### Issue 3: Ensure All Buttons Work
The skip forward/backward buttons (lines 1021-1081) use `seekToChar()` which is a TTS-specific function. These won't work correctly during streaming playback mode.

## Solution

### Fix 1: Remove Summary Button
Delete lines 1083-1107 containing the "Skip to Summary" button.

### Fix 2: Fix Play/Pause Icon Logic
Update the button icon condition to check both TTS and streaming states:

```typescript
// Fixed code:
{isTTSLoading ? (
  <Loader2 className="w-8 h-8 animate-spin" />
) : (isPlaying || (isStreamingPlayback && isStreamingPlaying)) ? (
  <Pause className="w-8 h-8" />
) : (
  <Play className="w-8 h-8 ml-1" />
)}
```

### Fix 3: Update Skip Buttons for Streaming Mode
Add conditional logic to skip buttons to work with streaming playback:

For **Skip Back**:
- In streaming mode: Go to previous chunk if available
- In TTS mode: Use existing `seekToChar()` logic

For **Skip Forward**:
- In streaming mode: Skip to next chunk if available
- In TTS mode: Use existing `seekToChar()` logic

```typescript
// Skip back button onClick:
onClick={() => {
  lightTap();
  if (!hasStarted) return;
  
  if (isStreamingPlayback) {
    // In streaming mode, go back one chunk
    const prevIndex = Math.max(0, currentStreamingChunkRef.current - 1);
    if (prevIndex !== currentStreamingChunkRef.current && streamingAudioQueueRef.current[prevIndex]) {
      if (streamingAudioRef.current) {
        streamingAudioRef.current.pause();
      }
      currentStreamingChunkRef.current = prevIndex;
      setCurrentStreamingChunkIndex(prevIndex);
      const audio = new Audio(streamingAudioQueueRef.current[prevIndex]);
      audio.playbackRate = streamingPlaybackRate;
      streamingAudioRef.current = audio;
      audio.addEventListener('play', () => setIsStreamingPlaying(true));
      audio.addEventListener('pause', () => setIsStreamingPlaying(false));
      audio.addEventListener('ended', () => {
        setIsStreamingPlaying(false);
        if (streamingAudioQueueRef.current[currentStreamingChunkRef.current + 1]) {
          playNextStreamingChunk();
        } else {
          setIsWaitingForNextChunk(true);
        }
      });
      audio.play().catch(console.error);
    }
  } else {
    // TTS mode - use existing seek logic
    const charsPerSecond = (fullTranscriptText.length / estimatedDuration);
    const skipChars = Math.floor(charsPerSecond * 15);
    const newCharIndex = Math.max(0, currentCharIndex - skipChars);
    seekToChar(newCharIndex);
  }
}}
```

Similar logic for skip forward button.

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/DailyDownloadPlayer.tsx` | Remove summary button, fix play/pause icon, update skip buttons |

## Summary of Changes

1. **Remove** the "Skip to Summary" button (lines 1083-1107)
2. **Fix** play/pause icon to show correct state: `(isPlaying || (isStreamingPlayback && isStreamingPlaying))`
3. **Update** skip back/forward buttons to handle streaming mode by navigating between chunks

