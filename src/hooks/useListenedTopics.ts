import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'listened-topics';

export const useListenedTopics = () => {
  const [listenedTopicIds, setListenedTopicIds] = useState<Set<string>>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...listenedTopicIds]));
  }, [listenedTopicIds]);

  const markAsListened = useCallback((topicId: string) => {
    setListenedTopicIds(prev => new Set([...prev, topicId]));
  }, []);

  const isListened = useCallback((topicId: string) => {
    return listenedTopicIds.has(topicId);
  }, [listenedTopicIds]);

  const getUnlistenedCount = useCallback((topicIds: string[]) => {
    return topicIds.filter(id => !listenedTopicIds.has(id)).length;
  }, [listenedTopicIds]);

  return { markAsListened, isListened, getUnlistenedCount };
};
