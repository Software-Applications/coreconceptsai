
## Replace Timer with Chevron in TopicCard

### Current State
The `TopicCard` in the Core Concepts drawer displays a clock icon with duration text (e.g., "5 min") on the right side of each card.

### Proposed Change
Replace the timer/duration display with a right-facing chevron icon for consistency with other navigable cards in the app, particularly the CoreConceptsHub main card pattern.

### Rationale
- **Consistency**: Matches the ChevronRight pattern used in CoreConceptsHub for navigable items
- **Clearer affordance**: Chevron universally signals "tap to navigate"
- **Style alignment**: Follows project convention of moving secondary metadata (duration) to detail views
- **Cleaner visual**: Reduces information density in the topic list

### Visual Change

**Before:**
```
[Icon] Topic Title           [Clock] 5 min
       Description text...
```

**After:**
```
[Icon] Topic Title                    [>]
       Description text...
```

### Implementation

| File | Change |
|------|--------|
| `src/components/topic-selection/TopicCard.tsx` | Replace Clock icon and duration with ChevronRight |

### Technical Details

**Current code (lines 82-85):**
```tsx
<span className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
  <Clock className="w-3 h-3" />
  {topic.duration}
</span>
```

**New code:**
```tsx
<ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
```

- Import `ChevronRight` from lucide-react (replace `Clock` import)
- Remove the `topic.duration` text display
- Use slightly larger icon (w-4 h-4) for better tap target visibility
- Keep muted foreground color for subtle visual hierarchy
