

# Standardize Primary and Secondary Colors Across the App

## Current State Analysis

After analyzing the codebase, I found the following color patterns in use:

### Design System Colors (Correctly Used)
These follow the Tailwind/shadcn design system and should be kept:
- `text-primary`, `bg-primary`, `border-primary` - Blue (HSL 221 83% 53%)
- `text-secondary`, `bg-secondary` - Gray tones
- `text-muted-foreground`, `bg-muted` - Muted grays
- `text-foreground`, `bg-background`, `bg-card` - Base colors
- `text-accent`, `bg-accent` - Amber/gold (HSL 38 92% 50%)
- `text-destructive`, `bg-destructive` - Red for errors

### Semantic Colors (Keep As-Is)
These have specific meanings and should remain:
- **Amber (`text-amber-500`, `bg-amber-500`)** - Resume/in-progress states
- **Green (`text-green-600`, `bg-green-500`)** - Success/completion states
- **Red (`text-red-600`, `bg-red-500`)** - Hard difficulty/errors

### AI Branding Colors (Keep As-Is)
The violet/purple gradient is intentionally used for AI features:
- `from-violet-500 to-purple-600` - AI badge and accents

### Colors to Standardize

| Current Usage | Location | Recommended Change |
|---------------|----------|-------------------|
| `bg-navy-800`, `bg-navy-700`, `bg-navy-900` | `courseData.ts` (subject colors) | Keep for now (data file, not UI) |

---

## Summary of Findings

The app is **already well-standardized**. The design system uses:

1. **Primary (Blue)** - Main interactive elements, active states, CTAs
2. **Accent (Amber/Gold)** - Badges showing unlistened count, special highlights
3. **Muted** - Secondary text, disabled states, backgrounds
4. **Foreground/Background/Card** - Base layer colors

### Semantic Exceptions (Appropriate to Keep)
- **Amber** for "resume" states (in-progress indicator)
- **Green** for completed/success states
- **Red** for hard difficulty or destructive actions
- **Violet gradient** for AI branding

---

## Recommended Standardization

While the app is largely consistent, there are a few minor improvements:

### 1. Consider Defining Semantic Colors in CSS Variables

Add these to `index.css` for consistency:

```css
:root {
  --success: 142 76% 36%;  /* Green for completed states */
  --warning: 38 92% 50%;   /* Amber for resume/in-progress */
  --info: 217 91% 60%;     /* Primary blue for information */
}
```

Then use `text-[hsl(var(--success))]` instead of `text-green-600` to ensure consistent colors across the app and allow easy theme customization.

### 2. Files That Could Be Standardized

| File | Current | Proposed |
|------|---------|----------|
| `FlashSummaryCard.tsx` | `text-green-600`, `text-amber-600`, `text-red-600` | Consider using CSS variables |
| `PracticeQuizSheet.tsx` | `bg-green-100 text-green-600` | Consider `bg-success/20 text-success` |
| `TopicCard.tsx` | `text-amber-500`, `bg-amber-500/20` | Consider `text-warning bg-warning/20` |
| `DailyDownloadPlayer.tsx` | `text-amber-500`, `bg-amber-500` | Consider `text-warning bg-warning` |
| `SearchResultsSection.tsx` | `text-amber-500/600` | Consider `text-warning` |

### 3. No Changes Needed For

- `courseData.ts` - Data layer colors for subject identification
- UI components using `primary`, `secondary`, `muted`, `accent`, `destructive`
- AI branding gradient (`from-violet-500 to-purple-600`)

---

## Implementation Plan

### Phase 1: Add CSS Variables for Semantic Colors

**File: `src/index.css`**

Add semantic color variables under `:root` and `.dark`:

```css
:root {
  /* Existing colors... */
  
  /* Semantic colors */
  --success: 142 76% 36%;
  --success-foreground: 0 0% 100%;
  --warning: 38 92% 50%;
  --warning-foreground: 0 0% 100%;
}

.dark {
  /* Existing dark mode colors... */
  
  /* Semantic colors */
  --success: 142 71% 45%;
  --warning: 38 92% 50%;
}
```

### Phase 2: Update Tailwind Config

**File: `tailwind.config.ts`**

Add the semantic colors:

```ts
colors: {
  // existing colors...
  success: {
    DEFAULT: "hsl(var(--success))",
    foreground: "hsl(var(--success-foreground))",
  },
  warning: {
    DEFAULT: "hsl(var(--warning))",
    foreground: "hsl(var(--warning-foreground))",
  },
}
```

### Phase 3: Update Components

Replace hardcoded colors with semantic variables:

| Component | Change |
|-----------|--------|
| `FlashSummaryCard.tsx` | `text-green-600` -> `text-success` |
| `PracticeQuizSheet.tsx` | `bg-green-100 text-green-600` -> `bg-success/10 text-success` |
| `TopicCard.tsx` | `text-amber-500` -> `text-warning`, `bg-amber-500/20` -> `bg-warning/20` |
| `DailyDownloadPlayer.tsx` | `text-amber-500` -> `text-warning`, `bg-amber-500` -> `bg-warning` |
| `SearchResultsSection.tsx` | `text-amber-500` -> `text-warning` |

---

## Benefits of Standardization

1. **Centralized theming** - Change colors in one place
2. **Dark mode consistency** - Semantic colors adapt automatically
3. **Design system alignment** - Follows shadcn/Tailwind patterns
4. **Future flexibility** - Easy to update brand colors later

---

## Technical Summary

**Files to modify:**
1. `src/index.css` - Add CSS variables
2. `tailwind.config.ts` - Add Tailwind color definitions
3. `src/components/FlashSummaryCard.tsx` - Use semantic colors
4. `src/components/PracticeQuizSheet.tsx` - Use semantic colors
5. `src/components/topic-selection/TopicCard.tsx` - Use semantic colors
6. `src/components/DailyDownloadPlayer.tsx` - Use semantic colors
7. `src/components/topic-selection/SearchResultsSection.tsx` - Use semantic colors

