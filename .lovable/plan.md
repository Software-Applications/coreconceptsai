

# Plan: Unified Core Concepts AI Hub

## Overview

Combine the Core Concepts AI sticky bar and Pinned Cards into a single cohesive component called `CoreConceptsHub`. This creates a clear information hierarchy where pinned cards are visually connected to their source feature.

---

## Visual Design

### Collapsed State (Default)
```text
┌─────────────────────────────────────────────────────────────┐
│ 🎧  Core Concepts AI  [3 new]         📌 2 saved     →     │
└─────────────────────────────────────────────────────────────┘
```

### Expanded State (Pinned Cards Visible)
```text
┌─────────────────────────────────────────────────────────────┐
│ 🎧  Core Concepts AI  [3 new]         📌 2 saved     ∨     │
├─────────────────────────────────────────────────────────────┤
│  ┌────────┐  ┌────────┐  ┌────────┐                        │
│  │ Card 1 │  │ Card 2 │  │ Card 3 │  ···                   │
│  └────────┘  └────────┘  └────────┘                        │
│                                            See All →        │
└─────────────────────────────────────────────────────────────┘
```

### Empty Pinned Cards State
```text
┌─────────────────────────────────────────────────────────────┐
│ 🎧  Core Concepts AI  [3 new]                        →     │
└─────────────────────────────────────────────────────────────┘
```
(No pinned indicator shown when empty, cleaner look)

---

## Component Behavior

| Interaction | Action |
|-------------|--------|
| Tap main bar (left side) | Opens Topic Selection Sheet |
| Tap pinned badge/count | Toggles pinned cards section |
| Tap a pinned card | Opens ExpandedCardModal |
| Tap "See All" | Opens ReviewBoard |
| Swipe horizontal | Scrolls through pinned cards |

---

## Implementation Details

### 1. Create New Component: `CoreConceptsHub.tsx`

A unified component that contains:
- **Header bar** (sticky): Headphones icon, title with AI badge, unlistened count, pinned count badge, expand/collapse chevron
- **Collapsible pinned cards section**: Horizontal scroll of preview cards with "See All" link
- Uses Radix `Collapsible` for smooth expand/collapse animation

**Props interface**:
```tsx
interface CoreConceptsHubProps {
  onOpenTopics: () => void;           // Opens Topic Selection
  onOpenReviewBoard: () => void;      // Opens full Review Board
  onCardClick: (card: PinnedCard) => void;  // Opens expanded modal
  pinnedCards: PinnedCard[];          // Cards for current subject
  unlistenedCount: number;            // Badge count for new topics
}
```

**Key design decisions**:
- Sticky positioning with `sticky top-0 z-20`
- Gradient background matching current style
- Pinned count only shows when cards exist
- Chevron rotates on expand/collapse
- Horizontal scroll for pinned cards with snap behavior
- Background blur + opacity for readability over content

### 2. Update `src/pages/Index.tsx`

**Remove**:
- The `CoreConceptsStickyBar` component usage (lines 260-264)
- The entire "My Pinned Cards Section" block (lines 266-327)
- `isPinnedCardsOpen` state (can be moved into the new component)

**Add**:
- Import `CoreConceptsHub`
- Single `<CoreConceptsHub>` component in place of the removed sections
- Pass handlers for topic selection, review board, and card expansion

---

## Technical Changes

### File 1: `src/components/CoreConceptsHub.tsx` (NEW)

```tsx
import { useState, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { Headphones, ChevronDown, Bookmark, ChevronRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useHaptics } from '@/hooks/useHaptics';
import { springTransition } from '@/lib/motionVariants';
import { AIBadge } from './AIBadge';
import { PinnedCardPreview } from './PinnedCardPreview';
import { useDragScrollHorizontal } from '@/hooks/useDragScroll';
import type { PinnedCard } from '@/data/dailyDownloadData';

interface CoreConceptsHubProps {
  onOpenTopics: () => void;
  onOpenReviewBoard: () => void;
  onCardClick: (card: PinnedCard) => void;
  pinnedCards: PinnedCard[];
  unlistenedCount: number;
}

export const CoreConceptsHub = ({
  onOpenTopics,
  onOpenReviewBoard,
  onCardClick,
  pinnedCards,
  unlistenedCount
}: CoreConceptsHubProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { mediumTap, lightTap } = useHaptics();
  const scrollRef = useRef<HTMLDivElement>(null);
  useDragScrollHorizontal(scrollRef);
  
  const hasPinnedCards = pinnedCards.length > 0;

  const handleMainClick = () => {
    mediumTap();
    onOpenTopics();
  };

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    lightTap();
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="sticky top-0 z-20 -mx-4 px-4 bg-background/95 backdrop-blur-sm">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        {/* Main Header Bar */}
        <div className="py-1.5">
          <motion.div
            className="w-full px-3 py-2.5 rounded-xl bg-gradient-to-r from-primary/15 via-primary/10 to-primary/5 border border-primary/20"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springTransition}
          >
            <div className="flex items-center gap-3">
              {/* Left: Core Concepts button */}
              <button
                onClick={handleMainClick}
                className="flex items-center gap-3 flex-1 min-w-0 text-left"
              >
                {/* Icon with unlistened badge */}
                <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 relative">
                  <Headphones className="w-5 h-5 text-primary" />
                  <AnimatePresence>
                    {unlistenedCount > 0 && (
                      <motion.div
                        className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                      >
                        {unlistenedCount}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Title */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    Core Concepts <AIBadge size="sm" />
                  </h3>
                  <p className="text-[11px] text-muted-foreground truncate">
                    AI explanations of tough topics
                  </p>
                </div>
              </button>

              {/* Right: Pinned badge + expand toggle */}
              {hasPinnedCards ? (
                <CollapsibleTrigger asChild>
                  <button
                    onClick={handleToggleExpand}
                    className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-primary/10 transition-colors"
                  >
                    <Bookmark className="w-4 h-4 text-primary" />
                    <span className="text-xs font-medium text-primary">
                      {pinnedCards.length}
                    </span>
                    <ChevronDown 
                      className="w-4 h-4 text-muted-foreground transition-transform duration-200" 
                      style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    />
                  </button>
                </CollapsibleTrigger>
              ) : (
                <ChevronRight 
                  className="w-4 h-4 text-muted-foreground flex-shrink-0" 
                  onClick={handleMainClick}
                />
              )}
            </div>
          </motion.div>
        </div>

        {/* Expandable Pinned Cards Section */}
        <CollapsibleContent className="data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up overflow-hidden data-[state=open]:overflow-visible">
          <div className="pb-2">
            {/* Horizontal scroll of cards */}
            <div
              ref={scrollRef}
              data-drag-scroll="x"
              className="flex gap-3 overflow-x-auto pt-2 pb-4 scrollbar-hide items-stretch snap-x snap-mandatory overscroll-x-contain select-none"
              style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x' }}
            >
              {pinnedCards.slice(0, 5).map((card) => (
                <PinnedCardPreview
                  key={card.id}
                  card={card}
                  onClick={() => onCardClick(card)}
                />
              ))}
            </div>
            
            {/* See All link */}
            {pinnedCards.length > 0 && (
              <div className="flex justify-end">
                <button
                  onClick={onOpenReviewBoard}
                  className="flex items-center gap-1 text-xs text-primary font-medium hover:underline"
                >
                  See All
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
```

### File 2: `src/pages/Index.tsx`

**Changes**:

1. Update imports:
   - Remove: `CoreConceptsStickyBar`
   - Add: `CoreConceptsHub`

2. Remove state (line 49):
   ```tsx
   // DELETE: const [isPinnedCardsOpen, setIsPinnedCardsOpen] = useState(false);
   ```

3. Replace Core Concepts + Pinned Cards sections (lines 260-327) with:
   ```tsx
   {/* Core Concepts AI Hub (with integrated pinned cards) */}
   <CoreConceptsHub
     onOpenTopics={() => setShowTopicSelection(true)}
     onOpenReviewBoard={() => setShowReviewBoard(true)}
     onCardClick={setExpandedPinnedCard}
     pinnedCards={subjectPinnedCards}
     unlistenedCount={unlistenedCount}
   />
   ```

4. Optional cleanup: Remove `CoreConceptsStickyBar.tsx` file after migration

---

## Files Summary

| File | Action |
|------|--------|
| `src/components/CoreConceptsHub.tsx` | CREATE - New unified component |
| `src/pages/Index.tsx` | EDIT - Replace separate components with hub |
| `src/components/CoreConceptsStickyBar.tsx` | DELETE (optional cleanup) |

---

## Benefits of This Approach

1. **Clear Information Hierarchy**: Pinned cards are visually nested under their source feature
2. **Reduced Cognitive Load**: One component to understand instead of two separate sections  
3. **Space Efficient**: Collapsed by default, only expands when user has pinned cards and wants to see them
4. **Consistent Sticky Behavior**: Both the header and expanded cards are part of the same sticky container
5. **Better Empty State**: No pinned badge shown when empty, reducing visual noise
6. **Discoverable**: Users see the bookmark count and can expand to preview cards

---

## Testing Checklist

1. Verify the hub appears below the textbook container
2. Tap the main bar → Topic Selection opens
3. Tap the pinned badge → Cards section expands/collapses
4. Tap a pinned card → ExpandedCardModal opens
5. Tap "See All" → ReviewBoard opens
6. Horizontal scroll works on pinned cards
7. Sticky behavior works while scrolling
8. Empty state shows no pinned badge (just chevron right)
9. Badge counts update correctly when listening/pinning

