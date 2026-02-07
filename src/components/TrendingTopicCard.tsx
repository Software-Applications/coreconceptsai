import { forwardRef, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Headphones, Check } from 'lucide-react';
import { cardHover, cardTap, springTransition } from '@/lib/motionVariants';
import { useHaptics } from '@/hooks/useHaptics';
import type { TrendingTopic } from '@/hooks/useTrendingTopics';

interface TrendingTopicCardProps {
  topic: TrendingTopic;
  isListened: boolean;
  onClick: () => void;
}

export const TrendingTopicCard = forwardRef<HTMLDivElement, TrendingTopicCardProps>(
  ({ topic, isListened, onClick }, ref) => {
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
      if (dx > 5 || dy > 5) {
        setIsDragging(true);
      }
    };

    const handleClick = (e: React.MouseEvent) => {
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
          className="w-40 h-28 bg-card border border-border rounded-xl p-3 text-left flex flex-col justify-between select-none shadow-sm relative overflow-hidden"
          whileHover={cardHover}
          whileTap={isDragging ? {} : cardTap}
          transition={springTransition}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onClick={handleClick}
        >
          {/* Listened checkmark */}
          {isListened && (
            <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-success flex items-center justify-center">
              <Check className="w-3 h-3 text-success-foreground" />
            </div>
          )}

          {/* Topic title */}
          <h4 className="text-sm font-semibold text-foreground leading-snug line-clamp-2 pr-6">
            {topic.title}
          </h4>

          {/* Bottom row: Subject badge + listen count */}
          <div className="flex items-center justify-between gap-2">
            {/* Subject badge */}
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground truncate max-w-[80px]">
              {topic.subject_name}
            </span>

            {/* Listen count */}
            <div className="flex items-center gap-1 text-muted-foreground">
              <Headphones className="w-3 h-3" />
              <span className="text-[10px] font-medium">{topic.listen_count}</span>
            </div>
          </div>
        </motion.button>
      </div>
    );
  }
);

TrendingTopicCard.displayName = 'TrendingTopicCard';
