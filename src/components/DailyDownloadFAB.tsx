import { motion } from 'framer-motion';
import { Headphones } from 'lucide-react';
import { useHaptics } from '@/hooks/useHaptics';
import { springTransition } from '@/lib/motionVariants';

interface DailyDownloadFABProps {
  onClick: () => void;
  unlistenedCount?: number;
}

export const DailyDownloadFAB = ({ onClick, unlistenedCount = 0 }: DailyDownloadFABProps) => {
  const { mediumTap } = useHaptics();

  const handleClick = () => {
    mediumTap();
    onClick();
  };

  return (
    <motion.button
      onClick={handleClick}
      className="fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      transition={springTransition}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
    >
      <Headphones className="w-6 h-6" />
      
      {/* Unlistened topics badge */}
      {unlistenedCount > 0 && (
        <motion.div
          className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-accent text-accent-foreground text-xs font-bold flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={springTransition}
        >
          {unlistenedCount}
        </motion.div>
      )}
    </motion.button>
  );
};
