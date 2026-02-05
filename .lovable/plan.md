

## Remove Non-Functional Progress Bar from Audio Generation Overlay

### Current State
The `GeneratingOverlay` component displays an indeterminate progress bar during audio generation (lines 93-98):
```tsx
{isGeneratingAudio && (
  <div className="w-48 mb-4">
    <Progress value={undefined} className="h-1.5 animate-pulse" />
  </div>
)}
```

This progress bar:
- Uses `value={undefined}` so it doesn't show actual progress
- Just pulses indefinitely, which adds visual noise without providing useful feedback
- Creates awkward spacing between the topic title and rotating messages

### Solution

1. **Remove the progress bar** - Delete lines 93-98 entirely
2. **Remove unused import** - Remove `Progress` from imports (line 4)
3. **Adjust spacing** - The topic title already has `mb-4` which provides good spacing to the rotating messages

### Code Changes

**Line 4** - Remove unused import:
```tsx
// Before:
import { Progress } from '@/components/ui/progress';

// After:
(removed)
```

**Lines 93-98** - Remove progress bar block:
```tsx
// Before:
{/* Progress indicator for audio generation */}
{isGeneratingAudio && (
  <div className="w-48 mb-4">
    <Progress value={undefined} className="h-1.5 animate-pulse" />
  </div>
)}

// After:
(removed)
```

### Visual Result

| Before | After |
|--------|-------|
| Icon → Title → Topic → Progress bar → Messages | Icon → Title → Topic → Messages |
| Extra visual element that adds no value | Cleaner, more focused loading state |
| Awkward vertical spacing | Natural flow from title to messages |

### File to Change
| File | Change |
|------|--------|
| `src/components/GeneratingOverlay.tsx` | Remove Progress import and progress bar JSX |

