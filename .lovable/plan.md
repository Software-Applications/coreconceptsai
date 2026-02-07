
## Trending Topics Carousel on Home Page

### Overview

Add a horizontal "Trending Topics" carousel to the home page that highlights the most-listened Core Concepts. This provides quick discovery and encourages engagement with popular content.

### Design Decisions

**Data Source for "Trending"**

Since the `user_progress` table currently has no listen data (0 listens for all topics), we have two options:

1. **Real analytics**: Query `user_progress` grouped by `topic_id` with `completed = true` count
2. **Fallback**: Show first 8 topics from across all subjects as "Featured" until real data accumulates

The implementation will use real analytics with a fallback - showing aggregated listen counts when available, otherwise displaying a curated set of topics.

**Placement**

Position the carousel BELOW the `CoreConceptsHub` component but ABOVE the "Related Videos and Practice" section. This keeps all Core Concepts content grouped together.

```text
+----------------------------------+
| Header                           |
| Subject Chips                    |
+----------------------------------+
| Textbook Reference Card          |
+----------------------------------+
| Core Concepts AI Hub             |
|   (Saved Cards accordion)        |
+----------------------------------+
| Trending Topics Carousel   <- NEW|
+----------------------------------+
| ─────── separator ──────────     |
| Related Videos and Practice      |
|   Chapter Drawer                 |
|   Videos Section                 |
|   Practice Section               |
+----------------------------------+
```

**Visual Design**

- Section header: TrendingUp icon + "Trending Topics" title
- Horizontal scroll carousel matching existing Videos/Practice styling
- Card design: Compact topic card (similar to `PinnedCardPreview` sizing) with:
  - Topic title (primary)
  - Subject name badge (secondary)
  - Listen count indicator
  - "Listened" checkmark if user has completed

---

### Technical Implementation

#### Part 1: Create `useTrendingTopics` Hook

**File: `src/hooks/useTrendingTopics.ts`**

```typescript
// Fetches topics ranked by listen count across all subjects
// Joins topics with user_progress to get aggregate completion counts
// Returns top 10 topics with listen_count and subject_name
```

Query strategy:
```sql
SELECT 
  t.*,
  s.name as subject_name,
  COUNT(up.topic_id) as listen_count
FROM topics t
JOIN chapters c ON t.chapter_id = c.id
JOIN subjects s ON c.subject_id = s.id
LEFT JOIN user_progress up ON t.id = up.topic_id AND up.completed = true
GROUP BY t.id, s.name
ORDER BY listen_count DESC, t.created_at DESC
LIMIT 10
```

#### Part 2: Create `TrendingTopicCard` Component

**File: `src/components/TrendingTopicCard.tsx`**

Compact card designed for horizontal carousel:
- Fixed width (~160px) matching `PinnedCardPreview` sizing pattern
- Topic title (line-clamped to 2 lines)
- Subject badge (small colored chip)
- Listen count with headphones icon
- Checkmark overlay if listened
- Framer Motion hover/tap animations matching existing cards

#### Part 3: Create `TrendingTopicsCarousel` Component

**File: `src/components/TrendingTopicsCarousel.tsx`**

- Uses `useTapVsDrag` for scroll handling (matching existing patterns)
- Section header with `TrendingUp` icon
- Horizontal scrolling container with snap behavior
- Maps trending topics to `TrendingTopicCard` components
- Clicking a card opens that topic in `DailyDownloadPlayer`

#### Part 4: Integrate into Home Page

**File: `src/pages/Index.tsx`**

1. Import new components and hook
2. Add `TrendingTopicsCarousel` after `CoreConceptsHub` (around line 286)
3. Pass `onSelectTopic` handler to open the player
4. Pass `isListened` function for checkmark display

---

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useTrendingTopics.ts` | Create | Hook to fetch trending topics with listen counts |
| `src/components/TrendingTopicCard.tsx` | Create | Compact card component for carousel items |
| `src/components/TrendingTopicsCarousel.tsx` | Create | Carousel container with header and scroll behavior |
| `src/pages/Index.tsx` | Modify | Add carousel below CoreConceptsHub |

---

### Expected Result

```text
┌─────────────────────────────────────┐
│ 📈 Trending Topics                  │
├─────────────────────────────────────┤
│ ┌────────┐ ┌────────┐ ┌────────┐    │
│ │ ✓      │ │        │ │        │ →  │
│ │Topic A │ │Topic B │ │Topic C │    │
│ │Biology │ │Chem    │ │Micro   │    │
│ │🎧 24   │ │🎧 18   │ │🎧 12   │    │
│ └────────┘ └────────┘ └────────┘    │
└─────────────────────────────────────┘
```

### Edge Cases

- **No trending data**: Show loading skeleton, then fallback to first 8 topics
- **User has listened to all trending**: Cards show checkmarks but remain accessible for replay
- **Empty state**: Hide entire section if no topics exist (unlikely)
