import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { springTransition, cardTap } from '@/lib/motionVariants';
import type { SubjectWithTextbook } from '@/hooks/useSubjects';

interface ProgressRingProps {
  progress: number;
  size: number;
  strokeWidth: number;
}

const ProgressRing = ({ progress, size, strokeWidth }: ProgressRingProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg 
      width={size} 
      height={size} 
      className="absolute inset-0 -rotate-90"
    >
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="hsl(var(--muted))"
        strokeWidth={strokeWidth}
      />
      {/* Progress circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-all duration-500 ease-out"
      />
    </svg>
  );
};

interface SubjectChipWithProgressProps {
  subject: SubjectWithTextbook;
  isSelected: boolean;
  progress: number;
  onClick: () => void;
}

export const SubjectChipWithProgress = forwardRef<HTMLButtonElement, SubjectChipWithProgressProps>(
  ({ subject, isSelected, progress, onClick }, ref) => {
    return (
      <motion.button
        ref={ref}
        onClick={onClick}
        whileTap={cardTap}
        transition={springTransition}
        className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl transition-colors min-w-fit ${
          isSelected
            ? 'border-2 border-primary bg-card shadow-sm'
            : 'border border-border bg-card hover:bg-accent'
        }`}
      >
        <img 
          src={subject.textbook_image_url || subject.image_url || ''} 
          alt={subject.name}
          className={`w-7 h-9 rounded-md object-cover flex-shrink-0 ring-1 ring-black/10 transition-shadow ${
            isSelected ? 'shadow-md' : 'shadow-sm'
          }`}
        />
        
        <span className={`text-sm font-medium whitespace-nowrap ${isSelected ? 'text-primary' : 'text-foreground'}`}>
          {subject.name}
        </span>
      </motion.button>
    );
  }
);

SubjectChipWithProgress.displayName = 'SubjectChipWithProgress';
