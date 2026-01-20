import { useState } from "react";
import { Plus, Video, HelpCircle, ChevronRight, Bookmark, X, Clock, Trash2, ChevronLeft, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useDragScroll, useDragScrollHorizontal } from "@/hooks/useDragScroll";
import { VideoPlayerSheet } from "@/components/VideoPlayerSheet";
import { PracticeQuizSheet } from "@/components/PracticeQuizSheet";
import { ChapterDropdown } from "@/components/ChapterDropdown";
import { VideoCard } from "@/components/VideoCard";
import { PracticeCard } from "@/components/PracticeCard";
import { BottomNav } from "@/components/BottomNav";
import { DailyDownloadFAB } from "@/components/DailyDownloadFAB";
import { TopicSelectionSheet } from "@/components/TopicSelectionSheet";
import { DailyDownloadPlayer } from "@/components/DailyDownloadPlayer";
import { ReviewBoard } from "@/components/ReviewBoard";

import { PinnedCardPreview } from "@/components/PinnedCardPreview";
import { usePinnedCards } from "@/hooks/usePinnedCards";
import { useListenedTopics } from "@/hooks/useListenedTopics";
import { useHaptics } from "@/hooks/useHaptics";
import { springTransition } from "@/lib/motionVariants";
import { subjects, videoTiles, practiceTiles, chapters, type VideoTile, type PracticeTile } from "@/data/courseData";
import { dailyDownloadTopics, type DailyDownloadTopic, type PinnedCard } from "@/data/dailyDownloadData";

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [selectedSubject, setSelectedSubject] = useState(subjects[0]);
  const [selectedVideo, setSelectedVideo] = useState<VideoTile | null>(null);
  const [selectedQuiz, setSelectedQuiz] = useState<PracticeTile | null>(null);
  
  // Daily Download state
  const [showTopicSelection, setShowTopicSelection] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<DailyDownloadTopic | null>(null);
  const [showReviewBoard, setShowReviewBoard] = useState(false);
  const [expandedPinnedCard, setExpandedPinnedCard] = useState<PinnedCard | null>(null);
  const { pinnedCards, pinCard, unpinCard, clearAllPinned, getPinnedCount } = usePinnedCards();
  const { markAsListened, isListened, getUnlistenedCount } = useListenedTopics();
  const { lightTap } = useHaptics();
  
  // Filter content by selected subject
  const subjectChapters = chapters.filter(ch => ch.subjectId === selectedSubject.id);
  const subjectVideos = videoTiles.filter(v => v.subjectId === selectedSubject.id);
  const subjectPractice = practiceTiles.filter(p => p.subjectId === selectedSubject.id);
  const subjectTopics = dailyDownloadTopics.filter(t => t.subjectId === selectedSubject.id);
  const subjectPinnedCards = pinnedCards.filter(c => c.subjectName === selectedSubject.name);
  const unlistenedCount = getUnlistenedCount(subjectTopics.map(t => t.id));
  
  const [selectedChapter, setSelectedChapter] = useState(subjectChapters[0]);
  
  // Reset chapter when subject changes
  const handleSubjectChange = (subject: typeof subjects[0]) => {
    setSelectedSubject(subject);
    const newChapters = chapters.filter(ch => ch.subjectId === subject.id);
    setSelectedChapter(newChapters[0]);
  };

  // Daily Download handlers
  const handleSelectTopic = (topic: DailyDownloadTopic) => {
    setSelectedTopic(topic);
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
  
  const mainScrollRef = useDragScroll<HTMLElement>();
  const subjectsScrollRef = useDragScrollHorizontal<HTMLDivElement>();
  const videosScrollRef = useDragScrollHorizontal<HTMLDivElement>();
  const pinnedCardsScrollRef = useDragScrollHorizontal<HTMLDivElement>();
  
  const practiceScrollRef = useDragScrollHorizontal<HTMLDivElement>();

  return (
    <div className="h-screen bg-background flex flex-col w-full safe-area-inset overflow-hidden">
      {/* Header */}
      <header className="px-4 pt-4 pb-2">
        <h1 className="text-2xl font-bold text-foreground mt-4">Home</h1>
        <div className="w-12 h-1 bg-primary mt-2 rounded-full" />
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
                src={subject.imageUrl} 
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
        {subjectPinnedCards.length > 0 && (
          <div className="py-2 pb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-medium text-foreground">My Pinned Cards</h3>
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                  {subjectPinnedCards.length}
                </span>
              </div>
              <button 
                onClick={() => setShowReviewBoard(true)}
                className="flex items-center gap-1 text-xs text-primary font-medium hover:underline"
              >
                See All
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
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
          </div>
        )}

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
                {subjectVideos.length} videos to watch
              </span>
              <span className="text-xs px-2 py-1 rounded-full bg-accent/20 text-accent-foreground font-medium">
                {subjectPractice.length} practice sets pending
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
                />
              ))}
            </div>
          </div>
        </div>
        </div>
      </section>

      {/* Daily Download FAB */}
      <DailyDownloadFAB 
        onClick={() => setShowTopicSelection(true)}
        unlistenedCount={unlistenedCount}
      />

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      <VideoPlayerSheet 
        video={selectedVideo}
        videos={subjectVideos}
        chapter={selectedChapter}
        isOpen={!!selectedVideo}
        onClose={() => setSelectedVideo(null)}
        onVideoSelect={setSelectedVideo}
      />

      <PracticeQuizSheet 
        quiz={selectedQuiz}
        chapter={selectedChapter}
        isOpen={!!selectedQuiz}
        onClose={() => setSelectedQuiz(null)}
      />

      {/* Daily Download Components */}
      <TopicSelectionSheet
        isOpen={showTopicSelection}
        onClose={() => setShowTopicSelection(false)}
        topics={subjectTopics}
        subjects={subjects}
        onSelectTopic={handleSelectTopic}
        isListened={isListened}
      />

      <DailyDownloadPlayer
        topic={selectedTopic}
        subjectName={getTopicSubjectName()}
        isOpen={!!selectedTopic}
        onClose={() => setSelectedTopic(null)}
        onPinCard={handlePinCard}
        onTopicListened={markAsListened}
      />

      <ReviewBoard
        isOpen={showReviewBoard}
        onClose={() => setShowReviewBoard(false)}
        pinnedCards={pinnedCards}
        onUnpinCard={unpinCard}
        onClearAll={clearAllPinned}
      />

      {/* Expanded Pinned Card Modal */}
      <AnimatePresence>
        {expandedPinnedCard && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setExpandedPinnedCard(null)}
          >
            <motion.div
              className="bg-card border border-border rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={springTransition}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="bg-gradient-to-br from-primary/20 to-primary/5 p-6 text-center relative">
                <button
                  onClick={() => setExpandedPinnedCard(null)}
                  className="absolute top-3 right-3 p-2 rounded-full hover:bg-background/50 transition-colors"
                >
                  <X className="w-5 h-5 text-foreground" />
                </button>
                {/* Card counter */}
                <div className="absolute top-3 left-3 px-2 py-1 rounded-full bg-background/50 text-xs font-medium text-foreground">
                  {pinnedCards.findIndex(c => c.id === expandedPinnedCard.id) + 1} / {pinnedCards.length}
                </div>
                <div className="text-4xl font-bold text-foreground mb-2">
                  {expandedPinnedCard.flashSummary.visualContent}
                </div>
                <span className={`text-xs px-3 py-1 rounded-full ${
                  expandedPinnedCard.flashSummary.difficulty === 'easy' 
                    ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                    : expandedPinnedCard.flashSummary.difficulty === 'medium'
                    ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                    : 'bg-red-500/20 text-red-600 dark:text-red-400'
                }`}>
                  {expandedPinnedCard.flashSummary.difficulty}
                </span>
              </div>

              {/* Modal content - native scroll with drag */}
              <div className="p-6 flex-1 overflow-y-scroll overscroll-contain touch-pan-y" style={{ WebkitOverflowScrolling: 'touch' }}>
                <div className="mb-4">
                  <h3 className="font-bold text-foreground text-lg">
                    {expandedPinnedCard.topicTitle}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {expandedPinnedCard.subjectName}
                  </p>
                </div>

                {/* All bullet points */}
                <ul className="space-y-3 mb-4">
                  {expandedPinnedCard.flashSummary.bulletPoints.map((point, i) => (
                    <li key={i} className="flex gap-3 text-sm text-foreground">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center">
                        {i + 1}
                      </span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>


                {/* Timestamp */}
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-4">
                  <Clock className="w-3 h-3" />
                  <span>Pinned {(() => {
                    const date = new Date(expandedPinnedCard.pinnedAt);
                    const now = new Date();
                    const diffMs = now.getTime() - date.getTime();
                    const diffMins = Math.floor(diffMs / 60000);
                    const diffHours = Math.floor(diffMs / 3600000);
                    const diffDays = Math.floor(diffMs / 86400000);
                    if (diffMins < 60) return `${diffMins}m ago`;
                    if (diffHours < 24) return `${diffHours}h ago`;
                    return `${diffDays}d ago`;
                  })()}</span>
                </div>
              </div>

              {/* Modal footer */}
              <div className="p-4 border-t border-border space-y-3">
                {/* Navigation buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      lightTap();
                      const currentIndex = pinnedCards.findIndex(c => c.id === expandedPinnedCard.id);
                      const prevIndex = currentIndex > 0 ? currentIndex - 1 : pinnedCards.length - 1;
                      setExpandedPinnedCard(pinnedCards[prevIndex]);
                    }}
                    className="flex-1 py-3 rounded-xl bg-muted text-foreground font-medium hover:bg-muted/80 transition-colors flex items-center justify-center gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <button
                    onClick={() => {
                      lightTap();
                      const currentIndex = pinnedCards.findIndex(c => c.id === expandedPinnedCard.id);
                      const nextIndex = currentIndex < pinnedCards.length - 1 ? currentIndex + 1 : 0;
                      setExpandedPinnedCard(pinnedCards[nextIndex]);
                    }}
                    className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                  >
                    Next Card
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Remove button */}
                <button
                  onClick={() => {
                    lightTap();
                    const currentIndex = pinnedCards.findIndex(c => c.id === expandedPinnedCard.id);
                    const nextCard = pinnedCards.length > 1 
                      ? pinnedCards[currentIndex < pinnedCards.length - 1 ? currentIndex + 1 : currentIndex - 1]
                      : null;
                    unpinCard(expandedPinnedCard.id);
                    setExpandedPinnedCard(nextCard);
                  }}
                  className="w-full py-2.5 rounded-xl text-destructive font-medium hover:bg-destructive/10 transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
