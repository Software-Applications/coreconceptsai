import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import { Headphones, ChevronRight } from 'lucide-react';
import { useHaptics } from '@/hooks/useHaptics';
import { springTransition } from '@/lib/motionVariants';
import { AIBadge } from './AIBadge';
import { useRef, useEffect } from 'react';

interface CoreConceptsStickyBarProps {
  onClick: () => void;
  unlistenedCount?: number;
}

export const CoreConceptsStickyBar = ({ 
  onClick, 
  unlistenedCount = 0 
}: CoreConceptsStickyBarProps) => {
  const { mediumTap } = useHaptics();
  const badgeControls = useAnimation();
  const prevCountRef = useRef(unlistenedCount);

  // Animate badge when count changes
  useEffect(() => {
    if (prevCountRef.current !== unlistenedCount && unlistenedCount >= 0) {
      badgeControls.start({
        scale: [1, 1.3, 0.9, 1.1, 1],
        transition: { duration: 0.4, ease: "easeOut" }
      });
    }
    prevCountRef.current = unlistenedCount;
  }, [unlistenedCount, badgeControls]);

  const handleClick = () => {
    mediumTap();
    onClick();
  };

  return (
    <div className="sticky top-0 z-20 py-1.5 -mx-4 px-4 bg-background/95 backdrop-blur-sm">
      <motion.button
        onClick={handleClick}
        className="w-full px-3 py-2.5 rounded-xl bg-gradient-to-r from-primary/15 via-primary/10 to-primary/5 border border-primary/20 flex items-center gap-3 text-left hover:border-primary/40 hover:shadow-md hover:shadow-primary/10 transition-all duration-200"
        whileHover={{ scale: 1.005 }}
        whileTap={{ scale: 0.995 }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springTransition}
      >
        {/* Icon with badge */}
        <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 relative">
          <Headphones className="w-5 h-5 text-primary" />
          <AnimatePresence>
            {unlistenedCount > 0 && (
              <motion.div
                className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center"
                initial={{ scale: 0, opacity: 0 }}
                animate={badgeControls}
                exit={{ scale: 0, opacity: 0 }}
                transition={springTransition}
                key="badge"
              >
                {unlistenedCount}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Text content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            Core Concepts <AIBadge size="sm" />
          </h3>
          <p className="text-[11px] text-muted-foreground truncate">
            AI explanations of tough topics
          </p>
        </div>

        {/* Chevron */}
        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      </motion.button>
    </div>
  );
};
