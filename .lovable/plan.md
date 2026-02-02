

# Fix: Audio Screen Not Opening

## Problem Identified

The console shows `[StreamContent] Cancelling...` being called repeatedly. This prevents the audio screen from properly initializing because:

1. **The `cancel` function in `useStreamingContent.ts` has `audioBlobUrl` as a dependency**
2. **The cleanup `useEffect` that calls `cancel()` has `cancel` as a dependency**
3. **When `cancel` changes (due to `audioBlobUrl` changing), the old cleanup effect runs, which calls `cancel()`**
4. **This resets all states (`transcriptReady`, `audioReady`, etc.) to `false`**
5. **The player component never sees the content as "ready" and may cancel/restart generation**

Additionally, in `DailyDownloadPlayer.tsx`:
- Line 360 has `streamingContent` as a dependency, but `streamingContent` is a new object on every render
- This causes the topic change effect to re-run unexpectedly

## Technical Solution

### Fix 1: Stable `cancel` function in `useStreamingContent.ts`

The `cancel` function should NOT have `audioBlobUrl` as a dependency. Instead, use a ref to track the blob URL for cleanup:

```typescript
// Change from:
const cancel = useCallback(() => {
  // ...
  if (audioBlobUrl) {
    URL.revokeObjectURL(audioBlobUrl);
  }
  // ...
}, [audioBlobUrl]);  // <-- This causes cancel to be recreated

// Change to:
const audioBlobUrlRef = useRef<string | null>(null);

// Update ref when audioBlobUrl changes
useEffect(() => {
  audioBlobUrlRef.current = audioBlobUrl;
}, [audioBlobUrl]);

const cancel = useCallback(() => {
  // ...
  if (audioBlobUrlRef.current) {
    URL.revokeObjectURL(audioBlobUrlRef.current);
    audioBlobUrlRef.current = null;
  }
  // ...
}, []);  // <-- Empty deps, stable function
```

### Fix 2: Stable cleanup effect

Change the cleanup effect to not depend on `cancel`:

```typescript
// Change from:
useEffect(() => {
  return () => {
    cancel();
  };
}, [cancel]);  // <-- Runs cleanup every time cancel changes

// Change to:
useEffect(() => {
  return () => {
    // Direct cleanup without calling cancel
    abortControllerRef.current?.abort();
    ttsAbortControllerRef.current?.abort();
    if (audioBlobUrlRef.current) {
      URL.revokeObjectURL(audioBlobUrlRef.current);
    }
  };
}, []);  // <-- Only runs on unmount
```

### Fix 3: Fix dependency in `DailyDownloadPlayer.tsx`

The topic change effect should not include `streamingContent` directly:

```typescript
// Change from:
}, [topic?.id, streamingContent, getProgress]);

// Change to (use streamingContent.cancel specifically):
const cancelGeneration = streamingContent.cancel;
// ...
useEffect(() => {
  if (previousTopicId.current !== null && previousTopicId.current !== topic?.id) {
    console.log('[Player] Topic changed, resetting');
    cancelGeneration();
    // ...
  }
  // ...
}, [topic?.id, cancelGeneration, getProgress]);
```

Similarly for the auto-generation effect - use destructured properties:

```typescript
const { 
  audioReady, 
  transcriptReady, 
  isGenerating, 
  isAudioGenerating, 
  startGeneration 
} = streamingContent;

useEffect(() => {
  if (audioReady || transcriptReady) return;
  if (isGenerating || isAudioGenerating) return;
  // ...
}, [isOpen, topic?.id, audioReady, transcriptReady, isGenerating, isAudioGenerating, subjectName, voiceId, startGeneration]);
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useStreamingContent.ts` | Use ref for audioBlobUrl in cancel, remove audioBlobUrl from cancel dependencies, fix cleanup effect to only run on unmount |
| `src/components/DailyDownloadPlayer.tsx` | Destructure streamingContent properties to avoid object reference issues in useEffect dependencies |

## Expected Behavior After Fix

1. User opens a topic → Generation starts once
2. `cancel()` is only called on actual topic change or unmount, not on state changes
3. Audio screen shows generating overlay while transcript and audio generate
4. When ready, the player UI appears with play button

