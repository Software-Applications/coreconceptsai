

## Fix Exam Topic Highlight Colors to Match Amber Pattern

### Problem
When clicking the "Upcoming Exam" chip, the matching topics are highlighted in red (`destructive`), which is inconsistent with the amber styling we just applied to the chip itself.

**Current red styling (lines 560-582):**
- Card container: `bg-destructive/10 ring-1 ring-destructive/30`
- "Exam" badge: `text-destructive bg-destructive/10`

### Solution

Update `src/components/TopicSelectionSheet.tsx` to use amber/warning colors instead of destructive:

| Element | Current (Red) | Updated (Amber) |
|---------|---------------|-----------------|
| Card background | `bg-destructive/10` | `bg-warning/10` |
| Card ring | `ring-destructive/30` | `ring-warning/30` |
| Badge text | `text-destructive` | `text-amber-600 dark:text-amber-500` |
| Badge background | `bg-destructive/10` | `bg-warning/10` |

### Code Changes

**Line 560-561** - Card container styling:
```tsx
// Before:
showHighlight ? 'bg-destructive/10 ring-1 ring-destructive/30 rounded-lg' : ''

// After:
showHighlight ? 'bg-warning/10 ring-1 ring-warning/30 rounded-lg' : ''
```

**Lines 578-583** - "Exam" badge styling:
```tsx
// Before:
<span className="flex items-center gap-0.5 text-[10px] text-destructive font-medium bg-destructive/10 px-1.5 py-0.5 rounded-full">

// After:
<span className="flex items-center gap-0.5 text-[10px] text-amber-600 dark:text-amber-500 font-medium bg-warning/10 px-1.5 py-0.5 rounded-full">
```

### Result
- Exam topics will have a warm amber highlight instead of red
- Consistent with the "Upcoming Exam" chip styling
- Consistent with the exam nudge pill on the Core Concepts card
- Follows the semantic color pattern: urgency = amber, not red

### File to Change
| File | Change |
|------|--------|
| `src/components/TopicSelectionSheet.tsx` | Update topic card and badge colors from destructive (red) to warning (amber) |

