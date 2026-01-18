import { useState, useEffect, useCallback } from 'react';

export interface VideoWatchRecord {
  videoId: number;
  chapterId: number;
  watchedAt: string;
  progress: number; // 0-100 percentage
  completed: boolean;
}

export interface VideoProgress {
  watches: VideoWatchRecord[];
  lastWatchedAt: string | null;
  currentProgress: number;
  completed: boolean;
}

const STORAGE_KEY = 'exam-ready-video-progress';

function loadProgress(): Record<string, VideoProgress> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveProgress(progress: Record<string, VideoProgress>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {
    console.error('Failed to save video progress:', e);
  }
}

export function useVideoProgress() {
  const [progress, setProgress] = useState<Record<string, VideoProgress>>(() => loadProgress());

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  const getVideoKey = (videoId: number, chapterId: number) => `${chapterId}-${videoId}`;

  const updateProgress = useCallback((videoId: number, chapterId: number, watchProgress: number) => {
    const key = getVideoKey(videoId, chapterId);
    const completed = watchProgress >= 90;
    
    const record: VideoWatchRecord = {
      videoId,
      chapterId,
      watchedAt: new Date().toISOString(),
      progress: watchProgress,
      completed,
    };

    setProgress(prev => {
      const existing = prev[key] || { watches: [], lastWatchedAt: null, currentProgress: 0, completed: false };
      const newProgress = Math.max(existing.currentProgress, watchProgress);
      
      return {
        ...prev,
        [key]: {
          watches: [...existing.watches.slice(-9), record], // Keep last 10 watches
          lastWatchedAt: record.watchedAt,
          currentProgress: newProgress,
          completed: existing.completed || completed,
        },
      };
    });
  }, []);

  const markCompleted = useCallback((videoId: number, chapterId: number) => {
    updateProgress(videoId, chapterId, 100);
  }, [updateProgress]);

  const getVideoProgress = useCallback((videoId: number, chapterId: number): VideoProgress | null => {
    const key = getVideoKey(videoId, chapterId);
    return progress[key] || null;
  }, [progress]);

  const getWatchPercentage = useCallback((videoId: number, chapterId: number): number => {
    const videoProgress = getVideoProgress(videoId, chapterId);
    return videoProgress?.currentProgress || 0;
  }, [getVideoProgress]);

  const isCompleted = useCallback((videoId: number, chapterId: number): boolean => {
    const videoProgress = getVideoProgress(videoId, chapterId);
    return videoProgress?.completed || false;
  }, [getVideoProgress]);

  const getWatchCount = useCallback((videoId: number, chapterId: number): number => {
    const videoProgress = getVideoProgress(videoId, chapterId);
    return videoProgress?.watches.length || 0;
  }, [getVideoProgress]);

  const clearProgress = useCallback(() => {
    setProgress({});
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    progress,
    updateProgress,
    markCompleted,
    getVideoProgress,
    getWatchPercentage,
    isCompleted,
    getWatchCount,
    clearProgress,
  };
}
