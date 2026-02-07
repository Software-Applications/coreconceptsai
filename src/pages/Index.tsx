import { useState, useEffect, useRef, useMemo } from "react";
import { Video, HelpCircle, ChevronRight, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { useDragScroll } from "@/hooks/useDragScroll";
import { useTapVsDrag } from "@/hooks/useTapVsDrag";
import { VideoPlayerSheet } from "@/components/VideoPlayerSheet";
import { PracticeQuizSheet } from "@/components/PracticeQuizSheet";
import { ChapterDrawer } from "@/components/ChapterDrawer";
import { VideoCard } from "@/components/VideoCard";
import { PracticeCard } from "@/components/PracticeCard";
import { BottomNav } from "@/components/BottomNav";
import { CoreConceptsHub } from "@/components/CoreConceptsHub";
import { TopicSelectionSheet } from "@/components/TopicSelectionSheet";
import { DailyDownloadPlayer } from "@/components/DailyDownloadPlayer";
import { ReviewBoard } from "@/components/ReviewBoard";
import { ExpandedCardModal } from "@/components/ExpandedCardModal";
import { SubjectChips } from "@/components/SubjectChips";
import { useTrendingTopics } from "@/hooks/useTrendingTopics";
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
import { useExamTopicIds } from "@/hooks/useExams";
import { subjectCrossFade } from "@/lib/motionVariants";
import { videoTiles, practiceTiles, type VideoTile, type PracticeTile } from "@/data/courseData";
import { type PinnedCard } from "@/data/dailyDownloadData";

// Map subject names to hardcoded IDs in courseData.ts
// This bridges the gap between Supabase UUIDs and static video/practice data
const SUBJECT_NAME_TO_ID: Record<string, number> = {
  'Microbiology': 1,
  'Chemistry': 2,
  'Biology': 3,
};

const Index = () => {
  // ALL HOOKS MUST BE CALLED FIRST - before any conditional returns
  const [activeTab, setActiveTab] = useState("home");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<VideoTile | null>(null);
  const [selectedQuiz, setSelectedQuiz] = useState<PracticeTile | null>(null);
  const [showTopicSelection, setShowTopicSelection] = useState(false);
  const [topicSelectionFilter, setTopicSelectionFilter] = useState<'trending' | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [showReviewBoard, setShowReviewBoard] = useState(false);
  const [expandedPinnedCard, setExpandedPinnedCard] = useState<PinnedCard | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<{ id: string; subject_id: string; chapter_number: number; title: string; created_at: string | null } | null>(null);
  
  
  // Fetch data from Supabase
  const { data: subjects = [], isLoading: subjectsLoading } = useSubjects();
  const { data: allChapters = [], isLoading: chaptersLoading } = useChapters();
  const { data: allTopics = [], isLoading: topicsLoading } = useTopics();
  const { data: trendingTopics = [], isLoading: trendingLoading } = useTrendingTopics(10);
  
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
  const { scrollRef: videosScrollRef, handleClick: handleVideoClick } = useTapVsDrag<HTMLDivElement>();
  const { scrollRef: practiceScrollRef, handleClick: handlePracticeClick } = useTapVsDrag<HTMLDivElement>();
  
  // Set default subject when data loads
  useEffect(() => {
    if (subjects.length > 0 && !selectedSubjectId) {
      setSelectedSubjectId(subjects[0].id);
    }
  }, [subjects, selectedSubjectId]);
  
  // Derived state
  const selectedSubject = subjects.find(s => s.id === selectedSubjectId) ?? subjects[0];
  const isLoading = subjectsLoading || chaptersLoading || topicsLoading;
  
  // Memoize filtered content to prevent recalculation on every render
  const subjectChapters = useMemo(() => 
    selectedSubject ? allChapters.filter(ch => ch.subject_id === selectedSubject.id) : [],
    [selectedSubject?.id, allChapters]
  );
  
  const subjectVideos = useMemo(() => {
    if (!selectedSubject) return [];
    const numericId = SUBJECT_NAME_TO_ID[selectedSubject.name] || 0;
    return videoTiles.filter(v => v.subjectId === numericId);
  }, [selectedSubject?.id, selectedSubject?.name]);
  
  const subjectPractice = useMemo(() => {
    if (!selectedSubject) return [];
    const numericId = SUBJECT_NAME_TO_ID[selectedSubject.name] || 0;
    return practiceTiles.filter(p => p.subjectId === numericId);
  }, [selectedSubject?.id, selectedSubject?.name]);
  
  const subjectTopics = useMemo(() => 
    selectedSubject ? allTopics.filter(t => t.subjectId === selectedSubject.id) : [],
    [selectedSubject?.id, allTopics]
  );
  
  const subjectPinnedCards = useMemo(() => 
    selectedSubject ? pinnedCards.filter(c => c.subjectName === selectedSubject.name) : [],
    [selectedSubject?.name, pinnedCards]
  );
  
  // Derive selectedTopic from query data so it updates when AI content is generated
  const selectedTopic = useMemo(() => {
    if (!selectedTopicId) return null;
    return allTopics.find(t => t.id === selectedTopicId) ?? null;
  }, [allTopics, selectedTopicId]);
  
  // Get exam-related topics with fallback for demo
  const { examTopicIds: realExamTopicIds, hasExam } = useExamTopicIds(selectedSubject?.id, subjectTopics);
  
  // Fallback: if no exam data, use first 3 topics as mock exam topics for demo
  const examTopicIds = hasExam 
    ? realExamTopicIds 
    : new Set(subjectTopics.slice(0, 3).map(t => t.id));
  const examTopicsCount = examTopicIds.size;
  
  // Memoize trending topic IDs Set
  const trendingTopicIds = useMemo(() => 
    new Set(trendingTopics.map(t => t.id)),
    [trendingTopics]
  );
  
  // Filter trending topics by selected subject for the home carousel
  const subjectTrendingTopics = useMemo(() => 
    selectedSubject 
      ? trendingTopics.filter(t => t.subject_name === selectedSubject.name)
      : [],
    [selectedSubject?.name, trendingTopics]
  );
  const unlistenedCount = getUnlistenedCount(subjectTopics.map(t => t.id));
  const listenedCount = subjectTopics.length - unlistenedCount;
  const watchedCount = getWatchedCount(subjectVideos.map(v => v.id));
  const completedPracticeCount = getCompletedCount(subjectPractice.map(p => p.id));
  
  // Set default chapter when subject changes
  useEffect(() => {
    if (subjectChapters.length > 0) {
      setSelectedChapter(subjectChapters[0]);
    }
  }, [selectedSubject?.id, subjectChapters]);
  
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
      <header className="px-4 pt-12 pb-1 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground mt-2">Home</h1>
          <div className="w-12 h-1 bg-primary mt-1.5 rounded-full" />
        </div>
      </header>

      {/* Subject Chips */}
      <SubjectChips
        subjects={subjects}
        allTopics={allTopics}
        selectedSubjectId={selectedSubject.id}
        onSubjectChange={handleSubjectChange}
      />

      {/* Main Scrollable Content with Cross-Fade */}
      <AnimatePresence mode="wait">
        <motion.section 
          key={`subject-content-${selectedSubjectId}`}
          ref={mainScrollRef} 
          className="px-4 flex-1 overflow-y-auto scrollbar-hide relative"
          variants={subjectCrossFade}
          initial="initial"
          animate="animate"
          exit="exit"
        >
        {/* Compact Textbook Reference */}
        <div className="py-3">
          <div 
            className="bg-card border border-border rounded-xl p-2 flex items-center gap-3 shadow-sm cursor-pointer hover:shadow-md hover:bg-primary/5 transition-all duration-200 active:scale-[0.98]"
            onClick={() => {
              lightTap();
              toast("Coming Soon", {
                description: "eTextbook integration is currently in development.",
              });
            }}
          >
            <div className="w-10 h-[52px] rounded-md flex-shrink-0 overflow-hidden shadow-sm bg-muted">
              <img 
                src={selectedSubject.textbook.imageUrl} 
                alt={selectedSubject.textbook.title}
                className="w-full h-full object-contain"
                style={{ imageRendering: 'auto' }}
                loading="eager"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground leading-snug truncate">{selectedSubject.textbook.title}</p>
              {selectedSubject.textbook.author && (
                <p className="text-xs text-muted-foreground truncate">{selectedSubject.textbook.author}</p>
              )}
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          </div>
        </div>

        {/* Core Concepts AI Hub (with integrated pinned cards and trending topics) */}
        <CoreConceptsHub
          onOpenTopics={() => {
            setTopicSelectionFilter(null);
            setShowTopicSelection(true);
          }}
          onOpenReviewBoard={() => setShowReviewBoard(true)}
          onCardClick={setExpandedPinnedCard}
          pinnedCards={subjectPinnedCards}
          unlistenedCount={unlistenedCount}
          examTopicsCount={examTopicsCount}
          trendingTopics={subjectTrendingTopics}
          trendingLoading={trendingLoading}
          onSelectTrendingTopic={(topicId) => setSelectedTopicId(topicId)}
          isTopicListened={isListened}
          onOpenTrendingTopics={() => {
            setTopicSelectionFilter('trending');
            setShowTopicSelection(true);
          }}
        />

        {/* Related Videos and Practice */}
        <div className="pt-4 pb-3">
          {/* Separator line with padding */}
          <div className="border-t border-border mb-4" />
          {/* Sticky Section Header */}
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm pb-1.5 -mx-4 px-4 pt-0.5">
            <h2 className="text-base font-semibold text-foreground">Related Videos and Practice</h2>
          </div>
        
        <ChapterDrawer 
          chapters={subjectChapters}
          selectedChapter={selectedChapter}
          onSelectChapter={setSelectedChapter}
        />

        {/* Videos Section */}
        <div className="mb-3">
          <div className="sticky top-[72px] z-10 bg-background/95 backdrop-blur-sm py-1.5 -mx-4 px-4 flex items-center gap-2">
            <Video className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-medium text-foreground">Videos</h3>
            <span className="text-xs text-muted-foreground">({subjectVideos.length})</span>
          </div>
          <div className="-mx-4 px-4 pt-2">
            <div ref={videosScrollRef} data-drag-scroll="x" className="flex gap-3 overflow-x-auto pt-2 pb-2 scrollbar-hide items-start pr-4 snap-x snap-mandatory overscroll-x-contain select-none" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x' }}>
              {subjectVideos.map((video) => (
                <VideoCard 
                  key={video.id} 
                  video={video} 
                  onClick={handleVideoClick(() => setSelectedVideo(video))}
                  isWatched={isWatched(video.id)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Practice Questions Section */}
        <div className="mb-4">
          <div className="sticky top-[72px] z-10 bg-background/95 backdrop-blur-sm py-1.5 -mx-4 px-4 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-medium text-foreground">Practice Sets</h3>
            <span className="text-xs text-muted-foreground">({subjectPractice.length})</span>
          </div>
          <div className="-mx-4 px-4 pt-2">
            <div ref={practiceScrollRef} data-drag-scroll="x" className="flex gap-3 overflow-x-auto pt-2 pb-2 scrollbar-hide items-start pr-4 snap-x snap-mandatory overscroll-x-contain select-none" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x' }}>
              {subjectPractice.map((practice) => (
                <PracticeCard 
                  key={practice.id} 
                  practice={practice} 
                  onClick={handlePracticeClick(() => setSelectedQuiz(practice))}
                  isCompleted={isPracticeCompleted(practice.id)}
                  bestScore={getBestScore(practice.id)}
                />
              ))}
            </div>
          </div>
        </div>
        </div>
      </motion.section>
      </AnimatePresence>


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
            onClose={() => {
              setShowTopicSelection(false);
              setTopicSelectionFilter(null);
            }}
            topics={subjectTopics}
            allTopics={allTopics}
            onSelectTopic={handleSelectTopic}
            isListened={isListened}
            hasProgress={hasAudioProgress}
            currentSubjectId={selectedSubject?.id}
            examTopicIds={examTopicIds}
            trendingTopicIds={trendingTopicIds}
            initialFilter={topicSelectionFilter}
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
