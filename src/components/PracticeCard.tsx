import { motion } from "framer-motion";
import type { PracticeTile } from "@/data/courseData";
import { cardHover, cardTap, springTransition } from "@/lib/motionVariants";
import { useHaptics } from "@/hooks/useHaptics";

interface PracticeCardProps {
  practice: PracticeTile;
  onClick: () => void;
}

export function PracticeCard({ practice, onClick }: PracticeCardProps) {
  const { lightTap } = useHaptics();
  const estimatedTime = Math.ceil(practice.questions * 1.5);

  const handleClick = () => {
    lightTap();
    onClick();
  };

  return (
    <motion.button 
      className="flex-shrink-0 w-44 text-left"
      onClick={handleClick}
      whileHover={cardHover}
      whileTap={cardTap}
      transition={springTransition}
    >
      <div className="relative rounded-xl overflow-hidden h-28 shadow-sm">
        <img 
          src={practice.imageUrl} 
          alt={practice.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 p-3 flex flex-col justify-between">
          <div>
            <p className="text-white font-semibold text-sm leading-tight">{practice.title}</p>
          </div>
          <div className="flex justify-between items-end">
            <span className="text-white/80 text-xs">{practice.questions} questions</span>
            <span className="text-white text-xs font-medium bg-white/20 px-2 py-0.5 rounded-full">
              {practice.difficulty}
            </span>
          </div>
        </div>
      </div>
      <div className="mt-2">
        <p className="font-medium text-foreground text-xs">Start quiz</p>
        <p className="text-muted-foreground text-xs">~{estimatedTime} min</p>
      </div>
    </motion.button>
  );
}
