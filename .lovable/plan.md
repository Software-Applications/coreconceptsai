

## Make Generating Toast Compact Instead of Full-Screen Modal

### Current Behavior
The generating toast currently appears as a large centered modal that dominates the viewport because of these CSS rules:
- `top: 50%` and `transform: translate(-50%, -50%)` - centers it vertically
- `width: calc(100% - 2rem)` - takes nearly full width
- `max-width: 350px` - still quite wide

### Proposed Solution
Reposition the toast to appear as a **compact notification at the top of the screen** (below the notch area), making it less intrusive while still being visible.

### Design Changes

**Before (modal-style centered):**
```text
+---------------------------+
|        [notch]            |
|                           |
|                           |
|  +---------------------+  |
|  |  ✨ Analyzing...    |  |  <-- Centered, feels like blocking modal
|  |  ████████░░░░░░░    |  |
|  +---------------------+  |
|                           |
|                           |
+---------------------------+
```

**After (compact top notification):**
```text
+---------------------------+
|        [notch]            |
|  +---------------------+  |
|  | ✨ Analyzing...     |  |  <-- Top position, non-intrusive
|  | ████░░░░░           |  |
|  +---------------------+  |
|                           |
|   [Content still visible] |
|                           |
+---------------------------+
```

### Technical Changes

**File: `src/index.css`**

Update the sonner toast positioning:
- Change `top: 50%` to `top: 4rem` (below notch safe area)
- Remove the vertical centering transform
- Reduce `max-width` to `280px` for a more compact feel
- Keep horizontal centering

**File: `src/components/GeneratingProgressToast.tsx`**

Make the toast more compact:
- Reduce `min-width` from `280px` to `220px`
- Use smaller gap spacing
- Slightly smaller text size

### Result
- Toast appears as a subtle top notification
- User can still see and interact with the content below
- Feels more like a status indicator rather than a blocking modal

