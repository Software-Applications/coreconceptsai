
# Clear All Cache and Stored Data

## Overview
Clean up all cached data and stored references across the app, including:
- **IndexedDB audio cache** (stored audio files from Google TTS)
- **localStorage data** (user preferences, watched videos, quiz progress, etc.)
- **TanStack Query cache** (in-memory query results)

---

## What Will Be Cleared

| Storage Type | Data Stored | Location |
|--------------|-------------|----------|
| IndexedDB | Audio blobs from Google TTS | `audio-cache` database |
| localStorage | Voice preference | `daily-download-voice` |
| localStorage | User subjects | `user-subjects` |
| localStorage | Quiz progress | `quiz-progress` |
| localStorage | Pinned cards (guests) | `pinned-cards` |
| localStorage | Watched videos | `watched-videos` |
| localStorage | Saved cards expanded state | `saved-cards-expanded` |
| localStorage | FAB tooltip seen | `daily-download-fab-tooltip-seen` |
| localStorage | Recent searches | `topic-search-recent` |
| localStorage | Supabase auth session | `sb-*` keys |
| Memory | TanStack Query cache | In-memory |

---

## Implementation

### 1. Create a Cache Clearing Utility
**New file: `src/lib/clearAllData.ts`**

```typescript
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
```

### 2. Execute the Cleanup

Since you want to clear this immediately, I'll:
1. Add a temporary button/function to trigger the cleanup
2. Or you can run this in the browser console

For a one-time cleanup, you can run this in the browser console:
```javascript
// Clear IndexedDB
indexedDB.deleteDatabase('audio-cache');

// Clear localStorage (preserving auth)
['daily-download-voice', 'user-subjects', 'quiz-progress', 'pinned-cards', 
 'watched-videos', 'saved-cards-expanded', 'daily-download-fab-tooltip-seen',
 'topic-search-recent'].forEach(key => localStorage.removeItem(key));

// Refresh to clear query cache
location.reload();
```

---

## Approach Options

| Option | What It Does |
|--------|--------------|
| **A: Console Script** | Run the above script in browser DevTools - quick one-time fix |
| **B: Utility Function** | Create reusable `clearAllAppData()` function for future use |
| **C: Settings Page** | Add a "Clear Cache" button in a settings area |

---

## Recommendation

**Option B** - Create the utility function so it's available for future use, plus run the console script now for immediate cleanup.

---

## Technical Details

The implementation creates a centralized utility that:
- Clears the IndexedDB `audio-cache` database
- Removes all app-specific localStorage keys (preserving Supabase auth)
- Optionally clears the TanStack Query cache if a QueryClient is provided
- Logs the cleanup for debugging purposes
