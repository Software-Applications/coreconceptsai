import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type Topic = Tables<'topics'>;

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
}

export const useTopics = (subjectId?: string) => {
  return useQuery({
    queryKey: ['topics', subjectId],
    queryFn: async (): Promise<DailyDownloadTopic[]> => {
      let query = supabase
        .from('topics')
        .select(`
          *,
          chapters!inner(subject_id)
        `)
        .order('created_at');
      
      if (subjectId) {
        query = query.eq('chapters.subject_id', subjectId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return (data || []).map(topic => {
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
        };
      });
    },
    staleTime: 1000 * 30,
    refetchOnWindowFocus: true,
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
          chapters!inner(subject_id)
        `)
        .eq('id', topicId)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) return null;
      
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
      };
    },
    enabled: !!topicId,
    staleTime: 1000 * 30,
    refetchOnWindowFocus: true,
  });
};
