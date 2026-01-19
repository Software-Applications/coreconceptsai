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
      className="flex-shrink-0 w-32 sm:w-36 md:w-40 bg-card border border-border rounded-xl p-3 text-left"
      whileHover={{ scale: 1.02, borderColor: 'hsl(var(--primary) / 0.5)' }}
      whileTap={{ scale: 0.98 }}
      transition={springTransition}
      onClick={() => {
        lightTap();
        onClick();
      }}
    >
      {/* Emoji */}
      <span className="text-lg block mb-2">{card.flashSummary.visualContent}</span>

      {/* Topic title */}
      <h4 className="text-xs font-medium text-foreground leading-normal line-clamp-2">
        {card.topicTitle}
      </h4>
    </motion.button>
  );
};
