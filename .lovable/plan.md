

## Plan: Google Cloud TTS with Voice Selection

This plan upgrades the text-to-speech system from browser-based speech synthesis to Google Cloud's Text-to-Speech API, adding a voice selection dropdown so users can choose their preferred narrator voice.

### What You'll Get

- Premium quality neural voices from Google Cloud (much better than browser voices)
- A voice selector dropdown in the player UI
- 6 voice options: 3 male and 3 female voices with distinct styles
- Persistent voice preference saved locally
- Fallback to browser speech if TTS fails

### Voice Options

| Voice ID | Label | Description |
|----------|-------|-------------|
| en-US-Neural2-D | Oliver | Clear, professional male voice |
| en-US-Neural2-A | Marcus | Deep, authoritative male voice |
| en-US-Neural2-J | James | Warm, friendly male voice |
| en-US-Neural2-F | Aria | Natural, engaging female voice |
| en-US-Neural2-C | Emma | Soft, calming female voice |
| en-US-Neural2-H | Sophia | Bright, energetic female voice |

### Architecture Overview

```text
┌─────────────────────┐     ┌─────────────────────────┐     ┌────────────────────┐
│  DailyDownloadPlayer│────▶│ google-tts Edge Function│────▶│ Google Cloud TTS   │
│  (React Component)  │     │ (Supabase)              │     │ API                │
└─────────────────────┘     └─────────────────────────┘     └────────────────────┘
         │                            │
         │                            │ Returns MP3 audio
         ▼                            ▼
   ┌──────────────┐           ┌───────────────┐
   │ Audio Player │◀──────────│ Base64 Audio  │
   │ (HTML5)      │           │ Blob URL      │
   └──────────────┘           └───────────────┘
```

### Implementation Steps

#### Step 1: Create `google-tts` Edge Function

A new Supabase Edge Function that:

- Accepts transcript text, voice ID, and speaking rate
- Calls Google Cloud Text-to-Speech API at `https://texttospeech.googleapis.com/v1/text:synthesize`
- Uses the existing `GOOGLE_API_KEY` secret (already configured)
- Returns base64-encoded MP3 audio
- Handles text chunking for transcripts over 5000 bytes

Request format:
```text
POST /google-tts
{
  text: string,
  voiceId: string,       // e.g., "en-US-Neural2-D"
  speakingRate: number   // 0.5 to 2.0
}
```

Response format:
```text
{
  audioContent: string,  // Base64 MP3
  durationMs: number     // Estimated duration
}
```

#### Step 2: Create `useGoogleTTS` Hook

A React hook that manages TTS audio generation and playback:

- Calls the edge function to generate audio from transcript text
- Creates a Blob URL from the returned base64 audio
- Uses HTML5 Audio element for accurate playback and timing
- Provides play/pause, seek, skip forward/back, and playback rate controls
- Caches generated audio by topic ID + voice ID
- Shows loading state during audio generation
- Falls back to browser speech synthesis if TTS fails

#### Step 3: Create `useVoicePreference` Hook

A simple hook to persist voice selection:

- Stores selected voice ID in localStorage
- Returns current voice preference and setter function
- Default voice: "en-US-Neural2-D" (Oliver)

#### Step 4: Create VoiceSelector Component

A compact dropdown component positioned in the player header:

- Shows current voice name with an icon (User/Mic icon)
- Opens a popover/dropdown with all available voices
- Groups voices by gender (Male/Female)
- Displays voice name and description
- Saves preference on selection

UI positioning in header:
```text
┌──────────────────────────────────────────┐
│  [X]     Daily Download   [🎤 Oliver ▼][✨]│
│          Biology                         │
└──────────────────────────────────────────┘
```

Dropdown design:
```text
┌──────────────────────────────────────────┐
│  Choose Voice                            │
├──────────────────────────────────────────┤
│  Male Voices                             │
│  ● Oliver - Clear, professional          │
│  ○ Marcus - Deep, authoritative          │
│  ○ James - Warm, friendly                │
├──────────────────────────────────────────┤
│  Female Voices                           │
│  ○ Aria - Natural, engaging              │
│  ○ Emma - Soft, calming                  │
│  ○ Sophia - Bright, energetic            │
└──────────────────────────────────────────┘
```

#### Step 5: Update DailyDownloadPlayer Component

Integrate the new TTS system:

- Import and use the new `useGoogleTTS` hook instead of `useSpeechSynthesis`
- Add `VoiceSelector` component in the header between close button and AI menu
- Pass selected voice to the TTS hook
- Show loading indicator while audio is being generated
- Use real audio duration from the generated audio instead of estimates
- Maintain backward compatibility with browser speech as fallback

### Files to Create

1. `supabase/functions/google-tts/index.ts` - Edge function for Google Cloud TTS API calls
2. `src/hooks/useGoogleTTS.ts` - React hook for TTS audio generation and playback
3. `src/hooks/useVoicePreference.ts` - React hook for persisting voice preference
4. `src/components/VoiceSelector.tsx` - Voice selection dropdown component

### Files to Modify

1. `supabase/config.toml` - Add google-tts function configuration
2. `src/components/DailyDownloadPlayer.tsx` - Integrate voice selector and new TTS hook

### Technical Details

**Edge Function - Text Chunking:**
Google TTS has a 5000 byte limit per request. For longer transcripts:
- Split text at sentence boundaries (periods, question marks)
- Make multiple API calls for each chunk
- Concatenate the base64 audio responses
- Return combined audio

**Audio Caching Strategy:**
- Cache key: `${topicId}-${voiceId}`
- Store Blob URLs in React state
- Clear cache when component unmounts
- Regenerate audio if voice changes

**Fallback Behavior:**
- If edge function fails (network error, API error), show toast notification
- Automatically fall back to browser speech synthesis (`useSpeechSynthesis`)
- Voice preference still displayed even in fallback mode

**Playback Rate Handling:**
- Store user's preferred playback rate
- Apply rate to HTML5 Audio element
- Available rates: 1x, 1.25x, 1.5x, 1.75x, 2x

### Considerations

- **Latency**: First playback will have a 1-3 second delay while audio generates
- **API Costs**: Google Cloud TTS pricing is ~$4 per 1 million characters for Neural2 voices. Typical transcripts are 5,000-10,000 characters each
- **Text Limits**: Transcripts over 5000 bytes will be chunked and processed in multiple API calls

