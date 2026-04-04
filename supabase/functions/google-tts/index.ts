import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface TTSRequest {
  text: string;
  voiceId?: string;
  speakingRate?: number;
  streaming?: boolean;
}

// Split SSML content into chunks that stay under the byte limit
// Each chunk is wrapped in <speak> tags
function splitSsmlIntoChunks(ssml: string, maxBytes: number = 4800): string[] {
  const encoder = new TextEncoder();
  
  // If already under limit, return as-is
  if (encoder.encode(ssml).length <= maxBytes) {
    return [ssml];
  }
  
  // Strip outer <speak> tags to get inner content
  const inner = ssml.replace(/^<speak>/, '').replace(/<\/speak>$/, '');
  
  // Split on break tags (natural pause points) while keeping the break with the preceding text
  const segments = inner.split(/(?<=<break[^/]*\/>)/);
  
  const chunks: string[] = [];
  let currentChunk = '';
  const wrapOverhead = encoder.encode('<speak></speak>').length;
  
  for (const segment of segments) {
    const potentialChunk = currentChunk + segment;
    const wrappedLength = encoder.encode(`<speak>${potentialChunk}</speak>`).length;
    
    if (wrappedLength > maxBytes && currentChunk) {
      chunks.push(`<speak>${currentChunk}</speak>`);
      currentChunk = segment;
    } else {
      currentChunk = potentialChunk;
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(`<speak>${currentChunk}</speak>`);
  }
  
  // Safety: if any chunk is still too large, split further at sentence boundaries
  const safeChunks: string[] = [];
  for (const chunk of chunks) {
    if (encoder.encode(chunk).length <= maxBytes) {
      safeChunks.push(chunk);
    } else {
      // Split inner content by sentences
      const innerContent = chunk.replace(/^<speak>/, '').replace(/<\/speak>$/, '');
      const sentences = innerContent.split(/(?<=[.!?])\s+/);
      let subChunk = '';
      for (const sentence of sentences) {
        const potential = subChunk + (subChunk ? ' ' : '') + sentence;
        if (encoder.encode(`<speak>${potential}</speak>`).length > maxBytes && subChunk) {
          safeChunks.push(`<speak>${subChunk}</speak>`);
          subChunk = sentence;
        } else {
          subChunk = potential;
        }
      }
      if (subChunk.trim()) {
        safeChunks.push(`<speak>${subChunk}</speak>`);
      }
    }
  }
  
  return safeChunks;
}

// Estimate duration in milliseconds based on text and speaking rate
function estimateDuration(text: string, speakingRate: number = 1.0): number {
  const words = text.split(/\s+/).length;
  const minutesAtNormalRate = words / 150;
  const actualMinutes = minutesAtNormalRate / speakingRate;
  return Math.round(actualMinutes * 60 * 1000);
}

// Escape special XML characters for SSML
function escapeXmlChars(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Strip XML-like tags (e.g., <transcript>) from text before processing
function stripXmlTags(text: string): string {
  return text.replace(/<\/?[a-zA-Z][^>]*>/g, '');
}

// Check if text contains new-style placeholder tags
function hasNewPlaceholders(text: string): boolean {
  return /\*?\*?\[(?:SIGNPOST|PROMPT|RETRIEVAL|PREDICT|TEACH)\]\*?\*?/.test(text);
}

// Process new-style placeholders into SSML
// Each placeholder wraps the NEXT sentence in the appropriate prosody/emphasis tag
function processNewPlaceholders(text: string): string {
  // Strip any XML-like tags first
  let cleaned = stripXmlTags(text);
  
  // Split by paragraphs
  const paragraphs = cleaned.split(/\n\n+/).filter(p => p.trim());
  
  const processedParagraphs = paragraphs.map((paragraph, index) => {
    let processed = paragraph;
    
    // Process each placeholder type: extract the placeholder and wrap the following sentence
    // Pattern: **[TAG]** or [TAG] followed by the next sentence
    
    // [SIGNPOST] -> <emphasis level="strong">next sentence</emphasis><break time="2000ms"/>
    processed = processed.replace(
      /\*?\*?\[SIGNPOST\]\*?\*?\s*([^.!?\n]+[.!?]?)/gi,
      (_, sentence) => `<emphasis level="strong">${escapeXmlChars(sentence.trim())}</emphasis><break time="2000ms"/>`
    );
    
    // [PROMPT] -> <prosody rate="90%" pitch="-5%">next sentence</prosody><break time="3000ms"/>
    processed = processed.replace(
      /\*?\*?\[PROMPT\]\*?\*?\s*([^.!?\n]+[.!?]?)/gi,
      (_, sentence) => `<prosody rate="90%" pitch="-5%">${escapeXmlChars(sentence.trim())}</prosody><break time="3000ms"/>`
    );
    
    // [RETRIEVAL] -> <prosody pitch="+10%" rate="105%">next sentence</prosody><break time="3000ms"/>
    processed = processed.replace(
      /\*?\*?\[RETRIEVAL\]\*?\*?\s*([^.!?\n]+[.!?]?)/gi,
      (_, sentence) => `<prosody pitch="+10%" rate="105%">${escapeXmlChars(sentence.trim())}</prosody><break time="3000ms"/>`
    );
    
    // [PREDICT] -> <prosody volume="-2dB" rate="85%">next sentence</prosody><break time="3000ms"/>
    processed = processed.replace(
      /\*?\*?\[PREDICT\]\*?\*?\s*([^.!?\n]+[.!?]?)/gi,
      (_, sentence) => `<prosody volume="-2dB" rate="85%">${escapeXmlChars(sentence.trim())}</prosody><break time="3000ms"/>`
    );
    
    // [TEACH] -> <prosody rate="95%" pitch="-1Hz">next sentence</prosody>
    processed = processed.replace(
      /\*?\*?\[TEACH\]\*?\*?\s*([^.!?\n]+[.!?]?)/gi,
      (_, sentence) => `<prosody rate="95%" pitch="-1Hz">${escapeXmlChars(sentence.trim())}</prosody>`
    );
    
    // Escape any remaining unprocessed text (text not already wrapped in SSML tags)
    // We need to escape parts that aren't already SSML
    processed = escapeRemainingText(processed);
    
    // Add paragraph break (except for first paragraph)
    if (index > 0) {
      processed = `<break time="2000ms"/>${processed}`;
    }
    
    return processed;
  });
  
  return `<speak>${processedParagraphs.join(' ')}</speak>`;
}

// Escape text segments that aren't already SSML tags
function escapeRemainingText(text: string): string {
  // Split on SSML tags, escape only non-tag parts
  const parts = text.split(/(<[^>]+>)/);
  return parts.map(part => {
    // If it's an SSML tag, keep as-is
    if (part.startsWith('<') && part.endsWith('>')) {
      return part;
    }
    // If it contains already-escaped XML entities, skip
    if (/&(?:amp|lt|gt|quot|apos);/.test(part)) {
      return part;
    }
    // Escape plain text
    return escapeXmlChars(part);
  }).join('');
}

// Legacy: Preprocess text with old [PAUSE: X Seconds] markers to SSML
function preprocessTextForSSMLLegacy(text: string): string {
  const cleanedText = stripXmlTags(text);
  const paragraphs = cleanedText.split(/\n\n+/).filter(p => p.trim());
  
  let prevEndsWithLongPause = false;
  
  const processedParagraphs = paragraphs.map((paragraph, index) => {
    const pauseMarkerRegex = /\[PAUSE:\s*(\d+)\s*(?:Seconds?|s)\]/gi;
    const pauseMarkers: { index: number; seconds: string }[] = [];
    let match;
    
    while ((match = pauseMarkerRegex.exec(paragraph)) !== null) {
      pauseMarkers.push({ index: match.index, seconds: match[1] });
    }
    
    let processed = paragraph.replace(pauseMarkerRegex, '|||PAUSE_PLACEHOLDER|||');
    processed = escapeXmlChars(processed);
    
    let placeholderIndex = 0;
    processed = processed.replace(/\|\|\|PAUSE_PLACEHOLDER\|\|\|/g, () => {
      const marker = pauseMarkers[placeholderIndex++];
      return marker ? `<break time="${marker.seconds}s"/>` : '';
    });
    
    if (index > 0 && !prevEndsWithLongPause) {
      processed = `<break time="2s"/>${processed}`;
    }
    
    prevEndsWithLongPause = /\[PAUSE:\s*[5-9]\d*\s*(?:Seconds?|s)\]\s*$/i.test(paragraph);
    
    return processed;
  });
  
  return `<speak>${processedParagraphs.join(' ')}</speak>`;
}

// Main preprocessing dispatcher
function preprocessTextForSSML(text: string): string {
  if (hasNewPlaceholders(text)) {
    console.log('[TTS] Using new placeholder SSML processing');
    return processNewPlaceholders(text);
  }
  
  console.log('[TTS] Using legacy PAUSE marker SSML processing');
  return preprocessTextForSSMLLegacy(text);
}

// Call Google Cloud TTS API for a single SSML chunk (already wrapped in <speak>)
async function synthesizeSSMLChunk(
  ssml: string,
  voiceId: string,
  speakingRate: number,
  apiKey: string
): Promise<string> {
  const encoder = new TextEncoder();
  console.log(`[TTS] Sending SSML chunk, byte length: ${encoder.encode(ssml).length}`);

  const maxAttempts = 5;
  const baseDelayMs = 250;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: { ssml },
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

    if (response.ok) {
      const data = await response.json();
      return data.audioContent;
    }

    const error = await response.text();
    const retryable = response.status === 429 || response.status === 503;

    console.error('Google TTS API error:', error);

    if (retryable && attempt < maxAttempts) {
      const retryAfter = response.headers.get('retry-after');
      const retryAfterMs = retryAfter ? Number(retryAfter) * 1000 : NaN;
      const expoMs = baseDelayMs * Math.pow(2, attempt - 1);
      const jitterMs = Math.floor(Math.random() * 150);
      const delayMs = Number.isFinite(retryAfterMs) ? retryAfterMs : expoMs + jitterMs;
      console.warn(`[TTS] Retryable error ${response.status}; retrying in ${delayMs}ms (attempt ${attempt}/${maxAttempts})`);
      await sleep(delayMs);
      continue;
    }

    throw new Error(`Google TTS API error: ${response.status} - ${error}`);
  }

  throw new Error('Google TTS API error: exhausted retries');
}

// Concatenate base64 MP3 chunks
function concatenateAudioChunks(chunks: string[]): string {
  const binaryChunks = chunks.map(chunk => {
    const binary = atob(chunk);
    return new Uint8Array(binary.length).map((_, i) => binary.charCodeAt(i));
  });

  const totalLength = binaryChunks.reduce((sum, chunk) => sum + chunk.length, 0);
  
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of binaryChunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  let binary = '';
  for (let i = 0; i < result.length; i++) {
    binary += String.fromCharCode(result[i]);
  }
  return btoa(binary);
}

// Handle streaming response
async function handleStreamingTTS(
  text: string,
  voiceId: string,
  speakingRate: number,
  apiKey: string
): Promise<Response> {
  const encoder = new TextEncoder();
  
  // Convert to SSML first, then split
  const fullSsml = preprocessTextForSSML(text);
  const chunks = splitSsmlIntoChunks(fullSsml);
  
  console.log(`[Streaming TTS] Processing ${chunks.length} SSML chunks`);
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const metadata = {
          type: 'metadata',
          totalChunks: chunks.length,
          estimatedDurationMs: estimateDuration(text, speakingRate)
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(metadata)}\n\n`));
        
        for (let i = 0; i < chunks.length; i++) {
          console.log(`[Streaming TTS] Processing chunk ${i + 1}/${chunks.length}`);
          
          const audioContent = await synthesizeSSMLChunk(chunks[i], voiceId, speakingRate, apiKey);
          await sleep(150);
          
          const chunkData = {
            type: 'audio',
            chunkIndex: i,
            totalChunks: chunks.length,
            audioContent,
            chunkDurationMs: estimateDuration(text, speakingRate) / chunks.length
          };
          
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunkData)}\n\n`));
        }
        
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
        controller.close();
      } catch (error) {
        console.error('[Streaming TTS] Error:', error);
        const errorData = {
          type: 'error',
          message: error instanceof Error ? error.message : 'Unknown error'
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorData)}\n\n`));
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('GOOGLE_API_KEY');
    if (!apiKey) {
      console.error('GOOGLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Google API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { text, voiceId = 'en-US-Neural2-D', speakingRate = 1.0, streaming = false }: TTSRequest = await req.json();

    if (!text || typeof text !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const rate = Math.max(0.5, Math.min(2.0, speakingRate));

    console.log(`Processing TTS request: voiceId=${voiceId}, rate=${rate}, textLength=${text.length}, streaming=${streaming}`);

    if (streaming) {
      return handleStreamingTTS(text, voiceId, rate, apiKey);
    }

    // Convert to SSML first, then split into safe chunks
    const fullSsml = preprocessTextForSSML(text);
    const ssmlChunks = splitSsmlIntoChunks(fullSsml);
    
    let audioContent: string;

    if (ssmlChunks.length === 1) {
      console.log('Single SSML chunk request');
      audioContent = await synthesizeSSMLChunk(ssmlChunks[0], voiceId, rate, apiKey);
    } else {
      console.log(`Split into ${ssmlChunks.length} SSML chunks`);

      const audioChunks: string[] = [];
      for (let i = 0; i < ssmlChunks.length; i++) {
        console.log(`Processing chunk ${i + 1}/${ssmlChunks.length}`);
        const chunkAudio = await synthesizeSSMLChunk(ssmlChunks[i], voiceId, rate, apiKey);
        audioChunks.push(chunkAudio);
        await sleep(150);
      }

      audioContent = concatenateAudioChunks(audioChunks);
    }

    const durationMs = estimateDuration(text, rate);

    console.log(`TTS complete: durationMs=${durationMs}`);

    return new Response(
      JSON.stringify({ audioContent, durationMs }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('TTS error:', error);

    const msg = error instanceof Error ? error.message : '';
    const isRateLimit = typeof msg === 'string' && msg.startsWith('Google TTS API error: 429');
    const status = isRateLimit ? 429 : 500;

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
