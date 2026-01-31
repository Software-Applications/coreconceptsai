import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Headphones, ChevronDown, Bookmark, ChevronRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
  const [isExpanded, setIsExpanded] = useState(false);
  const { mediumTap, lightTap } = useHaptics();
  const scrollRef = useDragScrollHorizontal<HTMLDivElement>();
  
  const hasPinnedCards = pinnedCards.length > 0;

  const handleMainClick = () => {
    mediumTap();
    onOpenTopics();
  };

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    lightTap();
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="sticky top-0 z-20 -mx-4 px-4 bg-background/95 backdrop-blur-sm">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        {/* Main Header Bar */}
        <div className="py-1.5">
          <motion.div
            className="w-full px-3 py-2.5 rounded-xl bg-gradient-to-r from-primary/15 via-primary/10 to-primary/5 border border-primary/20"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springTransition}
          >
            <div className="flex items-center gap-3">
              {/* Left: Core Concepts button */}
              <button
                onClick={handleMainClick}
                className="flex items-center gap-3 flex-1 min-w-0 text-left"
              >
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
              </button>

              {/* Right: Pinned badge + expand toggle */}
              {hasPinnedCards ? (
                <CollapsibleTrigger asChild>
                  <button
                    onClick={handleToggleExpand}
                    className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-primary/10 transition-colors"
                  >
                    <Bookmark className="w-4 h-4 text-primary" />
                    <span className="text-xs font-medium text-primary">
                      {pinnedCards.length}
                    </span>
                    <ChevronDown 
                      className="w-4 h-4 text-muted-foreground transition-transform duration-200" 
                      style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    />
                  </button>
                </CollapsibleTrigger>
              ) : (
                <ChevronRight 
                  className="w-4 h-4 text-muted-foreground flex-shrink-0 cursor-pointer" 
                  onClick={handleMainClick}
                />
              )}
            </div>
          </motion.div>
        </div>

        {/* Expandable Pinned Cards Section */}
        <CollapsibleContent className="data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up overflow-hidden data-[state=open]:overflow-visible">
          <div className="pb-2">
            {/* Horizontal scroll of cards */}
            <div
              ref={scrollRef}
              data-drag-scroll="x"
              className="flex gap-3 overflow-x-auto pt-2 pb-4 scrollbar-hide items-stretch snap-x snap-mandatory overscroll-x-contain select-none"
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
            
            {/* See All link */}
            {pinnedCards.length > 0 && (
              <div className="flex justify-end">
                <button
                  onClick={onOpenReviewBoard}
                  className="flex items-center gap-1 text-xs text-primary font-medium hover:underline"
                >
                  See All
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
