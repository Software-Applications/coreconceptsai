import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
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
      case 'easy': return 'bg-green-500';
      case 'medium': return 'bg-amber-500';
      case 'hard': return 'bg-red-500';
      default: return 'bg-muted';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${diffDays}d`;
  };

  return (
    <motion.button
      className="flex-shrink-0 w-32 bg-card border border-border rounded-xl p-3 text-left"
      variants={{ hover: cardHover, tap: cardTap }}
      whileHover="hover"
      whileTap="tap"
      onClick={() => {
        lightTap();
        onClick();
      }}
    >
      {/* Header with emoji and difficulty */}
      <div className="flex items-start justify-between mb-2">
        <span className="text-2xl">{card.flashSummary.visualContent}</span>
        <span className={`w-2 h-2 rounded-full ${getDifficultyColor(card.flashSummary.difficulty)}`} />
      </div>

      {/* Topic title */}
      <h4 className="text-xs font-medium text-foreground line-clamp-2 mb-1">
        {card.topicTitle}
      </h4>

      {/* Subject name */}
      <p className="text-[10px] text-muted-foreground mb-2 truncate">
        {card.subjectName}
      </p>

      {/* Pinned time */}
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <Clock className="w-2.5 h-2.5" />
        <span>{formatDate(card.pinnedAt)}</span>
      </div>
    </motion.button>
  );
};
