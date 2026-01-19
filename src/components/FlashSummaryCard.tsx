import { X } from 'lucide-react';
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
  const getDifficultyColor = (difficulty: FlashSummary['difficulty']) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-500/20 text-green-600 dark:text-green-400';
      case 'medium':
        return 'bg-amber-500/20 text-amber-600 dark:text-amber-400';
      case 'hard':
        return 'bg-red-500/20 text-red-600 dark:text-red-400';
    }
  };

  return (
    <div className="relative w-full max-w-sm mx-auto">
      <div className="relative bg-card border border-border rounded-2xl shadow-lg overflow-hidden">
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
      </div>
    </div>
  );
};
