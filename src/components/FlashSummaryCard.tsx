import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Check, Bookmark, X } from 'lucide-react';
import { useHaptics } from '@/hooks/useHaptics';
import type { FlashSummary } from '@/data/dailyDownloadData';

interface FlashSummaryCardProps {
  flashSummary: FlashSummary;
  topicTitle: string;
  onDismiss: () => void;
  onPin: () => void;
}

const SWIPE_THRESHOLD = 100;

export const FlashSummaryCard = ({
  flashSummary,
  topicTitle,
  onDismiss,
  onPin
}: FlashSummaryCardProps) => {
  const { selectionChanged, successNotification } = useHaptics();
  const x = useMotionValue(0);
  
  // Transform x position to rotation and opacity
  const rotate = useTransform(x, [-200, 0, 200], [-15, 0, 15]);
  const dismissOpacity = useTransform(x, [-150, -50, 0], [1, 0.5, 0]);
  const pinOpacity = useTransform(x, [0, 50, 150], [0, 0.5, 1]);
  const scale = useTransform(x, [-200, 0, 200], [0.95, 1, 0.95]);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const offset = info.offset.x;
    
    if (offset < -SWIPE_THRESHOLD) {
      // Swiped left - Dismiss (Got it!)
      successNotification();
      onDismiss();
    } else if (offset > SWIPE_THRESHOLD) {
      // Swiped right - Pin for review
      successNotification();
      onPin();
    }
  };

  const handleDrag = () => {
    selectionChanged();
  };

  const getDifficultyColor = (difficulty: FlashSummary['difficulty']) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500/20 text-green-600 dark:text-green-400';
      case 'medium': return 'bg-amber-500/20 text-amber-600 dark:text-amber-400';
      case 'hard': return 'bg-red-500/20 text-red-600 dark:text-red-400';
    }
  };

  return (
    <div className="relative w-full max-w-sm mx-auto">
      {/* Background indicators */}
      <motion.div 
        className="absolute inset-0 flex items-center justify-start pl-8 bg-green-500/20 rounded-2xl"
        style={{ opacity: dismissOpacity }}
      >
        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
          <Check className="w-8 h-8" />
          <span className="font-semibold">Got it!</span>
        </div>
      </motion.div>
      
      <motion.div 
        className="absolute inset-0 flex items-center justify-end pr-8 bg-primary/20 rounded-2xl"
        style={{ opacity: pinOpacity }}
      >
        <div className="flex items-center gap-2 text-primary">
          <span className="font-semibold">Pin for review</span>
          <Bookmark className="w-8 h-8" />
        </div>
      </motion.div>

      {/* Swipeable card */}
      <motion.div
        className="relative bg-card border border-border rounded-2xl shadow-lg overflow-hidden cursor-grab active:cursor-grabbing"
        style={{ x, rotate, scale }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.7}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        whileTap={{ cursor: 'grabbing' }}
      >
        {/* Close button */}
        <button 
          onClick={onDismiss}
          className="absolute top-3 right-3 z-10 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Visual content area */}
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-6 flex items-center justify-center min-h-[140px]">
          <div className="text-center">
            <p className="text-3xl font-bold text-foreground mb-2">
              {flashSummary.visualContent}
            </p>
            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(flashSummary.difficulty)}`}>
              {flashSummary.difficulty}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="text-lg font-bold text-foreground mb-4">{topicTitle}</h3>
          
          <ul className="space-y-3">
            {flashSummary.bulletPoints.map((point, index) => (
              <li key={index} className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-semibold flex items-center justify-center">
                  {index + 1}
                </span>
                <p className="text-sm text-muted-foreground leading-relaxed">{point}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* Swipe hint */}
        <div className="px-5 pb-4 flex justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Check className="w-3 h-3" /> Swipe left: Got it
          </span>
          <span className="flex items-center gap-1">
            Swipe right: Review <Bookmark className="w-3 h-3" />
          </span>
        </div>
      </motion.div>
    </div>
  );
};
