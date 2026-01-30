import { forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useHaptics } from '@/hooks/useHaptics';
import { useDragScroll } from '@/hooks/useDragScroll';
import { springTransition } from '@/lib/motionVariants';
import type { PinnedCard } from '@/data/dailyDownloadData';

interface ExpandedCardModalProps {
  card: PinnedCard | null;
  cards: PinnedCard[];
  onClose: () => void;
  onNavigate: (card: PinnedCard | null) => void;
  onRemove: (cardId: string) => void;
}

const formatDate = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};

export const ExpandedCardModal = forwardRef<HTMLDivElement, ExpandedCardModalProps>(({
  card,
  cards,
  onClose,
  onNavigate,
  onRemove
}, ref) => {
  const { lightTap } = useHaptics();
  const scrollRef = useDragScroll<HTMLDivElement>();

  if (!card) return null;

  const currentIndex = cards.findIndex(c => c.id === card.id);
  const isFirstCard = currentIndex === 0;
  const isLastCard = currentIndex === cards.length - 1;

  const handlePrevious = () => {
    if (!isFirstCard) {
      lightTap();
      onNavigate(cards[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (!isLastCard) {
      lightTap();
      onNavigate(cards[currentIndex + 1]);
    }
  };

  const handleRemove = () => {
    lightTap();
    const nextCard = cards.length > 1 
      ? cards[currentIndex < cards.length - 1 ? currentIndex + 1 : currentIndex - 1]
      : null;
    onRemove(card.id);
    onNavigate(nextCard);
  };

  // Swipe handlers
  const handleDragEnd = (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
    const swipeThreshold = 50;
    const velocityThreshold = 500;
    
    if (info.offset.x < -swipeThreshold || info.velocity.x < -velocityThreshold) {
      // Swipe left - go to next
      handleNext();
    } else if (info.offset.x > swipeThreshold || info.velocity.x > velocityThreshold) {
      // Swipe right - go to previous
      handlePrevious();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-card border border-border rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={springTransition}
          onClick={(e) => e.stopPropagation()}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          style={{ touchAction: 'pan-y' }}
        >
          {/* Modal header */}
          <div className="bg-gradient-to-br from-primary/20 to-primary/5 p-5 relative">
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-2 rounded-full hover:bg-background/50 transition-colors"
            >
              <X className="w-5 h-5 text-foreground" />
            </button>
            {/* Card counter */}
            <div className="absolute top-3 left-3 px-2 py-1 rounded-full bg-background/50 text-xs font-medium text-foreground">
              {currentIndex + 1} / {cards.length}
            </div>
            {/* Topic title as header */}
            <h2 className="text-lg font-bold text-foreground mt-6 pr-8">
              {card.topicTitle}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {card.subjectName}
            </p>
          </div>

          {/* Modal content */}
          <div
            ref={scrollRef}
            className="p-6 flex-1 overflow-y-auto scrollbar-hide overscroll-contain cursor-grab select-none"
            style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
          >
            {/* All bullet points */}
            <ul className="space-y-3 mb-4">
              {card.flashSummary.bulletPoints.map((point, i) => (
                <li key={i} className="flex gap-3 text-sm text-foreground">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>

            {/* Timestamp */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-4">
              <Clock className="w-3 h-3" />
              <span>Pinned {formatDate(card.pinnedAt)}</span>
            </div>
          </div>

          {/* Modal footer */}
          <div className="p-4 border-t border-border space-y-3">
            {/* Navigation buttons */}
            <div className="flex gap-2">
              <button
                disabled={isFirstCard}
                onClick={handlePrevious}
                className={`flex-1 py-2.5 rounded-xl bg-muted text-foreground font-medium transition-colors flex items-center justify-center gap-2 text-sm ${
                  isFirstCard ? 'opacity-40 cursor-not-allowed' : 'hover:bg-muted/80'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <button
                disabled={isLastCard}
                onClick={handleNext}
                className={`flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium transition-colors flex items-center justify-center gap-2 text-sm ${
                  isLastCard ? 'opacity-40 cursor-not-allowed' : 'hover:bg-primary/90'
                }`}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            {/* Remove button */}
            <button
              onClick={handleRemove}
              className="w-full py-2.5 rounded-xl text-destructive font-medium hover:bg-destructive/10 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <Trash2 className="w-4 h-4" />
              Remove
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
});

ExpandedCardModal.displayName = 'ExpandedCardModal';
