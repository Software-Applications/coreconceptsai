import { useState } from "react";
import { Plus, Video, HelpCircle } from "lucide-react";
import { useDragScroll, useDragScrollHorizontal } from "@/hooks/useDragScroll";
import { VideoPlayerSheet } from "@/components/VideoPlayerSheet";
import { PracticeQuizSheet } from "@/components/PracticeQuizSheet";
import { ChapterDropdown } from "@/components/ChapterDropdown";
import { VideoCard } from "@/components/VideoCard";
import { PracticeCard } from "@/components/PracticeCard";
import { BottomNav } from "@/components/BottomNav";
import { subjects, videoTiles, practiceTiles, chapters, type VideoTile, type PracticeTile } from "@/data/courseData";

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [selectedSubject, setSelectedSubject] = useState(subjects[0]);
  const [selectedChapter, setSelectedChapter] = useState(chapters[0]);
  const [selectedVideo, setSelectedVideo] = useState<VideoTile | null>(null);
  const [selectedQuiz, setSelectedQuiz] = useState<PracticeTile | null>(null);
  
  const mainScrollRef = useDragScroll<HTMLElement>();
  const subjectsScrollRef = useDragScrollHorizontal<HTMLDivElement>();
  const videosScrollRef = useDragScrollHorizontal<HTMLDivElement>();
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
              onClick={() => setSelectedSubject(subject)}
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
            src="https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=200&h=250&fit=crop" 
            alt="Microbiology Textbook"
            className="w-16 h-20 rounded-lg flex-shrink-0 object-cover shadow-sm"
          />
          <div>
            <p className="text-sm font-medium text-foreground leading-snug">Microbiology with Diseases by Body System, 5th edition</p>
          </div>
        </div>
      </section>

      {/* Section Divider */}
      <div className="mx-4 border-t border-border/50" />

      {/* Related Videos and Practice */}
      <section ref={mainScrollRef} className="px-4 py-4 flex-1 overflow-y-auto scrollbar-hide">
        <h2 className="text-lg font-bold text-foreground mb-4">Related videos and practice</h2>
        
        <ChapterDropdown 
          chapters={chapters}
          selectedChapter={selectedChapter}
          onSelectChapter={setSelectedChapter}
        />

        {/* Videos Section */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <Video className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-foreground text-sm">Videos</h3>
            <span className="text-xs text-muted-foreground">({videoTiles.length})</span>
          </div>
          <div className="-mx-4 px-4">
            <div ref={videosScrollRef} className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide items-start pr-4">
              {videoTiles.map((video) => (
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
            <h3 className="font-semibold text-foreground text-sm">Practice Sets</h3>
            <span className="text-xs text-muted-foreground">({practiceTiles.length})</span>
          </div>
          <div className="-mx-4 px-4">
            <div ref={practiceScrollRef} className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide items-start pr-4">
              {practiceTiles.map((practice) => (
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

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      <VideoPlayerSheet 
        video={selectedVideo}
        videos={videoTiles}
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
    </div>
  );
};

export default Index;
