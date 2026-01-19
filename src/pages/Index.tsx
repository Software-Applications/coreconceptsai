import { useState } from "react";
import { Plus, Video, HelpCircle, ChevronRight, Bookmark } from "lucide-react";
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
import { subjects, videoTiles, practiceTiles, chapters, type VideoTile, type PracticeTile } from "@/data/courseData";
import { dailyDownloadTopics, type DailyDownloadTopic } from "@/data/dailyDownloadData";

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [selectedSubject, setSelectedSubject] = useState(subjects[0]);
  const [selectedVideo, setSelectedVideo] = useState<VideoTile | null>(null);
  const [selectedQuiz, setSelectedQuiz] = useState<PracticeTile | null>(null);
  
  // Daily Download state
  const [showTopicSelection, setShowTopicSelection] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<DailyDownloadTopic | null>(null);
  const [showReviewBoard, setShowReviewBoard] = useState(false);
  const { pinnedCards, pinCard, unpinCard, clearAllPinned, getPinnedCount } = usePinnedCards();
  
  // Filter content by selected subject
  const subjectChapters = chapters.filter(ch => ch.subjectId === selectedSubject.id);
  const subjectVideos = videoTiles.filter(v => v.subjectId === selectedSubject.id);
  const subjectPractice = practiceTiles.filter(p => p.subjectId === selectedSubject.id);
  
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

      {/* Your eTextbook */}
      <section className="px-4 py-2 pb-4">
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
      </section>

      {/* My Pinned Cards Section */}
      {getPinnedCount() > 0 && (
        <section className="px-4 py-2 pb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-medium text-foreground">My Pinned Cards</h3>
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                {getPinnedCount()}
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
          <div className="-mx-4 px-4">
            <div ref={pinnedCardsScrollRef} className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide pr-4">
              {pinnedCards.slice(0, 5).map((card) => (
                <PinnedCardPreview
                  key={card.id}
                  card={card}
                  onClick={() => setShowReviewBoard(true)}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Section Divider */}
      <div className="mx-4 border-t border-border/50" />

      {/* Related Videos and Practice */}
      <section ref={mainScrollRef} className="px-4 py-4 flex-1 overflow-y-auto scrollbar-hide">
        <h2 className="text-base font-semibold text-foreground mb-4">Related Videos and Practice</h2>
        
        <ChapterDropdown 
          chapters={subjectChapters}
          selectedChapter={selectedChapter}
          onSelectChapter={setSelectedChapter}
        />

        {/* Videos Section */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
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
          <div className="flex items-center gap-2 mb-3">
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
      </section>

      {/* Daily Download FAB */}
      <DailyDownloadFAB 
        onClick={() => setShowTopicSelection(true)}
        hasPendingReviews={getPinnedCount() > 0}
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
        topics={dailyDownloadTopics}
        subjects={subjects}
        onSelectTopic={handleSelectTopic}
      />

      <DailyDownloadPlayer
        topic={selectedTopic}
        subjectName={getTopicSubjectName()}
        isOpen={!!selectedTopic}
        onClose={() => setSelectedTopic(null)}
        onPinCard={handlePinCard}
      />

      <ReviewBoard
        isOpen={showReviewBoard}
        onClose={() => setShowReviewBoard(false)}
        pinnedCards={pinnedCards}
        onUnpinCard={unpinCard}
        onClearAll={clearAllPinned}
      />
    </div>
  );
};

export default Index;
