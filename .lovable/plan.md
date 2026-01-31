

# Plan: Core Concepts AI Sticky Bar

## Goal
Replace the current inline `DailyDownloadCard` with a compact sticky bar positioned directly below the textbook container. This bar will remain visible as the user scrolls through the content, providing persistent access to Core Concepts AI.

---

## Visual Layout (After Implementation)

```text
Header
Subject Chips
┌─────────────────────────────────────┐
│ [Textbook Container]                │  ← Scrollable content starts
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ 🎧 Core Concepts AI  [3 new]  →    │  ← NEW: Sticky bar (sticks below textbook)
└─────────────────────────────────────┘
My Pinned Cards (collapsible)
Related Videos and Practice
  Chapter Dropdown
  Videos (horizontal scroll)
  Practice Sets (horizontal scroll)
Bottom Nav
```

---

## Implementation Details

### 1. Create New Component: `CoreConceptsStickyBar.tsx`

A compact, horizontal sticky bar component with:
- Headphones icon on the left
- "Core Concepts" title with AI badge
- Unlistened count badge (if > 0)
- Chevron right indicator
- Subtle gradient background matching the current card style
- Click handler to open topic selection

**Design specs**:
- Height: ~44px (compact but tappable)
- Sticky positioning with `sticky top-0 z-20`
- Gradient background: `from-primary/15 via-primary/10 to-primary/5`
- Border: `border border-primary/20`
- Rounded corners: `rounded-xl`

### 2. Update `src/pages/Index.tsx`

**Remove**: 
- Lines 323-329: The current `DailyDownloadCard` block

**Add**:
- Import the new `CoreConceptsStickyBar` component
- Place the sticky bar immediately after the textbook container (line 258)
- Wrap it in a sticky container that sticks just below the textbook

**Sticky behavior**:
- The bar will be inside the scrollable content area
- Uses `sticky top-0` to stick to the top of the scroll viewport
- z-index higher than other sticky elements to stay on top

---

## Technical Changes

### File 1: `src/components/CoreConceptsStickyBar.tsx` (NEW)

```tsx
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import { Headphones, ChevronRight } from 'lucide-react';
import { useHaptics } from '@/hooks/useHaptics';
import { springTransition } from '@/lib/motionVariants';
import { AIBadge } from './AIBadge';
import { useRef, useEffect } from 'react';

interface CoreConceptsStickyBarProps {
  onClick: () => void;
  unlistenedCount?: number;
}

export const CoreConceptsStickyBar = ({ 
  onClick, 
  unlistenedCount = 0 
}: CoreConceptsStickyBarProps) => {
  const { mediumTap } = useHaptics();
  const badgeControls = useAnimation();
  const prevCountRef = useRef(unlistenedCount);

  // Animate badge when count changes
  useEffect(() => {
    if (prevCountRef.current !== unlistenedCount && unlistenedCount >= 0) {
      badgeControls.start({
        scale: [1, 1.3, 0.9, 1.1, 1],
        transition: { duration: 0.4, ease: "easeOut" }
      });
    }
    prevCountRef.current = unlistenedCount;
  }, [unlistenedCount, badgeControls]);

  const handleClick = () => {
    mediumTap();
    onClick();
  };

  return (
    <div className="sticky top-0 z-20 py-1.5 -mx-4 px-4 bg-background/95 backdrop-blur-sm">
      <motion.button
        onClick={handleClick}
        className="w-full px-3 py-2.5 rounded-xl bg-gradient-to-r from-primary/15 via-primary/10 to-primary/5 border border-primary/20 flex items-center gap-3 text-left hover:border-primary/40 hover:shadow-md hover:shadow-primary/10 transition-all duration-200"
        whileHover={{ scale: 1.005 }}
        whileTap={{ scale: 0.995 }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springTransition}
      >
        {/* Icon with badge */}
        <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 relative">
          <Headphones className="w-5 h-5 text-primary" />
          <AnimatePresence>
            {unlistenedCount > 0 && (
              <motion.div
                className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center"
                initial={{ scale: 0, opacity: 0 }}
                animate={badgeControls}
                exit={{ scale: 0, opacity: 0 }}
                transition={springTransition}
                key="badge"
              >
                {unlistenedCount}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Text content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            Core Concepts <AIBadge size="sm" />
          </h3>
          <p className="text-[11px] text-muted-foreground truncate">
            AI explanations of tough topics
          </p>
        </div>

        {/* Chevron */}
        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      </motion.button>
    </div>
  );
};
```

### File 2: `src/pages/Index.tsx`

**Changes**:

1. Add import at top:
```tsx
import { CoreConceptsStickyBar } from "@/components/CoreConceptsStickyBar";
```

2. Remove the DailyDownloadCard block (lines 323-329):
```tsx
// DELETE THIS BLOCK:
{/* Daily Download Inline Card */}
<div className="py-2">
  <DailyDownloadCard 
    onClick={() => setShowTopicSelection(true)}
    unlistenedCount={unlistenedCount}
  />
</div>
```

3. Add the sticky bar after the textbook container (after line 258, before Pinned Cards):
```tsx
{/* Core Concepts AI Sticky Bar */}
<CoreConceptsStickyBar 
  onClick={() => setShowTopicSelection(true)}
  unlistenedCount={unlistenedCount}
/>
```

4. (Optional cleanup) Remove the `DailyDownloadCard` import if no longer needed

---

## Files to Modify
1. **`src/components/CoreConceptsStickyBar.tsx`** (NEW) - Create the compact sticky bar component
2. **`src/pages/Index.tsx`** - Replace inline card with sticky bar, update imports

---

## Testing Checklist
1. Verify the sticky bar appears directly below the textbook container
2. Scroll down - the bar should stick to the top of the content area
3. Tap the bar - should open the Topic Selection sheet
4. Badge count should animate when topics are listened to
5. Verify it doesn't overlap with other sticky headers (Videos/Practice)
6. Test on mobile viewport for proper sizing

