import { Play } from "lucide-react";
import { motion } from "framer-motion";
import type { VideoTile } from "@/data/courseData";
import { cardHover, cardTap, springTransition } from "@/lib/motionVariants";

interface VideoCardProps {
  video: VideoTile;
  onClick: () => void;
}

export function VideoCard({ video, onClick }: VideoCardProps) {
  return (
    <motion.button 
      className="flex-shrink-0 w-44 text-left"
      onClick={onClick}
      whileHover={cardHover}
      whileTap={cardTap}
      transition={springTransition}
    >
      <div className="relative rounded-xl overflow-hidden h-28 shadow-sm">
        <img 
          src={video.thumbnail} 
          alt={video.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/20" />
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
        </div>
      </div>
    </motion.button>
  );
}
