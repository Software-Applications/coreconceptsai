import { forwardRef, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { cardHover, cardTap, springTransition } from '@/lib/motionVariants';
import { useHaptics } from '@/hooks/useHaptics';
import type { PinnedCard } from '@/data/dailyDownloadData';

interface PinnedCardPreviewProps {
  card: PinnedCard;
  onClick: () => void;
}

export const PinnedCardPreview = forwardRef<HTMLDivElement, PinnedCardPreviewProps>(
  ({ card, onClick }, ref) => {
    const { lightTap } = useHaptics();
    const startPos = useRef({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);

    const handlePointerDown = (e: React.PointerEvent) => {
      startPos.current = { x: e.clientX, y: e.clientY };
      setIsDragging(false);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
      const dx = Math.abs(e.clientX - startPos.current.x);
      const dy = Math.abs(e.clientY - startPos.current.y);
      // If moved more than 5px, consider it a drag
      if (dx > 5 || dy > 5) {
        setIsDragging(true);
      }
    };

    const handleClick = (e: React.MouseEvent) => {
      // Don't trigger click if user was dragging
      if (isDragging) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      lightTap();
      onClick();
    };

    return (
      <div ref={ref} className="flex-shrink-0 snap-start">
        <motion.button
          className="w-40 h-28 bg-card border border-border rounded-xl p-3 text-left flex flex-col justify-between select-none shadow-sm"
          whileHover={cardHover}
          whileTap={isDragging ? {} : cardTap}
          transition={springTransition}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onClick={handleClick}
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
