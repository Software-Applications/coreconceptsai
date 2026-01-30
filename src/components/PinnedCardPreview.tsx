import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { springTransition } from '@/lib/motionVariants';
import { useHaptics } from '@/hooks/useHaptics';
import type { PinnedCard } from '@/data/dailyDownloadData';

interface PinnedCardPreviewProps {
  card: PinnedCard;
  onClick: () => void;
}

export const PinnedCardPreview = forwardRef<HTMLDivElement, PinnedCardPreviewProps>(
  ({ card, onClick }, ref) => {
    const { lightTap } = useHaptics();

    return (
      <div ref={ref} className="flex-shrink-0 snap-start">
        <motion.button
          className="w-40 h-28 bg-card border border-border rounded-xl p-3 text-left flex flex-col justify-between select-none"
          whileHover={{ scale: 1.02, borderColor: 'hsl(var(--primary) / 0.5)' }}
          whileTap={{ scale: 0.98 }}
          transition={springTransition}
          onClick={() => {
            lightTap();
            onClick();
          }}
        >
          {/* Flashcard title - Primary */}
          <h4 className="text-sm font-semibold text-foreground leading-snug line-clamp-2">
            {card.flashSummary.visualContent}
          </h4>

          {/* Topic title - Secondary */}
          <p className="text-xs text-muted-foreground leading-normal line-clamp-2">
            {card.topicTitle}
          </p>
        </motion.button>
      </div>
    );
  }
);

PinnedCardPreview.displayName = 'PinnedCardPreview';
