
# Transcript and Audio Pause Rules Implementation

## Overview

You want to improve the transcript chunking and audio generation with better pacing:

1. **Paragraph-based chunking**: Each text chunk should contain one or more complete paragraphs
2. **5-second pauses**: Audio should pause for 5 seconds after reflective questions or `[PAUSE]` markers
3. **2-second paragraph pauses**: Audio should pause for 2 seconds at the start of each new paragraph (superseded by the 5-second rule)

## Current Behavior

- Chunks are split by word count (~75 words) at sentence boundaries
- `[PAUSE: 5 Seconds]` markers are in the transcript but TTS speaks them as text
- No actual audio silence is inserted

## Technical Solution

### 1. Modify Transcript Chunking (Edge Function)

**File**: `supabase/functions/generate-content-stream/index.ts`

Update the `splitIntoChunks` function to respect paragraph boundaries:

```typescript
function splitIntoChunks(text: string, maxWordsPerChunk: number = 150): string[] {
  // Split by double newlines (paragraphs)
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim());
  const chunks: string[] = [];
  let currentChunk = '';
  let currentWords = 0;
  
  for (const paragraph of paragraphs) {
    const paragraphWords = countWords(paragraph);
    
    // If adding this paragraph exceeds limit and we have content, start new chunk
    if (currentWords + paragraphWords > maxWordsPerChunk && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = paragraph;
      currentWords = paragraphWords;
    } else {
      // Add paragraph to current chunk with double newline separator
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
      currentWords += paragraphWords;
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}
```

Also update the streaming generation logic to split at paragraph boundaries instead of sentence boundaries.

### 2. Convert Pause Markers to SSML (TTS Edge Function)

**File**: `supabase/functions/google-tts/index.ts`

Add a text preprocessing function that:
- Converts `[PAUSE: 5 Seconds]` markers to SSML `<break time="5s"/>`
- Adds `<break time="2s"/>` at the start of each paragraph (unless preceded by 5s pause)
- Wraps the text in SSML `<speak>` tags

```typescript
function preprocessTextForSSML(text: string): string {
  // Split by paragraphs (double newlines)
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim());
  
  const processedParagraphs = paragraphs.map((paragraph, index) => {
    let processed = paragraph;
    
    // Convert [PAUSE: X Seconds] to SSML breaks
    processed = processed.replace(
      /\[PAUSE:\s*(\d+)\s*(?:Seconds?|s)\]/gi,
      (_, seconds) => `<break time="${seconds}s"/>`
    );
    
    // Add 2s break at paragraph start (if not first paragraph)
    // Only add if the previous paragraph didn't end with a 5s break
    if (index > 0) {
      const prevParagraph = paragraphs[index - 1];
      const endsWithLongPause = /\[PAUSE:\s*[5-9]\d*\s*(?:Seconds?|s)\]\s*$/i.test(prevParagraph);
      
      if (!endsWithLongPause) {
        processed = `<break time="2s"/>${processed}`;
      }
    }
    
    return processed;
  });
  
  return `<speak>${processedParagraphs.join(' ')}</speak>`;
}
```

Update the TTS API call to use SSML input:

```typescript
async function synthesizeChunk(
  text: string,
  voiceId: string,
  speakingRate: number,
  apiKey: string
): Promise<string> {
  // Preprocess text to SSML with pause handling
  const ssmlText = preprocessTextForSSML(text);
  
  const response = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { ssml: ssmlText }, // Use SSML instead of plain text
        voice: {
          languageCode: 'en-US',
          name: voiceId,
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: speakingRate,
          pitch: 0,
          volumeGainDb: 0,
        },
      }),
    }
  );
  // ... rest of function
}
```

### 3. Update Prompt for Better Paragraph Structure

**File**: `supabase/functions/generate-content-stream/index.ts`

Add to the `TRANSCRIPT_SYSTEM_PROMPT`:

```
### PARAGRAPH STRUCTURE:
- Use clear paragraph breaks (double newlines) between distinct ideas or sections
- Each paragraph should contain a complete thought or concept
- Reflective questions should end with the [PAUSE: 5 Seconds] tag
- Keep paragraphs focused - aim for 2-4 sentences per paragraph
```

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/generate-content-stream/index.ts` | Update `splitIntoChunks` to respect paragraph boundaries, update prompt for paragraph structure |
| `supabase/functions/google-tts/index.ts` | Add `preprocessTextForSSML` function, convert pause markers to SSML breaks, add 2s breaks at paragraph starts |

## Pause Logic Summary

```text
Paragraph 1: "Let's start with the basics..."
                                                  → [2s break]
Paragraph 2: "Now, think about this..."
             [PAUSE: 5 Seconds]                   → [5s break, no additional 2s]
Paragraph 3: "The answer is..."                   
                                                  → [2s break]
Paragraph 4: "Before we move on... [PAUSE: 5 Seconds]"
                                                  → [5s break, no additional 2s]
Paragraph 5: "Great! Now let's..."
```

## Testing Considerations

- Test with topics that have multiple reflective questions
- Verify audio pauses are audible at the right moments
- Ensure paragraph boundaries are respected in chunking
- Validate that cached transcripts still work correctly
