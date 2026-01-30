

## Remove Duplicate Generating Toast

### Problem
Currently, when AI content is being generated, **two** indicators appear simultaneously:
1. **Top notification** (Sonner toast): "Analyzing key concepts..." with progress bar
2. **Center overlay** (GeneratingOverlay): "Distilling the essentials for you..." with animated sparkle icon

You want to keep only the center overlay and remove the top toast.

### Solution
Remove the Sonner toast logic entirely from `DailyDownloadPlayer.tsx`, keeping only the `GeneratingOverlay` component which already handles the generating state beautifully.

### Technical Changes

**File: `src/components/DailyDownloadPlayer.tsx`**

1. Remove the import for `GeneratingProgressToast`
2. Remove the `generatingToastId` and `generatingForTopicId` refs
3. Remove all three `useEffect` hooks that manage the toast lifecycle:
   - Cleanup on unmount effect
   - Cleanup when player closes effect  
   - Auto-generate + toast creation effect (keep the generation trigger, remove toast parts)
   - Toast dismissal effect on completion
4. Keep the `<GeneratingOverlay isGenerating={isGenerating} />` component (already in place at line 500)

### Result
- Only the elegant center overlay appears during generation
- No more duplicate/overlapping notifications
- Cleaner code with less state management

