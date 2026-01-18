import { Play } from "lucide-react";
import type { VideoTile } from "@/data/courseData";

interface VideoCardProps {
  video: VideoTile;
  onClick: () => void;
}

export function VideoCard({ video, onClick }: VideoCardProps) {
  return (
    <button 
      className="flex-shrink-0 w-44 text-left active:scale-[0.98] transition-all"
      onClick={onClick}
    >
      <div className={`relative rounded-xl overflow-hidden bg-gradient-to-br ${video.gradient} h-28 shadow-sm hover:shadow-md transition-shadow`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
            <Play className="w-6 h-6 text-foreground ml-1" fill="currentColor" />
          </div>
        </div>
        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
          {video.duration}
        </div>
      </div>
      <div className="flex items-start gap-2 mt-2">
        <div className="w-7 h-7 bg-amber-600 rounded-full flex-shrink-0" />
        <div className="min-w-0">
          <p className="font-medium text-foreground text-xs leading-tight">{video.title}</p>
          <p className="text-muted-foreground text-xs">By {video.author}</p>
        </div>
      </div>
    </button>
  );
}
