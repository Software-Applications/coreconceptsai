
# Remove Chapter Grouping from Core Concepts AI

## Overview

Simplify the Core Concepts AI bottom drawer by removing the chapter-based accordion organization and displaying all topics in a single flat, scrollable list.

## Current vs. New Layout

```text
CURRENT                           NEW
┌─────────────────────────┐       ┌─────────────────────────┐
│ Core Concepts AI        │       │ Core Concepts AI        │
│ ███████░░░ 7/10         │       │ ███████░░░ 7/10         │
│ [Search topics...]      │       │ [Search topics...]      │
├─────────────────────────┤       ├─────────────────────────┤
│ ▶ Ch. 1 - Intro (3)     │       │ ✓ Cell Structure        │
│ ▼ Ch. 2 - Cells (4)     │       │ ✓ Membrane Transport    │
│   ├─ Cell Structure ✓   │  →    │   DNA Replication       │
│   ├─ Membrane ✓         │       │ ↻ Protein Synthesis     │
│   └─ DNA Replication    │       │   Mitosis               │
│ ▶ Ch. 3 - Genetics (3)  │       │   Meiosis               │
└─────────────────────────┘       └─────────────────────────┘
```

## Changes Summary

| File | Change |
|------|--------|
| `TopicSelectionSheet.tsx` | Remove chapter accordion, display flat topic list |
| `ChapterAccordion.tsx` | No longer used (can be deleted) |
| `topic-selection/index.ts` | Remove ChapterAccordion export |

## Technical Details

### `src/components/TopicSelectionSheet.tsx`

**Remove:**
- `useChapters` hook import
- `expandedChapters` state and related logic
- `toggleChapter` function
- `groupedTopics` memo that groups by chapter
- Auto-expand chapter logic
- `ChapterAccordion` import and usage

**Keep:**
- Search functionality with `SearchResultsSection`
- Progress stats calculation
- Hero intro component
- Drag scroll behavior
- Topic request feature

**Add:**
- Simple sorted topics list using `TopicCard` directly
- Topics sorted by title alphabetically (or by their natural order)

### Updated content section (non-search mode):

```tsx
<motion.div
  key="topics"
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  className="space-y-2 pb-6"
>
  {topics.map((topic, index) => {
    const listened = isListened?.(topic.id) ?? false;
    const hasResume = !listened && (hasProgress?.(topic.id) ?? false);
    return (
      <TopicCard
        key={topic.id}
        topic={topic}
        listened={listened}
        hasResume={hasResume}
        index={index}
        onSelect={() => handleSelectTopic(topic)}
      />
    );
  })}
</motion.div>
```

### `src/components/topic-selection/index.ts`

Remove the `ChapterAccordion` export since it will no longer be used.

### `src/components/topic-selection/ChapterAccordion.tsx`

This file can be deleted as it's no longer needed.

## What Stays the Same

- Search functionality with direct hits and related topics
- Progress bar and completion stats in header
- Topic request feature for no-results state
- Hero intro for first-time users
- TopicCard component with listened/resume states
- Haptic feedback and animations
- Drag-to-scroll behavior
