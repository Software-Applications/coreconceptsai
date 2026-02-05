
## Fix Exam Nudge Visibility and Color Styling

### Problem Analysis
1. **Missing nudge**: The exam nudge only appears when `examTopicsCount > 0`, but since the database has no exam data (RLS blocks unauthenticated queries), the hook returns `hasExam: false` and the count is 0
2. **Color too heavy**: The current styling uses `text-primary` (blue), which is visually heavy for a contextual nudge

### Solution

**1. Add fallback mock data for demo purposes**

Update `src/pages/Index.tsx` to provide fallback mock exam topics when no real exam data exists:

```typescript
// Get exam-related topics with fallback for demo
const { examTopicIds: realExamTopicIds, hasExam } = useExamTopicIds(selectedSubject?.id, subjectTopics);

// Fallback: if no exam data, use first 3 topics as mock exam topics for demo
const examTopicIds = hasExam 
  ? realExamTopicIds 
  : new Set(subjectTopics.slice(0, 3).map(t => t.id));
const examTopicsCount = examTopicIds.size;
```

**2. Fix nudge color styling**

Update `src/components/CoreConceptsHub.tsx` to use a warmer, less heavy color that aligns with the design system's semantic colors:

| Current | Proposed |
|---------|----------|
| `text-primary` (blue) | `text-amber-600 dark:text-amber-500` (warm amber) |

This uses amber/orange tones that:
- Match the fire emoji visually
- Create urgency without being as heavy as blue
- Follow the pattern of using warm colors for time-sensitive nudges

### Files to Change

| File | Change |
|------|--------|
| `src/pages/Index.tsx` | Add fallback mock exam topics when no real exam data exists |
| `src/components/CoreConceptsHub.tsx` | Change `text-primary` to `text-amber-600 dark:text-amber-500` for the exam nudge |

### Technical Details

**Index.tsx changes (around lines 124-127)**:
```typescript
// Current:
const { examTopicIds, hasExam } = useExamTopicIds(selectedSubject?.id, subjectTopics);
const examTopicsCount = hasExam ? examTopicIds.size : 0;

// New:
const { examTopicIds: realExamTopicIds, hasExam } = useExamTopicIds(selectedSubject?.id, subjectTopics);
const examTopicIds = hasExam 
  ? realExamTopicIds 
  : new Set(subjectTopics.slice(0, 3).map(t => t.id));
const examTopicsCount = examTopicIds.size;
```

**CoreConceptsHub.tsx changes (line 96)**:
```tsx
// Current:
<p className="text-[10px] font-medium text-primary mt-1">

// New:
<p className="text-[10px] font-medium text-amber-600 dark:text-amber-500 mt-1">
```

### Result
- Exam nudge will always appear with the first 3 topics highlighted (until real exam data is added)
- The amber color creates a warm, urgent feel that matches the fire emoji without being as heavy as blue
