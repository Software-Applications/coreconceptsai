import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Clock, Sparkles, CheckCircle, RotateCcw } from 'lucide-react';
import type { DailyDownloadTopic } from '@/hooks/useTopics';

interface TopicCardProps {
  topic: DailyDownloadTopic;
  listened: boolean;
  hasResume: boolean;
  index: number;
  onSelect: () => void;
}

export const TopicCard = forwardRef<HTMLButtonElement, TopicCardProps>(
  ({ topic, listened, hasResume, index, onSelect }, ref) => {
    return (
      <motion.button
        ref={ref}
        onClick={onSelect}
        className={`w-full text-left bg-card border rounded-xl p-3 transition-colors touch-pan-y ${
          listened 
            ? 'border-primary/30 bg-primary/5' 
            : hasResume
              ? 'border-amber-500/50 bg-amber-500/5'
              : 'border-border hover:border-primary/50'
        }`}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.03 }}
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
            listened ? 'bg-primary/20' : hasResume ? 'bg-amber-500/20' : 'bg-primary/10'
          }`}>
            {listened ? (
              <CheckCircle className="w-4 h-4 text-primary" />
            ) : hasResume ? (
              <RotateCcw className="w-4 h-4 text-amber-500" />
            ) : (
              <Sparkles className="w-4 h-4 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-foreground text-sm truncate">
                {topic.title}
              </h3>
              {listened && (
                <span className="text-xs text-primary font-medium">✓</span>
              )}
              {hasResume && (
                <span className="text-xs text-amber-500 font-medium">Resume</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-3 mt-0.5">
              {topic.description}
            </p>
          </div>
          <span className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
            <Clock className="w-3 h-3" />
            {topic.duration}
          </span>
        </div>
      </motion.button>
    );
  }
);

TopicCard.displayName = 'TopicCard';
