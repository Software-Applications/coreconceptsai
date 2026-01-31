import { forwardRef } from 'react';
import { Play, CheckCircle, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import type { VideoTile } from "@/data/courseData";
import { cardHover, cardTap, springTransition } from "@/lib/motionVariants";
import { useHaptics } from "@/hooks/useHaptics";

interface VideoCardProps {
  video: VideoTile;
  onClick: () => void;
  isWatched?: boolean;
}

export const VideoCard = forwardRef<HTMLDivElement, VideoCardProps>(
  ({ video, onClick, isWatched = false }, ref) => {
    const { lightTap } = useHaptics();

    const handleClick = () => {
      lightTap();
      onClick();
    };

    return (
      <div ref={ref} className="flex-shrink-0 w-44">
        <motion.button 
          className="w-full text-left"
          onClick={handleClick}
          whileHover={cardHover}
          whileTap={cardTap}
          transition={springTransition}
        >
          <div className="relative rounded-xl overflow-hidden h-28 shadow-sm">
            <img 
              src={video.thumbnail} 
              alt={video.title}
              className={`w-full h-full object-cover ${isWatched ? 'opacity-75' : ''}`}
            />
            <div className="absolute inset-0 bg-black/20" />
            {isWatched && (
              <div className="absolute top-2 left-2 flex items-center gap-1 bg-primary/90 text-primary-foreground text-xs px-2 py-1 rounded-full">
                <CheckCircle className="w-3 h-3" />
                <span>Watched</span>
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div 
                className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg pl-1"
                whileHover={{ scale: 1.1 }}
                transition={springTransition}
              >
                <Play className="w-6 h-6 text-foreground" fill="currentColor" />
              </motion.div>
            </div>
            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
              {video.duration}
            </div>
          </div>
          <div className="flex items-start gap-2 mt-2">
            <img 
              src={video.avatarUrl} 
              alt={video.author}
              className="w-7 h-7 rounded-full flex-shrink-0 object-cover"
            />
            <div className="min-w-0">
              <p className="font-medium text-foreground text-xs leading-tight">{video.title}</p>
              <p className="text-muted-foreground text-xs">By {video.author}</p>
              {video.textbookPages && (
                <p className="text-muted-foreground/70 text-xs flex items-center gap-1 mt-0.5">
                  <BookOpen className="w-3 h-3" />
                  {video.textbookPages}
                </p>
              )}
            </div>
          </div>
        </motion.button>
      </div>
    );
  }
);

VideoCard.displayName = 'VideoCard';
