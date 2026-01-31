
# Fix: Manage Subjects Drawer Mobile Viewport

## Problem

The "Manage Subjects" bottom drawer currently uses the Radix UI `Sheet` component which applies `fixed` positioning. This causes it to appear relative to the full browser window instead of staying within the mobile frame container.

## Root Cause

- `AddSubjectSheet.tsx` imports and uses `Sheet` from `@/components/ui/sheet`
- The Sheet component uses `fixed z-50` positioning (line 32 of sheet.tsx)
- Other sheets like `TopicSelectionSheet`, `VideoPlayerSheet`, and `PracticeQuizSheet` use custom implementations with `absolute` positioning

## Solution

Convert `AddSubjectSheet` to use the same pattern as `TopicSelectionSheet`:
- Replace Radix Sheet with custom motion-based implementation
- Use `absolute` positioning instead of `fixed`
- Add backdrop with proper opacity animation
- Maintain the same visual design (drag handle, header, scrollable content)

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/AddSubjectSheet.tsx` | Replace Radix Sheet with custom absolute-positioned motion sheet |

---

## Technical Implementation

### Before (Current - Broken)
```tsx
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

<Sheet open={isOpen} onOpenChange={...}>
  <SheetContent side="bottom" className="...">
    {/* Content */}
  </SheetContent>
</Sheet>
```

### After (Fixed)
```tsx
import { motion } from 'framer-motion';

// Backdrop
<motion.div
  className="absolute inset-0 bg-black/50 z-50"
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  onClick={onClose}
/>

// Sheet
<motion.div
  className="absolute bottom-0 left-0 right-0 z-50 bg-background rounded-t-3xl max-h-[80vh] overflow-hidden flex flex-col"
  initial={{ y: '100%' }}
  animate={{ y: 0 }}
  exit={{ y: '100%' }}
  transition={springTransition}
>
  {/* Drag handle, header, content */}
</motion.div>
```

---

## Key Changes

1. Remove imports for Sheet, SheetContent, SheetHeader, SheetTitle
2. Wrap entire component render in conditional `if (!isOpen) return null;`
3. Add backdrop div with `absolute inset-0` and click-to-close
4. Replace SheetContent with motion.div using `absolute bottom-0 left-0 right-0`
5. Add slide-up animation matching TopicSelectionSheet pattern
6. Keep existing drag handle, header design, and scrollable subject list
