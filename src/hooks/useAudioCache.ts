import { useCallback, useRef, useEffect } from 'react';

const DB_NAME = 'audio-cache';
const DB_VERSION = 1;
const STORE_NAME = 'audio-files';
const MAX_CACHE_SIZE = 50; // Maximum number of cached items
const MAX_AGE_DAYS = 7; // Cache items older than this will be purged

interface CachedAudioEntry {
  cacheKey: string;
  audioBlob: Blob;
  durationMs: number;
  createdAt: number;
  lastAccessedAt: number;
}

export interface AudioCacheEntry {
  blobUrl: string;
  durationMs: number;
}

export const useAudioCache = () => {
  const dbRef = useRef<IDBDatabase | null>(null);
  const memoryCache = useRef<Map<string, AudioCacheEntry>>(new Map());

  // Initialize IndexedDB
  const initDB = useCallback((): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      if (dbRef.current) {
        resolve(dbRef.current);
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('[AudioCache] Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        dbRef.current = request.result;
        console.log('[AudioCache] IndexedDB initialized');
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'cacheKey' });
          store.createIndex('createdAt', 'createdAt', { unique: false });
          store.createIndex('lastAccessedAt', 'lastAccessedAt', { unique: false });
          console.log('[AudioCache] Object store created');
        }
      };
    });
  }, []);

  // Get cached audio
  const getFromCache = useCallback(async (cacheKey: string): Promise<AudioCacheEntry | null> => {
    // Check memory cache first (faster)
    const memoryCached = memoryCache.current.get(cacheKey);
    if (memoryCached) {
      console.log('[AudioCache] Memory cache hit:', cacheKey);
      return memoryCached;
    }

    try {
      const db = await initDB();
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(cacheKey);

        request.onerror = () => {
          console.error('[AudioCache] Get error:', request.error);
          reject(request.error);
        };

        request.onsuccess = () => {
          const result = request.result as CachedAudioEntry | undefined;
          
          if (!result) {
            console.log('[AudioCache] Cache miss:', cacheKey);
            resolve(null);
            return;
          }

          // Check if expired
          const ageMs = Date.now() - result.createdAt;
          if (ageMs > MAX_AGE_DAYS * 24 * 60 * 60 * 1000) {
            console.log('[AudioCache] Expired entry:', cacheKey);
            store.delete(cacheKey);
            resolve(null);
            return;
          }

          // Update last accessed time
          result.lastAccessedAt = Date.now();
          store.put(result);

          // Create blob URL and cache in memory
          const blobUrl = URL.createObjectURL(result.audioBlob);
          const entry: AudioCacheEntry = {
            blobUrl,
            durationMs: result.durationMs,
          };
          
          memoryCache.current.set(cacheKey, entry);
          console.log('[AudioCache] IndexedDB hit:', cacheKey);
          resolve(entry);
        };
      });
    } catch (err) {
      console.error('[AudioCache] Get failed:', err);
      return null;
    }
  }, [initDB]);

  // Save audio to cache
  const saveToCache = useCallback(async (
    cacheKey: string, 
    blobUrl: string, 
    durationMs: number
  ): Promise<void> => {
    try {
      // Fetch the blob from the URL
      const response = await fetch(blobUrl);
      const audioBlob = await response.blob();

      const db = await initDB();
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        const entry: CachedAudioEntry = {
          cacheKey,
          audioBlob,
          durationMs,
          createdAt: Date.now(),
          lastAccessedAt: Date.now(),
        };

        const request = store.put(entry);

        request.onerror = () => {
          console.error('[AudioCache] Save error:', request.error);
          reject(request.error);
        };

        request.onsuccess = () => {
          // Also update memory cache
          memoryCache.current.set(cacheKey, { blobUrl, durationMs });
          console.log('[AudioCache] Saved to IndexedDB:', cacheKey);
          resolve();
        };

        // Cleanup old entries after saving
        transaction.oncomplete = () => {
          cleanupOldEntries();
        };
      });
    } catch (err) {
      console.error('[AudioCache] Save failed:', err);
    }
  }, [initDB]);

  // Delete specific cache entry
  const deleteFromCache = useCallback(async (cacheKey: string): Promise<void> => {
    // Remove from memory cache
    const memoryCached = memoryCache.current.get(cacheKey);
    if (memoryCached) {
      URL.revokeObjectURL(memoryCached.blobUrl);
      memoryCache.current.delete(cacheKey);
    }

    try {
      const db = await initDB();
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(cacheKey);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          console.log('[AudioCache] Deleted:', cacheKey);
          resolve();
        };
      });
    } catch (err) {
      console.error('[AudioCache] Delete failed:', err);
    }
  }, [initDB]);

  // Delete cache entries by voice ID prefix
  const deleteByVoiceId = useCallback(async (voiceId: string): Promise<void> => {
    // Clear from memory cache
    memoryCache.current.forEach((entry, key) => {
      if (key.startsWith(`${voiceId}:`)) {
        URL.revokeObjectURL(entry.blobUrl);
        memoryCache.current.delete(key);
      }
    });

    try {
      const db = await initDB();
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.openCursor();
        
        request.onerror = () => reject(request.error);
        
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
          if (cursor) {
            if (cursor.key.toString().startsWith(`${voiceId}:`)) {
              cursor.delete();
            }
            cursor.continue();
          } else {
            console.log('[AudioCache] Deleted entries for voice:', voiceId);
            resolve();
          }
        };
      });
    } catch (err) {
      console.error('[AudioCache] Delete by voice failed:', err);
    }
  }, [initDB]);

  // Clear all cache
  const clearAllCache = useCallback(async (): Promise<void> => {
    // Clear memory cache
    memoryCache.current.forEach((entry) => {
      URL.revokeObjectURL(entry.blobUrl);
    });
    memoryCache.current.clear();

    try {
      const db = await initDB();
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          console.log('[AudioCache] All cache cleared');
          resolve();
        };
      });
    } catch (err) {
      console.error('[AudioCache] Clear all failed:', err);
    }
  }, [initDB]);

  // Cleanup old entries to stay within size limits
  const cleanupOldEntries = useCallback(async (): Promise<void> => {
    try {
      const db = await initDB();
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const countRequest = store.count();

        countRequest.onsuccess = () => {
          const count = countRequest.result;
          
          if (count <= MAX_CACHE_SIZE) {
            resolve();
            return;
          }

          // Delete oldest entries
          const toDelete = count - MAX_CACHE_SIZE;
          const index = store.index('lastAccessedAt');
          const cursorRequest = index.openCursor();
          let deleted = 0;

          cursorRequest.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
            if (cursor && deleted < toDelete) {
              const key = cursor.value.cacheKey;
              cursor.delete();
              
              // Also remove from memory cache
              const memoryCached = memoryCache.current.get(key);
              if (memoryCached) {
                URL.revokeObjectURL(memoryCached.blobUrl);
                memoryCache.current.delete(key);
              }
              
              deleted++;
              cursor.continue();
            } else {
              console.log(`[AudioCache] Cleaned up ${deleted} old entries`);
              resolve();
            }
          };

          cursorRequest.onerror = () => reject(cursorRequest.error);
        };

        countRequest.onerror = () => reject(countRequest.error);
      });
    } catch (err) {
      console.error('[AudioCache] Cleanup failed:', err);
    }
  }, [initDB]);

  // Get cache stats
  const getCacheStats = useCallback(async (): Promise<{ count: number; oldestDate: Date | null }> => {
    try {
      const db = await initDB();
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const countRequest = store.count();

        countRequest.onsuccess = () => {
          const count = countRequest.result;
          
          if (count === 0) {
            resolve({ count: 0, oldestDate: null });
            return;
          }

          const index = store.index('createdAt');
          const oldestRequest = index.openCursor();
          
          oldestRequest.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
            const oldestDate = cursor ? new Date(cursor.value.createdAt) : null;
            resolve({ count, oldestDate });
          };

          oldestRequest.onerror = () => reject(oldestRequest.error);
        };

        countRequest.onerror = () => reject(countRequest.error);
      });
    } catch (err) {
      console.error('[AudioCache] Stats failed:', err);
      return { count: 0, oldestDate: null };
    }
  }, [initDB]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Revoke all memory-cached blob URLs
      memoryCache.current.forEach((entry) => {
        URL.revokeObjectURL(entry.blobUrl);
      });
      memoryCache.current.clear();
    };
  }, []);

  return {
    getFromCache,
    saveToCache,
    deleteFromCache,
    deleteByVoiceId,
    clearAllCache,
    getCacheStats,
  };
};
