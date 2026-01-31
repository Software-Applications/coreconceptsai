

# Plan: Add Consistent Padding on Hover for Cards

## Problem
The three card types (Pinned Cards, Video Cards, Practice Cards) have inconsistent hover behavior:
- **PinnedCardPreview**: Uses inline `whileHover={{ scale: 1.02, borderColor: 'hsl(var(--primary) / 0.5)' }}`
- **VideoCard**: Uses shared `cardHover` variant (`scale: 1.02, y: -2`)
- **PracticeCard**: Uses shared `cardHover` variant (`scale: 1.02, y: -2`)

None of them currently have padding adjustments on hover.

## Solution
Add a consistent hover effect that includes a subtle padding/visual breathing room to all three card types. Since Framer Motion's `whileHover` doesn't directly animate CSS padding without layout shifts, we'll achieve the "padding feel" by:

1. Adding a subtle `y: -2` lift to all cards (already on Video/Practice, missing on Pinned)
2. Adding a subtle box-shadow glow effect for depth
3. Ensuring consistent `scale: 1.02` across all cards

## Technical Changes

### File: `src/lib/motionVariants.ts`
Update the shared `cardHover` variant to include a consistent shadow for visual padding:

```typescript
export const cardHover = {
  scale: 1.02,
  y: -2,
  boxShadow: "0 8px 16px -4px rgba(0, 0, 0, 0.1), 0 4px 8px -4px rgba(0, 0, 0, 0.06)",
};
```

### File: `src/components/PinnedCardPreview.tsx`
Update to use the shared `cardHover` variant instead of inline styles for consistency:

```tsx
import { cardHover, cardTap, springTransition } from '@/lib/motionVariants';

// Change whileHover from inline to:
whileHover={cardHover}
whileTap={isDragging ? {} : cardTap}
```

Add a base shadow to the card so the hover shadow transition looks smooth:
```tsx
className="w-40 h-28 bg-card border border-border rounded-xl p-3 text-left flex flex-col justify-between select-none shadow-sm"
```

### File: `src/components/VideoCard.tsx`
Already uses `cardHover` - will automatically get the new shadow effect.

### File: `src/components/PracticeCard.tsx`  
Already uses `cardHover` - will automatically get the new shadow effect.

## Files to Modify
1. `src/lib/motionVariants.ts` - Add shadow to cardHover
2. `src/components/PinnedCardPreview.tsx` - Use shared cardHover variant + add base shadow

## Expected Result
All three card types will have identical, smooth hover behavior:
- Slight scale up (1.02)
- Lift effect (-2px on Y axis)
- Subtle shadow glow for visual "breathing room"

