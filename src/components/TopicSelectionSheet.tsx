import { useState, useMemo, useRef, useEffect, type MouseEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Sparkles, CheckCircle, ChevronDown, RotateCcw } from 'lucide-react';
import { useHaptics } from '@/hooks/useHaptics';
import { springTransition } from '@/lib/motionVariants';
import type { DailyDownloadTopic } from '@/data/dailyDownloadData';
import type { Chapter } from '@/data/courseData';
import { chapters } from '@/data/courseData';

interface TopicSelectionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  topics: DailyDownloadTopic[];
  onSelectTopic: (topic: DailyDownloadTopic) => void;
  isListened?: (topicId: string) => boolean;
  hasProgress?: (topicId: string) => boolean;
}

export const TopicSelectionSheet = ({
  isOpen,
  onClose,
  topics,
  onSelectTopic,
  isListened,
  hasProgress
}: TopicSelectionSheetProps) => {
  const { lightTap, selectionChanged } = useHaptics();
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set());

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const dragState = useRef({
    isDown: false,
    startY: 0,
    scrollTop: 0,
    didDrag: false,
  });

  const handleScrollMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    const el = scrollContainerRef.current;
    if (!el) return;

    dragState.current.isDown = true;
    dragState.current.startY = e.clientY;
    dragState.current.scrollTop = el.scrollTop;
    dragState.current.didDrag = false;

    el.style.cursor = 'grabbing';
  };

  const handleScrollMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    if (!dragState.current.isDown) return;

    const dy = e.clientY - dragState.current.startY;
    if (Math.abs(dy) > 3) dragState.current.didDrag = true;

    el.scrollTop = dragState.current.scrollTop - dy;
    e.preventDefault();
  };

  const endDrag = () => {
    const el = scrollContainerRef.current;
    if (el) el.style.cursor = 'grab';

    const hadDrag = dragState.current.didDrag;
    dragState.current.isDown = false;

    // Clear after click would fire, so dragging doesn't accidentally trigger selection.
    if (hadDrag) {
      window.setTimeout(() => {
        dragState.current.didDrag = false;
      }, 0);
    }
  };

  const handleSelectTopic = (topic: DailyDownloadTopic) => {
    if (dragState.current.didDrag) return;
    selectionChanged();
    onSelectTopic(topic);
  };

  const toggleChapter = (chapterId: number) => {
    if (dragState.current.didDrag) return;
    lightTap();
    setExpandedChapters(prev => {
      const next = new Set(prev);
      if (next.has(chapterId)) {
        next.delete(chapterId);
      } else {
        next.add(chapterId);
      }
      return next;
    });
  };

  // Group topics by chapter
  const groupedTopics = useMemo(() => {
    const groups: { chapter: Chapter; topics: DailyDownloadTopic[] }[] = [];
    const chapterMap = new Map<number, DailyDownloadTopic[]>();

    topics.forEach(topic => {
      if (!chapterMap.has(topic.chapterId)) {
        chapterMap.set(topic.chapterId, []);
      }
      chapterMap.get(topic.chapterId)!.push(topic);
    });

    chapterMap.forEach((topicList, chapterId) => {
      const chapter = chapters.find(c => c.id === chapterId);
      if (chapter) {
        groups.push({ chapter, topics: topicList });
      }
    });

    // Sort by chapter id
    groups.sort((a, b) => a.chapter.id - b.chapter.id);

    return groups;
  }, [topics]);

  // Reset all expanded chapters when sheet closes
  useEffect(() => {
    if (!isOpen) {
      setExpandedChapters(new Set());
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 z-50 bg-background rounded-t-3xl max-h-[90%] overflow-hidden"
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

            {/* Topics list grouped by chapter */}
            <div
              ref={scrollContainerRef}
              className="px-5 pb-safe overflow-y-auto max-h-[calc(90%-100px)] scrollbar-none overscroll-contain cursor-grab"
              style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}
              onMouseDown={handleScrollMouseDown}
              onMouseMove={handleScrollMouseMove}
              onMouseUp={endDrag}
              onMouseLeave={endDrag}
              onDragStart={(e) => e.preventDefault()}
            >
              <div className="space-y-3 pb-6">
                {groupedTopics.map(({ chapter, topics: chapterTopics }, groupIndex) => {
                  const isExpanded = expandedChapters.has(chapter.id);
                  const listenedCount = chapterTopics.filter(t => isListened?.(t.id)).length;
                  
                  return (
                    <motion.div
                      key={chapter.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: groupIndex * 0.05 }}
                    >
                      {/* Chapter Header */}
                      <button
                        onClick={() => toggleChapter(chapter.id)}
                        className="w-full flex items-center justify-between p-3 bg-muted/50 rounded-xl hover:bg-muted transition-colors touch-pan-y"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-bold text-primary">
                              {chapter.id}
                            </span>
                          </div>
                          <div className="text-left">
                            <h3 className="font-semibold text-foreground text-sm">
                              {chapter.title.replace(/^Ch\. \d+ - /, '')}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              {chapterTopics.length} topics · {listenedCount} completed
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
                              {chapterTopics.map((topic, index) => {
                                const listened = isListened?.(topic.id) ?? false;
                                const hasResume = !listened && (hasProgress?.(topic.id) ?? false);
                                return (
                                  <motion.button
                                    key={topic.id}
                                    onClick={() => handleSelectTopic(topic)}
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
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
