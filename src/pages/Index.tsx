import { useState, useRef, useEffect } from "react";
import { Plus, Play, Home, BookOpen, Video, Briefcase, User, ChevronDown, HelpCircle, Check } from "lucide-react";
import { useDragScroll, useDragScrollHorizontal } from "@/hooks/useDragScroll";
import { VideoPlayerSheet } from "@/components/VideoPlayerSheet";
import { PracticeQuizSheet } from "@/components/PracticeQuizSheet";

const subjects = [
  { id: 1, name: "Microbiology", color: "bg-purple-600" },
  { id: 2, name: "Chemistry", color: "bg-blue-500" },
  { id: 3, name: "Biology", color: "bg-green-500" },
];

const videoTiles = [
  { id: 1, title: "Introduction to Microbiology", author: "Jason Amores", duration: "12:34", gradient: "from-purple-400 to-pink-300" },
  { id: 2, title: "Gram Staining Techniques", author: "Dr. Emily Park", duration: "08:22", gradient: "from-blue-400 to-cyan-300" },
  { id: 3, title: "Antibiotic Resistance", author: "Dr. Lisa Wong", duration: "15:47", gradient: "from-green-400 to-teal-300" },
  { id: 4, title: "Immune System Response", author: "Dr. Rachel Kim", duration: "11:05", gradient: "from-orange-400 to-amber-300" },
  { id: 5, title: "Bacterial Growth Phases", author: "Dr. Mike Chen", duration: "09:18", gradient: "from-indigo-400 to-purple-300" },
];

const practiceTiles = [
  { id: 1, title: "Cell Structure Quiz", questions: 15, difficulty: "Easy", color: "bg-emerald-500" },
  { id: 2, title: "Bacterial Identification", questions: 20, difficulty: "Medium", color: "bg-amber-500" },
  { id: 3, title: "Virology Concepts", questions: 12, difficulty: "Hard", color: "bg-rose-500" },
  { id: 4, title: "Antibiotic Mechanisms", questions: 18, difficulty: "Medium", color: "bg-blue-500" },
  { id: 5, title: "Immune Response", questions: 10, difficulty: "Easy", color: "bg-violet-500" },
];

const chapters = [
  { id: 1, title: "Ch. 1 - Introduction to Microbiology" },
  { id: 2, title: "Ch. 2 - Cell Structure and Function" },
  { id: 3, title: "Ch. 3 - Bacterial Genetics" },
  { id: 4, title: "Ch. 4 - Microbial Metabolism" },
  { id: 5, title: "Ch. 5 - Microbial Growth" },
  { id: 6, title: "Ch. 6 - Viruses and Prions" },
  { id: 7, title: "Ch. 7 - Control of Microbial Growth" },
  { id: 8, title: "Ch. 8 - Antimicrobial Drugs" },
];

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [selectedChapter, setSelectedChapter] = useState(chapters[0]);
  const [isChapterDropdownOpen, setIsChapterDropdownOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<typeof videoTiles[0] | null>(null);
  const [selectedQuiz, setSelectedQuiz] = useState<typeof practiceTiles[0] | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Drag scroll refs
  const mainScrollRef = useDragScroll<HTMLElement>();
  const subjectsScrollRef = useDragScrollHorizontal<HTMLDivElement>();
  const videosScrollRef = useDragScrollHorizontal<HTMLDivElement>();
  const practiceScrollRef = useDragScrollHorizontal<HTMLDivElement>();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsChapterDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card hover:bg-accent transition-colors"
            >
              <div className={`w-8 h-8 ${subject.color} rounded-lg flex items-center justify-center`}>
                <span className="text-white text-xs font-bold">
                  {subject.name.charAt(0)}
                </span>
              </div>
              <span className="text-sm font-medium text-foreground">{subject.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Your eTextbook */}
      <section className="px-4 py-2">
        <div className="mb-3">
          <h2 className="text-lg font-bold text-foreground">Textbook</h2>
        </div>
        <div className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
          <div className="w-16 h-20 bg-purple-700 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold text-center px-1">MICRO<br/>BIOLOGY</span>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground leading-snug">Microbiology with Diseases by Body System, 5th edition</p>
          </div>
        </div>
      </section>

      {/* Related Videos and Practice */}
      <section ref={mainScrollRef} className="px-4 py-4 flex-1 overflow-y-auto scrollbar-hide">
        {/* Topic Header */}
        <h2 className="text-lg font-bold text-foreground mb-3">{selectedChapter.title}</h2>
        
        <p className="text-sm text-muted-foreground mb-4">Related videos and practice</p>
        
        {/* Chapter/Topic Selector */}
        <div className="relative mb-5" ref={dropdownRef}>
          <button 
            onClick={() => setIsChapterDropdownOpen(!isChapterDropdownOpen)}
            className="w-full bg-card border border-border rounded-xl p-3 flex items-center justify-between"
          >
            <span className="text-sm font-medium text-foreground">{selectedChapter.title}</span>
            <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${isChapterDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {isChapterDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
              <ul className="py-1 max-h-64 overflow-y-auto">
                {chapters.map((chapter) => (
                  <li key={chapter.id}>
                    <button
                      onClick={() => {
                        setSelectedChapter(chapter);
                        setIsChapterDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-3 text-left flex items-center justify-between hover:bg-accent transition-colors ${
                        selectedChapter.id === chapter.id ? 'bg-accent' : ''
                      }`}
                    >
                      <span className="font-medium text-foreground text-sm">{chapter.title}</span>
                      {selectedChapter.id === chapter.id && (
                        <Check className="w-4 h-4 text-primary" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Videos Section */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <Video className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-foreground text-sm">Videos</h3>
            <span className="text-xs text-muted-foreground">({videoTiles.length})</span>
          </div>
          <div className="-mx-4 px-4">
            <div ref={videosScrollRef} className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide items-start pr-4">
              {videoTiles.map((tile) => (
                <button 
                  key={tile.id} 
                  className="flex-shrink-0 w-44 text-left active:scale-[0.98] transition-transform"
                  onClick={() => setSelectedVideo(tile)}
                >
                  <div className={`relative rounded-xl overflow-hidden bg-gradient-to-br ${tile.gradient} h-28`}>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                        <Play className="w-6 h-6 text-foreground ml-1" fill="currentColor" />
                      </div>
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                      {tile.duration}
                    </div>
                  </div>
                  <div className="flex items-start gap-2 mt-2">
                    <div className="w-7 h-7 bg-amber-600 rounded-full flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-foreground text-xs leading-tight">{tile.title}</p>
                      <p className="text-muted-foreground text-xs">By {tile.author}</p>
                    </div>
                  </div>
                </button>
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
              {practiceTiles.map((tile) => (
                <button 
                  key={tile.id} 
                  className="flex-shrink-0 w-44 text-left active:scale-[0.98] transition-transform"
                  onClick={() => setSelectedQuiz(tile)}
                >
                  <div className={`rounded-xl overflow-hidden ${tile.color} h-28 p-3 flex flex-col justify-between`}>
                    <div>
                      <p className="text-white font-semibold text-sm leading-tight">{tile.title}</p>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-white/80 text-xs">{tile.questions} questions</span>
                      <span className="text-white text-xs font-medium bg-white/20 px-2 py-0.5 rounded-full">
                        {tile.difficulty}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="font-medium text-foreground text-xs">Start quiz</p>
                    <p className="text-muted-foreground text-xs">~{Math.ceil(tile.questions * 1.5)} min</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Navigation */}
      <nav className="bg-card border-t border-border px-2 pt-2 pb-safe sticky bottom-0">
        <div className="flex justify-around items-center">
          {[
            { id: "home", icon: Home, label: "Home" },
            { id: "library", icon: BookOpen, label: "Library" },
            { id: "study", icon: Video, label: "Study" },
            { id: "jobs", icon: Briefcase, label: "Job Skills" },
            { id: "account", icon: User, label: "Account" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors active:scale-95 ${
                activeTab === item.id
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <item.icon className="w-6 h-6" fill={activeTab === item.id ? "currentColor" : "none"} />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
      {/* Video Player Sheet */}
      <VideoPlayerSheet 
        video={selectedVideo}
        videos={videoTiles}
        chapter={selectedChapter}
        isOpen={!!selectedVideo}
        onClose={() => setSelectedVideo(null)}
        onVideoSelect={setSelectedVideo}
      />

      {/* Practice Quiz Sheet */}
      <PracticeQuizSheet 
        quiz={selectedQuiz}
        isOpen={!!selectedQuiz}
        onClose={() => setSelectedQuiz(null)}
      />
    </div>
  );
};

export default Index;
