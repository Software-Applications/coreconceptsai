
# Fix: Generating Overlay Persists After Audio Starts Playing

## Problem Identified

The "Generating Your Brief" overlay remains visible even after the audio begins playing. This happens because:

1. The `GeneratingOverlay` component displays when `isStreaming` is `true`
2. `isStreaming` remains `true` until **all** transcript chunks are received **AND** all TTS audio chunks are generated
3. However, audio playback starts as soon as the **first** chunk is ready (`firstChunkReady`)
4. This creates a situation where audio is already playing but the overlay is still blocking the UI

## Root Cause

In `DailyDownloadPlayer.tsx` (lines 703-714), the overlay is shown based solely on `isStreaming`:

```typescript
<GeneratingOverlay 
  isGenerating={false} 
  isStreaming={isStreaming}  // <-- This stays true too long
  ...
/>
```

The overlay should hide once audio playback has started, which is indicated by `streamingContent.firstChunkReady` becoming `true`.

## Solution

Update the `isStreaming` prop passed to `GeneratingOverlay` to account for when the first audio chunk is ready:

```typescript
<GeneratingOverlay 
  isGenerating={false} 
  isStreaming={isStreaming && !streamingContent.firstChunkReady}
  ...
/>
```

This means:
- Show overlay when streaming is in progress AND first audio chunk is NOT ready
- Hide overlay as soon as the first audio chunk is ready (even if background generation continues)

## File Changes

| File | Change |
|------|--------|
| `src/components/DailyDownloadPlayer.tsx` | Update line 705 to hide overlay once `firstChunkReady` is true |

## Technical Details

The change is minimal - a single line modification:

**Before (line 705):**
```typescript
isStreaming={isStreaming}
```

**After:**
```typescript
isStreaming={isStreaming && !streamingContent.firstChunkReady}
```

This ensures the overlay only shows during the initial generation phase before any audio is ready to play. Once `onFirstChunkAudioReady` fires and audio starts, the overlay will fade out while remaining chunks continue generating in the background (which is the expected behavior per the architecture memory).
