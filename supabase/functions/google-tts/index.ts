import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface TTSRequest {
  text: string;
  voiceId?: string;
  speakingRate?: number;
  streaming?: boolean;
}

// Split text at sentence boundaries for chunking
function splitTextIntoChunks(text: string, maxBytes: number = 4500): string[] {
  const encoder = new TextEncoder();
  const chunks: string[] = [];
  let currentChunk = '';

  // Split by sentences (period, question mark, exclamation mark followed by space)
  const sentences = text.split(/(?<=[.!?])\s+/);

  for (const sentence of sentences) {
    const potentialChunk = currentChunk ? `${currentChunk} ${sentence}` : sentence;
    const byteLength = encoder.encode(potentialChunk).length;

    if (byteLength > maxBytes && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk = potentialChunk;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

// Estimate duration in milliseconds based on text and speaking rate
function estimateDuration(text: string, speakingRate: number = 1.0): number {
  const words = text.split(/\s+/).length;
  const minutesAtNormalRate = words / 150;
  const actualMinutes = minutesAtNormalRate / speakingRate;
  return Math.round(actualMinutes * 60 * 1000);
}

// Preprocess text to SSML with pause handling
function preprocessTextForSSML(text: string): string {
  // Split by paragraphs (double newlines)
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim());
  
  // Track if previous paragraph ended with a long pause (5+ seconds)
  let prevEndsWithLongPause = false;
  
  const processedParagraphs = paragraphs.map((paragraph, index) => {
    let processed = paragraph;
    
    // Convert [PAUSE: X Seconds] to SSML breaks
    processed = processed.replace(
      /\[PAUSE:\s*(\d+)\s*(?:Seconds?|s)\]/gi,
      (_, seconds) => `<break time="${seconds}s"/>`
    );
    
    // Add 2s break at paragraph start (if not first paragraph)
    // Only add if the previous paragraph didn't end with a 5s+ break
    if (index > 0 && !prevEndsWithLongPause) {
      processed = `<break time="2s"/>${processed}`;
    }
    
    // Check if this paragraph ends with a long pause for next iteration
    prevEndsWithLongPause = /\[PAUSE:\s*[5-9]\d*\s*(?:Seconds?|s)\]\s*$/i.test(paragraph);
    
    return processed;
  });
  
  return `<speak>${processedParagraphs.join(' ')}</speak>`;
}

// Call Google Cloud TTS API for a single chunk using SSML
async function synthesizeChunk(
  text: string,
  voiceId: string,
  speakingRate: number,
  apiKey: string
): Promise<string> {
  // Preprocess text to SSML with pause handling
  const ssmlText = preprocessTextForSSML(text);
  
  console.log(`[TTS] Processing chunk with SSML, length: ${ssmlText.length}`);
  
  const response = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: { ssml: ssmlText },
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

  if (!response.ok) {
    const error = await response.text();
    console.error('Google TTS API error:', error);
    throw new Error(`Google TTS API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.audioContent;
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

// Handle streaming response - sends chunks as they're generated
async function handleStreamingTTS(
  text: string,
  voiceId: string,
  speakingRate: number,
  apiKey: string
): Promise<Response> {
  const encoder = new TextEncoder();
  const chunks = splitTextIntoChunks(text);
  
  console.log(`[Streaming TTS] Processing ${chunks.length} chunks`);
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Send initial metadata
        const metadata = {
          type: 'metadata',
          totalChunks: chunks.length,
          estimatedDurationMs: estimateDuration(text, speakingRate)
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(metadata)}\n\n`));
        
        // Process and send each chunk as it's ready
        for (let i = 0; i < chunks.length; i++) {
          console.log(`[Streaming TTS] Processing chunk ${i + 1}/${chunks.length}`);
          
          const audioContent = await synthesizeChunk(chunks[i], voiceId, speakingRate, apiKey);
          
          const chunkData = {
            type: 'audio',
            chunkIndex: i,
            totalChunks: chunks.length,
            audioContent,
            chunkDurationMs: estimateDuration(chunks[i], speakingRate)
          };
          
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunkData)}\n\n`));
        }
        
        // Send completion signal
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
  // Handle CORS preflight requests
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

    // Validate speaking rate
    const rate = Math.max(0.5, Math.min(2.0, speakingRate));

    console.log(`Processing TTS request: voiceId=${voiceId}, rate=${rate}, textLength=${text.length}, streaming=${streaming}`);

    // Use streaming mode for faster initial playback
    if (streaming) {
      return handleStreamingTTS(text, voiceId, rate, apiKey);
    }

    // Non-streaming mode - return complete audio
    const encoder = new TextEncoder();
    const textBytes = encoder.encode(text).length;

    let audioContent: string;

    if (textBytes <= 4500) {
      console.log('Single chunk request');
      audioContent = await synthesizeChunk(text, voiceId, rate, apiKey);
    } else {
      const chunks = splitTextIntoChunks(text);
      console.log(`Split into ${chunks.length} chunks`);

      const audioChunks: string[] = [];
      for (let i = 0; i < chunks.length; i++) {
        console.log(`Processing chunk ${i + 1}/${chunks.length}`);
        const chunkAudio = await synthesizeChunk(chunks[i], voiceId, rate, apiKey);
        audioChunks.push(chunkAudio);
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
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
