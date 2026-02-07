
## Making Trending Topics Truly Data-Driven

### Current Implementation
The `useTrendingTopics.ts` hook currently determines trending status using hardcoded topic positions `[0, 1, 2, 4, 7]` instead of actual listen counts. While it does fetch `listen_count` from the `user_progress` table, this data is only used for display—the trending selection itself is position-based.

### Problem
- **Hardcoded positions**: The trending algorithm ignores real usage patterns
- **Not scalable**: New topics won't be recognized as trending until the codebase is updated
- **Data mismatch**: The listen_count is fetched but not used for ranking

### Solution Overview
Transform the trending topics selection to rank by **actual listen counts with recency bias**, ensuring the most-engaged topics float to the top while newer content isn't completely overlooked.

### Technical Implementation

**1. Update `useTrendingTopics.ts`** (Lines 21-94)
   - Remove the hardcoded `TRENDING_POSITIONS` constant
   - Fetch ALL topics with their listen counts from `user_progress`
   - Implement a ranking algorithm that:
     - Sorts topics by `listen_count` in descending order
     - Breaks ties by `created_at` (newer topics first)
     - Returns the top `limit` items (default 10)
   - This ensures topics with genuine engagement bubble up naturally

**Algorithm Logic:**
```
1. Fetch all topics with their subject/chapter info
2. For each topic, count completed entries in user_progress
3. Sort by: listen_count DESC, then created_at DESC
4. Return top N results (configurable limit)
```

**2. Key Changes**
   - Query modification: Aggregate `user_progress` data BEFORE filtering (not after)
   - New sort logic: `ORDER BY listen_count DESC, created_at DESC`
   - Return top results based on actual ranking, not position indices

**3. Benefits**
   - ✅ **Truly data-driven**: Real user engagement determines trending status
   - ✅ **Self-updating**: No code changes needed when new topics gain popularity
   - ✅ **Fair to new content**: Recent high-engagement topics still rank well
   - ✅ **Scalable**: Works with any number of topics
   - ✅ **Zero UX changes**: The carousel and drawer UI remain identical

**4. Edge Cases Handled**
   - No engagement yet: Newer topics still appear in trending (sorted by `created_at`)
   - Tie-breaking: When listen counts are equal, newer topics get priority
   - Empty data: Returns empty array gracefully (same as current behavior)

**5. No UI Changes Required**
   - `src/pages/Index.tsx`: Uses `trendingTopics` hook—no changes needed
   - `src/components/TopicSelectionSheet.tsx`: Sorting logic already in place—no changes needed
   - `src/components/CoreConceptsHub.tsx`: Renders trending topics as-is—no changes needed

### Testing Strategy
1. Verify the hook returns topics ordered by listen_count DESC
2. Confirm newer topics still appear when listen_count is 0
3. Check the trending carousel displays correctly
4. Validate the drawer "Trending" filter highlights correct topics
