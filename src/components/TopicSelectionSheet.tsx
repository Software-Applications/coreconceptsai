import { useState, useMemo, useRef, useEffect, type MouseEvent } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useHaptics } from '@/hooks/useHaptics';
import { springTransition } from '@/lib/motionVariants';
import type { DailyDownloadTopic } from '@/hooks/useTopics';
import type { Chapter } from '@/hooks/useChapters';
import { useChapters } from '@/hooks/useChapters';
import { AIBadge } from './AIBadge';
import { HeroIntro, ChapterAccordion } from './topic-selection';

const HERO_SEEN_KEY = 'core-concepts-hero-seen';

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
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [showHero, setShowHero] = useState(() => {
    if (typeof window === 'undefined') return true;
    return !localStorage.getItem(HERO_SEEN_KEY);
  });
  const { data: allChapters = [] } = useChapters();

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const chaptersStartRef = useRef<HTMLDivElement | null>(null);
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

  const toggleChapter = (chapterId: string) => {
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

  const handleStartExploring = () => {
    lightTap();
    localStorage.setItem(HERO_SEEN_KEY, 'true');
    setShowHero(false);
    chaptersStartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleDismissHero = () => {
    localStorage.setItem(HERO_SEEN_KEY, 'true');
    setShowHero(false);
  };

  const groupedTopics = useMemo(() => {
    const groups: { chapter: Chapter; topics: DailyDownloadTopic[] }[] = [];
    const chapterMap = new Map<string, DailyDownloadTopic[]>();

    topics.forEach(topic => {
      if (!chapterMap.has(topic.chapterId)) {
        chapterMap.set(topic.chapterId, []);
      }
      chapterMap.get(topic.chapterId)!.push(topic);
    });

    chapterMap.forEach((topicList, chapterId) => {
      const chapter = allChapters.find(c => c.id === chapterId);
      if (chapter) {
        groups.push({ chapter, topics: topicList });
      }
    });

    groups.sort((a, b) => a.chapter.chapter_number - b.chapter.chapter_number);

    return groups;
  }, [topics, allChapters]);

  useEffect(() => {
    if (!isOpen) {
      setExpandedChapters(new Set());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
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
        <div className="flex items-center justify-between px-5 pb-2">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              Core Concepts <AIBadge />
            </h2>
          </div>
          <button
            onClick={() => { lightTap(); onClose(); }}
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Scrollable content */}
        <div
          ref={scrollContainerRef}
          className="px-5 pb-safe overflow-y-auto max-h-[calc(90%-80px)] scrollbar-none overscroll-contain cursor-grab"
          style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}
          onMouseDown={handleScrollMouseDown}
          onMouseMove={handleScrollMouseMove}
          onMouseUp={endDrag}
          onMouseLeave={endDrag}
          onDragStart={(e) => e.preventDefault()}
        >
          <HeroIntro 
            isVisible={showHero} 
            onStartExploring={handleStartExploring} 
            onDismiss={handleDismissHero} 
          />

          {/* Chapters anchor */}
          <div ref={chaptersStartRef} />

          <div className="space-y-3 pb-6">
            {groupedTopics.map(({ chapter, topics: chapterTopics }, groupIndex) => (
              <ChapterAccordion
                key={chapter.id}
                chapter={chapter}
                topics={chapterTopics}
                isExpanded={expandedChapters.has(chapter.id)}
                listenedCount={chapterTopics.filter(t => isListened?.(t.id)).length}
                groupIndex={groupIndex}
                onToggle={() => toggleChapter(chapter.id)}
                onSelectTopic={handleSelectTopic}
                isListened={isListened}
                hasProgress={hasProgress}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </>
  );
};
