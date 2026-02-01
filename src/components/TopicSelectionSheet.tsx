import { useState, useMemo, useRef, useEffect, type MouseEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, ArrowDownAZ, Clock, CheckCircle2 } from 'lucide-react';
import { useHaptics } from '@/hooks/useHaptics';
import { useTopicRequest } from '@/hooks/useTopicRequest';
import { springTransition } from '@/lib/motionVariants';
import { searchTopics, hasResults, type SearchResults } from '@/lib/topicSearch';
import type { DailyDownloadTopic } from '@/hooks/useTopics';
import { AIBadge } from './AIBadge';
import { HeroIntro, TopicCard, SearchResultsSection } from './topic-selection';

const HERO_SEEN_KEY = 'core-concepts-hero-seen';
const SORT_PREFERENCE_KEY = 'core-concepts-sort';

type SortOption = 'alphabetical' | 'progress' | 'recent';

interface TopicSelectionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  topics: DailyDownloadTopic[];
  onSelectTopic: (topic: DailyDownloadTopic) => void;
  isListened?: (topicId: string) => boolean;
  hasProgress?: (topicId: string) => boolean;
  currentSubjectId?: string;
}

export const TopicSelectionSheet = ({
  isOpen,
  onClose,
  topics,
  onSelectTopic,
  isListened,
  hasProgress,
  currentSubjectId
}: TopicSelectionSheetProps) => {
  const { lightTap, selectionChanged, successNotification } = useHaptics();
  const topicRequest = useTopicRequest();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [showHero, setShowHero] = useState(() => {
    if (typeof window === 'undefined') return true;
    return !localStorage.getItem(HERO_SEEN_KEY);
  });
  const [sortOption, setSortOption] = useState<SortOption>(() => {
    if (typeof window === 'undefined') return 'recent';
    return (localStorage.getItem(SORT_PREFERENCE_KEY) as SortOption) || 'recent';
  });

  // Debounce search query for performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const chaptersStartRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
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

  const handleRequestTopic = (query: string) => {
    lightTap();
    topicRequest.mutate(
      { query, subjectId: currentSubjectId },
      {
        onSuccess: () => {
          successNotification();
          setSearchQuery('');
        },
      }
    );
  };

  // Use the smart search engine for prioritized results
  const searchResults: SearchResults = useMemo(() => {
    if (!debouncedQuery.trim() || debouncedQuery.trim().length < 2) {
      return { directHits: [], relatedTopics: [], query: '' };
    }
    return searchTopics(debouncedQuery, topics);
  }, [topics, debouncedQuery]);

  const isSearching = debouncedQuery.trim().length >= 2;

  // Sort topics based on selected option
  const sortedTopics = useMemo(() => {
    const sorted = [...topics];
    switch (sortOption) {
      case 'alphabetical':
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      case 'progress':
        // Unlistened first, then in-progress, then completed
        return sorted.sort((a, b) => {
          const aListened = isListened?.(a.id) ?? false;
          const bListened = isListened?.(b.id) ?? false;
          const aProgress = hasProgress?.(a.id) ?? false;
          const bProgress = hasProgress?.(b.id) ?? false;
          
          // Priority: unlistened (no progress) > in-progress > completed
          const getPriority = (listened: boolean, progress: boolean) => {
            if (listened) return 2; // Completed
            if (progress) return 1; // In progress
            return 0; // Not started
          };
          
          return getPriority(aListened, aProgress) - getPriority(bListened, bProgress);
        });
      case 'recent':
      default:
        // Keep original order (by created_at from DB)
        return sorted;
    }
  }, [topics, sortOption, isListened, hasProgress]);

  // Calculate progress stats (from all topics, not filtered)
  const progressStats = useMemo(() => {
    const total = topics.length;
    const listened = topics.filter(t => isListened?.(t.id)).length;
    return { total, listened, percentage: total > 0 ? Math.round((listened / total) * 100) : 0 };
  }, [topics, isListened]);

  const handleSortChange = (option: SortOption) => {
    lightTap();
    setSortOption(option);
    localStorage.setItem(SORT_PREFERENCE_KEY, option);
  };

  // Reset search when sheet closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50"
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
        <div className="flex justify-center pt-2 pb-1.5">
          <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-1.5">
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
        <div className="px-5 pb-2">
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

        {/* Sort options - only show when not searching */}
        {!isSearching && (
          <div className="px-5 pb-3 flex gap-2 overflow-x-auto scrollbar-none">
            <button
              onClick={() => handleSortChange('recent')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                sortOption === 'recent'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Recent
            </button>
            <button
              onClick={() => handleSortChange('alphabetical')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                sortOption === 'alphabetical'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              }`}
            >
              <ArrowDownAZ className="w-3.5 h-3.5" />
              A-Z
            </button>
            <button
              onClick={() => handleSortChange('progress')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                sortOption === 'progress'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Progress
            </button>
          </div>
        )}

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
                onRequestTopic={handleRequestTopic}
                isRequestingTopic={topicRequest.isPending}
              />
            ) : (
              <motion.div
                key="topics"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-2 pb-6"
              >
                {sortedTopics.map((topic, index) => {
                  const listened = isListened?.(topic.id) ?? false;
                  const hasResume = !listened && (hasProgress?.(topic.id) ?? false);
                  return (
                    <TopicCard
                      key={topic.id}
                      topic={topic}
                      listened={listened}
                      hasResume={hasResume}
                      index={index}
                      onSelect={() => handleSelectTopic(topic)}
                    />
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
};
