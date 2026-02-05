
## Enhance Exam Nudge Visibility with Larger Size and Pill Background

### Current State
The exam nudge is currently:
- Size: `text-[10px]` (10px) - smallest element on the card
- Color: `text-amber-600 dark:text-amber-500`
- No background or visual container

### Proposed Changes

**Update `src/components/CoreConceptsHub.tsx` (line 95-99)**

Replace the current nudge with an enhanced version that combines larger text and a subtle pill background:

```tsx
{examTopicsCount > 0 && (
  <div className="inline-flex items-center gap-1.5 bg-amber-500/10 dark:bg-amber-500/15 px-2.5 py-1 rounded-full mt-2">
    <span className="text-xs font-medium text-amber-600 dark:text-amber-500">
      🔥 {examTopicsCount} {examTopicsCount === 1 ? 'topic' : 'topics'} match your upcoming exam
    </span>
  </div>
)}
```

### Visual Changes
| Aspect | Before | After |
|--------|--------|-------|
| Size | `text-[10px]` (10px) | `text-xs` (12px) |
| Background | None | `bg-amber-500/10` with 2.5px x 1px padding |
| Shape | Plain text | Pill-shaped with `rounded-full` |
| Structure | `<p>` tag | `<div>` with flex layout for proper alignment |

### Design Rationale
- **Larger text** (12px vs 10px) improves readability and draws more attention
- **Subtle pill background** (`bg-amber-500/10`) creates visual separation without being intrusive
- **Rounded corners** enhance the "badge-like" appearance, conveying importance
- **Flex layout** ensures proper alignment and spacing between emoji and text
- **Dark mode support** with `dark:bg-amber-500/15` maintains visibility in dark mode

### Result
The exam nudge will be significantly more prominent while maintaining visual harmony with the rest of the card's design.

