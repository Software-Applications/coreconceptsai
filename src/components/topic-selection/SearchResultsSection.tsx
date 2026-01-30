import { motion } from 'framer-motion';
import { Target, Lightbulb, Search } from 'lucide-react';
import type { SearchResults, ScoredTopic } from '@/lib/topicSearch';
import { TopicCard } from './TopicCard';

interface SearchResultsSectionProps {
  results: SearchResults;
  onSelectTopic: (topic: ScoredTopic['topic']) => void;
  isListened?: (topicId: string) => boolean;
  hasProgress?: (topicId: string) => boolean;
  highlightQuery: string;
}

export const SearchResultsSection = ({
  results,
  onSelectTopic,
  isListened,
  hasProgress,
  highlightQuery,
}: SearchResultsSectionProps) => {
  const { directHits, relatedTopics } = results;
  const hasDirectHits = directHits.length > 0;
  const hasRelated = relatedTopics.length > 0;
  const hasAnyResults = hasDirectHits || hasRelated;

  if (!hasAnyResults) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="flex flex-col items-center justify-center py-12 text-center"
      >
        <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
          <Search className="w-6 h-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">No topics found</p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          Try a different search term or browse by chapter
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-4 pb-6"
    >
      {/* Direct Hits Section */}
      {hasDirectHits && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <Target className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">
              Direct Hits
            </h3>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {directHits.length}
            </span>
          </div>
          <div className="space-y-2">
            {directHits.map((scoredTopic, index) => (
              <TopicCard
                key={scoredTopic.topic.id}
                topic={scoredTopic.topic}
                listened={isListened?.(scoredTopic.topic.id) ?? false}
                hasResume={hasProgress?.(scoredTopic.topic.id) ?? false}
                index={index}
                onSelect={() => onSelectTopic(scoredTopic.topic)}
                highlightQuery={highlightQuery}
              />
            ))}
          </div>
        </div>
      )}

      {/* Related Topics Section */}
      {hasRelated && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-foreground">
              You might also be interested in
            </h3>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {relatedTopics.length}
            </span>
          </div>
          <div className="space-y-2">
            {relatedTopics.map((scoredTopic, index) => (
              <TopicCard
                key={scoredTopic.topic.id}
                topic={scoredTopic.topic}
                listened={isListened?.(scoredTopic.topic.id) ?? false}
                hasResume={hasProgress?.(scoredTopic.topic.id) ?? false}
                index={index}
                onSelect={() => onSelectTopic(scoredTopic.topic)}
                highlightQuery={highlightQuery}
              />
            ))}
          </div>
        </div>
      )}

      {/* Only related topics, no direct hits */}
      {!hasDirectHits && hasRelated && (
        <p className="text-xs text-muted-foreground text-center mt-2">
          No exact matches found, showing related topics
        </p>
      )}
    </motion.div>
  );
};
