import { forwardRef } from 'react';
import { motion } from "framer-motion";
import { Trophy, CheckCircle, Clock } from "lucide-react";
import type { PracticeTile } from "@/data/courseData";
import { cardHover, cardTap, springTransition } from "@/lib/motionVariants";
import { useHaptics } from "@/hooks/useHaptics";

interface PracticeCardProps {
  practice: PracticeTile;
  onClick: () => void;
  bestScore?: number | null;
  isCompleted?: boolean;
  isInProgress?: boolean;
}

export const PracticeCard = forwardRef<HTMLDivElement, PracticeCardProps>(
  ({ practice, onClick, bestScore, isCompleted = false, isInProgress = false }, ref) => {
    const { lightTap } = useHaptics();

    const handleClick = () => {
      lightTap();
      onClick();
    };

    const renderStatusBadge = () => {
      if (isCompleted && bestScore !== null && bestScore !== undefined) {
        return (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-success text-success-foreground text-xs px-2 py-1 rounded-full">
            <Trophy className="w-3 h-3" />
            <span>{bestScore}%</span>
          </div>
        );
      }
      if (isInProgress) {
        return (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-warning text-warning-foreground text-xs px-2 py-1 rounded-full">
            <Clock className="w-3 h-3" />
            <span>In progress</span>
          </div>
        );
      }
      return null;
    };

    return (
      <div ref={ref} className="flex-shrink-0 w-44">
        <motion.button 
          className="w-full text-left"
          onClick={handleClick}
          whileHover={cardHover}
          whileTap={cardTap}
          transition={springTransition}
        >
          <div className="relative rounded-xl overflow-hidden h-28 shadow-sm">
            <img 
              src={practice.imageUrl} 
              alt={practice.title}
              className={`w-full h-full object-cover ${isCompleted ? 'opacity-75' : ''}`}
            />
            <div className="absolute inset-0 bg-black/40" />
            {renderStatusBadge()}
            <div className="absolute inset-0 p-3 flex flex-col justify-end">
              <div className="flex justify-between items-end">
                <span className="text-white/80 text-xs">{practice.questions} questions</span>
                <span className="text-white text-xs font-medium bg-white/20 px-2 py-0.5 rounded-full">
                  {practice.difficulty}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-2">
            <p className="font-medium text-foreground text-xs line-clamp-2">{practice.title}</p>
          </div>
        </motion.button>
      </div>
    );
  }
);

PracticeCard.displayName = 'PracticeCard';
