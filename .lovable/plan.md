

# Replace Transcript Generation Prompt (3-Stage Pipeline)

## Overview

Replace the current single-prompt transcript generation with a new 2-stage pipeline:
1. **Gemini call**: Combined Prompt 1 (Architect) + Prompt 2 (Script Writer) -- produces a transcript with pedagogical placeholders
2. **Programmatic SSML conversion**: Prompt 3 (Audio Engineer) logic handled in `google-tts` function code

The transcript output will contain placeholders like `[SIGNPOST]`, `[PROMPT]`, `[RETRIEVAL]`, `[PREDICT]`, and `[TEACH]` instead of the old `[PAUSE: X Seconds]` markers.

---

## Changes

### 1. `supabase/functions/generate-transcript/index.ts`

- **Replace system prompt**: Swap the current `TRANSCRIPT_SYSTEM_PROMPT` with a combined Prompt 1 + Prompt 2 system prompt. The AI will internally create a blueprint then convert it to a transcript, outputting only the final `<TRANSCRIPT>` content.
- **Update user message**: Change from generic "Create the transcript" to instruct the model to analyze the topic, create a blueprint, then write the transcript.
- **Update extraction regex**: Change from `/<transcript>/` to match `<TRANSCRIPT>` tags (case-sensitive).
- **Update cache validation**: Keep the "let's summarize this topic" anchor phrase check (it's still required in the new prompt).
- **Increase `maxOutputTokens`**: From 4096 to 8192 to accommodate the blueprint + transcript generation.
- **Strip placeholders for display**: Clean `[SIGNPOST]`, `[PROMPT]`, `[RETRIEVAL]`, `[PREDICT]`, `[TEACH]` tags from the stored transcript so the UI displays clean text. Store the raw transcript (with placeholders) separately for TTS.

**Response format change**: Return both `transcript` (clean, for display) and `ssmlTranscript` (with placeholders, for TTS).

### 2. `supabase/functions/google-tts/index.ts`

- **Update `preprocessTextForSSML()`**: Replace the old `[PAUSE: X Seconds]` marker logic with the new placeholder-to-SSML mappings:

| Placeholder | SSML Output |
|---|---|
| `[SIGNPOST]` | Wrap next sentence in `<emphasis level="strong">`, add `<break time="2000ms"/>` |
| `[PROMPT]` | Wrap next sentence in `<prosody rate="90%" pitch="-5%">`, add `<break time="3000ms"/>` |
| `[RETRIEVAL]` | Wrap next sentence in `<prosody pitch="+10%" rate="105%">`, add `<break time="3000ms"/>` |
| `[PREDICT]` | Wrap next sentence in `<prosody volume="-2dB" rate="85%">`, add `<break time="3000ms"/>` |
| `[TEACH]` | Wrap next sentence in `<prosody rate="95%" pitch="-1Hz">` |

- Keep paragraph `<break time="2000ms"/>` between paragraphs.
- Also keep backward compatibility: if old `[PAUSE: X Seconds]` markers are found (cached transcripts), handle them as before.

### 3. `src/hooks/useStreamingContent.ts`

- Update to pass the `ssmlTranscript` (with placeholders) to the TTS function instead of the clean transcript.
- The clean `transcript` continues to be used for UI display.

### 4. `src/hooks/useTopics.ts`

- No changes needed -- the `transcript` field in the DB remains the display version.

---

## Data Flow

```text
Gemini API (Prompt 1+2 combined)
  → Raw transcript with [SIGNPOST], [PROMPT], etc.
  → Split into:
     • Clean transcript (placeholders stripped) → DB + UI display
     • Raw transcript (with placeholders) → sent to google-tts
       → google-tts converts placeholders to SSML programmatically
       → Google Cloud TTS API
       → Audio
```

---

## Technical Notes

- The combined prompt instructs the AI to internally create the blueprint (Prompt 1) then produce the transcript (Prompt 2), outputting only the `<TRANSCRIPT>` content. This avoids needing to parse `<BLUEPRINT>` tags.
- Cached transcripts without the new placeholders will still work since `google-tts` maintains backward compatibility with `[PAUSE]` markers.
- The `generate-transcript` response adds an `ssmlTranscript` field alongside `transcript`. The frontend passes `ssmlTranscript` to TTS when available, falling back to `transcript`.

