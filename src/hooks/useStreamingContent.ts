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
  const currentParamsRef = useRef<StreamingContentParams | null>(null);
  
  // Track saved position for voice change resume
  const savedPositionMsRef = useRef<number>(0);
  
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

  // Generate audio via TTS
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

  // Generate flashcard
  const generateFlashcard = useCallback(async (
    topicId: string,
    topicTitle: string,
    transcript: string,
    signal: AbortSignal
  ): Promise<FlashSummary | null> => {
    try {
      console.log('[StreamContent] Generating flashcard...');
      
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/generate-flashcard`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ topicId, topicTitle, transcript }),
          signal,
        }
      );

      if (!response.ok) {
        throw new Error(`Flashcard request failed: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.flashSummary) {
        console.log(`[StreamContent] Flashcard ready (status: ${data.status})`);
        return data.flashSummary;
      }
      return null;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return null;
      }
      console.error('[StreamContent] Flashcard error:', err);
      return null; // Don't throw - flashcard failure shouldn't break the flow
    }
  }, []);

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

    // Store params for retry
    currentParamsRef.current = params;

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

    const { voiceId = 'en-US-Neural2-D', speakingRate = 1.0 } = params;

    try {
      // Step 1: Generate transcript
      console.log('[StreamContent] Step 1: Calling generate-transcript...');
      
      const transcriptResponse = await fetch(
        `${SUPABASE_URL}/functions/v1/generate-transcript`,
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

      if (!transcriptResponse.ok) {
        throw new Error(`Transcript request failed: ${transcriptResponse.status}`);
      }

      const transcriptData = await transcriptResponse.json();
      
      if (!transcriptData.success || !transcriptData.transcript) {
        throw new Error(transcriptData.error || 'Failed to generate transcript');
      }

      const transcript = transcriptData.transcript;
      console.log(`[StreamContent] Transcript ready (status: ${transcriptData.status})`);

      if (isMountedRef.current) {
        setFullTranscript(transcript);
        setTranscriptReady(true);
        setIsGenerating(false);
        optionsRef.current.onTranscriptReady?.(transcript);
      }

      // Step 2: On transcript success, call flashcard AND TTS in parallel
      console.log('[StreamContent] Step 2: Calling flashcard and TTS in parallel...');
      
      if (isMountedRef.current && !mainSignal.aborted) {
        setIsAudioGenerating(true);
        
        ttsAbortControllerRef.current = new AbortController();
        
        // Run flashcard and TTS in parallel
        const [flashResult, audioResult] = await Promise.all([
          generateFlashcard(
            params.topicId,
            params.topicTitle,
            transcript,
            ttsAbortControllerRef.current.signal
          ),
          generateAudio(
            transcript,
            voiceId,
            speakingRate,
            ttsAbortControllerRef.current.signal
          )
        ]);

        // Handle flashcard result
        if (flashResult && isMountedRef.current) {
          setFlashSummary(flashResult);
        }

        // Handle audio result
        if (audioResult && isMountedRef.current) {
          setAudioBlobUrl(audioResult.blobUrl);
          setAudioDurationMs(audioResult.durationMs);
          setAudioReady(true);
          optionsRef.current.onAudioReady?.(audioResult.blobUrl, audioResult.durationMs);
        }

        if (isMountedRef.current) {
          setIsAudioGenerating(false);
        }
      }

      // Invalidate queries to refresh with new content
      queryClient.invalidateQueries({ queryKey: ['topics'] });
      queryClient.invalidateQueries({ queryKey: ['topic'] });

      // Call completion callback
      optionsRef.current.onComplete?.(transcript, flashSummary);

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
  }, [generateAudio, generateFlashcard, queryClient, audioBlobUrl, flashSummary]);

  // Retry generation with previously used params
  const retryGeneration = useCallback(() => {
    if (currentParamsRef.current) {
      console.log('[StreamContent] Retrying generation...');
      setError(null);
      startGeneration(currentParamsRef.current);
    }
  }, [startGeneration]);

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
      setError(null);
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
    retryGeneration,
    cancel,
    regenerateAudioWithVoice,
  };
};
