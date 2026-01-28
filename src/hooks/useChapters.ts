import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type Chapter = Tables<'chapters'>;

export const useChapters = (subjectId?: string) => {
  return useQuery({
    queryKey: ['chapters', subjectId],
    queryFn: async (): Promise<Chapter[]> => {
      let query = supabase
        .from('chapters')
        .select('*')
        .order('chapter_number');
      
      if (subjectId) {
        query = query.eq('subject_id', subjectId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useChaptersBySubject = (subjectId: string) => {
  return useChapters(subjectId);
};
