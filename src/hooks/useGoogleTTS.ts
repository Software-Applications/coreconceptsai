import { useState, useRef, useCallback, useEffect } from 'react';
import { useSpeechSynthesis } from './useSpeechSynthesis';
import * as audioCache from '@/lib/audioCache';
import type { AudioCacheEntry } from '@/lib/audioCache';

interface UseGoogleTTSOptions {
  onEnd?: () => void;
  onProgress?: (charIndex: number, progress: number) => void;
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
  const currentTextRef = useRef<string>('');
  const currentCacheKeyRef = useRef<string>('');
  const optionsRef = useRef(options);
  const useFallbackRef = useRef(useFallback);
  const playbackRateRef = useRef(playbackRate);
  
  // Session ID to track active playback session
  const sessionIdRef = useRef<number>(0);
  // Abort controller for cancelling in-flight streaming requests
  const abortControllerRef = useRef<AbortController | null>(null);
  // Store position to resume from after voice change
  const savedPositionRef = useRef<{ charIndex: number; wasPlaying: boolean } | null>(null);

  // Fallback to browser speech synthesis
  const speechSynthesis = useSpeechSynthesis({
    onEnd: options.onEnd,
    onProgress: options.onProgress,
  });
  
  const speechSynthesisRef = useRef(speechSynthesis);
  useEffect(() => {
    speechSynthesisRef.current = speechSynthesis;
  }, [speechSynthesis]);

  useEffect(() => {
    useFallbackRef.current = useFallback;
  }, [useFallback]);

  useEffect(() => {
    playbackRateRef.current = playbackRate;
  }, [playbackRate]);

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
      audioCache.clearMemoryCache();
    };
  }, []);

  // Generate cache key from text and voice
  const getCacheKey = useCallback((text: string, voiceId: string) => {
    const textChecksum = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return `${voiceId}:${text.length}:${textChecksum}`;
  }, []);

  // Clear cached audio
  const clearCache = useCallback(async (voiceId?: string, savePosition: boolean = false) => {
    console.log(`[TTS] Clearing cache${voiceId ? ` for voice: ${voiceId}` : ' (all voices)'}${savePosition ? ' (saving position)' : ''}`);
    
    if (savePosition && audioRef.current && currentTextRef.current.length > 0) {
      const currentProgress = audioRef.current.currentTime / (audioRef.current.duration || 1);
      const charIndex = Math.floor(currentProgress * currentTextRef.current.length);
      savedPositionRef.current = {
        charIndex,
        wasPlaying: !audioRef.current.paused
      };
      console.log(`[TTS] Saved position: charIndex=${charIndex}, wasPlaying=${savedPositionRef.current.wasPlaying}`);
    }
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    
    if (voiceId) {
      await audioCache.deleteByVoiceId(voiceId);
    } else {
      await audioCache.clearAllCache();
    }
    
    setIsPlaying(false);
    setIsPaused(false);
    setProgress(0);
    setCurrentTime(0);
    
    console.log(`[TTS] Cache cleared`);
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
          setIsPlaying(false);
          setIsPaused(false);
          setProgress(100);
          optionsRef.current.onEnd?.();
        }
      });
      
      // Add pause listener to detect unexpected stops
      audio.addEventListener('pause', () => {
        // If audio paused but we didn't intentionally pause, sync state
        if (!audio.ended && audioRef.current === audio) {
          // Only reset if we think we're still playing
          // (intentional pauses are handled via the pause() function)
        }
      });
      
      audio.addEventListener('timeupdate', () => {
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
      
      audio.play()
        .then(() => {
          // Verify audio is actually playing
          if (!audio.paused) {
            setIsPlaying(true);
            setIsPaused(false);
          }
        })
        .catch((err) => {
          console.error('Chunk playback error:', err);
          setIsPlaying(false);
        });
    }
  }, []);

  // Generate audio from text using streaming TTS
  const generateAudioStreaming = useCallback(async (
    text: string, 
    voiceId: string, 
    speakingRate: number,
    sessionId: number,
    signal: AbortSignal,
    onFirstChunk: (blobUrl: string, totalDurationMs: number) => void,
    onChunkReady: (blobUrl: string, chunkIndex: number) => void
  ): Promise<void> => {
    console.log(`[TTS] Starting streaming for voice: ${voiceId} (session ${sessionId})`);
    
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
          signal,
        }
      );

      if (!response.ok) {
        throw new Error(`TTS request failed: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';
      let isFirstAudioChunk = true;
      let totalDurationMs = 0;

      while (true) {
        if (sessionIdRef.current !== sessionId) {
          reader.cancel();
          return;
        }

        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          if (sessionIdRef.current !== sessionId) {
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
              console.log(`[TTS] Chunk ${data.chunkIndex + 1}/${data.totalChunks} ready`);
              
              if (isFirstAudioChunk) {
                isFirstAudioChunk = false;
                setIsLoading(false);
                onFirstChunk(blobUrl, totalDurationMs);
              } else {
                onChunkReady(blobUrl, data.chunkIndex);
              }
            } else if (data.type === 'error') {
              throw new Error(data.message);
            }
          } catch (parseError) {
            if (parseError instanceof Error && parseError.name === 'AbortError') return;
            console.warn('[TTS] Failed to parse SSE event:', parseError);
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      console.error('Google TTS streaming error:', err);
      setError(err instanceof Error ? err.message : 'TTS generation failed');
      throw err;
    }
  }, [base64ToBlobUrl]);

  // Speak text using Google TTS
  const speak = useCallback(async (text: string, voiceId: string = 'en-US-Neural2-D') => {
    // Abort any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    sessionIdRef.current += 1;
    const currentSessionId = sessionIdRef.current;
    console.log(`[TTS] Starting session ${currentSessionId}`);
    
    // Stop current playback
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
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
    
    const resumePosition = savedPositionRef.current;
    savedPositionRef.current = null;
    
    if (!resumePosition) {
      setProgress(0);
      setCurrentTime(0);
    }

    // Check cache (memory first, then IndexedDB)
    const cacheKey = getCacheKey(text, voiceId);
    let cached = audioCache.hasInMemoryCache(cacheKey);
    if (!cached) {
      cached = await audioCache.getFromCache(cacheKey) || undefined;
    }
    
    if (cached) {
      console.log(`[TTS] Using cached audio for voice: ${voiceId}`);
      
      if (sessionIdRef.current !== currentSessionId) return;
      
      const audio = new Audio(cached.blobUrl);
      audioRef.current = audio;
      audio.playbackRate = playbackRateRef.current;

      audio.addEventListener('loadedmetadata', () => {
        if (sessionIdRef.current !== currentSessionId) return;
        const actualDuration = audio.duration * 1000;
        setDuration(actualDuration > 0 ? actualDuration : cached!.durationMs);
        
        if (resumePosition && audio.duration > 0) {
          const targetTime = (resumePosition.charIndex / text.length) * audio.duration;
          console.log(`[TTS] Resuming from: ${targetTime.toFixed(2)}s`);
          audio.currentTime = targetTime;
        }
      });

      audio.addEventListener('timeupdate', () => {
        if (sessionIdRef.current !== currentSessionId) return;
        const currentMs = audio.currentTime * 1000;
        const totalMs = audio.duration * 1000 || cached!.durationMs;
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
      
      // Add pause listener to detect unexpected stops (cached audio)
      audio.addEventListener('pause', () => {
        if (sessionIdRef.current !== currentSessionId) return;
        // If audio stopped but not at the end, it may have been interrupted
        if (!audio.ended && audio.currentTime < audio.duration - 0.1) {
          // Only log, don't force state change - intentional pauses are handled separately
          console.log('[TTS] Audio paused unexpectedly at', audio.currentTime);
        }
      });

      audio.addEventListener('error', (e) => {
        if (sessionIdRef.current !== currentSessionId) return;
        const audioEl = e.target as HTMLAudioElement;
        if (!audioEl.src || audioEl.src === '' || audioEl.src === window.location.href) return;
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
        // Verify audio is actually playing before setting state
        if (!audio.paused) {
          setIsPlaying(true);
          setIsPaused(false);
        } else {
          console.warn('[TTS] audio.play() resolved but audio is paused');
          setIsPlaying(false);
        }
      } catch (err) {
        if (sessionIdRef.current !== currentSessionId) return;
        console.error('Playback error:', err);
        setIsPlaying(false);
        setUseFallback(true);
        speechSynthesisRef.current.speak(text);
      }
      return;
    }

    // Use streaming for uncached audio
    console.log(`[TTS] Starting streaming for voice: ${voiceId}`);
    
    try {
      await generateAudioStreaming(
        text,
        voiceId,
        playbackRateRef.current,
        currentSessionId,
        abortControllerRef.current.signal,
        // onFirstChunk
        (blobUrl, totalDurationMs) => {
          if (sessionIdRef.current !== currentSessionId) {
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
            
            if (resumePosition && audio.duration > 0) {
              const overallProgress = resumePosition.charIndex / text.length;
              const targetTime = overallProgress * audio.duration;
              console.log(`[TTS] Resuming from: ${targetTime.toFixed(2)}s`);
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
            if (audioQueueRef.current.length > 1) {
              playNextChunk();
            } else {
              setIsPlaying(false);
              setIsPaused(false);
              setProgress(100);
              optionsRef.current.onEnd?.();
            }
          });
          
          // Add pause listener for streaming audio
          audio.addEventListener('pause', () => {
            if (sessionIdRef.current !== currentSessionId) return;
            if (!audio.ended && audio.currentTime < audio.duration - 0.1) {
              console.log('[TTS] Streaming audio paused at', audio.currentTime);
            }
          });
          
          audio.addEventListener('error', (e) => {
            if (sessionIdRef.current !== currentSessionId) return;
            const audioEl = e.target as HTMLAudioElement;
            if (!audioEl.src || audioEl.src === '' || audioEl.src === window.location.href) return;
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
              // Verify audio is actually playing
              if (!audio.paused) {
                setIsPlaying(true);
                setIsPaused(false);
              } else {
                console.warn('[TTS] Streaming audio.play() resolved but audio is paused');
                setIsPlaying(false);
              }
            })
            .catch((err) => {
              if (sessionIdRef.current !== currentSessionId) return;
              console.error('Playback error:', err);
              setIsPlaying(false);
              setUseFallback(true);
              speechSynthesisRef.current.speak(text);
            });
        },
        // onChunkReady
        (blobUrl, chunkIndex) => {
          if (sessionIdRef.current !== currentSessionId) {
            URL.revokeObjectURL(blobUrl);
            return;
          }
          audioQueueRef.current[chunkIndex] = blobUrl;
        }
      );
      
      // Cache combined audio after streaming
      if (sessionIdRef.current === currentSessionId && audioQueueRef.current.length > 0) {
        const allBlobUrls = audioQueueRef.current;
        const blobs = await Promise.all(
          allBlobUrls.map(async (url) => {
            const response = await fetch(url);
            return response.blob();
          })
        );
        const combinedBlob = new Blob(blobs, { type: 'audio/mpeg' });
        const combinedBlobUrl = URL.createObjectURL(combinedBlob);
        
        audioCache.setInMemoryCache(cacheKey, { blobUrl: combinedBlobUrl, durationMs: totalEstimatedDurationRef.current });
        audioCache.saveToCache(cacheKey, combinedBlobUrl, totalEstimatedDurationRef.current).catch(console.warn);
        console.log(`[TTS] Cached audio for voice: ${voiceId}`);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      if (sessionIdRef.current !== currentSessionId) return;
      console.error('Streaming TTS error:', err);
      setError(err instanceof Error ? err.message : 'TTS streaming failed');
      setUseFallback(true);
      speechSynthesisRef.current.speak(text);
    }
  }, [generateAudioStreaming, getCacheKey, playNextChunk]);

  const pause = useCallback(() => {
    if (useFallbackRef.current) {
      speechSynthesisRef.current.pause();
    } else if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    setIsPaused(true);
  }, []);

  const resume = useCallback(async () => {
    if (useFallbackRef.current) {
      speechSynthesisRef.current.resume();
      setIsPlaying(true);
      setIsPaused(false);
    } else if (audioRef.current) {
      try {
        await audioRef.current.play();
        // Verify audio is actually playing after resume
        if (!audioRef.current.paused) {
          setIsPlaying(true);
          setIsPaused(false);
        } else {
          console.warn('[TTS] Resume failed - audio still paused');
          setIsPlaying(false);
        }
      } catch (err) {
        console.error('Resume error:', err);
        setIsPlaying(false);
        setIsPaused(false);
      }
    }
  }, []);

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

  const toggle = useCallback(() => {
    if (isPlaying) {
      pause();
    } else if (isPaused) {
      resume();
    }
  }, [isPlaying, isPaused, pause, resume]);

  const seekToTime = useCallback((timeMs: number) => {
    if (useFallbackRef.current) {
      const charIndex = Math.floor((timeMs / duration) * currentTextRef.current.length);
      speechSynthesisRef.current.seekToChar(charIndex);
    } else if (audioRef.current) {
      audioRef.current.currentTime = timeMs / 1000;
    }
  }, [duration]);

  const seekToChar = useCallback((charIndex: number) => {
    if (useFallbackRef.current) {
      speechSynthesisRef.current.seekToChar(charIndex);
    } else if (audioRef.current && currentTextRef.current.length > 0) {
      const percentage = charIndex / currentTextRef.current.length;
      audioRef.current.currentTime = (audioRef.current.duration || 0) * percentage;
    }
  }, []);

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
    // Method to check if audio is actually playing (for state sync)
    getActualPlayingState: () => {
      if (useFallbackRef.current) {
        return speechSynthesisRef.current.isPlaying;
      }
      return audioRef.current ? !audioRef.current.paused && !audioRef.current.ended : false;
    },
    setPlaybackRate: (rate: number) => {
      setPlaybackRate(rate);
      playbackRateRef.current = rate;
      if (audioRef.current) {
        audioRef.current.playbackRate = rate;
      }
    },
  };
};
