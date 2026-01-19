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
      className="flex-shrink-0 w-40 sm:w-44 md:w-48 bg-card border border-border rounded-xl p-4 text-left"
      whileHover={{ scale: 1.02, borderColor: 'hsl(var(--primary) / 0.5)' }}
      whileTap={{ scale: 0.98 }}
      transition={springTransition}
      onClick={() => {
        lightTap();
        onClick();
      }}
    >
      {/* Emoji */}
      <span className="text-2xl block mb-3">{card.flashSummary.visualContent}</span>

      {/* Topic title */}
      <h4 className="text-sm font-medium text-foreground/90 leading-normal line-clamp-2">
        {card.topicTitle}
      </h4>
    </motion.button>
  );
};
