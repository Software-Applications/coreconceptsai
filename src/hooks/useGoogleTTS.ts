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

  // Generate cache key from text and voice - use more unique identifier
  const getCacheKey = useCallback((text: string, voiceId: string) => {
    // Include voiceId, text length, and a checksum of text content
    const textChecksum = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return `${voiceId}:${text.length}:${textChecksum}`;
  }, []);

  // Clear cached audio for a specific voice or all
  const clearCache = useCallback((voiceId?: string) => {
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
  }, []);

  // Generate audio from text using Google TTS
  const generateAudio = useCallback(async (
    text: string, 
    voiceId: string, 
    speakingRate: number = 1.0
  ): Promise<AudioCacheEntry | null> => {
    const cacheKey = getCacheKey(text, voiceId);
    
    // Check cache first
    const cached = audioCache.current.get(cacheKey);
    if (cached) {
      return cached;
    }

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

      // Convert base64 to blob
      const binaryString = atob(data.audioContent);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'audio/mpeg' });
      const blobUrl = URL.createObjectURL(blob);

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
  }, [getCacheKey]);

  // Speak text using Google TTS
  const speak = useCallback(async (text: string, voiceId: string = 'en-US-Neural2-D') => {
    // Stop any current playback
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    speechSynthesisRef.current.stop();

    currentTextRef.current = text;
    currentCacheKeyRef.current = getCacheKey(text, voiceId);
    setUseFallback(false);
    setProgress(0);
    setCurrentTime(0);

    // Try to generate audio with Google TTS
    const audioEntry = await generateAudio(text, voiceId, playbackRateRef.current);

    if (!audioEntry) {
      // Fall back to browser speech synthesis
      console.log('Falling back to browser speech synthesis');
      setUseFallback(true);
      speechSynthesisRef.current.speak(text);
      return;
    }

    // Create and play audio element
    const audio = new Audio(audioEntry.blobUrl);
    audioRef.current = audio;
    audio.playbackRate = playbackRateRef.current;

    // Set up event listeners
    audio.addEventListener('loadedmetadata', () => {
      // Use actual duration from audio element if available
      const actualDuration = audio.duration * 1000;
      setDuration(actualDuration > 0 ? actualDuration : audioEntry.durationMs);
    });

    audio.addEventListener('timeupdate', () => {
      const currentMs = audio.currentTime * 1000;
      const totalMs = audio.duration * 1000 || audioEntry.durationMs;
      const progressPercent = totalMs > 0 ? (currentMs / totalMs) * 100 : 0;
      
      setCurrentTime(currentMs);
      setProgress(progressPercent);
      
      // Estimate character index for highlighting
      const charIndex = Math.floor((progressPercent / 100) * text.length);
      optionsRef.current.onProgress?.(charIndex, progressPercent);
    });

    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setIsPaused(false);
      setProgress(100);
      optionsRef.current.onEnd?.();
    });

    audio.addEventListener('error', (e) => {
      console.error('Audio playback error:', e);
      setError('Audio playback failed');
      setIsPlaying(false);
      setIsPaused(false);
      // Fall back to browser speech
      setUseFallback(true);
      speechSynthesisRef.current.speak(text);
    });

    // Start playback
    try {
      await audio.play();
      setIsPlaying(true);
      setIsPaused(false);
    } catch (err) {
      console.error('Playback error:', err);
      setError('Failed to start playback');
      // Fall back to browser speech
      setUseFallback(true);
      speechSynthesisRef.current.speak(text);
    }
  }, [generateAudio, getCacheKey]);

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
