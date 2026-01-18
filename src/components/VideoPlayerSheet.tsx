import { X, Play, Pause, SkipBack, SkipForward, Volume2 } from "lucide-react";
import { useState } from "react";

interface VideoPlayerSheetProps {
  video: {
    id: number;
    title: string;
    author: string;
    duration: string;
    gradient: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

export function VideoPlayerSheet({ video, isOpen, onClose }: VideoPlayerSheetProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  if (!isOpen || !video) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <button onClick={onClose} className="p-2 -ml-2 active:scale-95">
          <X className="w-6 h-6 text-foreground" />
        </button>
        <h2 className="font-semibold text-foreground text-sm truncate flex-1 mx-4 text-center">
          Now Playing
        </h2>
        <div className="w-10" />
      </div>

      {/* Video Player Area */}
      <div className="flex-1 flex flex-col">
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
        </div>

        {/* Video Info */}
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold text-foreground mb-1">{video.title}</h1>
          <p className="text-muted-foreground text-sm">By {video.author}</p>
        </div>

        {/* Progress Bar */}
        <div className="px-4 mb-4">
          <div className="relative">
            <div className="h-1 bg-muted rounded-full overflow-hidden">
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
            <span>0:00</span>
            <span>{video.duration}</span>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center justify-center gap-8 py-4">
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
        <div className="flex items-center gap-3 px-8 py-4">
          <Volume2 className="w-5 h-5 text-muted-foreground" />
          <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-muted-foreground/50 rounded-full w-3/4" />
          </div>
        </div>

        {/* Flashcard Summary */}
        <div className="mx-4 mt-auto mb-4 bg-card border border-border rounded-xl p-4">
          <h3 className="font-semibold text-foreground text-sm mb-2">Key Points</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Core concepts and definitions</li>
            <li>• Practical applications</li>
            <li>• Common exam questions</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
