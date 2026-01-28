import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface QuizAttempt {
  quizId: number;
  chapterId: number | string; // Support both number (local) and string (UUID)
  completedAt: string;
  score: number;
  totalQuestions: number;
}

export interface QuizProgress {
  attempts: QuizAttempt[];
  lastAttemptDate: string | null;
}

const STORAGE_KEY = 'exam-ready-quiz-progress';

function loadProgress(): Record<string, QuizProgress> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveProgressToStorage(progress: Record<string, QuizProgress>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {
    console.error('Failed to save quiz progress:', e);
  }
}

export function useQuizProgress() {
  const { user, isAuthenticated } = useAuth();
  const [progress, setProgress] = useState<Record<string, QuizProgress>>(() => loadProgress());
  const [loading, setLoading] = useState(false);

  // Sync to localStorage when progress changes (for guests)
  useEffect(() => {
    if (!isAuthenticated) {
      saveProgressToStorage(progress);
    }
  }, [progress, isAuthenticated]);

  // Fetch from Supabase when authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const fetchQuizProgress = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('quiz_attempts')
          .select('*')
          .eq('user_id', user.id)
          .order('completed_at', { ascending: false });

        if (error) {
          console.error('Error fetching quiz progress:', error);
          return;
        }

        if (data) {
          const progressMap: Record<string, QuizProgress> = {};
          
          data.forEach((attempt: any) => {
            const key = `${attempt.chapter_id}-${attempt.quiz_id}`;
            if (!progressMap[key]) {
              progressMap[key] = { attempts: [], lastAttemptDate: null };
            }
            progressMap[key].attempts.push({
              quizId: attempt.quiz_id,
              chapterId: attempt.chapter_id,
              completedAt: attempt.completed_at,
              score: attempt.score,
              totalQuestions: attempt.total_questions,
            });
            if (!progressMap[key].lastAttemptDate || 
                new Date(attempt.completed_at) > new Date(progressMap[key].lastAttemptDate!)) {
              progressMap[key].lastAttemptDate = attempt.completed_at;
            }
          });

          setProgress(progressMap);
          saveProgressToStorage(progressMap);
        }
      } catch (err) {
        console.error('Error fetching quiz progress:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizProgress();
  }, [isAuthenticated, user]);

  const getQuizKey = (quizId: number, chapterId: number | string) => `${chapterId}-${quizId}`;

  const recordAttempt = useCallback(async (
    quizId: number, 
    chapterId: number | string, 
    score: number, 
    totalQuestions: number
  ) => {
    const key = getQuizKey(quizId, chapterId);
    const attempt: QuizAttempt = {
      quizId,
      chapterId,
      completedAt: new Date().toISOString(),
      score,
      totalQuestions,
    };

    // Optimistic update
    setProgress(prev => {
      const existing = prev[key] || { attempts: [], lastAttemptDate: null };
      const updated = {
        ...prev,
        [key]: {
          attempts: [...existing.attempts, attempt],
          lastAttemptDate: attempt.completedAt,
        },
      };
      saveProgressToStorage(updated);
      return updated;
    });

    // Only sync to Supabase if chapterId is a UUID string (database record)
    if (isAuthenticated && user && typeof chapterId === 'string' && chapterId.includes('-')) {
      try {
        const { error } = await supabase
          .from('quiz_attempts')
          .insert({
            user_id: user.id,
            quiz_id: quizId,
            chapter_id: chapterId,
            score,
            total_questions: totalQuestions,
            completed_at: attempt.completedAt
          });

        if (error) {
          console.error('Error saving quiz attempt:', error);
        }
      } catch (err) {
        console.error('Error saving quiz attempt:', err);
      }
    }
  }, [isAuthenticated, user]);

  const getQuizProgress = useCallback((quizId: number, chapterId: number | string): QuizProgress | null => {
    const key = getQuizKey(quizId, chapterId);
    return progress[key] || null;
  }, [progress]);

  const getCompletionPercentage = useCallback((quizId: number, chapterId: number | string): number => {
    const quizProgress = getQuizProgress(quizId, chapterId);
    if (!quizProgress || quizProgress.attempts.length === 0) return 0;
    
    const bestAttempt = quizProgress.attempts.reduce((best, current) => 
      (current.score / current.totalQuestions) > (best.score / best.totalQuestions) ? current : best
    );
    
    return Math.round((bestAttempt.score / bestAttempt.totalQuestions) * 100);
  }, [getQuizProgress]);

  const getAttemptCount = useCallback((quizId: number, chapterId: number | string): number => {
    const quizProgress = getQuizProgress(quizId, chapterId);
    return quizProgress?.attempts.length || 0;
  }, [getQuizProgress]);

  const getBestScore = useCallback((quizId: number, chapterId: number | string): { score: number; total: number } | null => {
    const quizProgress = getQuizProgress(quizId, chapterId);
    if (!quizProgress || quizProgress.attempts.length === 0) return null;
    
    const bestAttempt = quizProgress.attempts.reduce((best, current) => 
      (current.score / current.totalQuestions) > (best.score / best.totalQuestions) ? current : best
    );
    
    return { score: bestAttempt.score, total: bestAttempt.totalQuestions };
  }, [getQuizProgress]);

  const clearProgress = useCallback(async () => {
    setProgress({});
    localStorage.removeItem(STORAGE_KEY);

    if (isAuthenticated && user) {
      try {
        const { error } = await supabase
          .from('quiz_attempts')
          .delete()
          .eq('user_id', user.id);

        if (error) {
          console.error('Error clearing quiz progress:', error);
        }
      } catch (err) {
        console.error('Error clearing quiz progress:', err);
      }
    }
  }, [isAuthenticated, user]);

  return {
    progress,
    recordAttempt,
    getQuizProgress,
    getCompletionPercentage,
    getAttemptCount,
    getBestScore,
    clearProgress,
    loading,
  };
}
