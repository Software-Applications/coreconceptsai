import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface TTSRequest {
  text: string;
  voiceId?: string;
  speakingRate?: number;
}

interface TTSResponse {
  audioContent: string;
  durationMs: number;
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
  // Average speaking rate is ~150 words per minute at 1.0x
  // Adjusted for speaking rate
  const words = text.split(/\s+/).length;
  const minutesAtNormalRate = words / 150;
  const actualMinutes = minutesAtNormalRate / speakingRate;
  return Math.round(actualMinutes * 60 * 1000); // Convert to milliseconds
}

// Call Google Cloud TTS API for a single chunk
async function synthesizeChunk(
  text: string,
  voiceId: string,
  speakingRate: number,
  apiKey: string
): Promise<string> {
  const response = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: { text },
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

// Concatenate base64 MP3 chunks (simple approach - just join them)
// Note: For proper concatenation, you'd need to decode, concatenate raw audio, and re-encode
// This simplified approach works because MP3 is a streaming format
function concatenateAudioChunks(chunks: string[]): string {
  // For MP3, we can decode each chunk and concatenate the binary data
  const binaryChunks = chunks.map(chunk => {
    const binary = atob(chunk);
    return new Uint8Array(binary.length).map((_, i) => binary.charCodeAt(i));
  });

  // Calculate total length
  const totalLength = binaryChunks.reduce((sum, chunk) => sum + chunk.length, 0);
  
  // Concatenate all chunks
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of binaryChunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  // Convert back to base64
  let binary = '';
  for (let i = 0; i < result.length; i++) {
    binary += String.fromCharCode(result[i]);
  }
  return btoa(binary);
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

    const { text, voiceId = 'en-US-Neural2-D', speakingRate = 1.0 }: TTSRequest = await req.json();

    if (!text || typeof text !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate speaking rate
    const rate = Math.max(0.5, Math.min(2.0, speakingRate));

    console.log(`Processing TTS request: voiceId=${voiceId}, rate=${rate}, textLength=${text.length}`);

    // Check if we need to chunk the text
    const encoder = new TextEncoder();
    const textBytes = encoder.encode(text).length;

    let audioContent: string;

    if (textBytes <= 4500) {
      // Single request
      console.log('Single chunk request');
      audioContent = await synthesizeChunk(text, voiceId, rate, apiKey);
    } else {
      // Split into chunks and process
      const chunks = splitTextIntoChunks(text);
      console.log(`Split into ${chunks.length} chunks`);

      const audioChunks: string[] = [];
      for (let i = 0; i < chunks.length; i++) {
        console.log(`Processing chunk ${i + 1}/${chunks.length}`);
        const chunkAudio = await synthesizeChunk(chunks[i], voiceId, rate, apiKey);
        audioChunks.push(chunkAudio);
      }

      // Concatenate all audio chunks
      audioContent = concatenateAudioChunks(audioChunks);
    }

    const durationMs = estimateDuration(text, rate);

    const response: TTSResponse = {
      audioContent,
      durationMs,
    };

    console.log(`TTS complete: durationMs=${durationMs}`);

    return new Response(
      JSON.stringify(response),
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
