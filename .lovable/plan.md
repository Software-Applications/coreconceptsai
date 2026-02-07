
# Fix Trending Topics Subject Filtering

## Problem
The Trending Concepts section on the home page shows topics from all subjects mixed together. For example, when viewing Biology, you may see Chemistry or Microbiology topics in the carousel.

## Root Cause
The `useTrendingTopics` hook fetches trending topics globally across all subjects, and they're passed directly to the `CoreConceptsHub` component without filtering by the currently selected subject.

## Solution
Filter the trending topics by the selected subject's name before passing them to `CoreConceptsHub`. This keeps the global trending data available for other features (like the "Trending" filter in the topic selection sheet) while showing subject-specific content in the home carousel.

---

## Implementation

### File: `src/pages/Index.tsx`

**Change 1: Add filtered trending topics**

Create a memoized filtered version of trending topics based on the selected subject:

```typescript
// After line 140 (after trendingTopicIds)
const subjectTrendingTopics = useMemo(() => 
  selectedSubject 
    ? trendingTopics.filter(t => t.subject_name === selectedSubject.name)
    : [],
  [selectedSubject?.name, trendingTopics]
);
```

**Change 2: Update CoreConceptsHub props**

Pass the filtered list instead of the global list (around line 296):

```diff
  <CoreConceptsHub
    ...
-   trendingTopics={trendingTopics}
+   trendingTopics={subjectTrendingTopics}
    trendingLoading={trendingLoading}
    ...
  />
```

---

## Technical Notes

- The filtering uses `subject_name` from the trending topic (which comes from the `subjects` table via the join) and compares it to `selectedSubject.name`
- The global `trendingTopics` array is still used for `trendingTopicIds` (line 137-140), which is passed to `TopicSelectionSheet` for the cross-subject "Trending" filter functionality
- The `useMemo` ensures the filtering only runs when the subject or trending topics change

## Result
Users will see only trending topics from their currently selected subject in the Trending Concepts carousel.
