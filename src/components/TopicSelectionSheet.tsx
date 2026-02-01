import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Headphones, CheckCircle, RotateCcw, ChevronRight, Lightbulb, Loader2, Clock, XCircle } from 'lucide-react';
import { useHaptics } from '@/hooks/useHaptics';
import { useTapVsDrag } from '@/hooks/useTapVsDrag';
import { useDragScroll } from '@/hooks/useDragScroll';
import { useTopicRequest } from '@/hooks/useTopicRequest';
import { useSubjectById } from '@/hooks/useSubjects';
import { springTransition } from '@/lib/motionVariants';
import { searchTopics, hasResults, type SearchResults } from '@/lib/topicSearch';
import { validateTopicRequest } from '@/lib/topicValidation';
import { toast } from '@/hooks/use-toast';
import type { DailyDownloadTopic } from '@/hooks/useTopics';

const RECENT_SEARCHES_KEY = 'core-concepts-recent-searches';
const MAX_RECENT_SEARCHES = 5;
import { AIBadge } from './AIBadge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

interface TopicSelectionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  topics: DailyDownloadTopic[];
  onSelectTopic: (topic: DailyDownloadTopic) => void;
  isListened?: (topicId: string) => boolean;
  hasProgress?: (topicId: string) => boolean;
  currentSubjectId?: string;
}

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
  const inputRef = useRef<HTMLInputElement>(null);
  const { scrollRef: chipsScrollRef, handleClick: wrapChipClick } = useTapVsDrag<HTMLDivElement>();
  const listScrollRef = useDragScroll<HTMLDivElement>();

  // Recent searches state
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Save a search to recent history
  const saveRecentSearch = useCallback((query: string) => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return;
    
    setRecentSearches(prev => {
      // Remove duplicates and add to front
      const filtered = prev.filter(s => s.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Clear a single recent search
  const clearRecentSearch = useCallback((term: string) => {
    lightTap();
    setRecentSearches(prev => {
      const updated = prev.filter(s => s !== term);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, [lightTap]);

  // Auto-focus search input when sheet opens
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure the sheet is fully rendered
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Debounce search query for performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 150);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectTopic = useCallback((topic: DailyDownloadTopic) => {
    // Save search when user selects a topic from search results
    if (searchQuery.trim().length >= 2) {
      saveRecentSearch(searchQuery);
    }
    selectionChanged();
    onSelectTopic(topic);
  }, [selectionChanged, onSelectTopic, searchQuery, saveRecentSearch]);

  // Get subject name for validation
  const { data: currentSubject } = useSubjectById(currentSubjectId);
  const subjectName = currentSubject?.name;

  const handleRequestTopic = useCallback((query: string) => {
    lightTap();
    
    // Validate the query before submitting
    const validation = validateTopicRequest(query, subjectName);
    if (!validation.valid) {
      toast({
        title: "Invalid topic",
        description: validation.message,
        variant: "destructive",
      });
      return;
    }
    
    topicRequest.mutate(
      { query, subjectId: currentSubjectId },
      {
        onSuccess: () => {
          successNotification();
          setSearchQuery('');
        },
      }
    );
  }, [lightTap, topicRequest, currentSubjectId, successNotification, subjectName]);

  // Use the smart search engine for prioritized results
  const searchResults: SearchResults = useMemo(() => {
    if (!debouncedQuery.trim() || debouncedQuery.trim().length < 2) {
      return { directHits: [], relatedTopics: [], query: '' };
    }
    return searchTopics(debouncedQuery, topics);
  }, [topics, debouncedQuery]);

  const isSearching = debouncedQuery.trim().length >= 2;
  const hasSearchResults = hasResults(searchResults);

  // Generate quick suggestion chips from topic titles
  const suggestionChips = useMemo(() => {
    // Extract key terms from topic titles (first word or short phrases)
    const terms = new Set<string>();
    topics.forEach(topic => {
      // Get first meaningful word from title (skip common words)
      const words = topic.title.split(' ').filter(w => 
        w.length > 2 && !['the', 'and', 'for', 'with', 'how'].includes(w.toLowerCase())
      );
      if (words[0]) {
        terms.add(words[0]);
      }
    });
    // Return top 6 unique terms, sorted by length for visual balance
    return Array.from(terms)
      .slice(0, 8)
      .sort((a, b) => a.length - b.length)
      .slice(0, 6);
  }, [topics]);

  const handleChipClick = useCallback((term: string) => {
    lightTap();
    setSearchQuery(term);
  }, [lightTap]);

  // Calculate progress stats
  const progressStats = useMemo(() => {
    const total = topics.length;
    const listened = topics.filter(t => isListened?.(t.id)).length;
    return { total, listened, percentage: total > 0 ? Math.round((listened / total) * 100) : 0 };
  }, [topics, isListened]);

  // Reset search when sheet closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setDebouncedQuery('');
    }
  }, [isOpen]);

  // Truncate query for display
  const displayQuery = searchQuery.length > 25 
    ? `${searchQuery.slice(0, 25)}...` 
    : searchQuery;

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
        className="absolute bottom-0 left-0 right-0 z-50 bg-background rounded-t-3xl h-[85vh] overflow-hidden flex flex-col"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={springTransition}
      >
        {/* Handle */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              Core Concepts <AIBadge size="sm" />
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">AI explanations of tough topics · AI can make mistakes.</p>
          </div>
          <button
            onClick={() => { lightTap(); onClose(); }}
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Command Palette */}
        <Command 
          className="flex-1 min-h-0 border-t border-border"
          shouldFilter={false}
        >
          <CommandInput
            ref={inputRef}
            placeholder="Search topics..."
            value={searchQuery}
            onValueChange={setSearchQuery}
            className={!isSearching && (suggestionChips.length > 0 || recentSearches.length > 0) ? "border-0" : ""}
          />
          
          {/* Quick suggestion and recent search chips - only show when not searching */}
          <AnimatePresence>
            {!isSearching && (suggestionChips.length > 0 || recentSearches.length > 0) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-y-hidden"
              >
                <div className="relative">
                  {/* Left fade gradient */}
                  <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-popover to-transparent z-10 pointer-events-none" />
                  {/* Right fade gradient */}
                  <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-popover to-transparent z-10 pointer-events-none" />
                  
                  <div 
                    ref={chipsScrollRef}
                    data-drag-scroll="x"
                    className="flex gap-2 overflow-x-auto scrollbar-hide px-4 pt-3 pb-3 border-b border-border bg-popover cursor-grab active:cursor-grabbing select-none"
                    style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x' }}
                  >
                    {/* Recent searches first */}
                    {recentSearches.map((term) => (
                      <div
                        key={`recent-${term}`}
                        className="flex items-center gap-1 pl-3 pr-2 py-2 text-xs font-medium bg-primary/10 hover:bg-primary/20 text-primary rounded-full transition-colors whitespace-nowrap flex-shrink-0"
                      >
                        <Clock className="w-3 h-3 opacity-60" />
                        <button
                          onClick={wrapChipClick(() => handleChipClick(term))}
                          className="hover:underline"
                        >
                          {term}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            clearRecentSearch(term);
                          }}
                          className="p-0.5 hover:bg-primary/20 rounded-full transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    
                    {/* Divider if both exist */}
                    {recentSearches.length > 0 && suggestionChips.length > 0 && (
                      <div className="w-px h-5 bg-border flex-shrink-0 self-center" />
                    )}
                    
                    {/* Suggestion chips */}
                    {suggestionChips.map((term) => (
                      <button
                        key={`suggest-${term}`}
                        onClick={wrapChipClick(() => handleChipClick(term))}
                        className="px-4 py-2 text-xs font-medium bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground rounded-full transition-colors whitespace-nowrap flex-shrink-0"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <CommandList
            ref={listScrollRef}
            className="max-h-none flex-1 min-h-0 overflow-y-auto pb-safe scrollbar-hide overscroll-contain cursor-grab select-none touch-pan-y"
            style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
          >
            <AnimatePresence mode="wait">
              {isSearching ? (
                // Search Results Mode
                <>
                  {hasSearchResults ? (
                    <>
                      {/* Direct Hits */}
                      {searchResults.directHits.length > 0 && (
                        <CommandGroup heading="Direct Matches">
                          {searchResults.directHits.map((scoredTopic) => {
                            const topic = scoredTopic.topic;
                            const listened = isListened?.(topic.id) ?? false;
                            const hasResume = !listened && (hasProgress?.(topic.id) ?? false);
                            return (
                              <CommandItem
                                key={topic.id}
                                value={topic.id}
                                onSelect={() => handleSelectTopic(topic)}
                                className="flex items-center gap-3 p-3 cursor-pointer"
                              >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                  listened ? 'bg-primary/20' : hasResume ? 'bg-warning/20' : 'bg-primary/10'
                                }`}>
                                  {listened ? (
                                    <CheckCircle className="w-4 h-4 text-primary" />
                                  ) : hasResume ? (
                                    <RotateCcw className="w-4 h-4 text-warning" />
                                  ) : (
                                    <Headphones className="w-4 h-4 text-primary" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-foreground text-sm truncate">
                                      <HighlightText text={topic.title} query={searchQuery} />
                                    </span>
                                    {listened && <span className="text-xs text-primary font-medium">✓</span>}
                                    {hasResume && <span className="text-xs text-warning font-medium">Resume</span>}
                                  </div>
                                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                    <HighlightText text={topic.description} query={searchQuery} />
                                  </p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      )}

                      {/* Related Topics */}
                      {searchResults.relatedTopics.length > 0 && (
                        <CommandGroup heading="Related Topics">
                          {searchResults.relatedTopics.map((scoredTopic) => {
                            const topic = scoredTopic.topic;
                            const listened = isListened?.(topic.id) ?? false;
                            const hasResume = !listened && (hasProgress?.(topic.id) ?? false);
                            return (
                              <CommandItem
                                key={topic.id}
                                value={topic.id}
                                onSelect={() => handleSelectTopic(topic)}
                                className="flex items-center gap-3 p-3 cursor-pointer opacity-80"
                              >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                  listened ? 'bg-primary/20' : hasResume ? 'bg-warning/20' : 'bg-muted'
                                }`}>
                                  {listened ? (
                                    <CheckCircle className="w-4 h-4 text-primary" />
                                  ) : hasResume ? (
                                    <RotateCcw className="w-4 h-4 text-warning" />
                                  ) : (
                                    <Headphones className="w-4 h-4 text-muted-foreground" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-foreground text-sm truncate">
                                      <HighlightText text={topic.title} query={searchQuery} />
                                    </span>
                                    {listened && <span className="text-xs text-primary font-medium">✓</span>}
                                    {hasResume && <span className="text-xs text-warning font-medium">Resume</span>}
                                  </div>
                                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                    <HighlightText text={topic.description} query={searchQuery} />
                                  </p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      )}

                      {/* Request Topic CTA - always at bottom after all results */}
                      {searchQuery.trim().length >= 2 && (
                        <div className="px-4 py-4 border-t border-border mt-2">
                          <p className="text-xs text-muted-foreground text-center mb-2">
                            Can't find what you're looking for?
                          </p>
                          <button
                            onClick={() => handleRequestTopic(searchQuery)}
                            disabled={topicRequest.isPending}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-primary/10 hover:bg-primary/20 rounded-lg text-sm text-primary font-medium transition-colors disabled:opacity-50"
                          >
                            {topicRequest.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Lightbulb className="w-4 h-4" />
                            )}
                            Request "{displayQuery}"
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    // No results - show request option
                    <CommandEmpty className="py-8">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
                          <Headphones className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">No topics found</p>
                          <p className="text-xs text-muted-foreground/70 mt-1">
                            Try a different search term
                          </p>
                        </div>
                        
                        {searchQuery.trim().length >= 2 && (
                          <>
                            <div className="flex items-center gap-3 w-full max-w-[160px] my-2">
                              <div className="flex-1 h-px bg-border" />
                              <span className="text-xs text-muted-foreground">or</span>
                              <div className="flex-1 h-px bg-border" />
                            </div>
                            
                            <button
                              onClick={() => handleRequestTopic(searchQuery)}
                              disabled={topicRequest.isPending}
                              className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 rounded-lg text-sm text-primary font-medium transition-colors disabled:opacity-50"
                            >
                              {topicRequest.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Lightbulb className="w-4 h-4" />
                              )}
                              Request "{displayQuery}"
                            </button>
                          </>
                        )}
                      </div>
                    </CommandEmpty>
                  )}
                </>
              ) : (
                // Browse Mode - All topics
                <CommandGroup heading="Listen to popular topics">
                  {topics.map((topic) => {
                    const listened = isListened?.(topic.id) ?? false;
                    const hasResume = !listened && (hasProgress?.(topic.id) ?? false);
                    return (
                      <motion.div
                        key={topic.id}
                        whileTap={{ scale: 0.98 }}
                        transition={{ duration: 0.1 }}
                      >
                        <CommandItem
                          value={topic.id}
                          onSelect={() => handleSelectTopic(topic)}
                          className="flex items-center gap-3 p-3 cursor-pointer"
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            listened ? 'bg-primary/20' : hasResume ? 'bg-warning/20' : 'bg-primary/10'
                          }`}>
                            {listened ? (
                              <CheckCircle className="w-4 h-4 text-primary" />
                            ) : hasResume ? (
                              <RotateCcw className="w-4 h-4 text-warning" />
                            ) : (
                              <Headphones className="w-4 h-4 text-primary" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground text-sm truncate">
                                {topic.title}
                              </span>
                              {listened && <span className="text-xs text-primary font-medium">✓</span>}
                              {hasResume && <span className="text-xs text-warning font-medium">Resume</span>}
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                              {topic.description}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        </CommandItem>
                      </motion.div>
                    );
                  })}
                </CommandGroup>
              )}
            </AnimatePresence>
          </CommandList>
        </Command>
      </motion.div>
    </>
  );
};
