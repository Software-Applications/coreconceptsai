import { X, Play, Pause, SkipBack, SkipForward, Volume2, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useDragScroll, useDragScrollHorizontal } from "@/hooks/useDragScroll";
import { useVideoProgress } from "@/hooks/useVideoProgress";

interface Video {
  id: number;
  title: string;
  author: string;
  duration: string;
  gradient: string;
}

interface VideoPlayerSheetProps {
  video: Video | null;
  videos: Video[];
  chapter: { id: number; title: string } | null;
  isOpen: boolean;
  onClose: () => void;
  onVideoSelect: (video: Video) => void;
}

export function VideoPlayerSheet({ video, videos, chapter, isOpen, onClose, onVideoSelect }: VideoPlayerSheetProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const contentRef = useDragScroll<HTMLDivElement>();
  const upNextRef = useDragScrollHorizontal<HTMLDivElement>();
  const { updateProgress, getWatchPercentage, isCompleted } = useVideoProgress();

  // Load saved progress when video changes
  useEffect(() => {
    if (video && chapter) {
      const savedProgress = getWatchPercentage(video.id, chapter.id);
      setProgress(savedProgress);
    }
  }, [video?.id, chapter?.id]);

  // Save progress when it changes
  useEffect(() => {
    if (video && chapter && progress > 0) {
      updateProgress(video.id, chapter.id, progress);
    }
  }, [progress, video?.id, chapter?.id]);

  if (!isOpen || !video || !chapter) return null;

  const upNextVideos = videos.filter(v => v.id !== video.id);
  const videoCompleted = isCompleted(video.id, chapter.id);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-border bg-gradient-to-b from-[hsl(var(--section-alt))] to-transparent">
        <button onClick={onClose} className="p-2 -ml-2 active:scale-95">
          <X className="w-6 h-6 text-foreground" />
        </button>
        <div className="flex-1 mx-4 text-center">
          <h2 className="font-semibold text-foreground text-sm truncate">
            {chapter?.title || "Video"}
          </h2>
          <p className="text-xs text-muted-foreground">Now Playing</p>
        </div>
        {videoCompleted && (
          <CheckCircle2 className="w-5 h-5 text-green-500" />
        )}
        {!videoCompleted && <div className="w-5" />}
      </div>

      {/* Scrollable Content */}
      <div ref={contentRef} className="flex-1 overflow-y-auto scrollbar-hide touch-pan-y">
        {/* Video Display */}
        <div className={`w-full aspect-video bg-gradient-to-br ${video.gradient} relative`}>
          <div className="absolute inset-0 flex items-center justify-center">
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-20 h-20 bg-white/90 rounded-full flex items-center justify-center shadow-xl active:scale-95"
            >
              {isPlaying ? (
                <Pause className="w-10 h-10 text-foreground" fill="currentColor" />
              ) : (
                <Play className="w-10 h-10 text-foreground ml-1" fill="currentColor" />
              )}
            </button>
          </div>
          {/* Progress indicator overlay */}
          {progress > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
              <div 
                className="h-full bg-primary"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>

        {/* Video Info */}
        <div className="px-4 py-5">
          <div className="flex items-start justify-between border-l-4 border-primary pl-4">
            <div>
              <h1 className="text-xl font-bold text-foreground mb-1">{video.title}</h1>
              <p className="text-muted-foreground text-sm">By {video.author}</p>
            </div>
            {videoCompleted && (
              <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded-full">
                Completed
              </span>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-4 mb-5">
          <div className="relative">
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>{Math.round(progress)}% watched</span>
            <span>{video.duration}</span>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center justify-center gap-8 py-5">
          <button className="p-3 active:scale-95">
            <SkipBack className="w-8 h-8 text-foreground" />
          </button>
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-16 h-16 bg-primary rounded-full flex items-center justify-center shadow-lg active:scale-95"
          >
            {isPlaying ? (
              <Pause className="w-8 h-8 text-primary-foreground" fill="currentColor" />
            ) : (
              <Play className="w-8 h-8 text-primary-foreground ml-1" fill="currentColor" />
            )}
          </button>
          <button className="p-3 active:scale-95">
            <SkipForward className="w-8 h-8 text-foreground" />
          </button>
        </div>

        {/* Volume */}
        <div className="flex items-center gap-3 px-8 py-5">
          <Volume2 className="w-5 h-5 text-muted-foreground" />
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-muted-foreground/50 rounded-full w-3/4" />
          </div>
        </div>

        {/* Key Points */}
        <div className="mx-4 mb-5 bg-gradient-to-br from-card to-[hsl(var(--section-alt))] border border-border rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-foreground text-sm mb-3 border-l-4 border-primary pl-3">Key Points</h3>
          <ul className="space-y-2.5 text-sm text-muted-foreground pl-4">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
              Core concepts and definitions
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
              Practical applications
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
              Common exam questions
            </li>
          </ul>
        </div>

        {/* Up Next */}
        {upNextVideos.length > 0 && (
          <div className="py-5 bg-[hsl(var(--section-alt))] mt-4">
            <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-4" />
            <h3 className="font-semibold text-foreground text-sm mb-4 px-4 border-l-4 border-primary pl-3 ml-4">Up Next</h3>
            <div className="px-4">
              <div ref={upNextRef} className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide touch-pan-x">
                {upNextVideos.map((nextVideo) => {
                  const nextVideoProgress = getWatchPercentage(nextVideo.id, chapter.id);
                  const nextVideoCompleted = isCompleted(nextVideo.id, chapter.id);
                  
                  return (
                    <div 
                      key={nextVideo.id}
                      onClick={() => {
                        setProgress(getWatchPercentage(nextVideo.id, chapter.id));
                        setIsPlaying(false);
                        onVideoSelect(nextVideo);
                      }}
                      className="flex-shrink-0 w-36 text-left cursor-pointer active:scale-[0.98] transition-transform"
                    >
                      <div className={`relative rounded-xl overflow-hidden bg-gradient-to-br ${nextVideo.gradient} h-20 shadow-md`}>
                        <div className="absolute inset-0 flex items-center justify-center">
                          {nextVideoCompleted ? (
                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                              <CheckCircle2 className="w-5 h-5 text-white" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                              <Play className="w-4 h-4 text-foreground ml-0.5" fill="currentColor" />
                            </div>
                          )}
                        </div>
                        <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                          {nextVideo.duration}
                        </div>
                        {/* Progress bar */}
                        {nextVideoProgress > 0 && !nextVideoCompleted && (
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
                            <div 
                              className="h-full bg-primary"
                              style={{ width: `${nextVideoProgress}%` }}
                            />
                          </div>
                        )}
                      </div>
                      <p className="font-medium text-foreground text-xs leading-tight mt-2 line-clamp-2">{nextVideo.title}</p>
                      <p className="text-muted-foreground text-xs mt-0.5">{nextVideo.author}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}