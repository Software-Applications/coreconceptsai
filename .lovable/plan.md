
# Fix: Preview Not Working Due to Missing forwardRef

## Problem

The preview is inconsistent because several components wrapped in `AnimatePresence` don't use `forwardRef`. This causes:

1. React warnings: "Function components cannot be given refs"
2. Exit animations failing silently
3. Potential rendering inconsistencies when components mount/unmount

The error trace shows this happens in `Index.tsx` where `AnimatePresence` wraps components that can't receive refs.

## Components Requiring Fix

| Component | File | Current Status |
|-----------|------|----------------|
| `VideoPlayerSheet` | `src/components/VideoPlayerSheet.tsx` | Missing forwardRef |
| `TopicSelectionSheet` | `src/components/TopicSelectionSheet.tsx` | Missing forwardRef |
| `DailyDownloadPlayer` | `src/components/DailyDownloadPlayer.tsx` | Missing forwardRef |
| `ReviewBoard` | `src/components/ReviewBoard.tsx` | Missing forwardRef |
| `ExpandedCardModal` | `src/components/ExpandedCardModal.tsx` | Missing forwardRef |
| `PracticeQuizSheet` | `src/components/PracticeQuizSheet.tsx` | Already has forwardRef (no change needed) |

## Technical Solution

Each component needs to be wrapped with `forwardRef` and pass the ref to its root motion element.

### Example Pattern

Before:
```typescript
export const MyComponent = ({ isOpen, onClose }: Props) => {
  if (!isOpen) return null;
  
  return (
    <motion.div className="...">
      {/* content */}
    </motion.div>
  );
};
```

After:
```typescript
import { forwardRef } from 'react';

export const MyComponent = forwardRef<HTMLDivElement, Props>(
  function MyComponent({ isOpen, onClose }, ref) {
    if (!isOpen) return null;
    
    return (
      <motion.div ref={ref} className="...">
        {/* content */}
      </motion.div>
    );
  }
);
```

## Files to Modify

### 1. VideoPlayerSheet.tsx
- Import `forwardRef`
- Wrap component with `forwardRef<HTMLDivElement, VideoPlayerSheetProps>`
- Add `ref` parameter and pass to root `motion.div`

### 2. TopicSelectionSheet.tsx
- Import `forwardRef`
- Wrap component with `forwardRef<HTMLDivElement, TopicSelectionSheetProps>`
- Add `ref` to the root fragment's first `motion.div` (backdrop)

### 3. DailyDownloadPlayer.tsx
- Import `forwardRef`
- Wrap component with `forwardRef<HTMLDivElement, DailyDownloadPlayerProps>`
- Add `ref` to root `motion.div`

### 4. ReviewBoard.tsx
- Import `forwardRef`
- Wrap component with `forwardRef<HTMLDivElement, ReviewBoardProps>`
- Add `ref` to root `motion.div`

### 5. ExpandedCardModal.tsx
- Import `forwardRef`
- Wrap component with `forwardRef<HTMLDivElement, ExpandedCardModalProps>`
- Add `ref` to root element

## Expected Result

After these changes:
- No more "Function components cannot be given refs" warnings
- AnimatePresence exit animations work correctly
- Preview loads consistently every time
- Smoother transitions between screens
