

# Plan: Unified Core Concepts Section

## Goal
Combine the Core Concepts AI bar and My Saved Cards into a single visually unified section that feels cohesive while maintaining distinct, easy-to-tap interaction zones.

---

## Recommended Design: Card-Style Section with Internal Rows

A single card container that houses both elements as internal rows, creating visual unity while preserving large tap targets.

```text
┌─────────────────────────────────────────────────────────────────┐
│ 🎧  Core Concepts  [AI]                         [3 new]   →    │  ← Tap to open topics
├─────────────────────────────────────────────────────────────────┤
│ 📌  My Saved Cards                                  2     ▾    │  ← Tap to expand
└─────────────────────────────────────────────────────────────────┘
         ↓ When expanded ↓
┌─────────────────────────────────────────────────────────────────┐
│ 🎧  Core Concepts  [AI]                         [3 new]   →    │
├─────────────────────────────────────────────────────────────────┤
│ 📌  My Saved Cards                                  2     ∧    │
├─────────────────────────────────────────────────────────────────┤
│   ┌────────┐  ┌────────┐  ┌────────┐                           │
│   │ Card 1 │  │ Card 2 │  │ Card 3 │  ···                      │
│   └────────┘  └────────┘  └────────┘                           │
│                                               See All →         │
└─────────────────────────────────────────────────────────────────┘
```

### Empty State (No Saved Cards)
```text
┌─────────────────────────────────────────────────────────────────┐
│ 🎧  Core Concepts  [AI]                         [3 new]   →    │
└─────────────────────────────────────────────────────────────────┘
```
(Single row, clean appearance - no divider)

---

## Design Benefits

1. **Visual Unity**: Single border wraps both features - they clearly belong together
2. **Large Tap Targets**: Each row is still a full-width tap zone (~100%)
3. **Clear Hierarchy**: Core Concepts is the primary feature (top), Saved Cards is secondary (bottom)
4. **Separator Line**: Subtle divider between rows indicates they're distinct but related
5. **Consistent Styling**: Unified gradient background across the whole section

---

## Styling Details

| Element | Style |
|---------|-------|
| Container | `rounded-xl bg-gradient-to-r from-primary/15 via-primary/10 to-primary/5 border border-primary/20` |
| Separator | `border-t border-primary/10` (subtle internal divider) |
| Row height | `min-h-[52px]` for accessibility |
| Saved Cards row | No separate border, inherits container background |
| Expanded content | Flush inside container, separated by another divider |

---

## Technical Implementation

### File: `src/components/CoreConceptsHub.tsx`

**Structure Change:**

```tsx
return (
  <div className="sticky top-0 z-20 -mx-4 px-4 bg-background/95 backdrop-blur-sm py-1.5">
    {/* Single unified container */}
    <motion.div
      className="rounded-xl bg-gradient-to-r from-primary/15 via-primary/10 to-primary/5 border border-primary/20 overflow-hidden"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springTransition}
    >
      {/* Row 1: Core Concepts - always tappable, opens topics */}
      <button
        onClick={handleMainClick}
        className="w-full px-3 py-2.5 text-left active:bg-primary/10 transition-colors"
      >
        <div className="flex items-center gap-3">
          {/* Headphones icon + badge, title, chevron right */}
        </div>
      </button>

      {/* Row 2: Saved Cards (only when cards exist) */}
      {hasPinnedCards && (
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          {/* Separator line */}
          <div className="border-t border-primary/10" />

          {/* Saved Cards trigger row */}
          <CollapsibleTrigger asChild>
            <button
              onClick={handleToggleExpand}
              className="w-full px-3 py-2.5 text-left active:bg-primary/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                {/* Bookmark icon, title, count, chevron */}
              </div>
            </button>
          </CollapsibleTrigger>

          {/* Expandable content */}
          <CollapsibleContent>
            <div className="border-t border-primary/10" />
            <div className="px-3 pt-2 pb-3">
              {/* Horizontal cards scroll + See All */}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </motion.div>
  </div>
);
```

---

## Key Changes Summary

| Aspect | Before | After |
|--------|--------|-------|
| Container | Two separate `rounded-xl` elements | Single unified `rounded-xl` container |
| Borders | Each row has its own border | Outer border only, internal separators |
| Background | Different backgrounds per row | Consistent gradient across section |
| Visual | Looks like two separate features | Looks like one cohesive section |
| Tap targets | Full-width rows ✓ | Full-width rows ✓ (preserved) |

---

## Files to Modify

| File | Action |
|------|--------|
| `src/components/CoreConceptsHub.tsx` | EDIT - Restructure into single container with internal rows |

---

## Alternative Considered: Tab-Style Toggle

Instead of stacking rows, use tabs to switch between "Listen" and "Saved" views:

```text
┌─────────────────────────────────────────────────────────────────┐
│   [ Listen  (3) ]      [ Saved  (2) ]                          │
├─────────────────────────────────────────────────────────────────┤
│   Content changes based on selected tab...                      │
└─────────────────────────────────────────────────────────────────┘
```

**Why not recommended:** More complex interaction, less discoverable, hides one feature behind the other.

---

## Testing Checklist

1. Verify both rows appear inside a single unified container
2. Tap Core Concepts row → Topic Selection opens
3. Tap Saved Cards row → Cards section expands/collapses
4. Visual separator appears between rows
5. Gradient background spans the entire section
6. Empty state (no saved cards) shows only Core Concepts row
7. Expanded cards section has proper divider above it
8. Sticky behavior works correctly

