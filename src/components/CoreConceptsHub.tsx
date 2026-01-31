import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Headphones, ChevronRight, ChevronDown, Bookmark } from 'lucide-react';
import { useHaptics } from '@/hooks/useHaptics';
import { springTransition } from '@/lib/motionVariants';
import { AIBadge } from './AIBadge';
import { PinnedCardPreview } from './PinnedCardPreview';
import { useDragScrollHorizontal } from '@/hooks/useDragScroll';
import type { PinnedCard } from '@/data/dailyDownloadData';

interface CoreConceptsHubProps {
  onOpenTopics: () => void;
  onOpenReviewBoard: () => void;
  onCardClick: (card: PinnedCard) => void;
  pinnedCards: PinnedCard[];
  unlistenedCount: number;
}

export const CoreConceptsHub = ({
  onOpenTopics,
  onOpenReviewBoard,
  onCardClick,
  pinnedCards,
  unlistenedCount
}: CoreConceptsHubProps) => {
  const { mediumTap, lightTap } = useHaptics();
  const scrollRef = useDragScrollHorizontal<HTMLDivElement>();
  const [isExpanded, setIsExpanded] = useState(true);
  
  const hasPinnedCards = pinnedCards.length > 0;

  const handleToggleAccordion = () => {
    lightTap();
    setIsExpanded(prev => !prev);
  };

  const handleMainClick = () => {
    mediumTap();
    onOpenTopics();
  };

  return (
    <div className="sticky top-0 z-20 -mx-4 px-4 bg-background/95 backdrop-blur-sm py-1.5">
      {/* Unified container with subtle border */}
      <div className="rounded-xl bg-muted/40 border border-border">
        {/* Core Concepts AI Bar - Outlined Button Style */}
        <div className="p-2">
          <motion.button
            onClick={handleMainClick}
            className="w-full px-3 py-2.5 text-left bg-navy-100 dark:bg-navy-800 text-navy-800 dark:text-navy-100 border border-navy-200 dark:border-navy-700 rounded-lg hover:bg-navy-200 dark:hover:bg-navy-700 active:bg-navy-300 dark:active:bg-navy-600 transition-all duration-200 shadow-sm"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springTransition}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <div className="flex items-center gap-3">
              {/* Icon with unlistened badge */}
                <div className="w-9 h-9 rounded-full bg-navy-200 dark:bg-navy-700 flex items-center justify-center flex-shrink-0 relative">
                  <Headphones className="w-5 h-5 text-navy-600 dark:text-navy-300" />
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
                  <h3 className="text-sm font-semibold text-navy-900 dark:text-navy-50 flex items-center gap-1.5">
                    Core Concepts <AIBadge size="sm" />
                  </h3>
                  <p className="text-[11px] text-navy-600 dark:text-navy-400 truncate">
                    AI explanations of tough topics
                  </p>
              </div>

              {/* Explore CTA */}
              <div className="flex-shrink-0 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center gap-1">
                Explore <ChevronRight className="w-3 h-3" />
              </div>
            </div>
          </motion.button>
        </div>

        {/* Saved Cards Section - Accordion */}
        <div className="px-3 pb-2">
          {/* Section Header - Clickable */}
          <button
            onClick={handleToggleAccordion}
            className="w-full flex items-center justify-between py-1.5 hover:bg-muted/30 rounded-lg transition-colors -mx-1 px-1"
          >
            <div className="flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-medium text-foreground">My Saved Cards</h3>
              <span className="text-xs text-muted-foreground">({pinnedCards.length})</span>
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
                  <div className="py-2">
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
                          onClick={() => onCardClick(card)}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="py-3">
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
      </div>
    </div>
  );
};
