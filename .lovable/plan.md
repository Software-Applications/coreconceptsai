

## Update Generating Overlay Copy

### Changes Required

**File: `src/components/GeneratingOverlay.tsx`**

1. **Update the rotating sub-copy messages** (lines 5-9):
   - Replace current messages with:
     - "Analyzing transcript for key academic terms..."
     - "Optimizing narration pace for complex topics..."
     - "Finalizing high-fidelity audio output..."

2. **Change rotation interval** (line 11):
   - Change `ROTATION_INTERVAL` from `3000` (3 seconds) to `2000` (2 seconds)

3. **Update the primary title** (lines 54-63):
   - Change the rotating message area to be the sub-copy (smaller text)
   - Add a static primary title: "Finalizing Audio Brief"

4. **Swap the layout structure** (lines 52-69):
   - The primary title "Finalizing Audio Brief" should be the larger, static heading
   - The rotating messages become the smaller sub-copy below

### Updated Structure
```text
+---------------------------+
|                           |
|      [✨ animated icon]   |
|                           |
|   Finalizing Audio Brief  |  <-- Primary title (static, larger)
|                           |
|   Analyzing transcript... |  <-- Sub-copy (rotating every 2s, smaller)
|                           |
+---------------------------+
```

### Code Changes Summary
- `LOADING_MESSAGES` array: 3 new messages
- `ROTATION_INTERVAL`: 3000 → 2000
- Primary title: New static "Finalizing Audio Brief" heading
- Sub-copy: Rotating messages moved to smaller text position

