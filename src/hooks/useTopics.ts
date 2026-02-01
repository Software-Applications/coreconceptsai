import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type Topic = Tables<'topics'>;
export type FlashSummary = Tables<'flash_summaries'>;

export interface TopicWithFlashSummary extends Topic {
  flash_summary: FlashSummary | null;
  subject_id: string;
}

// Transformed type matching the old DailyDownloadTopic interface
export interface DailyDownloadTopic {
  id: string;
  subjectId: string;
  chapterId: string;
  title: string;
  description: string;
  transcript: string;
  duration: string;
  audioUrl: string;
  flashSummary: {
    id: string;
    topicId: string;
    visualType: 'diagram' | 'formula' | 'analogy';
    visualContent: string;
    bulletPoints: [string, string, string];
    difficulty: 'easy' | 'medium' | 'hard';
  };
}

export const useTopics = (subjectId?: string) => {
  return useQuery({
    queryKey: ['topics', subjectId],
    queryFn: async (): Promise<DailyDownloadTopic[]> => {
      // First get topics with their chapter info
      let query = supabase
        .from('topics')
        .select(`
          *,
          chapters!inner(subject_id),
          flash_summaries(*)
        `)
        .order('created_at');
      
      if (subjectId) {
        query = query.eq('chapters.subject_id', subjectId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Transform to match DailyDownloadTopic interface
      return (data || []).map(topic => {
        const flashSummary = topic.flash_summaries?.[0];
        const chapter = topic.chapters as { subject_id: string } | null;
        const subjectId = chapter?.subject_id || '';
        return {
          id: topic.id,
          subjectId,
          chapterId: topic.chapter_id,
          title: topic.title,
          description: topic.description || '',
          transcript: (topic as any).transcript || '',
          duration: topic.duration || '0:00',
          audioUrl: topic.audio_url || topic.generated_audio_url || '/mock-audio.mp3',
          flashSummary: flashSummary ? {
            id: flashSummary.id,
            topicId: flashSummary.topic_id,
            visualType: (flashSummary.visual_type as 'diagram' | 'formula' | 'analogy') || 'diagram',
            visualContent: flashSummary.visual_content || '',
            bulletPoints: (flashSummary.bullet_points?.slice(0, 3) || ['', '', '']) as [string, string, string],
            difficulty: (flashSummary.difficulty as 'easy' | 'medium' | 'hard') || 'medium'
          } : {
            id: '',
            topicId: topic.id,
            visualType: 'diagram' as const,
            visualContent: '',
            bulletPoints: ['', '', ''] as [string, string, string],
            difficulty: 'medium' as const
          }
        };
      });
    },
    staleTime: 1000 * 30, // 30 seconds - shorter cache for fresher data
    refetchOnWindowFocus: true, // Refetch when user returns to the tab
  });
};

export const useTopicsBySubject = (subjectId: string) => {
  return useTopics(subjectId);
};

export const useTopicById = (topicId: string | undefined) => {
  return useQuery({
    queryKey: ['topic', topicId],
    queryFn: async (): Promise<DailyDownloadTopic | null> => {
      if (!topicId) return null;
      
      const { data, error } = await supabase
        .from('topics')
        .select(`
          *,
          chapters!inner(subject_id),
          flash_summaries(*)
        `)
        .eq('id', topicId)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) return null;
      
      const flashSummary = data.flash_summaries?.[0];
      const chapter = data.chapters as { subject_id: string } | null;
      const subjectId = chapter?.subject_id || '';
      
      return {
        id: data.id,
        subjectId,
        chapterId: data.chapter_id,
        title: data.title,
        description: data.description || '',
        transcript: (data as any).transcript || '',
        duration: data.duration || '0:00',
        audioUrl: data.audio_url || data.generated_audio_url || '/mock-audio.mp3',
        flashSummary: flashSummary ? {
          id: flashSummary.id,
          topicId: flashSummary.topic_id,
          visualType: (flashSummary.visual_type as 'diagram' | 'formula' | 'analogy') || 'diagram',
          visualContent: flashSummary.visual_content || '',
          bulletPoints: (flashSummary.bullet_points?.slice(0, 3) || ['', '', '']) as [string, string, string],
          difficulty: (flashSummary.difficulty as 'easy' | 'medium' | 'hard') || 'medium'
        } : {
          id: '',
          topicId: data.id,
          visualType: 'diagram' as const,
          visualContent: '',
          bulletPoints: ['', '', ''] as [string, string, string],
          difficulty: 'medium' as const
        }
      };
    },
    enabled: !!topicId,
    staleTime: 1000 * 30, // 30 seconds - shorter cache for fresher data
    refetchOnWindowFocus: true, // Refetch when user returns to the tab
  });
};
