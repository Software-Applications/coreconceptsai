import { useState, useEffect, useCallback } from 'react';

export interface QuizAttempt {
  quizId: number;
  chapterId: number;
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

function saveProgress(progress: Record<string, QuizProgress>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {
    console.error('Failed to save quiz progress:', e);
  }
}

export function useQuizProgress() {
  const [progress, setProgress] = useState<Record<string, QuizProgress>>(() => loadProgress());

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  const getQuizKey = (quizId: number, chapterId: number) => `${chapterId}-${quizId}`;

  const recordAttempt = useCallback((quizId: number, chapterId: number, score: number, totalQuestions: number) => {
    const key = getQuizKey(quizId, chapterId);
    const attempt: QuizAttempt = {
      quizId,
      chapterId,
      completedAt: new Date().toISOString(),
      score,
      totalQuestions,
    };

    setProgress(prev => {
      const existing = prev[key] || { attempts: [], lastAttemptDate: null };
      return {
        ...prev,
        [key]: {
          attempts: [...existing.attempts, attempt],
          lastAttemptDate: attempt.completedAt,
        },
      };
    });
  }, []);

  const getQuizProgress = useCallback((quizId: number, chapterId: number): QuizProgress | null => {
    const key = getQuizKey(quizId, chapterId);
    return progress[key] || null;
  }, [progress]);

  const getCompletionPercentage = useCallback((quizId: number, chapterId: number): number => {
    const quizProgress = getQuizProgress(quizId, chapterId);
    if (!quizProgress || quizProgress.attempts.length === 0) return 0;
    
    const bestAttempt = quizProgress.attempts.reduce((best, current) => 
      (current.score / current.totalQuestions) > (best.score / best.totalQuestions) ? current : best
    );
    
    return Math.round((bestAttempt.score / bestAttempt.totalQuestions) * 100);
  }, [getQuizProgress]);

  const getAttemptCount = useCallback((quizId: number, chapterId: number): number => {
    const quizProgress = getQuizProgress(quizId, chapterId);
    return quizProgress?.attempts.length || 0;
  }, [getQuizProgress]);

  const getBestScore = useCallback((quizId: number, chapterId: number): { score: number; total: number } | null => {
    const quizProgress = getQuizProgress(quizId, chapterId);
    if (!quizProgress || quizProgress.attempts.length === 0) return null;
    
    const bestAttempt = quizProgress.attempts.reduce((best, current) => 
      (current.score / current.totalQuestions) > (best.score / best.totalQuestions) ? current : best
    );
    
    return { score: bestAttempt.score, total: bestAttempt.totalQuestions };
  }, [getQuizProgress]);

  const clearProgress = useCallback(() => {
    setProgress({});
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    progress,
    recordAttempt,
    getQuizProgress,
    getCompletionPercentage,
    getAttemptCount,
    getBestScore,
    clearProgress,
  };
}
