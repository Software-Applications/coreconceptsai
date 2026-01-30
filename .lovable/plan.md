
## Fix Audio Player Perpetual Play State

### Overview
The audio waveform visualization gets stuck in an animated "playing" state because the `isPlaying` state is not properly synchronized with actual audio playback. The waveform bars continuously animate when `isPlaying` is true, but this state can become stale if audio playback fails or stops unexpectedly.

### Root Causes
1. **Missing pause event listener** - The audio element has listeners for `ended` and `error` events, but no `pause` event listener to detect when audio stops unexpectedly
2. **Async operations breaking user gesture context** - Network fetch operations before playback can break browser autoplay policies
3. **State not reset on playback failure** - If `audio.play()` silently fails, `isPlaying` may remain true
4. **No periodic state verification** - No mechanism to verify the audio element's actual playing state

### Changes

**1. src/hooks/useGoogleTTS.ts - Add pause event listener and state sync**
- Add `pause` event listener to audio elements to detect unexpected stops
- Check `audio.paused` property before setting `isPlaying = true`
- Add state verification when audio element is created
- Ensure `isPlaying` is only set to `true` after confirmed playback start

**2. src/hooks/useGoogleTTS.ts - Create Audio element synchronously**
- Move Audio element creation to happen immediately in the user gesture handler
- Set `preload = "auto"` for reliable loading
- Perform network operations after element creation (following browser best practices)

**3. src/components/DailyDownloadPlayer.tsx - Add fallback state check**
- Add a periodic check to verify waveform animation matches actual playback state
- Use audio element's `paused` property as source of truth

### Technical Implementation

For the useGoogleTTS hook, add a pause event handler to each audio element:

```typescript
audio.addEventListener('pause', () => {
  if (sessionIdRef.current !== currentSessionId) return;
  // Only update if not intentionally paused
  if (!isPaused) {
    setIsPlaying(false);
  }
});
```

Verify playback actually started before setting state:

```typescript
audio.play()
  .then(() => {
    // Double-check audio is actually playing
    if (!audio.paused) {
      setIsPlaying(true);
      setIsPaused(false);
    }
  })
  .catch((err) => {
    console.error('Playback error:', err);
    setIsPlaying(false);
    // Fall back to browser speech synthesis
  });
```

### Result
The waveform visualization will accurately reflect the audio playback state and won't get stuck in a perpetual playing animation when audio isn't actually playing.
