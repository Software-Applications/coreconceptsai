

## Align Status Bar with Dynamic Island (iOS-Accurate)

### Current Issue
The status bar is currently positioned **below** the Dynamic Island (`top: 52px`), but on real iOS devices, the status bar elements appear **alongside** the Dynamic Island at the same vertical level:
- Time on the **left** side of the Dynamic Island
- Signal, WiFi, Battery on the **right** side of the Dynamic Island

### Proposed Fix

**Visual Layout:**
```text
+--------------------------------------------------+
|   9:41     [===Dynamic Island===]   📶 📡 🔋    |
+--------------------------------------------------+
|                                                  |
|                  App Content                     |
|                                                  |
+--------------------------------------------------+
```

### Changes Required

**File: `src/index.css`**

Update the `.status-bar` positioning to align with the Dynamic Island:

| Property | Current | New |
|----------|---------|-----|
| `top` | `52px` (below island) | `12px` (same level as island) |
| `height` | `24px` | `36px` (match island height) |
| `padding` | `0 28px` | `0 28px` (outer edges) |

The status bar will continue to use `justify-content: space-between`, which naturally pushes the time to the left and icons to the right, creating the gap where the Dynamic Island sits in the center.

Since the Dynamic Island has `z-index: 9999` and the status bar has `z-index: 9998`, the Dynamic Island will correctly overlay and "cut through" the status bar, creating the authentic iOS appearance.

Also need to adjust:
- `.mobile-frame-content` padding-top from `40px` to a smaller value since the status bar now sits at the same level as the Dynamic Island

### Files to Modify

| File | Changes |
|------|---------|
| `src/index.css` | Adjust `.status-bar` top position and height to align with Dynamic Island |

