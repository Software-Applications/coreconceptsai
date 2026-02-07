

## Nest Trending Topics Under Core Concepts Hub

### Overview

Move the Trending Topics carousel inside `CoreConceptsHub` as a second collapsible accordion section, matching the "My Saved Cards" pattern. This creates a cleaner information hierarchy where all Core Concepts AI sub-features are grouped together.

### Visual Design

```text
Before:
┌──────────────────────────────────────┐
│ Core Concepts AI Hub                 │
│   └─ My Saved Cards (5)         ▼    │
│      [card] [card] [card] →          │
└──────────────────────────────────────┘
┌──────────────────────────────────────┐
│ 📈 Trending Topics                   │  ← Separate section
│   [card] [card] [card] →             │
└──────────────────────────────────────┘

After:
┌──────────────────────────────────────┐
│ Core Concepts AI Hub                 │
│   └─ My Saved Cards (5)         ▼    │
│      [card] [card] [card] →          │
│   └─ 📈 Trending Topics (10)    ▼    │  ← Nested under hub
│      [card] [card] [card] →          │
└──────────────────────────────────────┘
```

---

### Technical Implementation

#### Part 1: Update CoreConceptsHub Props

Add new props to receive trending data and handlers:

```typescript
interface CoreConceptsHubProps {
  // ... existing props
  trendingTopics: TrendingTopic[];
  trendingLoading: boolean;
  onSelectTrendingTopic: (topicId: string, chapterId: string) => void;
  isTopicListened: (topicId: string) => boolean;
}
```

#### Part 2: Add Trending Accordion State

Add a second accordion state with localStorage persistence:

```typescript
const [isTrendingExpanded, setIsTrendingExpanded] = useState(() => {
  const stored = localStorage.getItem('trending-topics-expanded');
  return stored !== null ? stored === 'true' : true;
});
```

#### Part 3: Add Trending Section UI

After the "My Saved Cards" section, add a matching collapsible section:

```text
Section Header Pattern:
┌────────────────────────────────────────────────────┐
│ 📈  Trending Topics  (10)                      ▼   │
└────────────────────────────────────────────────────┘
```

The section will include:
- `TrendingUp` icon (matching Saved Cards' `Bookmark` icon)
- "Trending Topics" label
- Count in parentheses: `(10)`
- Collapsible chevron with rotation animation

#### Part 4: Update Index.tsx

1. Fetch trending topics at the page level using `useTrendingTopics`
2. Pass trending data to `CoreConceptsHub` as props
3. Remove the standalone `<TrendingTopicsCarousel />` component

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/CoreConceptsHub.tsx` | Add trending section as second collapsible accordion |
| `src/pages/Index.tsx` | Move `useTrendingTopics` call here, pass data to CoreConceptsHub, remove TrendingTopicsCarousel |

### Files to Keep (No Changes)

| File | Reason |
|------|--------|
| `src/hooks/useTrendingTopics.ts` | Reuse existing hook |
| `src/components/TrendingTopicCard.tsx` | Reuse existing card component |
| `src/components/TrendingTopicsCarousel.tsx` | Keep file for potential future use (or delete later) |

---

### Expected Result

The Core Concepts Hub becomes a cohesive container with two collapsible sub-sections:

1. **My Saved Cards (5)** - User's pinned flashcards
2. **Trending Topics (10)** - Most-listened topics across all users

Both sections follow the same visual pattern:
- Muted icon + label + count
- Collapsible with chevron animation
- Horizontal scrolling card carousel when expanded
- Independent expand/collapse state persisted in localStorage

