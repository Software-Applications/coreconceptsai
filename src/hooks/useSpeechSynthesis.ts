import { useState, useRef, useEffect, useCallback } from 'react';

interface UseSpeechSynthesisOptions {
  onEnd?: () => void;
  onBoundary?: (charIndex: number) => void;
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

  const speak = useCallback((text: string) => {
    window.speechSynthesis.cancel();
    
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
    };
    
    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setProgress(100);
      optionsRef.current.onEnd?.();
    };
    
    utterance.onboundary = (event) => {
      const charIndex = event.charIndex;
      setCurrentCharIndex(charIndex);
      const progressPercent = (charIndex / text.length) * 100;
      setProgress(progressPercent);
      optionsRef.current.onBoundary?.(charIndex);
    };
    
    utterance.onerror = (event) => {
      // Ignore 'canceled' and 'interrupted' errors - these are expected when stopping/restarting
      if (event.error !== 'canceled' && event.error !== 'interrupted') {
        console.error('Speech synthesis error:', event.error);
      }
      setIsPlaying(false);
      setIsPaused(false);
    };
    
    window.speechSynthesis.speak(utterance);
  }, [playbackRate, getPreferredVoice]);

  const pause = useCallback(() => {
    window.speechSynthesis.pause();
    setIsPlaying(false);
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    window.speechSynthesis.resume();
    setIsPlaying(true);
    setIsPaused(false);
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setProgress(0);
    setCurrentCharIndex(0);
  }, []);

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
