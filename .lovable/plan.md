
# Plan: Restyle My Saved Cards Section

## Goal
Restyle "My Saved Cards" to match the Videos and Practice sections pattern, while maintaining a clear visual connection to the Core Concepts AI bar. Add an empty state for when no cards are pinned.

---

## Current vs Proposed Design

### Current Design
```text
┌─────────────────────────────────────────────────────────────────┐
│ 🎧  Core Concepts  [AI]                         [3 new]   →    │
├─────────────────────────────────────────────────────────────────┤
│ 📌  My Saved Cards                                  2     ▾    │  ← Both rows in same box
└─────────────────────────────────────────────────────────────────┘
```
**Problem:** Saved Cards looks cramped, doesn't match the rest of the UI pattern.

### Proposed Design
```text
┌─────────────────────────────────────────────────────────────────┐
│ 🎧  Core Concepts  [AI]                         [3 new]   →    │
└─────────────────────────────────────────────────────────────────┘
   │
   ├── 📌 My Saved Cards (2)                      See All →
   │   ┌────────┐  ┌────────┐  ┌────────┐
   │   │ Card 1 │  │ Card 2 │  │ Card 3 │  ···
   │   └────────┘  └────────┘  └────────┘
```
**Solution:** Saved Cards styled as a linked subsection, matching Videos/Practice pattern.

### Empty State
```text
┌─────────────────────────────────────────────────────────────────┐
│ 🎧  Core Concepts  [AI]                         [3 new]   →    │
└─────────────────────────────────────────────────────────────────┘
   │
   ├── 📌 My Saved Cards (0)
   │   ┌─────────────────────────────────────────────────────────┐
   │   │       📌                                                 │
   │   │    No saved cards yet                                   │
   │   │    Pin flashcards from Core Concepts to see them here   │
   │   └─────────────────────────────────────────────────────────┘
```

---

## Visual Link Design

To show the relationship between Core Concepts AI and My Saved Cards, I'll use:

1. **Connecting line**: A subtle vertical line from the Core Concepts bar down to the Saved Cards header
2. **Indentation**: The Saved Cards section is slightly indented to show hierarchy
3. **Consistent primary color**: Both use the primary color for icons
4. **Subtle background**: A very light primary tint behind the entire section

---

## Technical Changes

### File: `src/components/CoreConceptsHub.tsx`

**Structure:**

```text
┌── Sticky container ──────────────────────────────────────────────┐
│                                                                   │
│  ┌── Core Concepts Bar (gradient, rounded) ───────────────────┐  │
│  │ 🎧 Core Concepts AI [badge]                          →     │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌── Saved Cards Section (with connector line) ───────────────┐  │
│  │ │                                                           │  │
│  │ ├── 📌 My Saved Cards (count)              See All →       │  │
│  │ │   ┌────┐ ┌────┐ ┌────┐                                   │  │
│  │ │   │card│ │card│ │card│ ···                               │  │
│  │ │   └────┘ └────┘ └────┘                                   │  │
│  │                                                             │  │
│  │ OR (empty state):                                           │  │
│  │ │                                                           │  │
│  │ ├── 📌 My Saved Cards                                      │  │
│  │ │   ┌──────────────────────────────────────────────────┐   │  │
│  │ │   │ 📌 No saved cards yet                            │   │  │
│  │ │   │ Pin flashcards from Core Concepts to review      │   │  │
│  │ │   └──────────────────────────────────────────────────┘   │  │
│  └─────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────┘
```

**Key Changes:**

1. Move Saved Cards **outside** the Core Concepts gradient box
2. Add a vertical connector line using CSS (`border-l-2 border-primary/30`)
3. Style the header like Videos/Practice: `icon + title + (count) + See All link`
4. Always show the section (with empty state when no cards)
5. Horizontal scroll for cards matching Videos/Practice pattern

---

## Component Structure

```tsx
return (
  <div className="sticky top-0 z-20 -mx-4 px-4 bg-background/95 backdrop-blur-sm py-1.5">
    {/* Core Concepts AI Bar */}
    <motion.div className="rounded-xl bg-gradient-to-r from-primary/15 via-primary/10 to-primary/5 border border-primary/20">
      <button onClick={handleMainClick} className="w-full px-3 py-2.5 ...">
        {/* Headphones icon, title, badge, chevron */}
      </button>
    </motion.div>

    {/* Saved Cards Section - styled like Videos/Practice */}
    <div className="mt-2 ml-4 pl-3 border-l-2 border-primary/20">
      {/* Section Header */}
      <div className="flex items-center justify-between py-1.5">
        <div className="flex items-center gap-2">
          <Bookmark className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-medium text-foreground">My Saved Cards</h3>
          <span className="text-xs text-muted-foreground">({pinnedCards.length})</span>
        </div>
        {hasPinnedCards && (
          <button onClick={onOpenReviewBoard} className="flex items-center gap-1 text-xs text-primary font-medium">
            See All <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Cards or Empty State */}
      {hasPinnedCards ? (
        <div className="py-2">
          <div ref={scrollRef} className="flex gap-3 overflow-x-auto ... snap-x snap-mandatory">
            {pinnedCards.slice(0, 5).map((card) => (
              <PinnedCardPreview key={card.id} card={card} onClick={() => onCardClick(card)} />
            ))}
          </div>
        </div>
      ) : (
        <div className="py-3">
          <div className="bg-muted/30 rounded-lg p-4 text-center">
            <Bookmark className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No saved cards yet</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Pin flashcards from Core Concepts to review later
            </p>
          </div>
        </div>
      )}
    </div>
  </div>
);
```

---

## Styling Details

| Element | Style |
|---------|-------|
| Connector line | `border-l-2 border-primary/20` |
| Section indent | `ml-4 pl-3` (aligns with Core Concepts content) |
| Header | `flex items-center gap-2` with icon + title + count |
| See All link | Right-aligned, primary color, matches existing pattern |
| Empty state box | `bg-muted/30 rounded-lg p-4 text-center` |
| Cards scroll | Same as Videos/Practice: `-mx-4 px-4` for edge-to-edge |

---

## Files to Modify

| File | Action |
|------|--------|
| `src/components/CoreConceptsHub.tsx` | EDIT - Restructure layout with connected subsection |

---

## Benefits

1. **Consistency**: Matches Videos and Practice section styling
2. **Hierarchy**: Clear parent-child relationship via connecting line
3. **Discoverability**: Empty state teaches users about the feature
4. **Usability**: Full-width header row - no small tap targets
5. **Visual flow**: Eye naturally follows from Core Concepts down to Saved Cards

---

## Testing Checklist

1. Core Concepts bar still opens Topic Selection on tap
2. My Saved Cards header is easy to read and visually connected
3. See All link opens Review Board
4. Cards scroll horizontally like Videos/Practice
5. Empty state appears when no cards are pinned
6. Connecting line creates visual link between sections
7. Sticky behavior still works correctly while scrolling
