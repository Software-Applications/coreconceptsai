import { forwardRef, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { Headphones } from 'lucide-react';
import { useHaptics } from '@/hooks/useHaptics';
import { springTransition } from '@/lib/motionVariants';
import { AIBadge } from './AIBadge';

interface DailyDownloadCardProps {
  onClick: () => void;
  unlistenedCount?: number;
}

export const DailyDownloadCard = forwardRef<HTMLDivElement, DailyDownloadCardProps>(
  ({ onClick, unlistenedCount = 0 }, ref) => {
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
      <div ref={ref}>
        <motion.button
          onClick={handleClick}
          className="w-full p-4 rounded-xl bg-gradient-to-r from-primary/15 via-primary/10 to-primary/5 border border-primary/20 flex items-center justify-between gap-4 text-left hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 transition-all duration-200"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springTransition}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 relative">
              <Headphones className="w-6 h-6 text-primary" />
              <AnimatePresence>
                {unlistenedCount > 0 && (
                  <motion.div
                    className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-accent text-accent-foreground text-xs font-bold flex items-center justify-center"
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
            <div>
              <h3 className="font-semibold text-foreground flex items-center gap-1.5">
                Core Concepts <AIBadge size="sm" />
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Simplest AI explanations of tough topics to help you learn faster.
              </p>
            </div>
          </div>
        </motion.button>
      </div>
    );
  }
);

DailyDownloadCard.displayName = 'DailyDownloadCard';
