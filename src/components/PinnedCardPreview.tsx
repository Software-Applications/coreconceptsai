import { motion } from 'framer-motion';
import { cardHover, cardTap } from '@/lib/motionVariants';
import { useHaptics } from '@/hooks/useHaptics';
import type { PinnedCard } from '@/data/dailyDownloadData';

interface PinnedCardPreviewProps {
  card: PinnedCard;
  onClick: () => void;
}

export const PinnedCardPreview = ({ card, onClick }: PinnedCardPreviewProps) => {
  const { lightTap } = useHaptics();

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500/20 text-green-400';
      case 'medium': return 'bg-amber-500/20 text-amber-400';
      case 'hard': return 'bg-red-500/20 text-red-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  };

  return (
    <motion.button
      className="flex-shrink-0 w-36 sm:w-40 md:w-44 bg-card border border-border rounded-xl p-3 sm:p-4 text-left hover:border-primary/50 transition-colors"
      variants={{ hover: cardHover, tap: cardTap }}
      whileHover="hover"
      whileTap="tap"
      onClick={() => {
        lightTap();
        onClick();
      }}
    >
      {/* Header with emoji */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl sm:text-3xl">{card.flashSummary.visualContent}</span>
        <span className={`text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full font-medium ${getDifficultyColor(card.flashSummary.difficulty)}`}>
          {getDifficultyLabel(card.flashSummary.difficulty)}
        </span>
      </div>

      {/* Topic title */}
      <h4 className="text-xs sm:text-sm font-medium text-foreground line-clamp-2 leading-snug">
        {card.topicTitle}
      </h4>
    </motion.button>
  );
};
