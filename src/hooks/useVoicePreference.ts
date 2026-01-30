import { useState, useCallback } from 'react';

export interface VoiceOption {
  id: string;
  name: string;
  description: string;
  gender: 'male' | 'female';
}

export const VOICE_OPTIONS: VoiceOption[] = [
  { id: 'en-US-Neural2-D', name: 'Oliver', description: 'Clear, professional', gender: 'male' },
  { id: 'en-US-Neural2-A', name: 'Marcus', description: 'Deep, authoritative', gender: 'male' },
  { id: 'en-US-Neural2-J', name: 'James', description: 'Warm, friendly', gender: 'male' },
  { id: 'en-US-Neural2-F', name: 'Aria', description: 'Natural, engaging', gender: 'female' },
  { id: 'en-US-Neural2-C', name: 'Emma', description: 'Soft, calming', gender: 'female' },
  { id: 'en-US-Neural2-H', name: 'Sophia', description: 'Bright, energetic', gender: 'female' },
];

const VOICE_STORAGE_KEY = 'daily-download-voice-preference';
const DEFAULT_VOICE = 'en-US-Neural2-D';

export const useVoicePreference = () => {
  const [voiceId, setVoiceIdState] = useState<string>(() => {
    try {
      const stored = localStorage.getItem(VOICE_STORAGE_KEY);
      if (stored && VOICE_OPTIONS.some(v => v.id === stored)) {
        return stored;
      }
    } catch {
      // localStorage not available
    }
    return DEFAULT_VOICE;
  });

  const setVoiceId = useCallback((newVoiceId: string) => {
    setVoiceIdState(newVoiceId);
    try {
      localStorage.setItem(VOICE_STORAGE_KEY, newVoiceId);
    } catch {
      // localStorage not available
    }
  }, []);

  const currentVoice = VOICE_OPTIONS.find(v => v.id === voiceId) || VOICE_OPTIONS[0];

  return {
    voiceId,
    setVoiceId,
    currentVoice,
    voiceOptions: VOICE_OPTIONS,
  };
};
