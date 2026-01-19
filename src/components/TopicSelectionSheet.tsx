import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Sparkles } from 'lucide-react';
import { useHaptics } from '@/hooks/useHaptics';
import { springTransition } from '@/lib/motionVariants';
import type { DailyDownloadTopic } from '@/data/dailyDownloadData';
import type { Subject } from '@/data/courseData';

interface TopicSelectionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  topics: DailyDownloadTopic[];
  subjects: Subject[];
  onSelectTopic: (topic: DailyDownloadTopic) => void;
}

export const TopicSelectionSheet = ({
  isOpen,
  onClose,
  topics,
  subjects,
  onSelectTopic
}: TopicSelectionSheetProps) => {
  const { lightTap, selectionChanged } = useHaptics();

  const handleSelectTopic = (topic: DailyDownloadTopic) => {
    selectionChanged();
    onSelectTopic(topic);
  };

  const getSubjectName = (subjectId: number) => {
    return subjects.find(s => s.id === subjectId)?.name || 'Unknown';
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500/20 text-green-600 dark:text-green-400';
      case 'medium': return 'bg-amber-500/20 text-amber-600 dark:text-amber-400';
      case 'hard': return 'bg-red-500/20 text-red-600 dark:text-red-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-3xl max-h-[85vh] overflow-hidden"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={springTransition}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">Daily Download</h2>
                <p className="text-sm text-muted-foreground">Pick a topic to learn on the go</p>
              </div>
              <button
                onClick={() => { lightTap(); onClose(); }}
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Topics list */}
            <div className="px-5 pb-safe overflow-y-auto max-h-[calc(85vh-100px)]">
              <div className="space-y-3 pb-6">
                {topics.map((topic, index) => (
                  <motion.button
                    key={topic.id}
                    onClick={() => handleSelectTopic(topic)}
                    className="w-full text-left bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-colors"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground text-sm mb-1 truncate">
                          {topic.title}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                          {topic.description}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                            {getSubjectName(topic.subjectId)}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getDifficultyColor(topic.flashSummary.difficulty)}`}>
                            {topic.flashSummary.difficulty}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {topic.duration}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
