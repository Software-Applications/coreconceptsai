import { useState, useRef, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface StreamingChunk {
  index: number;
  text: string;
  audioReady: boolean;
  audioBlobUrl?: string;
}

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
  onFirstChunkAudioReady?: (blobUrl: string) => void;
  onChunkAudioReady?: (chunkIndex: number, blobUrl: string) => void;
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
  const [isStreaming, setIsStreaming] = useState(false);
  const [chunks, setChunks] = useState<StreamingChunk[]>([]);
  const [firstChunkReady, setFirstChunkReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [flashSummary, setFlashSummary] = useState<FlashSummary | null>(null);
  const [fullTranscript, setFullTranscript] = useState<string>('');

  const abortControllerRef = useRef<AbortController | null>(null);
  const optionsRef = useRef(options);
  const pendingTTSRef = useRef<Map<number, AbortController>>(new Map());
  const audioQueueRef = useRef<string[]>([]);
  
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

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

  // Generate audio for a transcript chunk
  const generateAudioForChunk = useCallback(async (
    chunkIndex: number,
    text: string,
    voiceId: string,
    speakingRate: number,
    signal: AbortSignal
  ): Promise<string | null> => {
    try {
      console.log(`[StreamContent] Generating audio for chunk ${chunkIndex}`);
      
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
            streaming: false // Use non-streaming for individual chunks
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
        console.log(`[StreamContent] Audio ready for chunk ${chunkIndex}`);
        return blobUrl;
      }
      return null;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return null;
      }
      console.error(`[StreamContent] TTS error for chunk ${chunkIndex}:`, err);
      throw err;
    }
  }, [base64ToBlobUrl]);

  const startStreaming = useCallback(async (params: StreamingContentParams) => {
    // Cancel any existing streaming
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    pendingTTSRef.current.forEach(controller => controller.abort());
    pendingTTSRef.current.clear();
    
    abortControllerRef.current = new AbortController();
    const mainSignal = abortControllerRef.current.signal;

    // Reset state
    setIsStreaming(true);
    setChunks([]);
    setFirstChunkReady(false);
    setProgress(0);
    setError(null);
    setFlashSummary(null);
    setFullTranscript('');
    audioQueueRef.current = [];

    const { voiceId = 'en-US-Neural2-D', speakingRate = 1.0 } = params;

    try {
      console.log('[StreamContent] Starting streaming generation...');
      
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
      let totalChunks = 0;
      let completedAudioChunks = 0;

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
            
            if (data.type === 'chunk') {
              const chunkIndex = data.index;
              const chunkText = data.text;
              const isLast = data.isLast;
              const isCached = data.cached || false;
              
              if (isCached) {
                console.log(`[StreamContent] Using cached chunk ${chunkIndex}`);
              }
              
              console.log(`[StreamContent] Received transcript chunk ${chunkIndex}${isLast ? ' (last)' : ''}`);
              
              // Add chunk to state
              setChunks(prev => {
                const updated = [...prev];
                updated[chunkIndex] = {
                  index: chunkIndex,
                  text: chunkText,
                  audioReady: false,
                };
                return updated;
              });

              // Update expected total chunks
              if (isLast) {
                totalChunks = chunkIndex + 1;
              }

              // Start TTS generation for this chunk immediately
              const ttsController = new AbortController();
              pendingTTSRef.current.set(chunkIndex, ttsController);

              generateAudioForChunk(chunkIndex, chunkText, voiceId, speakingRate, ttsController.signal)
                .then((blobUrl) => {
                  if (blobUrl && !mainSignal.aborted) {
                    audioQueueRef.current[chunkIndex] = blobUrl;
                    completedAudioChunks++;

                    // Update chunk state with audio
                    setChunks(prev => {
                      const updated = [...prev];
                      if (updated[chunkIndex]) {
                        updated[chunkIndex] = {
                          ...updated[chunkIndex],
                          audioReady: true,
                          audioBlobUrl: blobUrl,
                        };
                      }
                      return updated;
                    });

                    // Update progress
                    if (totalChunks > 0) {
                      setProgress((completedAudioChunks / totalChunks) * 100);
                    }

                    // First chunk ready - trigger callback
                    if (chunkIndex === 0) {
                      setFirstChunkReady(true);
                      optionsRef.current.onFirstChunkAudioReady?.(blobUrl);
                    } else {
                      optionsRef.current.onChunkAudioReady?.(chunkIndex, blobUrl);
                    }
                  }
                  pendingTTSRef.current.delete(chunkIndex);
                })
                .catch((err) => {
                  if (err.name !== 'AbortError') {
                    console.error(`[StreamContent] Audio generation failed for chunk ${chunkIndex}:`, err);
                  }
                  pendingTTSRef.current.delete(chunkIndex);
                });

            } else if (data.type === 'summary') {
              console.log('[StreamContent] Received flash summary');
              setFlashSummary(data.flashSummary);
            } else if (data.type === 'done') {
              console.log('[StreamContent] Streaming complete');
              setFullTranscript(data.fullTranscript);
              
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

      // Wait for all pending TTS to complete
      await Promise.allSettled(
        Array.from(pendingTTSRef.current.values()).map(
          controller => new Promise(resolve => {
            const checkInterval = setInterval(() => {
              if (!pendingTTSRef.current.has(controller as unknown as number)) {
                clearInterval(checkInterval);
                resolve(undefined);
              }
            }, 100);
          })
        )
      );

      setIsStreaming(false);
      setProgress(100);
      
      // Call completion callback
      optionsRef.current.onComplete?.(fullTranscript, flashSummary);

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('[StreamContent] Streaming cancelled');
        return;
      }
      
      console.error('[StreamContent] Error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Streaming failed';
      setError(errorMessage);
      setIsStreaming(false);
      optionsRef.current.onError?.(errorMessage);
    }
  }, [generateAudioForChunk, queryClient]);

  const cancel = useCallback(() => {
    console.log('[StreamContent] Cancelling...');
    abortControllerRef.current?.abort();
    pendingTTSRef.current.forEach(controller => controller.abort());
    pendingTTSRef.current.clear();
    
    // Revoke blob URLs
    audioQueueRef.current.forEach(url => {
      if (url) URL.revokeObjectURL(url);
    });
    audioQueueRef.current = [];
    
    setIsStreaming(false);
    setFirstChunkReady(false);
    setProgress(0);
    setChunks([]);
  }, []);

  // Regenerate audio for all available chunks with a new voice
  const regenerateAudioWithVoice = useCallback(async (
    newVoiceId: string,
    speakingRate: number = 1.0,
    onFirstChunkReady?: (blobUrl: string) => void,
    onChunkReady?: (chunkIndex: number, blobUrl: string) => void
  ) => {
    // Cancel any pending TTS requests
    pendingTTSRef.current.forEach(controller => controller.abort());
    pendingTTSRef.current.clear();
    
    // Revoke old blob URLs
    audioQueueRef.current.forEach(url => {
      if (url) URL.revokeObjectURL(url);
    });
    audioQueueRef.current = [];
    
    // Get current chunks with text
    const currentChunks = chunks.filter(c => c.text);
    if (currentChunks.length === 0) {
      console.log('[StreamContent] No chunks to regenerate');
      return;
    }
    
    console.log(`[StreamContent] Regenerating audio for ${currentChunks.length} chunks with voice: ${newVoiceId}`);
    
    // Reset audio ready state for all chunks
    setChunks(prev => prev.map(c => ({ ...c, audioReady: false, audioBlobUrl: undefined })));
    setFirstChunkReady(false);
    setProgress(0);
    
    let completedChunks = 0;
    const totalChunks = currentChunks.length;
    
    // Generate audio for each chunk
    for (let i = 0; i < currentChunks.length; i++) {
      const chunk = currentChunks[i];
      const ttsController = new AbortController();
      pendingTTSRef.current.set(i, ttsController);
      
      try {
        const blobUrl = await generateAudioForChunk(
          i,
          chunk.text,
          newVoiceId,
          speakingRate,
          ttsController.signal
        );
        
        if (blobUrl) {
          audioQueueRef.current[i] = blobUrl;
          completedChunks++;
          
          // Update chunk state
          setChunks(prev => {
            const updated = [...prev];
            if (updated[i]) {
              updated[i] = { ...updated[i], audioReady: true, audioBlobUrl: blobUrl };
            }
            return updated;
          });
          
          // Update progress
          setProgress((completedChunks / totalChunks) * 100);
          
          // First chunk callback
          if (i === 0) {
            setFirstChunkReady(true);
            onFirstChunkReady?.(blobUrl);
          } else {
            onChunkReady?.(i, blobUrl);
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error(`[StreamContent] Voice regeneration error for chunk ${i}:`, err);
        }
      } finally {
        pendingTTSRef.current.delete(i);
      }
    }
    
    console.log('[StreamContent] Voice regeneration complete');
  }, [chunks, generateAudioForChunk]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  return {
    isStreaming,
    chunks,
    firstChunkReady,
    progress,
    error,
    flashSummary,
    fullTranscript,
    audioQueue: audioQueueRef.current,
    startStreaming,
    cancel,
    regenerateAudioWithVoice,
  };
};
