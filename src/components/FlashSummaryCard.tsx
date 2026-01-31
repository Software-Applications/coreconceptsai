import { useState } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { X, Pin, Check } from 'lucide-react';
import type { FlashSummary } from '@/data/dailyDownloadData';

interface FlashSummaryCardProps {
  flashSummary: FlashSummary;
  topicTitle: string;
  onDismiss: () => void;
  onPin: () => void;
}

export const FlashSummaryCard = ({
  flashSummary,
  topicTitle,
  onDismiss,
  onPin
}: FlashSummaryCardProps) => {
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null);
  
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-15, 0, 15]);
  const dismissOpacity = useTransform(x, [-100, -50, 0], [1, 0.5, 0]);
  const pinOpacity = useTransform(x, [0, 50, 100], [0, 0.5, 1]);
  
  const getDifficultyColor = (difficulty: FlashSummary['difficulty']) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-success/20 text-success';
      case 'medium':
        return 'bg-warning/20 text-warning';
      case 'hard':
        return 'bg-destructive/20 text-destructive';
    }
  };

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100;
    
    if (info.offset.x < -threshold) {
      setExitDirection('left');
      onDismiss();
    } else if (info.offset.x > threshold) {
      setExitDirection('right');
      onPin();
    }
  };

  return (
    <div className="relative w-full max-w-sm mx-auto">
      {/* Swipe hint indicators */}
      <motion.div 
        className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-muted-foreground pointer-events-none z-0"
        style={{ opacity: dismissOpacity }}
      >
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
          <Check className="w-5 h-5" />
        </div>
        <span className="text-xs font-medium">Got it</span>
      </motion.div>
      
      <motion.div 
        className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-primary pointer-events-none z-0"
        style={{ opacity: pinOpacity }}
      >
        <span className="text-xs font-medium">Pin</span>
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
          <Pin className="w-5 h-5" />
        </div>
      </motion.div>

      <motion.div
        className="relative bg-card border border-border rounded-2xl shadow-lg overflow-hidden z-10 cursor-grab active:cursor-grabbing"
        style={{ x, rotate }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.7}
        onDragEnd={handleDragEnd}
        animate={exitDirection ? { 
          x: exitDirection === 'left' ? -300 : 300,
          opacity: 0,
          transition: { duration: 0.3 }
        } : {}}
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

        {/* Swipe hint text */}
        <div className="px-5 pb-3 text-center">
          <p className="text-[10px] text-muted-foreground/60">
            Swipe left to dismiss • Swipe right to pin
          </p>
        </div>

        {/* Tap actions */}
        <div className="px-5 pb-5 flex gap-3">
          <button
            type="button"
            onClick={onDismiss}
            className="flex-1 h-10 rounded-xl bg-muted text-foreground text-sm font-semibold"
          >
            Got it
          </button>
          <button
            type="button"
            onClick={onPin}
            className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
          >
            Pin for review
          </button>
        </div>
      </motion.div>
    </div>
  );
};
