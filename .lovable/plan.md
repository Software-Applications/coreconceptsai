

# UI Refinement Plan

This plan addresses three focused improvements to reduce visual clutter and enhance the hierarchy of the home screen.

---

## Summary of Changes

| Task | Component(s) Affected | Key Change |
|------|-----------------------|------------|
| 1. Streamline Video Card | `VideoCard.tsx`, `VideoPlayerSheet.tsx` | Remove author/pages from card, enhance detail page |
| 2. Consolidate Section Progress | `Index.tsx`, `ChapterDropdown.tsx` | Replace 2 pills with single progress bar in dropdown |
| 3. Refine Core Concepts Hub | `CoreConceptsHub.tsx` | Remove outer border, add soft background, reduce CTA size |

---

## Task 1: Streamline Video Card Metadata

### Current State
- Video cards display: title, duration, author avatar, author name, and textbook page references
- This creates visual clutter in the horizontal carousel

### Changes

**VideoCard.tsx**
- Remove the author name line (`By {video.author}`)
- Remove the textbook pages section (the `BookOpen` icon and `{video.textbookPages}`)
- Keep: thumbnail, play button overlay, duration badge, "Watched" badge, title, and author avatar (for visual continuity)

**VideoPlayerSheet.tsx**
- Already displays author name and textbook reference on the detail page - no changes needed there

### Visual Before/After

```text
BEFORE (Card):                    AFTER (Card):
┌─────────────────┐               ┌─────────────────┐
│   [Thumbnail]   │               │   [Thumbnail]   │
│     ▶ 12:34     │               │     ▶ 12:34     │
├─────────────────┤               ├─────────────────┤
│ 🧑 Title...     │               │ 🧑 Title...     │
│   By Author     │               └─────────────────┘
│   📖 pp. 1-28   │
└─────────────────┘
```

---

## Task 2: Consolidate Section Progress Indicators

### Current State
- Two separate pills below "Related Videos and Practice" header:
  - `"X of Y videos watched"` (primary color background)
  - `"X of Y practice sets done"` (accent color background)

### Changes

**Index.tsx**
- Remove the two progress pills from the section header
- Pass progress data to `ChapterDropdown`

**ChapterDropdown.tsx**
- Add a horizontal progress bar inside the dropdown button (below the chapter title)
- Use the combined progress: `(watchedVideos + completedPractice) / (totalVideos + totalPractice)`
- Style: neutral `bg-muted` background with `bg-primary` fill
- Add subtle text showing progress (e.g., "4 of 9 items completed")

### Visual Before/After

```text
BEFORE:
┌────────────────────────────────────────┐
│ Related Videos and Practice            │
│ [2/5 videos] [1/4 practice]            │
├────────────────────────────────────────┤
│ Ch. 1 - The Study of Life         ▾    │
└────────────────────────────────────────┘

AFTER:
┌────────────────────────────────────────┐
│ Related Videos and Practice            │
├────────────────────────────────────────┤
│ Ch. 1 - The Study of Life         ▾    │
│ ████████░░░░░░ 3 of 9 completed        │
└────────────────────────────────────────┘
```

---

## Task 3: Refine Visual Hierarchy of AI Components

### Current State
- CoreConceptsHub has an outer container with `border border-border`
- The Core Concepts button has navy-themed styling with an "Explore" pill CTA
- The "Explore" button uses `px-3 py-1.5` padding

### Changes

**CoreConceptsHub.tsx**

1. **Remove outer border, add soft background**
   - Change outer container from `bg-muted/40 border border-border` to `bg-violet-50/50 dark:bg-violet-950/20` (soft lavender)
   - Remove `border border-border`

2. **Reduce "Explore" CTA size**
   - Change from `px-3 py-1.5 text-xs` to `px-2 py-1 text-[11px]`
   - Remove chevron icon to further reduce visual weight

3. **Maintain AI sparkle as primary differentiator**
   - Keep the existing `AIBadge` component - it already uses the violet gradient with sparkles icon
   - The softer container background will make the AI badge stand out more

### Visual Before/After

```text
BEFORE:
┌─────────────────────────────────────────┐  ← border
│ 🎧 Core Concepts [AI] ━━━ [Explore ▸]   │
│     AI explanations...                   │
├─────────────────────────────────────────┤
│ 🔖 My Saved Cards (3)                   │
└─────────────────────────────────────────┘

AFTER:
╭───────────────────────────────────────╮  ← no border, soft lavender bg
│ 🎧 Core Concepts [AI] ━━━━ [Explore]  │  ← smaller CTA, no chevron
│     AI explanations...                 │
├───────────────────────────────────────┤
│ 🔖 My Saved Cards (3)                 │
╰───────────────────────────────────────╯
```

---

## Technical Details

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/VideoCard.tsx` | Remove lines 66-71 (author + textbook pages) |
| `src/pages/Index.tsx` | Remove progress pills (lines 298-305), pass progress props to ChapterDropdown |
| `src/components/ChapterDropdown.tsx` | Add progress bar with props for watched/completed counts |
| `src/components/CoreConceptsHub.tsx` | Update outer container styling, reduce Explore button size |

### New Props for ChapterDropdown

```typescript
interface ChapterDropdownProps {
  chapters: Chapter[];
  selectedChapter: Chapter | null;
  onSelectChapter: (chapter: Chapter) => void;
  // New props:
  watchedCount: number;
  totalVideos: number;
  completedPracticeCount: number;
  totalPractice: number;
}
```

### Progress Bar Calculation

```typescript
const totalItems = totalVideos + totalPractice;
const completedItems = watchedCount + completedPracticeCount;
const progressPercent = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
```

---

## Implementation Order

1. **VideoCard.tsx** - Remove metadata (quick, isolated change)
2. **CoreConceptsHub.tsx** - Restyle container and CTA (quick, isolated change)
3. **ChapterDropdown.tsx + Index.tsx** - Add progress bar and remove pills (requires prop changes)

