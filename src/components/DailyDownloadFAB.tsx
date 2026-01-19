import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Headphones } from 'lucide-react';
import { useHaptics } from '@/hooks/useHaptics';
import { springTransition } from '@/lib/motionVariants';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface DailyDownloadFABProps {
  onClick: () => void;
  unlistenedCount?: number;
}

const TOOLTIP_STORAGE_KEY = 'dailyDownloadFAB_tooltipShown';

export const DailyDownloadFAB = ({ onClick, unlistenedCount = 0 }: DailyDownloadFABProps) => {
  const { mediumTap } = useHaptics();
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const hasSeenTooltip = localStorage.getItem(TOOLTIP_STORAGE_KEY);
    if (!hasSeenTooltip) {
      // Show tooltip after a brief delay for better UX
      const timer = setTimeout(() => setShowTooltip(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClick = () => {
    mediumTap();
    // Dismiss tooltip on first interaction
    if (showTooltip) {
      setShowTooltip(false);
      localStorage.setItem(TOOLTIP_STORAGE_KEY, 'true');
    }
    onClick();
  };

  const dismissTooltip = () => {
    setShowTooltip(false);
    localStorage.setItem(TOOLTIP_STORAGE_KEY, 'true');
  };

  return (
    <TooltipProvider>
      <Tooltip open={showTooltip} onOpenChange={(open) => !open && dismissTooltip()}>
        <TooltipTrigger asChild>
          <motion.button
            onClick={handleClick}
            className="fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ ...springTransition, delay: 0.8 }}
          >
            {/* Pulsing glow ring */}
            <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-30" />
            <span className="absolute inset-0 rounded-full bg-primary/50 animate-pulse" />
            
            <Headphones className="w-6 h-6 relative z-10" />
            
            {/* Unlistened topics badge */}
            {unlistenedCount > 0 && (
              <motion.div
                className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-accent text-accent-foreground text-xs font-bold flex items-center justify-center z-20"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={springTransition}
              >
                {unlistenedCount}
              </motion.div>
            )}
          </motion.button>
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-[200px] text-center">
          <p className="font-medium">Daily Downloads</p>
          <p className="text-xs text-muted-foreground">Quick audio summaries of today's topics</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
