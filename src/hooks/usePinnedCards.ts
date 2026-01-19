import { useState, useEffect, useCallback } from 'react';
import type { PinnedCard, FlashSummary } from '@/data/dailyDownloadData';

const STORAGE_KEY = 'daily-download-pinned-cards';

export const usePinnedCards = () => {
  const [pinnedCards, setPinnedCards] = useState<PinnedCard[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as PinnedCard[];
        // Sort by most recently pinned
        parsed.sort((a, b) => new Date(b.pinnedAt).getTime() - new Date(a.pinnedAt).getTime());
        setPinnedCards(parsed);
      }
    } catch (error) {
      console.error('Failed to load pinned cards:', error);
    }
  }, []);

  // Save to localStorage whenever pinnedCards changes
  const saveToStorage = useCallback((cards: PinnedCard[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
    } catch (error) {
      console.error('Failed to save pinned cards:', error);
    }
  }, []);

  const pinCard = useCallback((
    flashSummary: FlashSummary,
    topicTitle: string,
    subjectName: string
  ) => {
    console.log('pinCard called with:', { flashSummary, topicTitle, subjectName });
    
    setPinnedCards(prev => {
      // Check if already pinned
      if (prev.some(card => card.flashSummary.id === flashSummary.id)) {
        console.log('Card already pinned, skipping');
        return prev;
      }

      const newCard: PinnedCard = {
        id: `pinned-${flashSummary.id}-${Date.now()}`,
        flashSummary,
        pinnedAt: new Date().toISOString(),
        topicTitle,
        subjectName
      };

      const updated = [newCard, ...prev];
      console.log('Pinned card, new total:', updated.length);
      saveToStorage(updated);
      return updated;
    });
  }, [saveToStorage]);

  const unpinCard = useCallback((cardId: string) => {
    setPinnedCards(prev => {
      const updated = prev.filter(card => card.id !== cardId);
      saveToStorage(updated);
      return updated;
    });
  }, [saveToStorage]);

  const clearAllPinned = useCallback(() => {
    setPinnedCards([]);
    saveToStorage([]);
  }, [saveToStorage]);

  const getPinnedCount = useCallback(() => {
    return pinnedCards.length;
  }, [pinnedCards]);

  const isCardPinned = useCallback((flashSummaryId: string) => {
    return pinnedCards.some(card => card.flashSummary.id === flashSummaryId);
  }, [pinnedCards]);

  return {
    pinnedCards,
    pinCard,
    unpinCard,
    clearAllPinned,
    getPinnedCount,
    isCardPinned
  };
};
