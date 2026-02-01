import { motion } from 'framer-motion';
import { Target, Lightbulb, Search, Loader2 } from 'lucide-react';
import type { SearchResults, ScoredTopic } from '@/lib/topicSearch';
import { TopicCard } from './TopicCard';
import { Button } from '@/components/ui/button';

interface SearchResultsSectionProps {
  results: SearchResults;
  onSelectTopic: (topic: ScoredTopic['topic']) => void;
  isListened?: (topicId: string) => boolean;
  hasProgress?: (topicId: string) => boolean;
  highlightQuery: string;
  onRequestTopic?: (query: string) => void;
  isRequestingTopic?: boolean;
}

export const SearchResultsSection = ({
  results,
  onSelectTopic,
  isListened,
  hasProgress,
  highlightQuery,
  onRequestTopic,
  isRequestingTopic,
}: SearchResultsSectionProps) => {
  const { directHits, relatedTopics } = results;
  const hasDirectHits = directHits.length > 0;
  const hasRelated = relatedTopics.length > 0;
  const hasAnyResults = hasDirectHits || hasRelated;

  const displayQuery = results.query.length > 30 
    ? `${results.query.slice(0, 30)}...` 
    : results.query;

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

        {/* Request Topic Section */}
        {onRequestTopic && results.query.trim().length >= 2 && (
          <>
            <div className="flex items-center gap-3 w-full max-w-[200px] mt-5 mb-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onRequestTopic(results.query)}
              disabled={isRequestingTopic}
              className="gap-2"
            >
              {isRequestingTopic ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Lightbulb className="w-4 h-4" />
              )}
              Request "<span className="text-primary font-medium">{displayQuery}</span>"
            </Button>

            <p className="text-xs text-muted-foreground/60 mt-2">
              We'll add it to our content queue
            </p>
          </>
        )}
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
          <div className="flex items-center gap-2 px-1 py-1 bg-primary/5 rounded-lg border border-primary/20">
            <Target className="w-4 h-4 text-primary ml-2" />
            <h3 className="text-sm font-semibold text-primary">
              Direct Hits
            </h3>
            <span className="text-xs text-primary-foreground bg-primary px-2 py-0.5 rounded-full">
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

      {/* Divider between sections */}
      {hasDirectHits && hasRelated && (
        <div className="flex items-center gap-3 py-2">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">related</span>
          <div className="flex-1 h-px bg-border" />
        </div>
      )}

      {/* Related Topics Section */}
      {hasRelated && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1 py-1 bg-warning/5 rounded-lg border border-warning/20">
            <Lightbulb className="w-4 h-4 text-warning ml-2" />
            <h3 className="text-sm font-semibold text-warning">
              You might also be interested in
            </h3>
            <span className="text-xs text-warning-foreground bg-warning px-2 py-0.5 rounded-full">
              {relatedTopics.length}
            </span>
          </div>
          <div className="space-y-2 opacity-90">
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

      {/* Only related topics, no direct hits - show request button */}
      {!hasDirectHits && hasRelated && onRequestTopic && results.query.trim().length >= 2 && (
        <div className="mt-6 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center mb-3">
            No exact matches found. Want us to add this topic?
          </p>
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRequestTopic(results.query)}
              disabled={isRequestingTopic}
              className="gap-2"
            >
              {isRequestingTopic ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Lightbulb className="w-4 h-4" />
              )}
              Request "<span className="text-primary font-medium">{displayQuery}</span>"
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
};
