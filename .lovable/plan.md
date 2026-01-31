

# UI Refinement: Remove Progress & Better AI Background

## Changes

### 1. Remove Progress Bar from ChapterDropdown

**File:** `src/components/ChapterDropdown.tsx`

Remove the progress bar and related text that was just added inside the dropdown button. This includes:
- The progress bar container with `mt-2`
- The `h-1.5` progress track
- The animated fill div
- The "X of Y completed" text

Keep the props in case they're needed later, but don't render the progress UI.

### 2. Update Core Concepts AI Background

**File:** `src/components/CoreConceptsHub.tsx`

Replace the current soft lavender background with a more visible option.

**Current:** `bg-violet-50/50 dark:bg-violet-950/20` (too light)

**Recommended options:**

| Option | Light Mode | Dark Mode | Feel |
|--------|------------|-----------|------|
| **A. Muted** | `bg-muted` | `bg-muted` | Neutral, uses design system |
| **B. Stronger violet** | `bg-violet-100/80` | `bg-violet-900/40` | Still on-brand, more visible |
| **C. Navy-tinted** | `bg-navy-50/70` | `bg-navy-900/40` | Matches the button inside |
| **D. Slate** | `bg-slate-100/80` | `bg-slate-800/50` | Professional, high contrast |

**Recommendation:** Option **B (Stronger violet)** or **C (Navy-tinted)** would work best since they coordinate with the existing AI branding while being more visible.

---

## Technical Details

### ChapterDropdown Changes

```tsx
// REMOVE this block (around lines 67-77):
{totalItems > 0 && (
  <div className="mt-2">
    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
      <motion.div ... />
    </div>
    <p className="text-[11px] text-muted-foreground mt-1">
      {completedItems} of {totalItems} completed
    </p>
  </div>
)}
```

### CoreConceptsHub Changes

```tsx
// Line 52 - Change from:
<div className="rounded-xl bg-violet-50/50 dark:bg-violet-950/20">

// To (Option B - Stronger violet):
<div className="rounded-xl bg-violet-100/80 dark:bg-violet-900/40">

// Or (Option C - Navy-tinted):
<div className="rounded-xl bg-navy-50/70 dark:bg-navy-900/40">
```

---

## Summary

| File | Change |
|------|--------|
| `ChapterDropdown.tsx` | Remove progress bar UI (keep props) |
| `CoreConceptsHub.tsx` | Update background to stronger violet or navy tint |

