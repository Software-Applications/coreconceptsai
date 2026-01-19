import { motion, AnimatePresence } from 'framer-motion';
import { X, Bookmark, Trash2, Clock } from 'lucide-react';
import { useHaptics } from '@/hooks/useHaptics';
import { springTransition } from '@/lib/motionVariants';
import type { PinnedCard } from '@/data/dailyDownloadData';

interface ReviewBoardProps {
  isOpen: boolean;
  onClose: () => void;
  pinnedCards: PinnedCard[];
  onUnpinCard: (cardId: string) => void;
  onClearAll: () => void;
}

export const ReviewBoard = ({
  isOpen,
  onClose,
  pinnedCards,
  onUnpinCard,
  onClearAll
}: ReviewBoardProps) => {
  const { lightTap, errorNotification } = useHaptics();

  const handleUnpin = (cardId: string) => {
    lightTap();
    onUnpinCard(cardId);
  };

  const handleClearAll = () => {
    errorNotification();
    onClearAll();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500/20 text-green-600 dark:text-green-400';
      case 'medium': return 'bg-amber-500/20 text-amber-600 dark:text-amber-400';
      case 'hard': return 'bg-red-500/20 text-red-600 dark:text-red-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 bg-background flex flex-col"
          initial={{ opacity: 0, x: '100%' }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: '100%' }}
          transition={springTransition}
        >
          {/* Header */}
          <header className="flex items-center justify-between p-4 pt-safe border-b border-border">
            <button
              onClick={() => { lightTap(); onClose(); }}
              className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
            >
              <X className="w-6 h-6 text-foreground" />
            </button>
            <div className="text-center">
              <h1 className="text-lg font-bold text-foreground">Review Board</h1>
              <p className="text-xs text-muted-foreground">
                {pinnedCards.length} card{pinnedCards.length !== 1 ? 's' : ''} to review
              </p>
            </div>
            {pinnedCards.length > 0 ? (
              <button
                onClick={handleClearAll}
                className="p-2 -mr-2 rounded-full hover:bg-destructive/10 transition-colors text-destructive"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            ) : (
              <div className="w-10" />
            )}
          </header>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 pb-safe">
            {pinnedCards.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-8">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Bookmark className="w-10 h-10 text-muted-foreground" />
                </div>
                <h2 className="text-lg font-semibold text-foreground mb-2">
                  No cards pinned yet
                </h2>
                <p className="text-sm text-muted-foreground">
                  Swipe right on flash cards during your Daily Download to add them here for review.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pinnedCards.map((card, index) => (
                  <motion.div
                    key={card.id}
                    className="bg-card border border-border rounded-xl overflow-hidden"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    {/* Card header */}
                    <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-4 flex items-center justify-between">
                      <div className="text-xl font-bold text-foreground">
                        {card.flashSummary.visualContent}
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getDifficultyColor(card.flashSummary.difficulty)}`}>
                        {card.flashSummary.difficulty}
                      </span>
                    </div>

                    {/* Card content */}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-foreground text-sm">
                            {card.topicTitle}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {card.subjectName}
                          </p>
                        </div>
                        <button
                          onClick={() => handleUnpin(card.id)}
                          className="p-2 rounded-full hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                        </button>
                      </div>

                      {/* Bullet points preview */}
                      <ul className="space-y-2 mb-3">
                        {card.flashSummary.bulletPoints.slice(0, 2).map((point, i) => (
                          <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                            <span className="flex-shrink-0 w-4 h-4 rounded-full bg-primary/10 text-primary text-[10px] font-semibold flex items-center justify-center">
                              {i + 1}
                            </span>
                            <span className="line-clamp-1">{point}</span>
                          </li>
                        ))}
                        {card.flashSummary.bulletPoints.length > 2 && (
                          <li className="text-xs text-primary ml-6">
                            +1 more point
                          </li>
                        )}
                      </ul>

                      {/* Timestamp */}
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>Pinned {formatDate(card.pinnedAt)}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
