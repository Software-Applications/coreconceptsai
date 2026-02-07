import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TrendingTopic {
  id: string;
  title: string;
  description: string | null;
  chapter_id: string;
  subject_name: string;
  subject_color: string | null;
  listen_count: number;
  created_at: string | null;
}

export const useTrendingTopics = (limit: number = 10) => {
  return useQuery({
    queryKey: ['trending-topics', limit],
    queryFn: async (): Promise<TrendingTopic[]> => {
      // Fetch ALL topics with their subject info
      const { data: topics, error: topicsError } = await supabase
        .from('topics')
        .select(`
          id,
          title,
          description,
          chapter_id,
          created_at,
          chapters!inner (
            subject_id,
            subjects!inner (
              name,
              color
            )
          )
        `);

      if (topicsError) {
        console.error('Error fetching topics:', topicsError);
        throw topicsError;
      }

      if (!topics || topics.length === 0) {
        return [];
      }

      // Fetch listen counts from user_progress (aggregate across all users)
      const topicIds = topics.map(t => t.id);
      const { data: progressData, error: progressError } = await supabase
        .from('user_progress')
        .select('topic_id')
        .in('topic_id', topicIds)
        .eq('completed', true);

      if (progressError) {
        console.error('Error fetching progress:', progressError);
        // Continue without listen counts
      }

      // Count listens per topic
      const listenCounts = new Map<string, number>();
      if (progressData) {
        progressData.forEach(p => {
          const count = listenCounts.get(p.topic_id) || 0;
          listenCounts.set(p.topic_id, count + 1);
        });
      }

      // Transform and sort topics by listen_count DESC, then created_at DESC
      const trendingTopics: TrendingTopic[] = topics.map(topic => {
        const chapters = topic.chapters as unknown as {
          subject_id: string;
          subjects: { name: string; color: string | null };
        };
        
        return {
          id: topic.id,
          title: topic.title,
          description: topic.description,
          chapter_id: topic.chapter_id,
          subject_name: chapters.subjects.name,
          subject_color: chapters.subjects.color,
          listen_count: listenCounts.get(topic.id) || 0,
          created_at: topic.created_at,
        };
      });

      // Sort by listen_count DESC, then by created_at DESC (newer first for ties)
      trendingTopics.sort((a, b) => {
        // Primary: listen_count descending
        if (b.listen_count !== a.listen_count) {
          return b.listen_count - a.listen_count;
        }
        // Secondary: created_at descending (newer first)
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      });

      return trendingTopics.slice(0, limit);
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true,
  });
};
