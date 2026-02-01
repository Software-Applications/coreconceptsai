
## Fix Generating Overlay Layout and Add Cancel Button

### Problem 1: Text Overlap
The current layout has issues with the rotating messages overlapping the topic title because:
- The rotating message container has a fixed `h-6` (24px) height
- Messages use `absolute` positioning which removes them from normal flow
- Long messages can overflow the container, overlapping with content above

### Problem 2: No Cancel Option
Users cannot cancel the generation process once it starts, which can be frustrating if they accidentally selected the wrong topic.

---

### Solution

**1. Fix the layout spacing to prevent overlap:**

| Element | Current | Proposed |
|---------|---------|----------|
| Title margin | `mb-2` | `mb-1` |
| Topic title margin | `mb-2` | `mb-4` (increased gap) |
| Message container | `h-6` fixed | `h-8` (more breathing room) |
| Message text | Single line, may overflow | Constrained with `max-w-[280px]` |

**2. Add Cancel button (X) in top-right corner:**

Consistent with the app's existing pattern:
```tsx
<button
  onClick={onCancel}
  className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors"
>
  <X className="w-5 h-5 text-muted-foreground" />
</button>
```

---

### Updated Component Structure

```text
+------------------------------------------+
|                                    [X]   |  <- Cancel button (top-right)
|                                          |
|              (sparkle icon)              |
|                                          |
|         Generating Your Brief            |  <- Main title
|           {Topic Title}                  |  <- Topic name (more spacing below)
|                                          |
|    Writing a concise transcript...       |  <- Rotating message (more height)
|                                          |
+------------------------------------------+
```

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/GeneratingOverlay.tsx` | Add `onCancel` prop, add X button, fix spacing |
| `src/components/DailyDownloadPlayer.tsx` | Pass cancel handler to overlay |

---

### Technical Details

**GeneratingOverlay.tsx changes:**
1. Add `onCancel?: () => void` to props interface
2. Import `X` from lucide-react
3. Add cancel button positioned `absolute top-4 right-4`
4. Increase topic title bottom margin from `mb-2` to `mb-4`
5. Increase message container height from `h-6` to `h-8`
6. Add `max-w-[280px]` to message text to prevent overflow

**DailyDownloadPlayer.tsx changes:**
1. Pass `onCancel={onClose}` to `GeneratingOverlay` - closing the player cancels generation
