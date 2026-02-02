import { useState, useRef, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface FlashSummary {
  id: string;
  topic_id: string;
  visual_type: string;
  visual_content: string;
  bullet_points: string[];
  difficulty: string;
  ai_generated: boolean;
}

interface UseStreamingContentOptions {
  onTranscriptReady?: (transcript: string) => void;
  onAudioReady?: (blobUrl: string, durationMs: number) => void;
  onComplete?: (fullTranscript: string, flashSummary: FlashSummary | null) => void;
  onError?: (error: string) => void;
}

interface StreamingContentParams {
  topicId: string;
  topicTitle: string;
  topicDescription?: string;
  subjectName?: string;
  voiceId?: string;
  speakingRate?: number;
  forceRegenerate?: boolean;
}

const SUPABASE_URL = "https://uzlkbqfxlamwetmvpqsi.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6bGticWZ4bGFtd2V0bXZwcXNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MTk5NzQsImV4cCI6MjA4NTE5NTk3NH0.3plzfmm6lf5XkVEHFpkRaWrGCekKK0BVTf4qxUJR7kY";

export const useStreamingContent = (options: UseStreamingContentOptions = {}) => {
  const queryClient = useQueryClient();
  
  // Generation states
  const [isGenerating, setIsGenerating] = useState(false);      // True while transcript is being generated
  const [isAudioGenerating, setIsAudioGenerating] = useState(false); // True while TTS is running
  const [transcriptReady, setTranscriptReady] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  
  // Content
  const [fullTranscript, setFullTranscript] = useState<string>('');
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const [audioDurationMs, setAudioDurationMs] = useState<number>(0);
  const [flashSummary, setFlashSummary] = useState<FlashSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const abortControllerRef = useRef<AbortController | null>(null);
  const ttsAbortControllerRef = useRef<AbortController | null>(null);
  const optionsRef = useRef(options);
  const isMountedRef = useRef(true);
  const audioBlobUrlRef = useRef<string | null>(null);
  
  // Track saved position for voice change resume
  const savedPositionMsRef = useRef<number>(0);
  const wasPlayingRef = useRef<boolean>(false);
  
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // Keep ref in sync with state for stable cleanup
  useEffect(() => {
    audioBlobUrlRef.current = audioBlobUrl;
  }, [audioBlobUrl]);

  // Convert base64 to blob URL
  const base64ToBlobUrl = useCallback((base64: string): string => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'audio/mpeg' });
    return URL.createObjectURL(blob);
  }, []);

  // Generate audio for full transcript
  const generateAudio = useCallback(async (
    text: string,
    voiceId: string,
    speakingRate: number,
    signal: AbortSignal
  ): Promise<{ blobUrl: string; durationMs: number } | null> => {
    try {
      console.log(`[StreamContent] Generating audio for full transcript (${text.length} chars)`);
      
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/google-tts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ 
            text, 
            voiceId, 
            speakingRate,
            streaming: false
          }),
          signal,
        }
      );

      if (!response.ok) {
        throw new Error(`TTS request failed: ${response.status}`);
      }

      const data = await response.json();
      if (data.audioContent) {
        const blobUrl = base64ToBlobUrl(data.audioContent);
        const durationMs = data.durationMs || 0;
        console.log(`[StreamContent] Audio ready: ${durationMs}ms`);
        return { blobUrl, durationMs };
      }
      return null;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return null;
      }
      console.error('[StreamContent] TTS error:', err);
      throw err;
    }
  }, [base64ToBlobUrl]);

  const startGeneration = useCallback(async (params: StreamingContentParams) => {
    // Cancel any existing generation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (ttsAbortControllerRef.current) {
      ttsAbortControllerRef.current.abort();
    }
    
    // Revoke old blob URL
    if (audioBlobUrl) {
      URL.revokeObjectURL(audioBlobUrl);
    }
    
    abortControllerRef.current = new AbortController();
    const mainSignal = abortControllerRef.current.signal;

    // Reset state
    setIsGenerating(true);
    setIsAudioGenerating(false);
    setTranscriptReady(false);
    setAudioReady(false);
    setError(null);
    setFlashSummary(null);
    setFullTranscript('');
    setAudioBlobUrl(null);
    setAudioDurationMs(0);
    savedPositionMsRef.current = 0;
    wasPlayingRef.current = false;

    const { voiceId = 'en-US-Neural2-D', speakingRate = 1.0 } = params;

    try {
      console.log('[StreamContent] Starting generation...');
      
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/generate-content-stream`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            topicId: params.topicId,
            topicTitle: params.topicTitle,
            topicDescription: params.topicDescription,
            subjectName: params.subjectName,
            forceRegenerate: params.forceRegenerate || false,
          }),
          signal: mainSignal,
        }
      );

      if (!response.ok) {
        throw new Error(`Streaming request failed: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';
      let transcript = '';
      let summary: FlashSummary | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          
          try {
            const data = JSON.parse(line.slice(6));
            
            if (data.type === 'transcript') {
              // Full transcript received
              transcript = data.text;
              console.log('[StreamContent] Received full transcript');
              
              if (isMountedRef.current) {
                setFullTranscript(transcript);
                setTranscriptReady(true);
                setIsGenerating(false);
                optionsRef.current.onTranscriptReady?.(transcript);
              }
              
              // Start TTS generation immediately
              if (isMountedRef.current && !mainSignal.aborted) {
                setIsAudioGenerating(true);
                
                ttsAbortControllerRef.current = new AbortController();
                
                try {
                  const audioResult = await generateAudio(
                    transcript,
                    voiceId,
                    speakingRate,
                    ttsAbortControllerRef.current.signal
                  );
                  
                  if (audioResult && isMountedRef.current) {
                    setAudioBlobUrl(audioResult.blobUrl);
                    setAudioDurationMs(audioResult.durationMs);
                    setAudioReady(true);
                    optionsRef.current.onAudioReady?.(audioResult.blobUrl, audioResult.durationMs);
                  }
                } catch (ttsErr) {
                  if (ttsErr instanceof Error && ttsErr.name !== 'AbortError') {
                    console.error('[StreamContent] TTS generation failed:', ttsErr);
                    if (isMountedRef.current) {
                      setError('Audio generation failed');
                    }
                  }
                } finally {
                  if (isMountedRef.current) {
                    setIsAudioGenerating(false);
                  }
                }
              }
              
            } else if (data.type === 'summary') {
              console.log('[StreamContent] Received flash summary');
              summary = data.flashSummary;
              if (isMountedRef.current) {
                setFlashSummary(summary);
              }
            } else if (data.type === 'done') {
              console.log('[StreamContent] Generation complete');
              
              // Invalidate queries to refresh with new content
              queryClient.invalidateQueries({ queryKey: ['topics'] });
              queryClient.invalidateQueries({ queryKey: ['topic'] });
            } else if (data.type === 'error') {
              throw new Error(data.message);
            }
          } catch (parseError) {
            if (parseError instanceof Error && parseError.name !== 'AbortError') {
              console.warn('[StreamContent] Failed to parse SSE event:', parseError);
            }
          }
        }
      }
      
      // Call completion callback
      optionsRef.current.onComplete?.(transcript, summary);

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('[StreamContent] Generation cancelled');
        return;
      }
      
      console.error('[StreamContent] Error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Generation failed';
      if (isMountedRef.current) {
        setError(errorMessage);
        setIsGenerating(false);
        setIsAudioGenerating(false);
      }
      optionsRef.current.onError?.(errorMessage);
    }
  }, [generateAudio, queryClient, audioBlobUrl]);

  const cancel = useCallback(() => {
    console.log('[StreamContent] Cancelling...');
    abortControllerRef.current?.abort();
    ttsAbortControllerRef.current?.abort();
    
    // Revoke blob URL using ref for stable function
    if (audioBlobUrlRef.current) {
      URL.revokeObjectURL(audioBlobUrlRef.current);
      audioBlobUrlRef.current = null;
    }
    
    if (isMountedRef.current) {
      setIsGenerating(false);
      setIsAudioGenerating(false);
      setTranscriptReady(false);
      setAudioReady(false);
      setAudioBlobUrl(null);
      setFullTranscript('');
    }
  }, []);

  // Regenerate audio with a new voice, optionally resuming from a position
  const regenerateAudioWithVoice = useCallback(async (
    newVoiceId: string,
    speakingRate: number = 1.0,
    resumeFromMs: number = 0
  ): Promise<{ blobUrl: string; durationMs: number } | null> => {
    if (!fullTranscript) {
      console.log('[StreamContent] No transcript to regenerate audio for');
      return null;
    }
    
    // Save resume position
    savedPositionMsRef.current = resumeFromMs;
    
    // Cancel any pending TTS
    if (ttsAbortControllerRef.current) {
      ttsAbortControllerRef.current.abort();
    }
    
    // Revoke old blob URL
    if (audioBlobUrl) {
      URL.revokeObjectURL(audioBlobUrl);
    }
    
    console.log(`[StreamContent] Regenerating audio with voice: ${newVoiceId}, resume from: ${resumeFromMs}ms`);
    
    if (isMountedRef.current) {
      setIsAudioGenerating(true);
      setAudioReady(false);
      setAudioBlobUrl(null);
    }
    
    ttsAbortControllerRef.current = new AbortController();
    
    try {
      const audioResult = await generateAudio(
        fullTranscript,
        newVoiceId,
        speakingRate,
        ttsAbortControllerRef.current.signal
      );
      
      if (audioResult && isMountedRef.current) {
        setAudioBlobUrl(audioResult.blobUrl);
        setAudioDurationMs(audioResult.durationMs);
        setAudioReady(true);
        setIsAudioGenerating(false);
        optionsRef.current.onAudioReady?.(audioResult.blobUrl, audioResult.durationMs);
        return audioResult;
      }
      return null;
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('[StreamContent] Voice regeneration error:', err);
        if (isMountedRef.current) {
          setError('Audio generation failed');
          setIsAudioGenerating(false);
        }
      }
      return null;
    }
  }, [fullTranscript, audioBlobUrl, generateAudio]);

  // Cleanup on unmount only (stable effect)
  useEffect(() => {
    return () => {
      // Direct cleanup without calling cancel to avoid dependency issues
      abortControllerRef.current?.abort();
      ttsAbortControllerRef.current?.abort();
      if (audioBlobUrlRef.current) {
        URL.revokeObjectURL(audioBlobUrlRef.current);
      }
    };
  }, []);

  return {
    // States
    isGenerating,
    isAudioGenerating,
    transcriptReady,
    audioReady,
    
    // Content
    fullTranscript,
    audioBlobUrl,
    audioDurationMs,
    flashSummary,
    error,
    
    // Saved position for voice change resume
    savedPositionMs: savedPositionMsRef.current,
    
    // Actions
    startGeneration,
    cancel,
    regenerateAudioWithVoice,
  };
};
