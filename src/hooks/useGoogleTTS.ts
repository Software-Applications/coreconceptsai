import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSpeechSynthesis } from './useSpeechSynthesis';

interface UseGoogleTTSOptions {
  onEnd?: () => void;
  onProgress?: (charIndex: number, progress: number) => void;
}

interface AudioCacheEntry {
  blobUrl: string;
  durationMs: number;
}

export const useGoogleTTS = (options: UseGoogleTTSOptions = {}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [useFallback, setUseFallback] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCache = useRef<Map<string, AudioCacheEntry>>(new Map());
  const currentTextRef = useRef<string>('');
  const currentCacheKeyRef = useRef<string>('');
  const optionsRef = useRef(options);
  const useFallbackRef = useRef(useFallback);
  const playbackRateRef = useRef(playbackRate);
  
  // Session ID to track active playback session and ignore stale callbacks
  const sessionIdRef = useRef<number>(0);
  // Abort controller for cancelling in-flight streaming requests
  const abortControllerRef = useRef<AbortController | null>(null);

  // Keep refs updated
  useEffect(() => {
    useFallbackRef.current = useFallback;
  }, [useFallback]);

  useEffect(() => {
    playbackRateRef.current = playbackRate;
  }, [playbackRate]);

  // Fallback to browser speech synthesis
  const speechSynthesis = useSpeechSynthesis({
    onEnd: options.onEnd,
    onProgress: options.onProgress,
  });
  
  // Store speech synthesis methods in refs for stable callbacks
  const speechSynthesisRef = useRef(speechSynthesis);
  useEffect(() => {
    speechSynthesisRef.current = speechSynthesis;
  }, [speechSynthesis]);

  // Keep options ref updated
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      // Revoke all cached blob URLs
      audioCache.current.forEach((entry) => {
        URL.revokeObjectURL(entry.blobUrl);
      });
      audioCache.current.clear();
    };
  }, []);

  // Store position to resume from after voice change
  const savedPositionRef = useRef<{ charIndex: number; wasPlaying: boolean } | null>(null);

  // Generate cache key from text and voice - use more unique identifier
  const getCacheKey = useCallback((text: string, voiceId: string) => {
    // Include voiceId, text length, and a checksum of text content
    const textChecksum = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return `${voiceId}:${text.length}:${textChecksum}`;
  }, []);

  // Clear cached audio for a specific voice or all, optionally saving position to resume
  const clearCache = useCallback((voiceId?: string, savePosition: boolean = false) => {
    console.log(`[TTS] Clearing cache${voiceId ? ` for voice: ${voiceId}` : ' (all voices)'}${savePosition ? ' (saving position)' : ''}`);
    
    // Save current position before clearing if requested
    if (savePosition && audioRef.current && currentTextRef.current.length > 0) {
      const currentProgress = audioRef.current.currentTime / (audioRef.current.duration || 1);
      const charIndex = Math.floor(currentProgress * currentTextRef.current.length);
      savedPositionRef.current = {
        charIndex,
        wasPlaying: !audioRef.current.paused
      };
      console.log(`[TTS] Saved position: charIndex=${charIndex}, wasPlaying=${savedPositionRef.current.wasPlaying}`);
    }
    
    // Stop current audio to prevent it from trying to use revoked blob URLs
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = ''; // Clear source before revoking
      audioRef.current = null;
    }
    
    if (voiceId) {
      // Clear only entries for specific voice
      audioCache.current.forEach((entry, key) => {
        if (key.startsWith(`${voiceId}:`)) {
          URL.revokeObjectURL(entry.blobUrl);
          audioCache.current.delete(key);
        }
      });
    } else {
      // Clear all cache
      audioCache.current.forEach((entry) => {
        URL.revokeObjectURL(entry.blobUrl);
      });
      audioCache.current.clear();
    }
    
    // Reset playback state
    setIsPlaying(false);
    setIsPaused(false);
    setProgress(0);
    setCurrentTime(0);
    
    console.log(`[TTS] Cache size after clear: ${audioCache.current.size}`);
  }, []);

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

  // Generate audio from text using streaming TTS for faster playback
  const generateAudioStreaming = useCallback(async (
    text: string, 
    voiceId: string, 
    speakingRate: number = 1.0,
    sessionId: number,
    signal: AbortSignal,
    onFirstChunk: (blobUrl: string, totalDurationMs: number) => void,
    onChunkReady: (blobUrl: string, chunkIndex: number) => void
  ): Promise<void> => {
    console.log(`[TTS] Starting streaming audio generation for voice: ${voiceId} (session ${sessionId})`);
    
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-tts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text, voiceId, speakingRate, streaming: true }),
          signal, // Allow aborting the request
        }
      );

      if (!response.ok) {
        throw new Error(`TTS request failed: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let isFirstAudioChunk = true;
      let totalDurationMs = 0;

      while (true) {
        // Check if this session is still active
        if (sessionIdRef.current !== sessionId) {
          console.log(`[TTS] Session ${sessionId} cancelled, stopping streaming`);
          reader.cancel();
          return;
        }

        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        // Process complete SSE events
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || ''; // Keep incomplete event in buffer

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          
          // Check session again before processing each chunk
          if (sessionIdRef.current !== sessionId) {
            console.log(`[TTS] Session ${sessionId} cancelled during chunk processing`);
            reader.cancel();
            return;
          }
          
          try {
            const data = JSON.parse(line.slice(6));
            
            if (data.type === 'metadata') {
              totalDurationMs = data.estimatedDurationMs;
              console.log(`[TTS] Metadata: ${data.totalChunks} chunks, ~${totalDurationMs}ms`);
            } else if (data.type === 'audio') {
              const blobUrl = base64ToBlobUrl(data.audioContent);
              console.log(`[TTS] Chunk ${data.chunkIndex + 1}/${data.totalChunks} ready (session ${sessionId})`);
              
              if (isFirstAudioChunk) {
                isFirstAudioChunk = false;
                setIsLoading(false); // Stop loading indicator once first chunk arrives
                onFirstChunk(blobUrl, totalDurationMs);
              } else {
                onChunkReady(blobUrl, data.chunkIndex);
              }
            } else if (data.type === 'error') {
              throw new Error(data.message);
            }
          } catch (parseError) {
            if (parseError instanceof Error && parseError.name === 'AbortError') {
              console.log(`[TTS] Session ${sessionId} aborted`);
              return;
            }
            console.warn('[TTS] Failed to parse SSE event:', parseError);
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log(`[TTS] Session ${sessionId} fetch aborted`);
        return;
      }
      console.error('Google TTS streaming error:', err);
      setError(err instanceof Error ? err.message : 'TTS generation failed');
      throw err;
    }
  }, [base64ToBlobUrl]);

  // Generate audio from text using non-streaming TTS (for cached playback)
  const generateAudio = useCallback(async (
    text: string, 
    voiceId: string, 
    speakingRate: number = 1.0
  ): Promise<AudioCacheEntry | null> => {
    const cacheKey = getCacheKey(text, voiceId);
    
    // Check cache first
    const cached = audioCache.current.get(cacheKey);
    if (cached) {
      console.log(`[TTS] Using cached audio for voice: ${voiceId}`);
      return cached;
    }

    console.log(`[TTS] Generating new audio for voice: ${voiceId}`);

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fnError } = await supabase.functions.invoke('google-tts', {
        body: { text, voiceId, speakingRate },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (!data?.audioContent) {
        throw new Error('No audio content returned');
      }

      const blobUrl = base64ToBlobUrl(data.audioContent);

      console.log(`[TTS] Audio generated successfully for voice: ${voiceId}, blobUrl: ${blobUrl.slice(-20)}`);

      const entry: AudioCacheEntry = {
        blobUrl,
        durationMs: data.durationMs || 0,
      };

      // Cache the result
      audioCache.current.set(cacheKey, entry);

      return entry;
    } catch (err) {
      console.error('Google TTS error:', err);
      setError(err instanceof Error ? err.message : 'TTS generation failed');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getCacheKey, base64ToBlobUrl]);

  // Audio queue for streaming playback
  const audioQueueRef = useRef<string[]>([]);
  const currentChunkIndexRef = useRef<number>(0);
  const totalEstimatedDurationRef = useRef<number>(0);
  const chunkDurationsRef = useRef<number[]>([]);

  // Play next chunk in queue
  const playNextChunk = useCallback(() => {
    const queue = audioQueueRef.current;
    const nextIndex = currentChunkIndexRef.current + 1;
    
    if (nextIndex < queue.length) {
      currentChunkIndexRef.current = nextIndex;
      const nextBlobUrl = queue[nextIndex];
      console.log(`[TTS] Playing chunk ${nextIndex + 1}/${queue.length}`);
      
      const audio = new Audio(nextBlobUrl);
      audioRef.current = audio;
      audio.playbackRate = playbackRateRef.current;
      
      audio.addEventListener('ended', () => {
        if (currentChunkIndexRef.current < queue.length - 1) {
          playNextChunk();
        } else {
          // All chunks finished
          setIsPlaying(false);
          setIsPaused(false);
          setProgress(100);
          optionsRef.current.onEnd?.();
        }
      });
      
      audio.addEventListener('timeupdate', () => {
        // Calculate overall progress across all chunks
        const completedChunksDuration = chunkDurationsRef.current
          .slice(0, currentChunkIndexRef.current)
          .reduce((sum, d) => sum + d, 0);
        const currentChunkProgress = audio.currentTime * 1000;
        const totalProgress = completedChunksDuration + currentChunkProgress;
        const progressPercent = totalEstimatedDurationRef.current > 0 
          ? (totalProgress / totalEstimatedDurationRef.current) * 100 
          : 0;
        
        setCurrentTime(totalProgress);
        setProgress(progressPercent);
        
        const charIndex = Math.floor((progressPercent / 100) * currentTextRef.current.length);
        optionsRef.current.onProgress?.(charIndex, progressPercent);
      });
      
      audio.play().catch(console.error);
    }
  }, []);

  // Speak text using Google TTS with streaming for faster playback
  const speak = useCallback(async (text: string, voiceId: string = 'en-US-Neural2-D') => {
    // Abort any in-flight streaming request
    if (abortControllerRef.current) {
      console.log('[TTS] Aborting previous streaming request');
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller for this session
    abortControllerRef.current = new AbortController();
    
    // Increment session ID to invalidate any stale callbacks
    sessionIdRef.current += 1;
    const currentSessionId = sessionIdRef.current;
    console.log(`[TTS] Starting new session ${currentSessionId}`);
    
    // Stop any current playback
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = ''; // Clear source to prevent errors
      audioRef.current = null;
    }
    speechSynthesisRef.current.stop();
    
    // Reset queue
    audioQueueRef.current = [];
    currentChunkIndexRef.current = 0;
    chunkDurationsRef.current = [];

    currentTextRef.current = text;
    currentCacheKeyRef.current = getCacheKey(text, voiceId);
    setUseFallback(false);
    
    // Check if we have a saved position to resume from
    const resumePosition = savedPositionRef.current;
    savedPositionRef.current = null; // Clear after reading
    
    if (!resumePosition) {
      setProgress(0);
      setCurrentTime(0);
    }

    // Check cache first - if cached, use non-streaming playback
    const cacheKey = getCacheKey(text, voiceId);
    const cached = audioCache.current.get(cacheKey);
    
    if (cached) {
      console.log(`[TTS] Using cached audio for voice: ${voiceId} (session ${currentSessionId})`);
      
      // Check if session is still valid
      if (sessionIdRef.current !== currentSessionId) {
        console.log(`[TTS] Session ${currentSessionId} cancelled before playback`);
        return;
      }
      
      const audio = new Audio(cached.blobUrl);
      audioRef.current = audio;
      audio.playbackRate = playbackRateRef.current;

      audio.addEventListener('loadedmetadata', () => {
        if (sessionIdRef.current !== currentSessionId) return;
        const actualDuration = audio.duration * 1000;
        setDuration(actualDuration > 0 ? actualDuration : cached.durationMs);
        
        if (resumePosition && audio.duration > 0) {
          const targetTime = (resumePosition.charIndex / text.length) * audio.duration;
          console.log(`[TTS] Resuming from position: ${targetTime.toFixed(2)}s`);
          audio.currentTime = targetTime;
        }
      });

      audio.addEventListener('timeupdate', () => {
        if (sessionIdRef.current !== currentSessionId) return;
        const currentMs = audio.currentTime * 1000;
        const totalMs = audio.duration * 1000 || cached.durationMs;
        const progressPercent = totalMs > 0 ? (currentMs / totalMs) * 100 : 0;
        
        setCurrentTime(currentMs);
        setProgress(progressPercent);
        
        const charIndex = Math.floor((progressPercent / 100) * text.length);
        optionsRef.current.onProgress?.(charIndex, progressPercent);
      });

      audio.addEventListener('ended', () => {
        if (sessionIdRef.current !== currentSessionId) return;
        setIsPlaying(false);
        setIsPaused(false);
        setProgress(100);
        optionsRef.current.onEnd?.();
      });

      audio.addEventListener('error', (e) => {
        if (sessionIdRef.current !== currentSessionId) return;
        console.error('Audio playback error:', e);
        setError('Audio playback failed');
        setIsPlaying(false);
        setIsPaused(false);
        setUseFallback(true);
        speechSynthesisRef.current.speak(text);
      });

      try {
        await audio.play();
        if (sessionIdRef.current !== currentSessionId) {
          audio.pause();
          return;
        }
        setIsPlaying(true);
        setIsPaused(false);
      } catch (err) {
        if (sessionIdRef.current !== currentSessionId) return;
        console.error('Playback error:', err);
        setUseFallback(true);
        speechSynthesisRef.current.speak(text);
      }
      return;
    }

    // Use streaming for uncached audio
    console.log(`[TTS] Starting streaming playback for voice: ${voiceId} (session ${currentSessionId})`);
    
    try {
      await generateAudioStreaming(
        text,
        voiceId,
        playbackRateRef.current,
        currentSessionId,
        abortControllerRef.current.signal,
        // onFirstChunk - start playing immediately
        (blobUrl, totalDurationMs) => {
          // Check if this session is still active
          if (sessionIdRef.current !== currentSessionId) {
            console.log(`[TTS] Session ${currentSessionId} cancelled, ignoring first chunk`);
            URL.revokeObjectURL(blobUrl);
            return;
          }
          
          audioQueueRef.current.push(blobUrl);
          totalEstimatedDurationRef.current = totalDurationMs;
          setDuration(totalDurationMs);
          
          const audio = new Audio(blobUrl);
          audioRef.current = audio;
          audio.playbackRate = playbackRateRef.current;
          
          audio.addEventListener('loadedmetadata', () => {
            if (sessionIdRef.current !== currentSessionId) return;
            chunkDurationsRef.current[0] = audio.duration * 1000;
            
            // Resume from saved position if available
            if (resumePosition && audio.duration > 0) {
              const overallProgress = resumePosition.charIndex / text.length;
              const targetTime = overallProgress * audio.duration;
              console.log(`[TTS] Resuming from position: ${targetTime.toFixed(2)}s`);
              audio.currentTime = Math.min(targetTime, audio.duration);
            }
          });
          
          audio.addEventListener('timeupdate', () => {
            if (sessionIdRef.current !== currentSessionId) return;
            const currentMs = audio.currentTime * 1000;
            const progressPercent = totalDurationMs > 0 ? (currentMs / totalDurationMs) * 100 : 0;
            
            setCurrentTime(currentMs);
            setProgress(progressPercent);
            
            const charIndex = Math.floor((progressPercent / 100) * text.length);
            optionsRef.current.onProgress?.(charIndex, progressPercent);
          });
          
          audio.addEventListener('ended', () => {
            if (sessionIdRef.current !== currentSessionId) return;
            // Check if there are more chunks to play
            if (audioQueueRef.current.length > 1) {
              playNextChunk();
            } else {
              setIsPlaying(false);
              setIsPaused(false);
              setProgress(100);
              optionsRef.current.onEnd?.();
            }
          });
          
          audio.addEventListener('error', (e) => {
            if (sessionIdRef.current !== currentSessionId) return;
            console.error('Audio playback error:', e);
            setError('Audio playback failed');
            setIsPlaying(false);
            setUseFallback(true);
            speechSynthesisRef.current.speak(text);
          });
          
          audio.play()
            .then(() => {
              if (sessionIdRef.current !== currentSessionId) {
                audio.pause();
                return;
              }
              setIsPlaying(true);
              setIsPaused(false);
            })
            .catch((err) => {
              if (sessionIdRef.current !== currentSessionId) return;
              console.error('Playback error:', err);
              setUseFallback(true);
              speechSynthesisRef.current.speak(text);
            });
        },
        // onChunkReady - add to queue
        (blobUrl, chunkIndex) => {
          if (sessionIdRef.current !== currentSessionId) {
            URL.revokeObjectURL(blobUrl);
            return;
          }
          audioQueueRef.current[chunkIndex] = blobUrl;
          console.log(`[TTS] Chunk ${chunkIndex + 1} queued, total queued: ${audioQueueRef.current.length}`);
        }
      );
      
      // After streaming completes, cache the combined audio for future use
      if (sessionIdRef.current === currentSessionId && audioQueueRef.current.length > 0) {
        const allBlobUrls = audioQueueRef.current;
        // Fetch all blobs and combine them
        const blobs = await Promise.all(
          allBlobUrls.map(async (url) => {
            const response = await fetch(url);
            return response.blob();
          })
        );
        const combinedBlob = new Blob(blobs, { type: 'audio/mpeg' });
        const combinedBlobUrl = URL.createObjectURL(combinedBlob);
        
        audioCache.current.set(cacheKey, {
          blobUrl: combinedBlobUrl,
          durationMs: totalEstimatedDurationRef.current,
        });
        console.log(`[TTS] Cached combined audio for voice: ${voiceId}`);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log(`[TTS] Session ${currentSessionId} aborted`);
        return;
      }
      if (sessionIdRef.current !== currentSessionId) return;
      console.error('Streaming TTS error:', err);
      setError(err instanceof Error ? err.message : 'TTS streaming failed');
      // Fall back to browser speech synthesis
      setUseFallback(true);
      speechSynthesisRef.current.speak(text);
    }
  }, [generateAudioStreaming, getCacheKey, playNextChunk]);

  // Pause playback
  const pause = useCallback(() => {
    if (useFallbackRef.current) {
      speechSynthesisRef.current.pause();
    } else if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    setIsPaused(true);
  }, []);

  // Resume playback
  const resume = useCallback(async () => {
    if (useFallbackRef.current) {
      speechSynthesisRef.current.resume();
    } else if (audioRef.current) {
      try {
        await audioRef.current.play();
      } catch (err) {
        console.error('Resume error:', err);
      }
    }
    setIsPlaying(true);
    setIsPaused(false);
  }, []);

  // Stop playback
  const stop = useCallback(() => {
    if (useFallbackRef.current) {
      speechSynthesisRef.current.stop();
    } else if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setIsPaused(false);
    setProgress(0);
    setCurrentTime(0);
  }, []);

  // Toggle play/pause
  const toggle = useCallback(() => {
    if (isPlaying) {
      pause();
    } else if (isPaused) {
      resume();
    }
  }, [isPlaying, isPaused, pause, resume]);

  // Seek to a specific position (in milliseconds)
  const seekToTime = useCallback((timeMs: number) => {
    if (useFallbackRef.current) {
      // For browser speech, estimate character index
      const charIndex = Math.floor((timeMs / duration) * currentTextRef.current.length);
      speechSynthesisRef.current.seekToChar(charIndex);
    } else if (audioRef.current) {
      audioRef.current.currentTime = timeMs / 1000;
    }
  }, [duration]);

  // Seek to a specific character index
  const seekToChar = useCallback((charIndex: number) => {
    if (useFallbackRef.current) {
      speechSynthesisRef.current.seekToChar(charIndex);
    } else if (audioRef.current && currentTextRef.current.length > 0) {
      const percentage = charIndex / currentTextRef.current.length;
      audioRef.current.currentTime = (audioRef.current.duration || 0) * percentage;
    }
  }, []);

  // Cycle through playback rates
  const cyclePlaybackRate = useCallback(() => {
    const rates = [1, 1.25, 1.5, 1.75, 2];
    const currentIndex = rates.indexOf(playbackRateRef.current);
    const nextIndex = (currentIndex + 1) % rates.length;
    const newRate = rates[nextIndex];
    
    setPlaybackRate(newRate);
    playbackRateRef.current = newRate;
    
    if (useFallbackRef.current) {
      speechSynthesisRef.current.setRate(newRate);
    } else if (audioRef.current) {
      audioRef.current.playbackRate = newRate;
    }
  }, []);

  // Calculate current character index based on progress
  const currentCharIndex = Math.floor((progress / 100) * currentTextRef.current.length);

  return {
    isLoading,
    isPlaying,
    isPaused,
    isSpeaking: isPlaying || isPaused,
    currentTime,
    duration,
    progress,
    playbackRate,
    currentCharIndex,
    textLength: currentTextRef.current.length,
    useFallback,
    error,
    speak,
    pause,
    resume,
    stop,
    toggle,
    seekToTime,
    seekToChar,
    cyclePlaybackRate,
    clearCache,
    setPlaybackRate: (rate: number) => {
      setPlaybackRate(rate);
      playbackRateRef.current = rate;
      if (audioRef.current) {
        audioRef.current.playbackRate = rate;
      }
    },
  };
};
