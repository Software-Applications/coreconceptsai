

# Filter Trending Topics to Minimum 2 Plays

## Problem

Currently, `useTrendingTopics` returns all topics sorted by listen count, including those with 0 or 1 plays. Topics should only appear as "trending" if they have been played 2 or more times.

## Change

**File**: `src/hooks/useTrendingTopics.ts`, after the sort (line 97), add a filter before slicing:

```typescript
// Filter to only topics with 2+ listens
const filtered = trendingTopics.filter(t => t.listen_count >= 2);

return filtered.slice(0, limit);
```

This replaces `return trendingTopics.slice(0, limit);` on line 99.

## Impact

- Topics with 0 or 1 play will no longer appear in the Trending Concepts section
- If no topics meet the threshold, the section will be empty (and hidden automatically since `CoreConceptsHub` checks `trendingTopics.length > 0`)
- No other files need changes

