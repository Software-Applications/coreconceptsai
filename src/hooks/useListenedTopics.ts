import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

const STORAGE_KEY = 'listened-topics';

export const useListenedTopics = () => {
  const { user, isAuthenticated } = useAuth();
  const [listenedTopicIds, setListenedTopicIds] = useState<Set<string>>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });
  const [loading, setLoading] = useState(false);

  // Sync with Supabase when authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const fetchProgress = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('user_progress')
          .select('topic_id')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching progress:', error);
          return;
        }

        if (data && data.length > 0) {
          const ids = new Set(data.map(p => p.topic_id));
          setListenedTopicIds(ids);
          // Sync to localStorage as backup
          localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
        }
      } catch (err) {
        console.error('Error fetching progress:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [isAuthenticated, user]);

  // Save to localStorage when not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...listenedTopicIds]));
    }
  }, [listenedTopicIds, isAuthenticated]);

  const markAsListened = useCallback(async (topicId: string) => {
    // Optimistic update
    setListenedTopicIds(prev => new Set([...prev, topicId]));

    if (isAuthenticated && user) {
      try {
        const { error } = await supabase
          .from('user_progress')
          .upsert({
            user_id: user.id,
            topic_id: topicId,
            completed: true,
            progress_percentage: 100,
            listened_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,topic_id'
          });

        if (error) {
          console.error('Error saving progress:', error);
          // Revert optimistic update on error
          setListenedTopicIds(prev => {
            const next = new Set(prev);
            next.delete(topicId);
            return next;
          });
        }
      } catch (err) {
        console.error('Error saving progress:', err);
      }
    } else {
      // Save to localStorage for guests
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...listenedTopicIds, topicId]));
    }
  }, [isAuthenticated, user, listenedTopicIds]);

  const isListened = useCallback((topicId: string) => {
    return listenedTopicIds.has(topicId);
  }, [listenedTopicIds]);

  const getUnlistenedCount = useCallback((topicIds: string[]) => {
    return topicIds.filter(id => !listenedTopicIds.has(id)).length;
  }, [listenedTopicIds]);

  const getListenedCount = useCallback((topicIds: string[]) => {
    return topicIds.filter(id => listenedTopicIds.has(id)).length;
  }, [listenedTopicIds]);

  return { markAsListened, isListened, getUnlistenedCount, getListenedCount, loading };
};
