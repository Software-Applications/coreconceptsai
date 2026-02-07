

# Fix Trending Topics Count and Order

## Problems Found

### Problem 1: Count shows "30" instead of filtered count

**Location**: `src/components/TopicSelectionSheet.tsx` line 577

**Root cause**: The heading displays `trendingTopicIds.size` which contains ALL trending topic IDs (global, 30 total), not the subject-filtered ones.

**Current code**:
```typescript
trendingFilterActive 
  ? `Trending Topics (${trendingTopicIds.size})`
```

**Fix**: Calculate a subject-filtered count by filtering the topics that are both trending AND belong to the current subject.

---

### Problem 2: Topics not ordered by popularity ranking

**Location**: `src/components/TopicSelectionSheet.tsx` lines 582-592

**Root cause**: The sort function only separates trending from non-trending topics, but does NOT preserve the popularity order. All trending topics are treated equally.

**Current code**:
```typescript
.sort((a, b) => {
  const aIsTrending = trendingTopicIds.has(a.id);
  const bIsTrending = trendingTopicIds.has(b.id);
  if (aIsTrending && !bIsTrending) return -1;
  if (!aIsTrending && bIsTrending) return 1;
  return 0; // Bug: doesn't sort by listen_count
})
```

**Fix**: Pass the full `trendingTopics` array (with `listen_count` data) to `TopicSelectionSheet` instead of just IDs. Then sort by that ranking order.

---

## Implementation Plan

### Step 1: Update Index.tsx props

Pass `subjectTrendingTopics` (which is already filtered by subject and properly ordered by listen_count) to `TopicSelectionSheet`:

```typescript
<TopicSelectionSheet
  ...
  trendingTopics={subjectTrendingTopics}  // New prop (ordered array)
  trendingTopicIds={trendingTopicIds}     // Keep for quick lookups
/>
```

### Step 2: Update TopicSelectionSheet.tsx interface

Add a new prop to receive the ordered trending topics:

```typescript
interface TopicSelectionSheetProps {
  ...
  trendingTopics?: TrendingTopic[];  // New: ordered array for display
  trendingTopicIds?: Set<string>;    // Keep for lookups
}
```

### Step 3: Fix the trending count display

Update line 577 to use the filtered length:

```typescript
trendingFilterActive 
  ? `Trending Topics (${trendingTopics?.length || 0})`
```

### Step 4: Fix the topic ordering

Replace the broken sort logic (lines 582-592) with proper ordering that uses the `trendingTopics` array order:

```typescript
// Create a map of topic ID -> rank for sorting
const trendingRankMap = useMemo(() => {
  const map = new Map<string, number>();
  trendingTopics?.forEach((t, index) => map.set(t.id, index));
  return map;
}, [trendingTopics]);

// In the render:
trendingFilterActive && allTopics.length > 0 
  ? [...allTopics]
      .filter(t => !currentSubjectId || t.subjectId === currentSubjectId)
      .sort((a, b) => {
        const aRank = trendingRankMap.get(a.id) ?? Infinity;
        const bRank = trendingRankMap.get(b.id) ?? Infinity;
        return aRank - bRank;
      })
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Index.tsx` | Add `trendingTopics={subjectTrendingTopics}` prop |
| `src/components/TopicSelectionSheet.tsx` | Add `trendingTopics` prop, fix count display, fix sort logic |

---

## Expected Result

After implementation:
- **Count**: When Biology is selected, the drawer heading will show "Trending Topics (5)" instead of "30"
- **Order**: Topics will appear in correct popularity order: Homeostatic Feedback (10), Signal Transduction (8), Hardy-Weinberg Equilibrium (6), The Calvin Cycle (4), Epigenetics (2)

