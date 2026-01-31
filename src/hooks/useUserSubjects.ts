import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'user-selected-subjects';

interface UserSubjectsState {
  selectedSubjectIds: string[];
  order: string[];
}

const getInitialState = (allSubjectIds: string[]): UserSubjectsState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as UserSubjectsState;
      // Filter out any IDs that no longer exist
      const validIds = parsed.selectedSubjectIds.filter(id => allSubjectIds.includes(id));
      const validOrder = parsed.order.filter(id => validIds.includes(id));
      return { selectedSubjectIds: validIds, order: validOrder };
    }
  } catch (e) {
    console.error('Failed to parse user subjects from localStorage:', e);
  }
  // Default: show all subjects
  return { selectedSubjectIds: allSubjectIds, order: allSubjectIds };
};

export const useUserSubjects = (allSubjectIds: string[]) => {
  const [state, setState] = useState<UserSubjectsState>(() => 
    getInitialState(allSubjectIds)
  );

  // Update state when allSubjectIds changes (e.g., after initial load)
  useEffect(() => {
    if (allSubjectIds.length > 0 && state.selectedSubjectIds.length === 0) {
      setState(getInitialState(allSubjectIds));
    }
  }, [allSubjectIds]);

  // Persist to localStorage
  useEffect(() => {
    if (state.selectedSubjectIds.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state]);

  const addSubject = useCallback((subjectId: string) => {
    setState(prev => {
      if (prev.selectedSubjectIds.includes(subjectId)) return prev;
      return {
        selectedSubjectIds: [...prev.selectedSubjectIds, subjectId],
        order: [...prev.order, subjectId],
      };
    });
  }, []);

  const removeSubject = useCallback((subjectId: string) => {
    setState(prev => ({
      selectedSubjectIds: prev.selectedSubjectIds.filter(id => id !== subjectId),
      order: prev.order.filter(id => id !== subjectId),
    }));
  }, []);

  const reorderSubjects = useCallback((newOrder: string[]) => {
    setState(prev => ({
      ...prev,
      order: newOrder,
    }));
  }, []);

  const isSelected = useCallback((subjectId: string) => {
    return state.selectedSubjectIds.includes(subjectId);
  }, [state.selectedSubjectIds]);

  const getUnselectedSubjectIds = useCallback((allIds: string[]) => {
    return allIds.filter(id => !state.selectedSubjectIds.includes(id));
  }, [state.selectedSubjectIds]);

  // Get subjects in correct order
  const getOrderedSelectedIds = useCallback(() => {
    return state.order.filter(id => state.selectedSubjectIds.includes(id));
  }, [state]);

  return {
    selectedSubjectIds: state.selectedSubjectIds,
    orderedSubjectIds: getOrderedSelectedIds(),
    addSubject,
    removeSubject,
    reorderSubjects,
    isSelected,
    getUnselectedSubjectIds,
  };
};
