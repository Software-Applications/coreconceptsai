import { useState, useEffect, useRef, useMemo } from "react";
import { Plus, Video, HelpCircle, ChevronRight, ChevronDown, Bookmark, Sun, Moon, Loader2 } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { useDragScroll, useDragScrollHorizontal } from "@/hooks/useDragScroll";
import { VideoPlayerSheet } from "@/components/VideoPlayerSheet";
import { PracticeQuizSheet } from "@/components/PracticeQuizSheet";
import { ChapterDropdown } from "@/components/ChapterDropdown";
import { VideoCard } from "@/components/VideoCard";
import { PracticeCard } from "@/components/PracticeCard";
import { BottomNav } from "@/components/BottomNav";
import { DailyDownloadCard } from "@/components/DailyDownloadCard";
import { TopicSelectionSheet } from "@/components/TopicSelectionSheet";
import { DailyDownloadPlayer } from "@/components/DailyDownloadPlayer";
import { ReviewBoard } from "@/components/ReviewBoard";
import { ExpandedCardModal } from "@/components/ExpandedCardModal";

import { PinnedCardPreview } from "@/components/PinnedCardPreview";
import { usePinnedCards } from "@/hooks/usePinnedCards";
import { useListenedTopics } from "@/hooks/useListenedTopics";
import { useWatchedVideos } from "@/hooks/useWatchedVideos";
import { useCompletedPractice } from "@/hooks/useCompletedPractice";
import { useAudioProgress } from "@/hooks/useAudioProgress";
import { useHaptics } from "@/hooks/useHaptics";
import { useConfetti } from "@/hooks/useConfetti";
import { useSubjects } from "@/hooks/useSubjects";
import { useChapters } from "@/hooks/useChapters";
import { useTopics, type DailyDownloadTopic } from "@/hooks/useTopics";
import { videoTiles, practiceTiles, type VideoTile, type PracticeTile } from "@/data/courseData";
import { type PinnedCard } from "@/data/dailyDownloadData";

const Index = () => {
  // ALL HOOKS MUST BE CALLED FIRST - before any conditional returns
  const [activeTab, setActiveTab] = useState("home");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<VideoTile | null>(null);
  const [selectedQuiz, setSelectedQuiz] = useState<PracticeTile | null>(null);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showTopicSelection, setShowTopicSelection] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [showReviewBoard, setShowReviewBoard] = useState(false);
  const [expandedPinnedCard, setExpandedPinnedCard] = useState<PinnedCard | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<{ id: string; subject_id: string; chapter_number: number; title: string; created_at: string | null } | null>(null);
  const [isPinnedCardsOpen, setIsPinnedCardsOpen] = useState(false);
  
  // Fetch data from Supabase
  const { data: subjects = [], isLoading: subjectsLoading } = useSubjects();
  const { data: allChapters = [], isLoading: chaptersLoading } = useChapters();
  const { data: allTopics = [], isLoading: topicsLoading } = useTopics();
  
  // Custom hooks
  const { pinnedCards, pinCard, unpinCard, clearAllPinned } = usePinnedCards();
  const { markAsListened, isListened, getUnlistenedCount } = useListenedTopics();
  const { markAsWatched, isWatched, getWatchedCount } = useWatchedVideos();
  const { isCompleted: isPracticeCompleted, getBestScore, getCompletedCount } = useCompletedPractice();
  const { hasProgress: hasAudioProgress } = useAudioProgress();
  const { lightTap } = useHaptics();
  const { celebrate } = useConfetti();
  
  // Refs
  const prevWatchedCount = useRef(0);
  const prevCompletedPracticeCount = useRef(0);
  const prevListenedCount = useRef(0);
  
  // Scroll refs
  const mainScrollRef = useDragScroll<HTMLElement>();
  const subjectsScrollRef = useDragScrollHorizontal<HTMLDivElement>();
  const videosScrollRef = useDragScrollHorizontal<HTMLDivElement>();
  const pinnedCardsScrollRef = useDragScrollHorizontal<HTMLDivElement>();
  const practiceScrollRef = useDragScrollHorizontal<HTMLDivElement>();
  
  // Set default subject when data loads
  useEffect(() => {
    if (subjects.length > 0 && !selectedSubjectId) {
      setSelectedSubjectId(subjects[0].id);
    }
  }, [subjects, selectedSubjectId]);
  
  // Ensure theme toggle doesn't cause hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Derived state
  const selectedSubject = subjects.find(s => s.id === selectedSubjectId) ?? subjects[0];
  const isLoading = subjectsLoading || chaptersLoading || topicsLoading;
  
  // Filter content by selected subject (safe even when selectedSubject is undefined)
  const subjectChapters = selectedSubject ? allChapters.filter(ch => ch.subject_id === selectedSubject.id) : [];
  const subjectVideos = selectedSubject ? videoTiles.filter(v => v.subjectId === subjects.findIndex(s => s.id === selectedSubject.id) + 1) : [];
  const subjectPractice = selectedSubject ? practiceTiles.filter(p => p.subjectId === subjects.findIndex(s => s.id === selectedSubject.id) + 1) : [];
  const subjectTopics = selectedSubject ? allTopics.filter(t => t.subjectId === selectedSubject.id) : [];
  const subjectPinnedCards = selectedSubject ? pinnedCards.filter(c => c.subjectName === selectedSubject.name) : [];
  
  // Derive selectedTopic from query data so it updates when AI content is generated
  const selectedTopic = useMemo(() => {
    if (!selectedTopicId) return null;
    return allTopics.find(t => t.id === selectedTopicId) ?? null;
  }, [allTopics, selectedTopicId]);
  const unlistenedCount = getUnlistenedCount(subjectTopics.map(t => t.id));
  const listenedCount = subjectTopics.length - unlistenedCount;
  const watchedCount = getWatchedCount(subjectVideos.map(v => v.id));
  const completedPracticeCount = getCompletedCount(subjectPractice.map(p => p.id));
  
  // Set default chapter when subject changes
  useEffect(() => {
    if (subjectChapters.length > 0) {
      setSelectedChapter(subjectChapters[0]);
    }
  }, [selectedSubject?.id, subjectChapters.length]);
  
  // Auto-expand when cards are added, auto-collapse when empty
  useEffect(() => {
    setIsPinnedCardsOpen(subjectPinnedCards.length > 0);
  }, [subjectPinnedCards.length]);
  useEffect(() => {
    // Videos completion check
    if (!selectedSubject) return;
    if (watchedCount === subjectVideos.length && 
        watchedCount > 0 && 
        prevWatchedCount.current === subjectVideos.length - 1) {
      celebrate();
      toast.success("🎉 All videos completed!", {
        description: `You've watched all ${subjectVideos.length} videos in ${selectedSubject.name}!`
      });
    }
    prevWatchedCount.current = watchedCount;
  }, [watchedCount, subjectVideos.length, celebrate, selectedSubject]);

  useEffect(() => {
    // Practice sets completion check
    if (!selectedSubject) return;
    if (completedPracticeCount === subjectPractice.length && 
        completedPracticeCount > 0 && 
        prevCompletedPracticeCount.current === subjectPractice.length - 1) {
      celebrate();
      toast.success("🎉 All practice sets completed!", {
        description: `You've finished all ${subjectPractice.length} practice sets in ${selectedSubject.name}!`
      });
    }
    prevCompletedPracticeCount.current = completedPracticeCount;
  }, [completedPracticeCount, subjectPractice.length, celebrate, selectedSubject]);

  useEffect(() => {
    // Daily Download completion check
    if (!selectedSubject) return;
    if (listenedCount === subjectTopics.length && 
        listenedCount > 0 && 
        prevListenedCount.current === subjectTopics.length - 1) {
      celebrate();
      toast.success("🎉 All Core Concepts completed!", {
        description: `You've listened to all ${subjectTopics.length} topics in ${selectedSubject.name}!`
      });
    }
    prevListenedCount.current = listenedCount;
  }, [listenedCount, subjectTopics.length, celebrate, selectedSubject]);
  
  // Reset chapter when subject changes
  const handleSubjectChange = (subject: typeof subjects[0]) => {
    setSelectedSubjectId(subject.id);
  };

  // Daily Download handlers
  const handleSelectTopic = (topic: DailyDownloadTopic) => {
    setSelectedTopicId(topic.id);
    setShowTopicSelection(false);
  };

  const handlePinCard = (topic: DailyDownloadTopic) => {
    const subjectName = subjects.find(s => s.id === topic.subjectId)?.name || 'Unknown';
    pinCard(topic.flashSummary, topic.title, subjectName);
  };

  const getTopicSubjectName = () => {
    if (!selectedTopic) return '';
    return subjects.find(s => s.id === selectedTopic.subjectId)?.name || '';
  };
  
  // Show loading state while data is being fetched
  if (isLoading || !selectedSubject) {
    return (
      <div className="h-full bg-background flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading content...</p>
      </div>
    );
  }

  return (
    <div className="h-full bg-background flex flex-col w-full safe-area-inset overflow-hidden relative">
      {/* Header */}
      <header className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground mt-4">Home</h1>
          <div className="w-12 h-1 bg-primary mt-2 rounded-full" />
        </div>
        {mounted && (
          <button
            onClick={() => {
              lightTap();
              setTheme(theme === 'dark' ? 'light' : 'dark');
            }}
            className="mt-4 p-2 rounded-full hover:bg-muted transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-foreground" />
            ) : (
              <Moon className="w-5 h-5 text-foreground" />
            )}
          </button>
        )}
      </header>

      {/* Subject Chips */}
      <section className="px-4 py-4">
        <div ref={subjectsScrollRef} className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          <button className="flex-shrink-0 w-12 h-12 rounded-xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
            <Plus className="w-6 h-6 text-muted-foreground" />
          </button>
          {subjects.map((subject) => (
            <button
              key={subject.id}
              onClick={() => handleSubjectChange(subject)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
                selectedSubject.id === subject.id
                  ? 'border-2 border-primary bg-card'
                  : 'border border-border bg-card hover:bg-accent'
              }`}
            >
              <img 
                src={subject.image_url || ''} 
                alt={subject.name}
                className="w-8 h-8 rounded-lg object-cover"
              />
              <span className={`text-sm font-medium ${selectedSubject.id === subject.id ? 'text-primary' : 'text-foreground'}`}>
                {subject.name}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Main Scrollable Content */}
      <section ref={mainScrollRef} className="px-4 flex-1 overflow-y-auto scrollbar-hide relative">
        {/* Your eTextbook */}
        <div className="py-2 pb-4">
          <div className="mb-3">
            <h2 className="text-xl font-bold text-foreground">Textbook</h2>
          </div>
          <div className="bg-card border border-border rounded-xl p-3 flex items-center gap-3 shadow-sm cursor-pointer hover:shadow-md hover:border-primary/30 transition-all duration-200 active:scale-[0.98]">
            <img 
              src={selectedSubject.textbook.imageUrl} 
              alt={selectedSubject.textbook.title}
              className="w-16 h-20 rounded-lg flex-shrink-0 object-cover shadow-sm"
            />
            <div>
              <p className="text-sm font-medium text-foreground leading-snug">{selectedSubject.textbook.title}</p>
            </div>
          </div>
        </div>

        {/* My Pinned Cards Section */}
        <div className="py-2 pb-4">
          <Collapsible open={isPinnedCardsOpen} onOpenChange={setIsPinnedCardsOpen}>
            <div className="flex items-center justify-between mb-3">
              <CollapsibleTrigger asChild>
                <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                  <Bookmark className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-medium text-foreground">My Pinned Cards</h3>
                  {subjectPinnedCards.length > 0 && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                      {subjectPinnedCards.length}
                    </span>
                  )}
                  <ChevronDown 
                    className="w-4 h-4 text-muted-foreground transition-transform duration-200" 
                    style={{ transform: isPinnedCardsOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  />
                </button>
              </CollapsibleTrigger>
              {subjectPinnedCards.length > 0 && (
                <button 
                  onClick={() => setShowReviewBoard(true)}
                  className="flex items-center gap-1 text-xs text-primary font-medium hover:underline"
                >
                  See All
                  <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </div>
            
            <CollapsibleContent className="data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up overflow-hidden">
              {subjectPinnedCards.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                    <Bookmark className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">No pinned cards yet</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Listen to Core Concepts AI and pin cards to review later
                  </p>
                </div>
              ) : (
                <div className="-mx-4 px-4 -my-2 py-2">
                  <div
                    ref={pinnedCardsScrollRef}
                    data-drag-scroll="x"
                    className="flex gap-3 overflow-x-auto overflow-y-hidden py-2 scrollbar-hide items-stretch pr-4 pl-1 snap-x snap-mandatory overscroll-x-contain overscroll-y-none select-none"
                    style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x' }}
                  >
                    {subjectPinnedCards.slice(0, 5).map((card) => (
                      <PinnedCardPreview
                        key={card.id}
                        card={card}
                        onClick={() => setExpandedPinnedCard(card)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Daily Download Inline Card */}
        <div className="py-3">
          <DailyDownloadCard 
            onClick={() => setShowTopicSelection(true)}
            unlistenedCount={unlistenedCount}
          />
        </div>

        {/* Section Divider */}
        <div className="border-t border-border/50 my-2" />

        {/* Related Videos and Practice */}
        <div className="py-4">
          {/* Sticky Section Header */}
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm pb-3 -mx-4 px-4 pt-1">
            <h2 className="text-base font-semibold text-foreground">Related Videos and Practice</h2>
            {/* Progress Indicators */}
            <div className="flex gap-3 mt-2">
              <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                {watchedCount} of {subjectVideos.length} videos watched
              </span>
              <span className="text-xs px-2 py-1 rounded-full bg-accent/20 text-accent-foreground font-medium">
                {completedPracticeCount} of {subjectPractice.length} practice sets done
              </span>
            </div>
          </div>
        
        <ChapterDropdown 
          chapters={subjectChapters}
          selectedChapter={selectedChapter}
          onSelectChapter={setSelectedChapter}
        />

        {/* Videos Section */}
        <div className="mb-5">
          <div className="sticky top-[72px] z-10 bg-background/95 backdrop-blur-sm py-2 -mx-4 px-4 flex items-center gap-2">
            <Video className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-medium text-foreground">Videos</h3>
            <span className="text-xs text-muted-foreground">({subjectVideos.length})</span>
          </div>
          <div className="-mx-4 px-4">
            <div ref={videosScrollRef} className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide items-start pr-4">
              {subjectVideos.map((video) => (
                <VideoCard 
                  key={video.id} 
                  video={video} 
                  onClick={() => setSelectedVideo(video)}
                  isWatched={isWatched(video.id)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Practice Questions Section */}
        <div className="mb-4">
          <div className="sticky top-[72px] z-10 bg-background/95 backdrop-blur-sm py-2 -mx-4 px-4 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-medium text-foreground">Practice Sets</h3>
            <span className="text-xs text-muted-foreground">({subjectPractice.length})</span>
          </div>
          <div className="-mx-4 px-4">
            <div ref={practiceScrollRef} className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide items-start pr-4">
              {subjectPractice.map((practice) => (
                <PracticeCard 
                  key={practice.id} 
                  practice={practice} 
                  onClick={() => setSelectedQuiz(practice)}
                  isCompleted={isPracticeCompleted(practice.id)}
                  bestScore={getBestScore(practice.id)}
                />
              ))}
            </div>
          </div>
        </div>
        </div>
      </section>


      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      <AnimatePresence mode="wait">
        {selectedVideo && (
          <VideoPlayerSheet 
            video={selectedVideo}
            videos={subjectVideos}
            chapter={selectedChapter}
            isOpen={!!selectedVideo}
            onClose={() => setSelectedVideo(null)}
            onVideoSelect={setSelectedVideo}
            onVideoWatched={markAsWatched}
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {selectedQuiz && (
          <PracticeQuizSheet 
            quiz={selectedQuiz}
            chapter={selectedChapter}
            isOpen={!!selectedQuiz}
            onClose={() => setSelectedQuiz(null)}
          />
        )}
      </AnimatePresence>

      {/* Daily Download Components */}
      <AnimatePresence mode="wait">
        {showTopicSelection && (
          <TopicSelectionSheet
            isOpen={showTopicSelection}
            onClose={() => setShowTopicSelection(false)}
            topics={subjectTopics}
            onSelectTopic={handleSelectTopic}
            isListened={isListened}
            hasProgress={hasAudioProgress}
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {selectedTopic && (
          <DailyDownloadPlayer
            topic={selectedTopic}
            subjectName={getTopicSubjectName()}
            isOpen={!!selectedTopic}
            onClose={() => setSelectedTopicId(null)}
            onPinCard={handlePinCard}
            onTopicListened={markAsListened}
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {showReviewBoard && (
          <ReviewBoard
            isOpen={showReviewBoard}
            onClose={() => setShowReviewBoard(false)}
            pinnedCards={pinnedCards}
            onUnpinCard={unpinCard}
            onClearAll={clearAllPinned}
          />
        )}
      </AnimatePresence>

      {/* Expanded Pinned Card Modal */}
      <AnimatePresence mode="wait">
        {expandedPinnedCard && (
          <ExpandedCardModal
            card={expandedPinnedCard}
            cards={pinnedCards}
            onClose={() => setExpandedPinnedCard(null)}
            onNavigate={setExpandedPinnedCard}
            onRemove={unpinCard}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
