import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Headphones, CheckCircle, PlayCircle, Clock } from 'lucide-react';
import type { DailyDownloadTopic } from '@/hooks/useTopics';

// Helper to highlight matching text
const HighlightText = ({ text, query }: { text: string; query: string }) => {
  if (!query.trim()) return <>{text}</>;
  
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  
  return (
    <>
      {parts.map((part, i) => 
        regex.test(part) ? (
          <mark key={i} className="bg-primary/30 text-foreground rounded-sm px-0.5">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
};

interface TopicCardProps {
  topic: DailyDownloadTopic;
  listened: boolean;
  hasResume: boolean;
  index: number;
  onSelect: () => void;
  highlightQuery?: string;
  progressPercent?: number;
}

export const TopicCard = forwardRef<HTMLButtonElement, TopicCardProps>(
  ({ topic, listened, hasResume, index, onSelect, highlightQuery = '', progressPercent }, ref) => {
    const showProgress = hasResume && progressPercent != null && progressPercent > 0;
    return (
      <motion.button
        ref={ref}
        onClick={onSelect}
        className={`w-full text-left bg-card border rounded-xl p-3 transition-colors touch-pan-y overflow-hidden relative ${
          listened 
            ? 'border-primary/30 bg-primary/5' 
            : hasResume
              ? 'border-warning/50 bg-warning/5'
              : 'border-border hover:border-primary/50'
        }`}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.03 }}
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
            listened ? 'bg-primary/20' : hasResume ? 'bg-warning/20' : 'bg-primary/10'
          }`}>
            {listened ? (
              <CheckCircle className="w-4 h-4 text-primary" />
            ) : hasResume ? (
              <PlayCircle className="w-4 h-4 text-warning" />
            ) : (
              <Headphones className="w-4 h-4 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-foreground text-sm truncate">
                <HighlightText text={topic.title} query={highlightQuery} />
              </h3>
              {listened && (
                <span className="text-xs text-primary font-medium">✓</span>
              )}
              {showProgress ? (
                <span className="text-xs text-warning font-medium whitespace-nowrap">Resume · {progressPercent}%</span>
              ) : hasResume ? (
                <span className="text-xs text-warning font-medium">Resume</span>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-3 mt-0.5">
              <HighlightText text={topic.description} query={highlightQuery} />
            </p>
            {topic.duration && topic.duration !== '0:00' && (
              <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>{topic.duration}</span>
              </div>
            )}
            {showProgress && (
              <div className="mt-1.5 h-[3px] w-full bg-warning/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-warning transition-all rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            )}
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        </div>
      </motion.button>
    );
  }
);

TopicCard.displayName = 'TopicCard';
