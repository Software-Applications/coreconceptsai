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
}

// Define which topic positions are "trending" (1-indexed: 1st, 2nd, 3rd, 5th, 8th)
const TRENDING_POSITIONS = [0, 1, 2, 4, 7]; // 0-indexed positions

export const useTrendingTopics = (limit: number = 10) => {
  return useQuery({
    queryKey: ['trending-topics', limit],
    queryFn: async (): Promise<TrendingTopic[]> => {
      // Fetch topics with their subject info, ordered by creation date
      const { data: topics, error: topicsError } = await supabase
        .from('topics')
        .select(`
          id,
          title,
          description,
          chapter_id,
          chapters!inner (
            subject_id,
            subjects!inner (
              name,
              color
            )
          )
        `)
        .order('created_at', { ascending: true })
        .limit(50); // Fetch enough to cover positions

      if (topicsError) {
        console.error('Error fetching topics:', topicsError);
        throw topicsError;
      }

      if (!topics || topics.length === 0) {
        return [];
      }

      // Filter to only the trending positions (1st, 2nd, 3rd, 5th, 8th topics)
      const trendingTopicsRaw = TRENDING_POSITIONS
        .filter(pos => pos < topics.length)
        .map(pos => topics[pos]);

      // Fetch listen counts from user_progress (aggregate across all users)
      const topicIds = trendingTopicsRaw.map(t => t.id);
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

      // Transform topics
      const trendingTopics: TrendingTopic[] = trendingTopicsRaw.map(topic => {
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
        };
      });

      return trendingTopics.slice(0, limit);
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true,
  });
};
