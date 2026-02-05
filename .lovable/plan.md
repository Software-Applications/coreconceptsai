
## Fix Upcoming Exam Chip Color Pattern

### Problem
The "Upcoming Exam" chip in the Core Concepts drawer uses `destructive` (red), which is semantically incorrect:
- Red (`destructive`) = errors, dangerous/irreversible actions
- The exam filter represents **urgency/time-sensitivity**, not danger

### Design Pattern Alignment
Per the color standardization memory, semantic colors should indicate state:
- `success` (green) → completed/positive states
- `warning` (amber) → urgency/attention needed
- `destructive` (red) → errors/dangerous actions
- `info` (blue) → informational

The exam nudge on the Core Concepts card already uses amber styling, so this chip should match.

### Solution

**Update `src/components/TopicSelectionSheet.tsx` (lines 319-329)**

Change the Upcoming Exam chip from destructive (red) to warning (amber):

```text
Before                              After
─────────────────────────────────   ─────────────────────────────────
bg-destructive/10                → bg-warning/10
hover:bg-destructive/20          → hover:bg-warning/20
text-destructive                 → text-amber-600 dark:text-amber-500
bg-destructive                   → bg-warning
text-destructive-foreground      → text-warning-foreground
```

**Updated code:**
```tsx
<button
  onClick={wrapChipClick(handleExamFilterToggle)}
  className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-full transition-colors whitespace-nowrap flex-shrink-0 ${
    examFilterActive 
      ? 'bg-warning text-warning-foreground' 
      : 'bg-warning/10 hover:bg-warning/20 text-amber-600 dark:text-amber-500'
  }`}
>
  <Flame className="w-3.5 h-3.5" />
  Upcoming Exam
</button>
```

### Visual Comparison

| State | Current (Red) | Proposed (Amber) |
|-------|---------------|------------------|
| Default | Light red bg, red text | Light amber bg, amber text |
| Hover | Darker red bg | Darker amber bg |
| Active | Solid red bg, white text | Solid amber bg, white text |

### Benefits
- Consistent with exam nudge pill styling on the Core Concepts card
- Matches the fire emoji's warm color association
- Follows semantic color guidelines (urgency = amber, not red)
- Less alarming visual weight than red

### File to Change
| File | Change |
|------|--------|
| `src/components/TopicSelectionSheet.tsx` | Update chip colors from destructive (red) to warning (amber) |
