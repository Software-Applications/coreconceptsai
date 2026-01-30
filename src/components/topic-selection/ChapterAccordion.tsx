import { forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import type { Chapter } from '@/hooks/useChapters';
import type { DailyDownloadTopic } from '@/hooks/useTopics';
import { TopicCard } from './TopicCard';

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

export interface ChapterAccordionProps {
  chapter: Chapter;
  topics: DailyDownloadTopic[];
  isExpanded: boolean;
  listenedCount: number;
  groupIndex: number;
  onToggle: () => void;
  onSelectTopic: (topic: DailyDownloadTopic) => void;
  isListened?: (topicId: string) => boolean;
  hasProgress?: (topicId: string) => boolean;
  highlightQuery?: string;
}

export const ChapterAccordion = forwardRef<HTMLDivElement, ChapterAccordionProps>(
  ({ 
    chapter, 
    topics, 
    isExpanded, 
    listenedCount, 
    groupIndex, 
    onToggle, 
    onSelectTopic,
    isListened,
    hasProgress,
    highlightQuery = ''
  }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: groupIndex * 0.05 }}
      >
        {/* Chapter Header */}
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-between p-3 bg-muted/50 rounded-xl hover:bg-muted transition-colors touch-pan-y"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">
                {chapter.chapter_number}
              </span>
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-foreground text-sm">
                {chapter.title.replace(/^Ch\. \d+ - /, '')}
              </h3>
              <p className="text-xs text-muted-foreground">
                {topics.length} topics · {listenedCount} completed
              </p>
            </div>
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          </motion.div>
        </button>

        {/* Chapter Topics */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-2 space-y-2 pl-2">
                {topics.map((topic, index) => {
                  const listened = isListened?.(topic.id) ?? false;
                  const hasResume = !listened && (hasProgress?.(topic.id) ?? false);
                  return (
                    <TopicCard
                      key={topic.id}
                      topic={topic}
                      listened={listened}
                      hasResume={hasResume}
                      index={index}
                      onSelect={() => onSelectTopic(topic)}
                      highlightQuery={highlightQuery}
                    />
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }
);

ChapterAccordion.displayName = 'ChapterAccordion';
