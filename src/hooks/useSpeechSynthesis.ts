import { useState, useRef, useEffect, useCallback } from 'react';

interface UseSpeechSynthesisOptions {
  onEnd?: () => void;
  onProgress?: (charIndex: number, progress: number) => void;
}

export const useSpeechSynthesis = (options: UseSpeechSynthesisOptions = {}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const textRef = useRef<string>('');
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const optionsRef = useRef(options);
  const startTimeRef = useRef<number>(0);
  const progressIntervalRef = useRef<number | null>(null);
  
  // Keep options ref updated
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      voicesRef.current = window.speechSynthesis.getVoices();
    };
    
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    
    return () => {
      window.speechSynthesis.cancel();
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  const getPreferredVoice = useCallback(() => {
    const voices = voicesRef.current;
    // Prefer natural sounding English voices
    const preferred = voices.find(v => 
      v.name.includes('Samantha') || 
      v.name.includes('Karen') ||
      v.name.includes('Daniel') ||
      (v.name.includes('Google') && v.lang.startsWith('en'))
    );
    return preferred || voices.find(v => v.lang.startsWith('en')) || voices[0];
  }, []);

  const startProgressTracking = useCallback((text: string, rate: number) => {
    // Estimate duration: ~150 words/min at rate 1
    const wordCount = text.split(/\s+/).length;
    const estimatedDurationMs = (wordCount / 150) * 60 * 1000 / rate;
    const textLength = text.length;
    
    startTimeRef.current = Date.now();
    
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    
    progressIntervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const progressPercent = Math.min((elapsed / estimatedDurationMs) * 100, 99);
      const estimatedCharIndex = Math.floor((progressPercent / 100) * textLength);
      
      setProgress(progressPercent);
      setCurrentCharIndex(estimatedCharIndex);
      optionsRef.current.onProgress?.(estimatedCharIndex, progressPercent);
    }, 50); // Update every 50ms for smooth highlighting
  }, []);

  const stopProgressTracking = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  const speak = useCallback((text: string) => {
    window.speechSynthesis.cancel();
    stopProgressTracking();
    
    textRef.current = text;
    setCurrentCharIndex(0);
    setProgress(0);
    
    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;
    
    utterance.rate = playbackRate;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    const voice = getPreferredVoice();
    if (voice) {
      utterance.voice = voice;
    }
    
    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
      startProgressTracking(text, playbackRate);
    };
    
    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setProgress(100);
      setCurrentCharIndex(text.length);
      stopProgressTracking();
      optionsRef.current.onEnd?.();
    };
    
    // Also use onboundary if supported (bonus accuracy)
    utterance.onboundary = (event) => {
      if (event.charIndex > 0) {
        setCurrentCharIndex(event.charIndex);
        const progressPercent = (event.charIndex / text.length) * 100;
        setProgress(progressPercent);
        // Reset start time for more accurate tracking
        const elapsedRatio = event.charIndex / text.length;
        const wordCount = text.split(/\s+/).length;
        const estimatedDurationMs = (wordCount / 150) * 60 * 1000 / playbackRate;
        startTimeRef.current = Date.now() - (elapsedRatio * estimatedDurationMs);
      }
    };
    
    utterance.onerror = (event) => {
      // Ignore 'canceled' and 'interrupted' errors - these are expected when stopping/restarting
      if (event.error !== 'canceled' && event.error !== 'interrupted') {
        console.error('Speech synthesis error:', event.error);
      }
      setIsPlaying(false);
      setIsPaused(false);
      stopProgressTracking();
    };
    
    window.speechSynthesis.speak(utterance);
  }, [playbackRate, getPreferredVoice, startProgressTracking, stopProgressTracking]);

  const pause = useCallback(() => {
    window.speechSynthesis.pause();
    setIsPlaying(false);
    setIsPaused(true);
    stopProgressTracking();
  }, [stopProgressTracking]);

  const resume = useCallback(() => {
    window.speechSynthesis.resume();
    setIsPlaying(true);
    setIsPaused(false);
    // Resume progress tracking from current position
    const text = textRef.current;
    if (text) {
      const remainingRatio = 1 - (currentCharIndex / text.length);
      const wordCount = text.split(/\s+/).length;
      const totalDurationMs = (wordCount / 150) * 60 * 1000 / playbackRate;
      const elapsedMs = (currentCharIndex / text.length) * totalDurationMs;
      startTimeRef.current = Date.now() - elapsedMs;
      startProgressTracking(text, playbackRate);
    }
  }, [currentCharIndex, playbackRate, startProgressTracking]);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setProgress(0);
    setCurrentCharIndex(0);
    stopProgressTracking();
  }, [stopProgressTracking]);

  const toggle = useCallback(() => {
    if (isPlaying) {
      pause();
    } else if (isPaused) {
      resume();
    }
  }, [isPlaying, isPaused, pause, resume]);

  const setRate = useCallback((rate: number) => {
    setPlaybackRate(rate);
    // If currently speaking, restart with new rate
    if (isPlaying || isPaused) {
      const currentText = textRef.current;
      stop();
      // Small delay to ensure clean restart
      setTimeout(() => speak(currentText), 50);
    }
  }, [isPlaying, isPaused, stop, speak]);

  const cyclePlaybackRate = useCallback(() => {
    const rates = [1, 1.25, 1.5, 1.75, 2];
    const currentIndex = rates.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % rates.length;
    setRate(rates[nextIndex]);
  }, [playbackRate, setRate]);

  return {
    isPlaying,
    isPaused,
    isSpeaking: isPlaying || isPaused,
    currentCharIndex,
    progress,
    playbackRate,
    speak,
    pause,
    resume,
    stop,
    toggle,
    setRate,
    cyclePlaybackRate
  };
};
