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
      className="flex-shrink-0 w-36 sm:w-40 md:w-44 bg-card border border-border rounded-xl p-3 sm:p-4 text-left"
      whileHover={{ scale: 1.02, borderColor: 'hsl(var(--primary) / 0.5)' }}
      whileTap={{ scale: 0.98 }}
      transition={springTransition}
      onClick={() => {
        lightTap();
        onClick();
      }}
    >
      {/* Emoji */}
      <span className="text-2xl sm:text-3xl block mb-2">{card.flashSummary.visualContent}</span>

      {/* Topic title */}
      <h4 className="text-xs sm:text-sm font-medium text-foreground leading-relaxed">
        {card.topicTitle}
      </h4>
    </motion.button>
  );
};
