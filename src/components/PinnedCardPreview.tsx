import { motion } from 'framer-motion';
import { springTransition } from '@/lib/motionVariants';
import { useHaptics } from '@/hooks/useHaptics';
import type { PinnedCard } from '@/data/dailyDownloadData';

interface PinnedCardPreviewProps {
  card: PinnedCard;
  onClick: () => void;
}

export const PinnedCardPreview = ({ card, onClick }: PinnedCardPreviewProps) => {
  const { lightTap } = useHaptics();

  return (
    <motion.button
      className="flex-shrink-0 w-36 sm:w-40 md:w-44 bg-card border border-border rounded-xl p-3 text-left snap-start"
      whileHover={{ scale: 1.02, borderColor: 'hsl(var(--primary) / 0.5)' }}
      whileTap={{ scale: 0.98 }}
      transition={springTransition}
      onClick={() => {
        lightTap();
        onClick();
      }}
    >
      {/* Flashcard title - Primary */}
      <h4 className="text-sm font-semibold text-foreground leading-snug line-clamp-2 mb-1.5">
        {card.flashSummary.visualContent}
      </h4>

      {/* Topic title - Secondary */}
      <p className="text-xs text-muted-foreground leading-normal line-clamp-2">
        {card.topicTitle}
      </p>
    </motion.button>
  );
};
