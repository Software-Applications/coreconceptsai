import { useState, useMemo, useRef, useEffect, type MouseEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search } from 'lucide-react';
import { useHaptics } from '@/hooks/useHaptics';
import { springTransition } from '@/lib/motionVariants';
import { searchTopics, hasResults, type SearchResults } from '@/lib/topicSearch';
import type { DailyDownloadTopic } from '@/hooks/useTopics';
import type { Chapter } from '@/hooks/useChapters';
import { useChapters } from '@/hooks/useChapters';
import { AIBadge } from './AIBadge';
import { HeroIntro, ChapterAccordion, SearchResultsSection } from './topic-selection';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [showHero, setShowHero] = useState(() => {
    if (typeof window === 'undefined') return true;
    return !localStorage.getItem(HERO_SEEN_KEY);
  });

  // Debounce search query for performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  const { data: allChapters = [] } = useChapters();

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const chaptersStartRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const hasAutoExpandedRef = useRef(false);
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

  // Use the smart search engine for prioritized results
  const searchResults: SearchResults = useMemo(() => {
    if (!debouncedQuery.trim() || debouncedQuery.trim().length < 2) {
      return { directHits: [], relatedTopics: [], query: '' };
    }
    return searchTopics(debouncedQuery, topics);
  }, [topics, debouncedQuery]);

  const isSearching = debouncedQuery.trim().length >= 2;
  const hasSearchResults = hasResults(searchResults);

  // For non-search mode, use all topics
  const filteredTopics = useMemo(() => {
    if (isSearching) return topics; // Not used in search mode
    return topics;
  }, [topics, isSearching]);

  const groupedTopics = useMemo(() => {
    const groups: { chapter: Chapter; topics: DailyDownloadTopic[] }[] = [];
    const chapterMap = new Map<string, DailyDownloadTopic[]>();

    filteredTopics.forEach(topic => {
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
  }, [filteredTopics, allChapters]);

  // Calculate progress stats (from all topics, not filtered)
  const progressStats = useMemo(() => {
    const total = topics.length;
    const listened = topics.filter(t => isListened?.(t.id)).length;
    return { total, listened, percentage: total > 0 ? Math.round((listened / total) * 100) : 0 };
  }, [topics, isListened]);

  // When searching in non-smart mode, expand all matching chapters
  useEffect(() => {
    if (searchQuery.trim() && !isSearching) {
      const matchingChapterIds = new Set(filteredTopics.map(t => t.chapterId));
      setExpandedChapters(matchingChapterIds);
    }
  }, [searchQuery, filteredTopics, isSearching]);

  // Auto-expand first chapter with unlistened topics on open
  useEffect(() => {
    if (isOpen && groupedTopics.length > 0 && !hasAutoExpandedRef.current) {
      // Find first chapter with unlistened topics
      const firstUnlistenedChapter = groupedTopics.find(({ topics: chapterTopics }) =>
        chapterTopics.some(t => !isListened?.(t.id))
      );
      
      if (firstUnlistenedChapter) {
        setExpandedChapters(new Set([firstUnlistenedChapter.chapter.id]));
        hasAutoExpandedRef.current = true;
      }
    }
  }, [isOpen, groupedTopics, isListened]);

  useEffect(() => {
    if (!isOpen) {
      setExpandedChapters(new Set());
      hasAutoExpandedRef.current = false;
      setSearchQuery('');
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

      <motion.div
        className="absolute bottom-0 left-0 right-0 z-50 bg-background rounded-t-3xl max-h-[90%] overflow-hidden flex flex-col"
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
            {/* Progress summary */}
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-[120px]">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressStats.percentage}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
              <span className="text-xs text-muted-foreground">
                {progressStats.listened}/{progressStats.total} completed
              </span>
            </div>
          </div>
          <button
            onClick={() => { lightTap(); onClose(); }}
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Search input */}
        <div className="px-5 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 bg-muted/50 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); searchInputRef.current?.focus(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable content */}
        <div
          ref={scrollContainerRef}
          className="px-5 pb-safe overflow-y-auto flex-1 min-h-0 scrollbar-none overscroll-contain cursor-grab"
          style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}
          onMouseDown={handleScrollMouseDown}
          onMouseMove={handleScrollMouseMove}
          onMouseUp={endDrag}
          onMouseLeave={endDrag}
          onDragStart={(e) => e.preventDefault()}
        >
          {!isSearching && (
            <HeroIntro 
              isVisible={showHero} 
              onStartExploring={handleStartExploring} 
              onDismiss={handleDismissHero} 
            />
          )}

          {/* Chapters anchor */}
          <div ref={chaptersStartRef} />

          {/* Search results or grouped chapters */}
          <AnimatePresence mode="wait">
            {isSearching ? (
              <SearchResultsSection
                key="search-results"
                results={searchResults}
                onSelectTopic={handleSelectTopic}
                isListened={isListened}
                hasProgress={hasProgress}
                highlightQuery={searchQuery}
              />
            ) : (
              <motion.div
                key="chapters"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3 pb-6"
              >
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
                    highlightQuery={searchQuery}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
};
