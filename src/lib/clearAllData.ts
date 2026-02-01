import { clearAllCache as clearAudioCache } from './audioCache';
import { QueryClient } from '@tanstack/react-query';

// All localStorage keys used by the app
const LOCALSTORAGE_KEYS = [
  'daily-download-voice',
  'user-subjects',
  'quiz-progress',
  'pinned-cards',
  'watched-videos',
  'saved-cards-expanded',
  'daily-download-fab-tooltip-seen',
  'topic-search-recent',
];

export async function clearAllAppData(queryClient?: QueryClient): Promise<void> {
  // 1. Clear IndexedDB audio cache
  await clearAudioCache();
  
  // 2. Clear localStorage (preserve auth session)
  LOCALSTORAGE_KEYS.forEach(key => {
    localStorage.removeItem(key);
  });
  
  // 3. Clear TanStack Query cache
  if (queryClient) {
    queryClient.clear();
  }
  
  console.log('[ClearData] All app data cleared');
}

export function clearAllLocalStorage(): void {
  LOCALSTORAGE_KEYS.forEach(key => {
    localStorage.removeItem(key);
  });
}
