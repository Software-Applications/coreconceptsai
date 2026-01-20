import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'completed-practice';

interface PracticeRecord {
  id: number;
  bestScore: number;
  attempts: number;
  lastAttempt: string;
}

export const useCompletedPractice = () => {
  const [records, setRecords] = useState<Map<number, PracticeRecord>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const arr: PracticeRecord[] = JSON.parse(stored);
        return new Map(arr.map(r => [r.id, r]));
      }
      return new Map();
    } catch {
      return new Map();
    }
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...records.values()]));
  }, [records]);

  const recordAttempt = useCallback((practiceId: number, score: number) => {
    setRecords(prev => {
      const existing = prev.get(practiceId);
      const newRecord: PracticeRecord = {
        id: practiceId,
        bestScore: existing ? Math.max(existing.bestScore, score) : score,
        attempts: existing ? existing.attempts + 1 : 1,
        lastAttempt: new Date().toISOString()
      };
      return new Map(prev).set(practiceId, newRecord);
    });
  }, []);

  const isCompleted = useCallback((practiceId: number) => {
    return records.has(practiceId);
  }, [records]);

  const getBestScore = useCallback((practiceId: number) => {
    return records.get(practiceId)?.bestScore ?? null;
  }, [records]);

  const getAttemptCount = useCallback((practiceId: number) => {
    return records.get(practiceId)?.attempts ?? 0;
  }, [records]);

  const getCompletedCount = useCallback((practiceIds: number[]) => {
    return practiceIds.filter(id => records.has(id)).length;
  }, [records]);

  const getPendingCount = useCallback((practiceIds: number[]) => {
    return practiceIds.filter(id => !records.has(id)).length;
  }, [records]);

  return { 
    recordAttempt, 
    isCompleted, 
    getBestScore, 
    getAttemptCount, 
    getCompletedCount, 
    getPendingCount 
  };
};
