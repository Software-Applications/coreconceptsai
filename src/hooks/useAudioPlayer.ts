import { useState, useRef, useEffect, useCallback } from 'react';

interface UseAudioPlayerOptions {
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
}

export const useAudioPlayer = (audioUrl: string | null, options: UseAudioPlayerOptions = {}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize audio element
  useEffect(() => {
    if (!audioUrl) {
      audioRef.current = null;
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      return;
    }

    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    
    audio.addEventListener('loadstart', () => setIsLoading(true));
    audio.addEventListener('canplay', () => setIsLoading(false));
    audio.addEventListener('loadedmetadata', () => {
      // Mock duration since we don't have real audio
      setDuration(audio.duration || 632); // ~10:32 default
    });
    
    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime);
      options.onTimeUpdate?.(audio.currentTime, audio.duration);
    });
    
    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      options.onEnded?.();
    });

    audio.addEventListener('error', () => {
      // For mock mode, simulate audio availability
      setIsLoading(false);
      setDuration(632); // Mock duration
    });

    return () => {
      audio.pause();
      audio.remove();
    };
  }, [audioUrl, options.onEnded, options.onTimeUpdate]);

  // Update playback rate
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const play = useCallback(async () => {
    if (audioRef.current) {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch {
        // Mock play for demo purposes
        setIsPlaying(true);
      }
    } else {
      // Mock play when no audio
      setIsPlaying(true);
    }
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
  }, []);

  const toggle = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
    setCurrentTime(time);
  }, []);

  const skipForward = useCallback((seconds: number = 15) => {
    const newTime = Math.min(currentTime + seconds, duration);
    seek(newTime);
  }, [currentTime, duration, seek]);

  const skipBackward = useCallback((seconds: number = 15) => {
    const newTime = Math.max(currentTime - seconds, 0);
    seek(newTime);
  }, [currentTime, seek]);

  const cyclePlaybackRate = useCallback(() => {
    const rates = [1, 1.25, 1.5, 1.75, 2];
    const currentIndex = rates.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % rates.length;
    setPlaybackRate(rates[nextIndex]);
  }, [playbackRate]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return {
    isPlaying,
    isLoading,
    currentTime,
    duration,
    progress,
    playbackRate,
    play,
    pause,
    toggle,
    seek,
    skipForward,
    skipBackward,
    cyclePlaybackRate,
    formatTime
  };
};
