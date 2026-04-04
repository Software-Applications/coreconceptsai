import { useState, useRef, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface UseStreamingContentOptions {
  onTranscriptReady?: (transcript: string) => void;
  onAudioReady?: (blobUrl: string, durationMs: number) => void;
  onComplete?: (fullTranscript: string) => void;
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
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAudioGenerating, setIsAudioGenerating] = useState(false);
  const [transcriptReady, setTranscriptReady] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  
  const [fullTranscript, setFullTranscript] = useState<string>('');
  const [ssmlTranscript, setSsmlTranscript] = useState<string | null>(null);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const [audioDurationMs, setAudioDurationMs] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const ttsAbortControllerRef = useRef<AbortController | null>(null);
  const optionsRef = useRef(options);
  const isMountedRef = useRef(true);
  const audioBlobUrlRef = useRef<string | null>(null);
  const currentParamsRef = useRef<StreamingContentParams | null>(null);
  
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

  useEffect(() => {
    audioBlobUrlRef.current = audioBlobUrl;
  }, [audioBlobUrl]);

  const base64ToBlobUrl = useCallback((base64: string): string => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'audio/mpeg' });
    return URL.createObjectURL(blob);
  }, []);

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
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (ttsAbortControllerRef.current) {
      ttsAbortControllerRef.current.abort();
    }
    
    if (audioBlobUrl) {
      URL.revokeObjectURL(audioBlobUrl);
    }
    
    abortControllerRef.current = new AbortController();
    const mainSignal = abortControllerRef.current.signal;

    currentParamsRef.current = params;

    setIsGenerating(true);
    setIsAudioGenerating(false);
    setTranscriptReady(false);
    setAudioReady(false);
    setError(null);
    setFullTranscript('');
    setSsmlTranscript(null);
    setAudioBlobUrl(null);
    setAudioDurationMs(0);
    savedPositionMsRef.current = 0;

    const { voiceId = 'en-US-Neural2-D', speakingRate = 1.0 } = params;

    try {
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
      const ssmlText = transcriptData.ssmlTranscript || null;
      console.log(`[StreamContent] Transcript ready (status: ${transcriptData.status}), has SSML: ${!!ssmlText}`);

      if (isMountedRef.current) {
        setFullTranscript(transcript);
        setSsmlTranscript(ssmlText);
        setTranscriptReady(true);
        setIsGenerating(false);
        optionsRef.current.onTranscriptReady?.(transcript);
      }

      // Step 2: Generate TTS audio
      console.log('[StreamContent] Step 2: Generating TTS audio...');
      
      if (isMountedRef.current && !mainSignal.aborted) {
        setIsAudioGenerating(true);
        
        ttsAbortControllerRef.current = new AbortController();
        
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

        if (isMountedRef.current) {
          setIsAudioGenerating(false);
        }
      }

      queryClient.invalidateQueries({ queryKey: ['topics'] });
      queryClient.invalidateQueries({ queryKey: ['topic'] });

      optionsRef.current.onComplete?.(transcript);

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

  const regenerateAudioWithVoice = useCallback(async (
    newVoiceId: string,
    speakingRate: number = 1.0,
    resumeFromMs: number = 0
  ): Promise<{ blobUrl: string; durationMs: number } | null> => {
    if (!fullTranscript) {
      console.log('[StreamContent] No transcript to regenerate audio for');
      return null;
    }
    
    savedPositionMsRef.current = resumeFromMs;
    
    if (ttsAbortControllerRef.current) {
      ttsAbortControllerRef.current.abort();
    }
    
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

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      ttsAbortControllerRef.current?.abort();
      if (audioBlobUrlRef.current) {
        URL.revokeObjectURL(audioBlobUrlRef.current);
      }
    };
  }, []);

  return {
    isGenerating,
    isAudioGenerating,
    transcriptReady,
    audioReady,
    
    fullTranscript,
    audioBlobUrl,
    audioDurationMs,
    error,
    
    savedPositionMs: savedPositionMsRef.current,
    
    startGeneration,
    retryGeneration,
    cancel,
    regenerateAudioWithVoice,
  };
};
