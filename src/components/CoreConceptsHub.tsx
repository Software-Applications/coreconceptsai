import { motion, AnimatePresence } from 'framer-motion';
import { Headphones, ChevronRight, Bookmark } from 'lucide-react';
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
  const { mediumTap } = useHaptics();
  const scrollRef = useDragScrollHorizontal<HTMLDivElement>();
  
  const hasPinnedCards = pinnedCards.length > 0;

  const handleMainClick = () => {
    mediumTap();
    onOpenTopics();
  };

  return (
    <div className="sticky top-0 z-20 -mx-4 px-4 bg-background/95 backdrop-blur-sm py-1.5">
      {/* Unified container with subtle border */}
      <div className="rounded-xl bg-muted/40 border border-border overflow-hidden">
        {/* Core Concepts AI Bar */}
        <motion.div
          className="bg-gradient-to-r from-primary/25 via-primary/15 to-primary/10"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springTransition}
        >
          <button
            onClick={handleMainClick}
            className="w-full px-3 py-2.5 text-left hover:bg-primary/10 active:bg-primary/15 transition-colors"
          >
            <div className="flex items-center gap-3">
              {/* Icon with unlistened badge */}
              <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 relative">
                <Headphones className="w-5 h-5 text-primary" />
                <AnimatePresence>
                  {unlistenedCount > 0 && (
                    <motion.div
                      className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center"
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
                  AI explanations of tough topics
                </p>
              </div>

              {/* Animated chevron indicator */}
              <motion.div
                className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/15 flex-shrink-0"
                animate={{ x: [0, 3, 0] }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity, 
                  ease: "easeInOut",
                  repeatDelay: 1
                }}
              >
                <ChevronRight className="w-4 h-4 text-primary" />
              </motion.div>
            </div>
          </button>
        </motion.div>

        {/* Separator */}
        <div className="border-t border-border/50" />

        {/* Saved Cards Section */}
        <div className="px-3 py-2">
          {/* Section Header */}
          <div className="flex items-center justify-between py-1.5">
            <div className="flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-medium text-foreground">My Saved Cards</h3>
              <span className="text-xs text-muted-foreground">({pinnedCards.length})</span>
            </div>
            {hasPinnedCards && (
              <button 
                onClick={onOpenReviewBoard} 
                className="flex items-center gap-1 text-xs text-primary font-medium hover:underline"
              >
                See All <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>

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
        </div>
      </div>
    </div>
  );
};
