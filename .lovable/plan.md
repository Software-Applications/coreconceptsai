

# Course Switching UX Enhancements Plan

## Overview

This plan implements all recommended UX improvements for the subject/course switching feature, including visual scroll hints, progress indicators, smooth transitions, and an interactive "+" button for adding new subjects.

---

## Current State Analysis

The subject chips section (lines 218-245 in `Index.tsx`) currently:
- Uses horizontal scrollable chips with subject images and names
- Has a non-functional "+" button
- Lacks visual indication of hidden content
- Shows no progress per subject
- Switches content abruptly without animation

---

## Implementation Plan

### Phase 1: Scroll Discoverability

**Goal**: Add gradient fades to indicate more content is available beyond the visible area.

| Component | Change |
|-----------|--------|
| `SubjectChips.tsx` (new) | Create a dedicated component with scroll-aware gradient masks |
| `src/index.css` | Add gradient mask CSS utilities |

**Technical Details**:
- Track scroll position using `useState` and `onScroll` event
- Show left gradient when scrolled right, right gradient when at start
- Use CSS `mask-image` with linear gradients for smooth fades

```text
+--------------------------------------------------+
|  [+]  [Bio ███]  [Chem]  [Micro]  ▓▓▓ (fade) ▓▓▓ |
+--------------------------------------------------+
                                    ↑
                        Right fade hints at more content
```

---

### Phase 2: Progress Indicators on Subject Chips

**Goal**: Show circular progress rings on each subject chip reflecting overall completion.

| File | Change |
|------|--------|
| `SubjectChipWithProgress.tsx` (new) | Chip component with SVG progress ring |
| `useSubjectProgress.ts` (new) | Hook to calculate combined progress across videos, practice sets, and topics |
| `Index.tsx` | Replace inline subject chips with new component |

**Progress Calculation**:
- Combine watched videos, completed practice sets, and listened topics
- Formula: `(watchedVideos + completedPractice + listenedTopics) / (totalVideos + totalPractice + totalTopics) * 100`

**Visual Design**:
```text
    ╭───────────────────╮
    │  ┌─────┐          │
    │  │ 🧬  │◠  Biology │  <- SVG ring around image
    │  └─────┘          │
    ╰───────────────────╯
           ↑
    75% progress ring (primary color)
```

---

### Phase 3: Cross-Fade Transitions

**Goal**: Smooth content transitions when switching subjects instead of abrupt changes.

| File | Change |
|------|--------|
| `Index.tsx` | Wrap content sections in `AnimatePresence` with cross-fade |
| `src/lib/motionVariants.ts` | Add `crossFade` variant for subject transitions |

**Animation Behavior**:
- Outgoing subject content fades out (opacity 1 -> 0)
- Incoming subject content fades in (opacity 0 -> 1)
- Duration: 200ms with easing

---

### Phase 4: Functional "+" Button

**Goal**: Enable users to add new subjects to their home screen via a bottom sheet.

| File | Change |
|------|--------|
| `AddSubjectSheet.tsx` (new) | Bottom sheet with available subjects to add |
| `useUserSubjects.ts` (new) | Hook to manage user's selected subjects (localStorage + Supabase) |
| `Index.tsx` | Connect "+" button to open the sheet |

**User Flow**:
1. Tap "+" button
2. Bottom sheet slides up with available subjects (not yet added)
3. User selects a subject
4. Subject chip appears with entry animation
5. Sheet closes

**Data Structure** (localStorage for guests, Supabase for authenticated):
```typescript
interface UserSubjects {
  selectedSubjectIds: string[];
  order: string[]; // For drag-to-reorder (future)
}
```

---

## New Files to Create

| File Path | Purpose |
|-----------|---------|
| `src/components/SubjectChips.tsx` | Main container with scroll hints |
| `src/components/SubjectChipWithProgress.tsx` | Individual chip with progress ring |
| `src/components/AddSubjectSheet.tsx` | Bottom sheet for adding subjects |
| `src/hooks/useSubjectProgress.ts` | Calculate combined progress per subject |
| `src/hooks/useUserSubjects.ts` | Manage user's selected subjects |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Index.tsx` | Replace inline subject chips section with new `SubjectChips` component; wrap content in `AnimatePresence` |
| `src/lib/motionVariants.ts` | Add `subjectCrossFade` animation variant |
| `src/index.css` | Add `.scroll-fade-left` and `.scroll-fade-right` gradient utilities |

---

## Technical Implementation Details

### Scroll Fade Gradients (CSS)

```css
.scroll-fade-container {
  position: relative;
}

.scroll-fade-left::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 24px;
  background: linear-gradient(to right, hsl(var(--background)), transparent);
  pointer-events: none;
  z-index: 10;
}

.scroll-fade-right::after {
  content: '';
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 24px;
  background: linear-gradient(to left, hsl(var(--background)), transparent);
  pointer-events: none;
  z-index: 10;
}
```

### Progress Ring Component (SVG)

```typescript
interface ProgressRingProps {
  progress: number; // 0-100
  size: number;
  strokeWidth: number;
}

// Uses SVG circle with stroke-dasharray/dashoffset for animated progress
```

### Cross-Fade Animation Variant

```typescript
export const subjectCrossFade: Variants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: { duration: 0.2, ease: "easeOut" }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.15, ease: "easeIn" }
  }
};
```

---

## Implementation Order

1. **Phase 1**: Scroll fade gradients (visual polish, no logic changes)
2. **Phase 2**: Progress calculation hook + progress ring component
3. **Phase 3**: Cross-fade transitions (wrap content in AnimatePresence)
4. **Phase 4**: Add Subject sheet (new feature)

---

## Testing Checklist

After implementation:
- [ ] Scroll right on subject chips to verify left fade appears
- [ ] Scroll left to verify right fade appears
- [ ] Watch a video and verify progress ring updates on subject chip
- [ ] Switch subjects and verify smooth cross-fade animation
- [ ] Tap "+" button and verify bottom sheet opens
- [ ] Add a new subject and verify it appears with animation

