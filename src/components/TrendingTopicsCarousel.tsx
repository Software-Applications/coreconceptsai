import { TrendingUp } from 'lucide-react';
import { useTapVsDrag } from '@/hooks/useTapVsDrag';
import { useTrendingTopics, type TrendingTopic } from '@/hooks/useTrendingTopics';
import { TrendingTopicCard } from './TrendingTopicCard';
import { Skeleton } from '@/components/ui/skeleton';

interface TrendingTopicsCarouselProps {
  onSelectTopic: (topicId: string, chapterId: string) => void;
  isListened: (topicId: string) => boolean;
}

export const TrendingTopicsCarousel = ({
  onSelectTopic,
  isListened,
}: TrendingTopicsCarouselProps) => {
  const { scrollRef, handleClick } = useTapVsDrag<HTMLDivElement>();
  const { data: trendingTopics = [], isLoading } = useTrendingTopics(10);

  // Don't render if no topics available
  if (!isLoading && trendingTopics.length === 0) {
    return null;
  }

  return (
    <div className="py-3">
      {/* Section Header */}
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Trending Topics</h3>
      </div>

      {/* Carousel */}
      <div className="-mx-4 px-4">
        {isLoading ? (
          <div className="flex gap-3 overflow-x-auto scrollbar-hide">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="w-40 h-28 rounded-xl flex-shrink-0" />
            ))}
          </div>
        ) : (
          <div
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory overscroll-x-contain select-none pr-4"
            style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x' }}
          >
            {trendingTopics.map((topic) => (
              <TrendingTopicCard
                key={topic.id}
                topic={topic}
                isListened={isListened(topic.id)}
                onClick={handleClick(() => onSelectTopic(topic.id, topic.chapter_id))}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
