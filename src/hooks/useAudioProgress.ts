import { useCallback } from 'react';

const STORAGE_KEY = 'audio-progress';

interface AudioProgressRecord {
  topicId: string;
  charIndex: number;
  lastUpdated: string;
}

export const useAudioProgress = () => {
  const saveProgress = useCallback((topicId: string, charIndex: number) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const records: AudioProgressRecord[] = stored ? JSON.parse(stored) : [];
      
      // Remove existing record for this topic
      const filtered = records.filter(r => r.topicId !== topicId);
      
      // Add new record
      filtered.push({
        topicId,
        charIndex,
        lastUpdated: new Date().toISOString()
      });
      
      // Keep only last 50 records
      const trimmed = filtered.slice(-50);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch {
      // Ignore storage errors
    }
  }, []);

  const getProgress = useCallback((topicId: string): number | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;
      
      const records: AudioProgressRecord[] = JSON.parse(stored);
      const record = records.find(r => r.topicId === topicId);
      
      // Only return progress if it was saved in the last 7 days
      if (record) {
        const lastUpdated = new Date(record.lastUpdated);
        const now = new Date();
        const daysDiff = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysDiff < 7 && record.charIndex > 0) {
          return record.charIndex;
        }
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  const clearProgress = useCallback((topicId: string) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      
      const records: AudioProgressRecord[] = JSON.parse(stored);
      const filtered = records.filter(r => r.topicId !== topicId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch {
      // Ignore storage errors
    }
  }, []);

  const hasProgress = useCallback((topicId: string): boolean => {
    return getProgress(topicId) !== null;
  }, [getProgress]);

  return { saveProgress, getProgress, clearProgress, hasProgress };
};
