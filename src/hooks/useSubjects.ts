import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type Subject = Tables<'subjects'>;

export interface SubjectWithTextbook extends Subject {
  textbook: {
    title: string;
    imageUrl: string;
    author?: string;
  };
}

export const useSubjects = () => {
  return useQuery({
    queryKey: ['subjects'],
    queryFn: async (): Promise<SubjectWithTextbook[]> => {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      // Transform to match the expected interface
      return (data || []).map(subject => ({
        ...subject,
        textbook: {
          title: subject.textbook_title || subject.name,
          imageUrl: subject.textbook_image_url || subject.image_url || '',
          author: (subject as any).textbook_author || undefined
        }
      }));
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useSubjectById = (subjectId: string | undefined) => {
  return useQuery({
    queryKey: ['subjects', subjectId],
    queryFn: async (): Promise<SubjectWithTextbook | null> => {
      if (!subjectId) return null;
      
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('id', subjectId)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) return null;
      
      return {
        ...data,
        textbook: {
          title: data.textbook_title || data.name,
          imageUrl: data.textbook_image_url || data.image_url || '',
          author: (data as any).textbook_author || undefined
        }
      };
    },
    enabled: !!subjectId,
  });
};
