import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { PinnedCard, FlashSummary } from '@/data/dailyDownloadData';

const STORAGE_KEY = 'daily-download-pinned-cards';

export const usePinnedCards = () => {
  const { user, isAuthenticated } = useAuth();
  const [pinnedCards, setPinnedCards] = useState<PinnedCard[]>([]);
  const [loading, setLoading] = useState(false);

  // Load from localStorage on mount (for guests)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as PinnedCard[];
        parsed.sort((a, b) => new Date(b.pinnedAt).getTime() - new Date(a.pinnedAt).getTime());
        setPinnedCards(parsed);
      }
    } catch (error) {
      console.error('Failed to load pinned cards:', error);
    }
  }, []);

  // Sync with Supabase when authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const fetchPinnedCards = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('pinned_cards')
          .select(`
            id,
            pinned_at,
            flash_summary_id,
            flash_summaries (
              id,
              visual_type,
              visual_content,
              bullet_points,
              difficulty,
              topics (
                id,
                title,
                chapters (
                  subjects (name)
                )
              )
            )
          `)
          .eq('user_id', user.id)
          .order('pinned_at', { ascending: false });

        if (error) {
          console.error('Error fetching pinned cards:', error);
          return;
        }

        if (data) {
          // Define the shape of the joined query result
          type PinnedCardRow = {
            id: string;
            pinned_at: string | null;
            flash_summary_id: string;
            flash_summaries: {
              id: string;
              topic_id?: string;
              visual_type: string | null;
              visual_content: string | null;
              bullet_points: string[] | null;
              difficulty: string | null;
              topics?: {
                id: string;
                title: string;
                chapters?: {
                  subjects?: { name: string } | null;
                } | null;
              } | null;
            } | null;
          };
          
          const cards: PinnedCard[] = (data as PinnedCardRow[]).map((item) => ({
            id: item.id,
            pinnedAt: item.pinned_at || new Date().toISOString(),
            topicTitle: item.flash_summaries?.topics?.title || '',
            subjectName: item.flash_summaries?.topics?.chapters?.subjects?.name || '',
            flashSummary: {
              id: item.flash_summaries?.id || '',
              topicId: item.flash_summaries?.topic_id || '',
              visualType: (item.flash_summaries?.visual_type as 'diagram' | 'formula' | 'analogy') || 'diagram',
              visualContent: item.flash_summaries?.visual_content || '',
              bulletPoints: (item.flash_summaries?.bullet_points?.slice(0, 3) || ['', '', '']) as [string, string, string],
              difficulty: (item.flash_summaries?.difficulty as 'easy' | 'medium' | 'hard') || 'medium'
            }
          }));
          setPinnedCards(cards);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
        }
      } catch (err) {
        console.error('Error fetching pinned cards:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPinnedCards();
  }, [isAuthenticated, user]);

  const saveToStorage = useCallback((cards: PinnedCard[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
    } catch (error) {
      console.error('Failed to save pinned cards:', error);
    }
  }, []);

  const pinCard = useCallback(async (
    flashSummary: FlashSummary,
    topicTitle: string,
    subjectName: string
  ) => {
    // Check if already pinned
    if (pinnedCards.some(card => card.flashSummary.id === flashSummary.id)) {
      return;
    }

    const newCard: PinnedCard = {
      id: `pinned-${flashSummary.id}-${Date.now()}`,
      flashSummary,
      pinnedAt: new Date().toISOString(),
      topicTitle,
      subjectName
    };

    // Optimistic update
    setPinnedCards(prev => {
      const updated = [newCard, ...prev];
      saveToStorage(updated);
      return updated;
    });

    if (isAuthenticated && user) {
      try {
        const { data, error } = await supabase
          .from('pinned_cards')
          .insert({
            user_id: user.id,
            flash_summary_id: flashSummary.id,
            pinned_at: newCard.pinnedAt
          })
          .select('id')
          .single();

        if (error) {
          console.error('Error pinning card:', error);
          // Revert on error
          setPinnedCards(prev => prev.filter(c => c.id !== newCard.id));
        } else if (data) {
          // Update with server ID
          setPinnedCards(prev => prev.map(c => 
            c.id === newCard.id ? { ...c, id: data.id } : c
          ));
        }
      } catch (err) {
        console.error('Error pinning card:', err);
      }
    }
  }, [pinnedCards, isAuthenticated, user, saveToStorage]);

  const unpinCard = useCallback(async (cardId: string) => {
    const cardToRemove = pinnedCards.find(c => c.id === cardId);
    
    // Optimistic update
    setPinnedCards(prev => {
      const updated = prev.filter(card => card.id !== cardId);
      saveToStorage(updated);
      return updated;
    });

    if (isAuthenticated && user && cardToRemove) {
      try {
        const { error } = await supabase
          .from('pinned_cards')
          .delete()
          .eq('id', cardId)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error unpinning card:', error);
          // Revert on error
          if (cardToRemove) {
            setPinnedCards(prev => [cardToRemove, ...prev]);
          }
        }
      } catch (err) {
        console.error('Error unpinning card:', err);
      }
    }
  }, [pinnedCards, isAuthenticated, user, saveToStorage]);

  const clearAllPinned = useCallback(async () => {
    const previousCards = [...pinnedCards];
    
    // Optimistic update
    setPinnedCards([]);
    saveToStorage([]);

    if (isAuthenticated && user) {
      try {
        const { error } = await supabase
          .from('pinned_cards')
          .delete()
          .eq('user_id', user.id);

        if (error) {
          console.error('Error clearing pinned cards:', error);
          // Revert on error
          setPinnedCards(previousCards);
          saveToStorage(previousCards);
        }
      } catch (err) {
        console.error('Error clearing pinned cards:', err);
      }
    }
  }, [pinnedCards, isAuthenticated, user, saveToStorage]);

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
    isCardPinned,
    loading
  };
};
