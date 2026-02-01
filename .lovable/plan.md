
# Streaming Transcript + Audio Generation

## Overview

Transform the content generation pipeline from a sequential batch process to a **parallel streaming architecture** where transcript and audio are generated in 30-second chunks. The audio player screen is presented as soon as the first chunk is ready, allowing playback to begin while the rest is still being generated.

---

## Current Flow (What We're Changing)

```text
┌─────────────────────────────────────────────────────────────────┐
│  1. User opens topic                                            │
│  2. Edge function generates FULL transcript (10-20 seconds)     │
│  3. User sees "Generating..." overlay                           │
│  4. Transcript complete → Audio screen shown                    │
│  5. User taps Play                                              │
│  6. TTS generates audio via SSE streaming                       │
│  7. Audio plays                                                 │
└─────────────────────────────────────────────────────────────────┘

Total wait time before playback: 15-25 seconds
```

---

## New Flow (Streaming Pipeline)

```text
┌────────────────────────────────────────────────────────────────────────────┐
│  1. User opens topic                                                       │
│  2. Edge function streams transcript in chunks via SSE                     │
│     ├─ Chunk 1 (~30 sec audio worth of text) → immediately sent to TTS    │
│     ├─ Chunk 2 → sent to TTS while chunk 1 audio plays                    │
│     └─ Chunk 3, 4, ... → continue in parallel                             │
│  3. First chunk audio ready → Audio screen shown + auto-play              │
│  4. Remaining chunks stream in background                                  │
└────────────────────────────────────────────────────────────────────────────┘

Time to first audio: 4-8 seconds (vs 15-25 seconds before)
```

---

## Technical Implementation

### 1. New Edge Function: `generate-content-stream`

Replaces batch `generate-content` with a streaming version that:
- Uses Gemini's `streamGenerateContent` REST API endpoint
- Accumulates text until approximately 30 seconds worth (~75-100 words)
- Emits each chunk as an SSE event
- Runs flash summary generation in parallel (background task)

**SSE Event Types:**
- `{ type: "chunk", index: 0, text: "...", isLast: false }`
- `{ type: "chunk", index: 1, text: "...", isLast: true }`
- `{ type: "summary", flashSummary: {...} }`
- `{ type: "done", fullTranscript: "..." }`

```typescript
// Pseudocode for streaming approach
const stream = await fetch("...streamGenerateContent", { ... });
const reader = stream.body.getReader();

let buffer = "";
let chunkIndex = 0;

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  buffer += parseChunkText(value);
  
  // Emit when we have ~30 seconds worth of content
  if (estimateAudioDuration(buffer) >= 30) {
    emit({ type: "chunk", index: chunkIndex++, text: buffer });
    buffer = "";
  }
}

// Emit remaining text
if (buffer.length > 0) {
  emit({ type: "chunk", index: chunkIndex, text: buffer, isLast: true });
}
```

### 2. New Hook: `useStreamingContent`

Replaces `useAIGeneration` hook with a streaming version:
- Connects to SSE endpoint
- Receives transcript chunks
- Immediately sends each chunk to TTS for audio generation
- Tracks overall progress and ready state

**Key State:**
- `chunks: Array<{ text: string, audioReady: boolean }>`
- `firstChunkReady: boolean` - triggers audio screen display
- `isStreaming: boolean`
- `progress: number` - 0-100 across all chunks

### 3. Modified TTS Pipeline

The existing `google-tts` edge function already supports streaming. We'll:
- Call TTS for each transcript chunk as it arrives
- Queue audio chunks for seamless playback
- Leverage existing `audioQueueRef` infrastructure in `useGoogleTTS`

### 4. Updated `DailyDownloadPlayer`

**Changes:**
- Replace `useGenerateContent` with `useStreamingContent`
- Auto-show audio screen when `firstChunkReady` becomes true
- Auto-start playback (no manual play button press needed initially)
- Show streaming progress indicator while remaining chunks load
- Transition `GeneratingOverlay` to streaming-aware UI

**New UI States:**
1. **Streaming** - Show progress: "Preparing audio... (Chunk 2/5)"
2. **Ready** - First chunk ready, auto-play begins
3. **Buffering** - Next chunk not ready yet (existing behavior)

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `supabase/functions/generate-content-stream/index.ts` | Create | New streaming edge function |
| `supabase/config.toml` | Edit | Add new function config |
| `src/hooks/useStreamingContent.ts` | Create | New hook for SSE transcript + audio orchestration |
| `src/hooks/useAIGeneration.ts` | Edit | Keep for backward compatibility, add deprecation |
| `src/hooks/useGoogleTTS.ts` | Edit | Add method to queue multiple transcript chunks |
| `src/components/DailyDownloadPlayer.tsx` | Edit | Use streaming hook, auto-show and auto-play |
| `src/components/GeneratingOverlay.tsx` | Edit | Show chunk-based progress |

---

## Detailed Changes

### `supabase/functions/generate-content-stream/index.ts`

New edge function that:
1. Uses Gemini REST API `streamGenerateContent` endpoint
2. Parses streaming response and accumulates text
3. Emits SSE events when chunks reach ~30 seconds of audio content
4. Runs flash summary + description generation as background tasks
5. Saves full transcript to database when complete

### `src/hooks/useStreamingContent.ts`

New hook that:
1. Opens EventSource to streaming edge function
2. Receives transcript chunks
3. For each chunk, immediately calls `google-tts` edge function
4. Maintains a queue of ready audio chunks
5. Signals when first chunk audio is ready
6. Provides overall progress percentage

### `src/hooks/useGoogleTTS.ts`

Add new method `queueChunks(chunks: string[], voiceId: string)`:
- Pre-generates audio for multiple transcript chunks
- Manages seamless playback across chunk boundaries
- Reuses existing `audioQueueRef` and `playNextChunk` logic

### `src/components/DailyDownloadPlayer.tsx`

Key changes:
1. Replace `useGenerateContent` with `useStreamingContent`
2. Auto-transition from loading overlay to audio player when `firstChunkReady`
3. Auto-start playback without requiring user to tap Play
4. Show subtle progress indicator while remaining chunks stream

### `src/components/GeneratingOverlay.tsx`

Update to show:
- "Preparing your brief..." initially
- "Generating audio... (1/4)" with chunk progress
- Smooth transition to audio player

---

## Edge Cases and Considerations

| Scenario | Handling |
|----------|----------|
| User closes before first chunk | Abort controller cancels all in-flight requests |
| Network interruption mid-stream | Fallback to existing batch generation |
| TTS slower than transcript | Show buffering indicator, continue playback when ready |
| Very short topics | May complete in 1-2 chunks, still works |
| Voice change during streaming | Clear queue, regenerate audio from available transcript |

---

## Performance Expectations

| Metric | Before | After |
|--------|--------|-------|
| Time to audio screen | 15-25 sec | 4-8 sec |
| Time to first audio | 20-30 sec | 4-8 sec |
| Total generation time | Same | Same (work shifted earlier) |
| Perceived responsiveness | Slow | Fast and progressive |

---

## Dependencies

- Gemini REST API `streamGenerateContent` endpoint (confirmed available)
- Existing SSE infrastructure in `google-tts` edge function
- No new npm packages required
