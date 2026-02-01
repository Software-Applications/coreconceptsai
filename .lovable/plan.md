
# Standardize Badge Colors with Subtle Visual Hierarchy

## Design Philosophy

Both "Completed/Watched" and "In Progress" are informational metadata that should recede rather than compete with the thumbnail content. We'll create a subtle hierarchy where:

- **Completed states** use a darker muted pill (more definitive, "done")
- **In Progress states** use a lighter gray pill (softer, ongoing)

## Color Mapping

| State | Current | New | Rationale |
|-------|---------|-----|-----------|
| Watched (Video) | `bg-primary/90 text-primary-foreground` | `bg-foreground/70 text-background` | Dark, confident, "finished" |
| Completed (Practice) | `bg-success text-success-foreground` | `bg-foreground/70 text-background` | Matches watched badge |
| In Progress (Practice) | `bg-warning text-warning-foreground` | `bg-muted text-muted-foreground` | Lighter gray, softer presence |

## Changes

### 1. `src/components/VideoCard.tsx`

Update the "Watched" badge styling:

```tsx
// Line 40-43: Change from primary to muted dark pill
<div className="absolute top-2 left-2 flex items-center gap-1 bg-foreground/70 text-background text-xs px-2 py-1 rounded-full">
  <CheckCircle className="w-3 h-3" />
  <span>Watched</span>
</div>
```

### 2. `src/components/PracticeCard.tsx`

Update both badge styles in the `renderStatusBadge` function:

```tsx
// Completed badge (lines 27-32): Change from success to muted dark pill
<div className="absolute top-2 left-2 flex items-center gap-1 bg-foreground/70 text-background text-xs px-2 py-1 rounded-full">
  <Trophy className="w-3 h-3" />
  <span>{bestScore}%</span>
</div>

// In Progress badge (lines 35-40): Change from warning to light muted pill
<div className="absolute top-2 left-2 flex items-center gap-1 bg-muted text-muted-foreground text-xs px-2 py-1 rounded-full">
  <Clock className="w-3 h-3" />
  <span>In progress</span>
</div>
```

## Visual Result

| Badge | Appearance | Effect |
|-------|------------|--------|
| Watched/Completed | Dark semi-transparent pill | Reads as "done" without shouting |
| In Progress | Light gray pill | Softer, indicates ongoing activity |

Both badges will now blend harmoniously with the thumbnail while still being readable, with the completed state having slightly more visual weight than the in-progress state.
