

# Remove Separator Lines & Fix Slow Transcript Highlighting

## Issues to Address

1. **Separator lines** - The subtle `h-px bg-border/50` dividers between paragraphs need to be removed
2. **Slow transcript highlighting** - The highlighting lags behind audio because the browser's native `timeupdate` event only fires ~4 times/second (every ~250ms)

## Root Cause of Slow Highlighting

The current implementation at line 211 relies on the browser's `timeupdate` event:
```js
audio.addEventListener('timeupdate', () => {
  setCurrentTimeMs(audio.currentTime * 1000);
});
```

This event fires infrequently (~4Hz), causing noticeable lag between audio playback and text highlighting.

## Solution

### 1. Remove Separator Lines

Remove the separator `div` from the paragraph rendering (lines 736-739).

### 2. Use `requestAnimationFrame` for Real-Time Sync

Replace the `timeupdate` event listener with a `requestAnimationFrame` loop that updates at 60fps when audio is playing. This provides smooth, real-time synchronization between audio and highlighting.

**Technical approach:**
- Add an `animationFrameRef` to track the animation frame ID
- Create a `syncTime` function that reads `audio.currentTime` and schedules the next frame
- Start the loop when audio plays, stop when paused or ended
- Clean up properly on unmount

## Changes Summary

| File | Change |
|------|--------|
| `src/components/DailyDownloadPlayer.tsx` | Remove separator div (line 736-739), replace `timeupdate` listener with `requestAnimationFrame` loop |

## Technical Details

### New Animation Frame Loop

```typescript
// Add ref for animation frame
const animationFrameRef = useRef<number | null>(null);

// Time sync function
const syncTime = useCallback(() => {
  if (audioRef.current && isPlaying) {
    setCurrentTimeMs(audioRef.current.currentTime * 1000);
    animationFrameRef.current = requestAnimationFrame(syncTime);
  }
}, [isPlaying]);

// Start/stop loop based on playing state
useEffect(() => {
  if (isPlaying) {
    animationFrameRef.current = requestAnimationFrame(syncTime);
  } else {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }
  
  return () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };
}, [isPlaying, syncTime]);
```

### Remove Separator (lines 735-739)

Change from:
```jsx
<div key={index}>
  {index > 0 && (
    <div className="h-px bg-border/50 mb-6" />
  )}
  <p ...>
```

To:
```jsx
<div key={index}>
  <p ...>
```

## Expected Result

- **No separator lines** between paragraphs (clean look)
- **Smooth 60fps highlighting** that precisely matches audio playback with no perceptible lag

