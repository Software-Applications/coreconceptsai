import { X, Play, Pause, Expand } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { useDragScroll, useDragScrollHorizontal } from "@/hooks/useDragScroll";
import { useSwipeToDismiss } from "@/hooks/useSwipeToDismiss";
import { useHaptics } from "@/hooks/useHaptics";
import { springTransition } from "@/lib/motionVariants";
import { SwipeHintHandle } from "./SwipeHintHandle";
import type { VideoTile } from "@/data/courseData";
import type { Chapter } from "@/hooks/useChapters";

interface VideoPlayerSheetProps {
  video: VideoTile | null;
  videos: VideoTile[];
  chapter: Chapter | null;
  isOpen: boolean;
  onClose: () => void;
  onVideoSelect: (video: VideoTile) => void;
  onVideoWatched?: (videoId: number) => void;
}

export function VideoPlayerSheet({ video, videos, chapter, isOpen, onClose, onVideoSelect, onVideoWatched }: VideoPlayerSheetProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isKeyPointsExpanded, setIsKeyPointsExpanded] = useState(false);
  const contentRef = useDragScroll<HTMLDivElement>();
  const upNextRef = useDragScrollHorizontal<HTMLDivElement>();
  const { lightTap } = useHaptics();
  
  const { dragProps, backdropOpacity } = useSwipeToDismiss({
    onDismiss: onClose,
    threshold: 120,
  });

  if (!isOpen || !video) return null;

  const upNextVideos = videos.filter(v => v.id !== video.id);

  return (
    <motion.div 
      className="absolute inset-0 z-50 flex flex-col bg-background"
      initial={{ opacity: 0, y: '100%' }}
      animate={{ opacity: backdropOpacity, y: 0 }}
      exit={{ opacity: 0, y: '100%' }}
      transition={springTransition}
      {...dragProps}
    >
      {/* Drag Handle with swipe hint */}
      <SwipeHintHandle direction="down" />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 pt-8 border-b border-border">
        <button onClick={() => { lightTap(); onClose(); }} className="p-2 -ml-2 active:scale-95">
          <X className="w-6 h-6 text-foreground" />
        </button>
        <div className="flex-1 mx-4 text-center">
          <h2 className="font-semibold text-foreground text-sm truncate">
            {chapter?.title || "Video"}
          </h2>
          <p className="text-xs text-muted-foreground">Now Playing</p>
        </div>
        <div className="w-10" />
      </div>

      {/* Scrollable Content */}
      <div ref={contentRef} className="flex-1 overflow-y-auto scrollbar-hide touch-pan-y">
        {/* Video Display */}
        <div className="w-full aspect-video relative">
          <img 
            src={video.thumbnail} 
            alt={video.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute inset-0 flex items-center justify-center">
            <button 
              onClick={() => {
                setIsPlaying(!isPlaying);
                // Mark as watched when user plays the video
                if (!isPlaying && video && onVideoWatched) {
                  onVideoWatched(video.id);
                }
              }}
              className="w-20 h-20 bg-white/90 rounded-full flex items-center justify-center shadow-xl active:scale-95 pl-1"
            >
              {isPlaying ? (
                <Pause className="w-10 h-10 text-foreground -ml-1" fill="currentColor" />
              ) : (
                <Play className="w-10 h-10 text-foreground" fill="currentColor" />
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
        {/* Key Points */}
        {isKeyPointsExpanded && (
          <div 
            className="absolute inset-0 z-50 bg-black/60" 
            onClick={() => setIsKeyPointsExpanded(false)} 
          />
        )}
        <div className={`bg-card border border-border rounded-xl p-4 transition-all ${
          isKeyPointsExpanded 
            ? 'absolute inset-[10%] z-50 overflow-y-auto shadow-2xl' 
            : 'mx-4 mb-4 min-h-[315px]'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-foreground text-sm">Key Points</h3>
            <button 
              onClick={() => setIsKeyPointsExpanded(!isKeyPointsExpanded)}
              className="p-1.5 hover:bg-muted rounded-lg transition-colors active:scale-95"
            >
              <Expand className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Core concepts and definitions</li>
            <li>• Practical applications</li>
            <li>• Common exam questions</li>
            {isKeyPointsExpanded && (
              <>
                <li>• Key terminology and vocabulary</li>
                <li>• Important diagrams and visuals</li>
                <li>• Study tips and mnemonics</li>
                <li>• Related topics to explore</li>
              </>
            )}
          </ul>
        </div>

        {/* Up Next */}
        {upNextVideos.length > 0 && (
          <div className="py-4 border-t border-border">
            <h3 className="font-semibold text-foreground text-sm mb-3 px-4">Up Next</h3>
            <div className="px-4">
              <div ref={upNextRef} className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide touch-pan-x">
                {upNextVideos.map((nextVideo) => (
                  <div 
                    key={nextVideo.id}
                    onClick={() => {
                      setProgress(0);
                      setIsPlaying(false);
                      onVideoSelect(nextVideo);
                    }}
                    className="flex-shrink-0 w-36 text-left cursor-pointer active:scale-[0.98] transition-transform"
                  >
                    <div className="relative rounded-xl overflow-hidden h-20">
                      <img 
                        src={nextVideo.thumbnail} 
                        alt={nextVideo.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/20" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-lg pl-0.5">
                          <Play className="w-4 h-4 text-foreground" fill="currentColor" />
                        </div>
                      </div>
                      <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                        {nextVideo.duration}
                      </div>
                    </div>
                    <p className="font-medium text-foreground text-xs leading-tight mt-2 line-clamp-2">{nextVideo.title}</p>
                    <p className="text-muted-foreground text-xs">{nextVideo.author}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
