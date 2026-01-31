import { useMemo } from 'react';
import { useWatchedVideos } from './useWatchedVideos';
import { useCompletedPractice } from './useCompletedPractice';
import { useListenedTopics } from './useListenedTopics';
import { videoTiles, practiceTiles } from '@/data/courseData';
import type { DailyDownloadTopic } from './useTopics';
import type { SubjectWithTextbook } from './useSubjects';

interface SubjectProgressData {
  progress: number; // 0-100
  watchedVideos: number;
  totalVideos: number;
  completedPractice: number;
  totalPractice: number;
  listenedTopics: number;
  totalTopics: number;
}

export const useSubjectProgress = (
  subjects: SubjectWithTextbook[],
  allTopics: DailyDownloadTopic[]
) => {
  const { getWatchedCount } = useWatchedVideos();
  const { getCompletedCount } = useCompletedPractice();
  const { getListenedCount } = useListenedTopics();

  const progressBySubject = useMemo(() => {
    const progressMap = new Map<string, SubjectProgressData>();

    subjects.forEach((subject, index) => {
      const subjectIndex = index + 1;
      
      // Get subject-specific content
      const subjectVideos = videoTiles.filter(v => v.subjectId === subjectIndex);
      const subjectPractice = practiceTiles.filter(p => p.subjectId === subjectIndex);
      const subjectTopics = allTopics.filter(t => t.subjectId === subject.id);

      // Calculate watched/completed/listened counts
      const watchedVideos = getWatchedCount(subjectVideos.map(v => v.id));
      const completedPractice = getCompletedCount(subjectPractice.map(p => p.id));
      const listenedTopics = getListenedCount(subjectTopics.map(t => t.id));

      // Calculate totals
      const totalVideos = subjectVideos.length;
      const totalPractice = subjectPractice.length;
      const totalTopics = subjectTopics.length;
      const totalItems = totalVideos + totalPractice + totalTopics;
      const completedItems = watchedVideos + completedPractice + listenedTopics;

      // Calculate percentage (avoid division by zero)
      const progress = totalItems > 0 
        ? Math.round((completedItems / totalItems) * 100) 
        : 0;

      progressMap.set(subject.id, {
        progress,
        watchedVideos,
        totalVideos,
        completedPractice,
        totalPractice,
        listenedTopics,
        totalTopics,
      });
    });

    return progressMap;
  }, [subjects, allTopics, getWatchedCount, getCompletedCount, getListenedCount]);

  const getProgress = (subjectId: string): SubjectProgressData => {
    return progressBySubject.get(subjectId) ?? {
      progress: 0,
      watchedVideos: 0,
      totalVideos: 0,
      completedPractice: 0,
      totalPractice: 0,
      listenedTopics: 0,
      totalTopics: 0,
    };
  };

  return { progressBySubject, getProgress };
};
