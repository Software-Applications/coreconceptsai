import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'watched-videos';

export const useWatchedVideos = () => {
  const [watchedIds, setWatchedIds] = useState<Set<number>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...watchedIds]));
  }, [watchedIds]);

  const markAsWatched = useCallback((videoId: number) => {
    setWatchedIds(prev => new Set([...prev, videoId]));
  }, []);

  const isWatched = useCallback((videoId: number) => {
    return watchedIds.has(videoId);
  }, [watchedIds]);

  const getWatchedCount = useCallback((videoIds: number[]) => {
    return videoIds.filter(id => watchedIds.has(id)).length;
  }, [watchedIds]);

  const getUnwatchedCount = useCallback((videoIds: number[]) => {
    return videoIds.filter(id => !watchedIds.has(id)).length;
  }, [watchedIds]);

  return { markAsWatched, isWatched, getWatchedCount, getUnwatchedCount };
};
