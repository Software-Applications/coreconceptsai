import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIBadgeProps {
  size?: 'sm' | 'md';
  className?: string;
}

export const AIBadge = ({ size = 'md', className }: AIBadgeProps) => {
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-[9px] gap-0.5',
    md: 'px-2 py-0.5 text-[10px] gap-1'
  };

  const iconSizes = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3'
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-bold text-white rounded-full',
        'bg-gradient-to-r from-violet-500 via-primary to-cyan-500',
        'bg-[length:200%_100%] animate-ai-shimmer',
        'shadow-[0_0_8px_hsl(var(--primary)/0.4)]',
        sizeClasses[size],
        className
      )}
    >
      <Sparkles className={iconSizes[size]} />
      AI
    </span>
  );
};
