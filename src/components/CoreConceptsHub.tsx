import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Headphones, ChevronDown, Bookmark, ChevronRight, TrendingUp } from 'lucide-react';
import { useHaptics } from '@/hooks/useHaptics';
import { springTransition } from '@/lib/motionVariants';
import { AIBadge } from './AIBadge';
import { PinnedCardPreview } from './PinnedCardPreview';
import { TrendingTopicCard } from './TrendingTopicCard';
import { useTapVsDrag } from '@/hooks/useTapVsDrag';
import { Skeleton } from '@/components/ui/skeleton';
import type { PinnedCard } from '@/data/dailyDownloadData';
import type { TrendingTopic } from '@/hooks/useTrendingTopics';

interface CoreConceptsHubProps {
  onOpenTopics: () => void;
  onOpenReviewBoard: () => void;
  onCardClick: (card: PinnedCard) => void;
  pinnedCards: PinnedCard[];
  unlistenedCount: number;
  examTopicsCount?: number;
  trendingTopics?: TrendingTopic[];
  trendingLoading?: boolean;
  onSelectTrendingTopic?: (topicId: string, chapterId: string) => void;
  isTopicListened?: (topicId: string) => boolean;
  onOpenTrendingTopics?: () => void;
}

export const CoreConceptsHub = ({
  onOpenTopics,
  onOpenReviewBoard,
  onCardClick,
  pinnedCards,
  unlistenedCount,
  examTopicsCount = 0,
  trendingTopics = [],
  trendingLoading = false,
  onSelectTrendingTopic,
  isTopicListened = () => false,
  onOpenTrendingTopics
}: CoreConceptsHubProps) => {
  const { mediumTap, lightTap } = useHaptics();
  const { scrollRef, handleClick } = useTapVsDrag<HTMLDivElement>();
  const { scrollRef: trendingScrollRef, handleClick: handleTrendingClick } = useTapVsDrag<HTMLDivElement>();
  
  const [isExpanded, setIsExpanded] = useState(() => {
    const stored = localStorage.getItem('saved-cards-expanded');
    return stored !== null ? stored === 'true' : true;
  });
  
  const [isTrendingExpanded, setIsTrendingExpanded] = useState(() => {
    const stored = localStorage.getItem('trending-topics-expanded');
    return stored !== null ? stored === 'true' : true;
  });
  
  const hasPinnedCards = pinnedCards.length > 0;
  const hasTrendingTopics = trendingTopics.length > 0 || trendingLoading;

  const handleToggleSavedCards = () => {
    lightTap();
    setIsExpanded(prev => {
      const newState = !prev;
      localStorage.setItem('saved-cards-expanded', String(newState));
      return newState;
    });
  };

  const handleToggleTrending = () => {
    lightTap();
    setIsTrendingExpanded(prev => {
      const newState = !prev;
      localStorage.setItem('trending-topics-expanded', String(newState));
      return newState;
    });
  };

  const handleMainClick = () => {
    mediumTap();
    onOpenTopics();
  };

  return (
    <div className="-mx-4 px-4 py-1.5">
      {/* Outer container - no background, just structure */}
      <div className="rounded-xl overflow-hidden">
        {/* Core Concepts AI Card - Elevated with gradient accent */}
        <div className="relative bg-card rounded-xl shadow-md border border-border/50 overflow-hidden">
          {/* Purple gradient left accent stripe */}
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-violet-500 to-purple-600" />
          
          <motion.button
            onClick={handleMainClick}
            className="w-full pl-5 pr-3 py-3.5 text-left hover:bg-muted/50 active:bg-muted/70 transition-colors duration-200"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springTransition}
            whileHover={{ scale: 1.005 }}
            whileTap={{ scale: 0.995 }}
          >
            <div className="flex items-center gap-3">
              {/* Icon with unlistened badge */}
              <div className="w-10 h-10 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0 relative">
                <Headphones className="w-5 h-5 text-primary" />
                <AnimatePresence>
                  {unlistenedCount > 0 && (
                    <motion.div
                      className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      {unlistenedCount}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

               {/* Title */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  Core Concepts <AIBadge size="sm" />
                </h3>
                <p className="text-[11px] text-muted-foreground truncate">
                  Complex topics, simplified in AI audio
                </p>
                {examTopicsCount > 0 && (
                  <div className="inline-flex items-center gap-1.5 bg-warning/10 px-2.5 py-1 rounded-full mt-2">
                    <span className="text-xs font-medium text-warning">
                      🔥 {examTopicsCount} {examTopicsCount === 1 ? 'topic' : 'topics'} match your upcoming exam
                    </span>
                  </div>
                )}
              </div>

              {/* Arrow CTA */}
              <div className="w-8 h-8 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0">
                <ChevronRight className="w-4 h-4 text-primary" />
              </div>
            </div>
          </motion.button>
        </div>

        {/* Saved Cards Section - Demoted, cleaner */}
         <div className="px-3 pt-3 pb-1.5">
          {/* Section Header - Clickable */}
          <button
            onClick={handleToggleSavedCards}
            className="w-full flex items-center justify-between py-1.5 hover:bg-muted/30 rounded-lg transition-colors -mx-1 px-1"
          >
            <div className="flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-xs font-medium text-muted-foreground">My Saved Cards</h3>
              <span className="text-xs text-muted-foreground/70">({pinnedCards.length})</span>
            </div>
            <div className="flex items-center gap-2">
              {hasPinnedCards && isExpanded && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenReviewBoard();
                  }} 
                  className="flex items-center gap-1 text-xs text-primary font-medium hover:underline"
                >
                  See All <ChevronRight className="w-3 h-3" />
                </button>
              )}
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </motion.div>
            </div>
          </button>

          {/* Collapsible Content */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                {/* Cards or Empty State */}
                {hasPinnedCards ? (
                  <div className="pt-2">
                    <div
                      ref={scrollRef}
                      data-drag-scroll="x"
                      className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide items-stretch snap-x snap-mandatory overscroll-x-contain select-none -mx-3 px-3"
                      style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x' }}
                    >
                      {pinnedCards.slice(0, 5).map((card) => (
                        <PinnedCardPreview
                          key={card.id}
                          card={card}
                          onClick={handleClick(() => onCardClick(card))}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="pt-3">
                    <div className="bg-muted/30 rounded-lg p-4 text-center">
                      <Bookmark className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No saved cards yet</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        Pin flashcards from Core Concepts to review later
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Trending Topics Section */}
         {hasTrendingTopics && (
           <div className="px-3 py-1.5">
            {/* Section Header - Clickable */}
            <button
              onClick={handleToggleTrending}
              className="w-full flex items-center justify-between py-1.5 hover:bg-muted/30 rounded-lg transition-colors -mx-1 px-1"
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-xs font-medium text-muted-foreground">Trending Concepts</h3>
                <span className="text-xs text-muted-foreground/70">({trendingTopics.length})</span>
              </div>
              <div className="flex items-center gap-2">
                {isTrendingExpanded && onOpenTrendingTopics && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenTrendingTopics();
                    }} 
                    className="flex items-center gap-1 text-xs text-primary font-medium hover:underline"
                  >
                    See All <ChevronRight className="w-3 h-3" />
                  </button>
                )}
                <motion.div
                  animate={{ rotate: isTrendingExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </motion.div>
              </div>
            </button>

            {/* Collapsible Content */}
            <AnimatePresence>
              {isTrendingExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="pt-2">
                    {trendingLoading ? (
                      <div className="flex gap-3 overflow-x-auto scrollbar-hide">
                        {[...Array(4)].map((_, i) => (
                          <Skeleton key={i} className="w-40 h-28 rounded-xl flex-shrink-0" />
                        ))}
                      </div>
                    ) : (
                      <div
                        ref={trendingScrollRef}
                        data-drag-scroll="x"
                        className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide items-stretch snap-x snap-mandatory overscroll-x-contain select-none"
                        style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x' }}
                      >
                        {trendingTopics.map((topic) => (
                          <TrendingTopicCard
                            key={topic.id}
                            topic={topic}
                            isListened={isTopicListened(topic.id)}
                            onClick={handleTrendingClick(() => onSelectTrendingTopic?.(topic.id, topic.chapter_id))}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};
