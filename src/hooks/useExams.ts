import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Exam {
  id: string;
  user_id: string;
  subject_id: string;
  title: string;
  exam_date: string;
  created_at: string;
}

export interface ExamChapter {
  id: string;
  exam_id: string;
  chapter_id: string;
  created_at: string;
}

export interface ExamWithChapters extends Exam {
  exam_chapters: ExamChapter[];
}

/**
 * Fetch upcoming exams for a specific subject
 * Returns exams with their linked chapters
 */
export const useUpcomingExam = (subjectId: string | undefined) => {
  return useQuery({
    queryKey: ['upcoming-exam', subjectId],
    queryFn: async (): Promise<ExamWithChapters | null> => {
      if (!subjectId) return null;

      const { data, error } = await supabase
        .from('exams')
        .select(`
          *,
          exam_chapters(*)
        `)
        .eq('subject_id', subjectId)
        .gte('exam_date', new Date().toISOString())
        .order('exam_date', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as ExamWithChapters | null;
    },
    enabled: !!subjectId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Get topic IDs that are relevant to an upcoming exam
 * by looking up which chapters are linked to the exam
 */
export const useExamTopicIds = (subjectId: string | undefined, allTopics: { id: string; chapterId: string }[]) => {
  const { data: exam, isLoading } = useUpcomingExam(subjectId);

  const examTopicIds = new Set<string>();
  
  if (exam?.exam_chapters) {
    const examChapterIds = new Set(exam.exam_chapters.map(ec => ec.chapter_id));
    
    allTopics.forEach(topic => {
      if (examChapterIds.has(topic.chapterId)) {
        examTopicIds.add(topic.id);
      }
    });
  }

  return {
    examTopicIds,
    exam,
    isLoading,
    hasExam: !!exam,
    examDate: exam?.exam_date ? new Date(exam.exam_date) : null,
    daysUntilExam: exam?.exam_date 
      ? Math.ceil((new Date(exam.exam_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null,
  };
};
