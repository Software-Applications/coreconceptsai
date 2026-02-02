
# Update Invalid Topic Toast Styling

## Problem
The invalid topic toast that appears when clicking the request button uses a raw red destructive style (`bg-destructive`) that doesn't match the app's softer navy-based design scheme. The styling is too harsh and inconsistent with other UI elements.

## Solution
Update the toast component's destructive variant to use a softer styling that aligns with the app's design language - using a light background with red accents rather than a solid red background.

---

## Implementation

### File: `src/components/ui/toast.tsx`

Update the `toastVariants` destructive variant (line 31) from:
```typescript
destructive: "destructive group border-destructive bg-destructive text-destructive-foreground",
```

To a softer, more cohesive style:
```typescript
destructive: "destructive group border-destructive/30 bg-destructive/10 text-foreground",
```

This change:
- Uses `border-destructive/30` for a subtle red border (30% opacity)
- Uses `bg-destructive/10` for a light red-tinted background (10% opacity)
- Uses `text-foreground` for readable dark text instead of white

### File: `src/components/ui/toast.tsx` (optional refinement)

Also update the ToastClose destructive styling (line 70) to match:
```typescript
group-[.destructive]:text-destructive group-[.destructive]:hover:text-destructive group-[.destructive]:bg-destructive/10 group-[.destructive]:hover:bg-destructive/20
```

This makes the close button use the destructive color as an accent rather than a solid background.

---

## Visual Result

| Before | After |
|--------|-------|
| Solid red background, white text | Light pink-tinted background, dark text, subtle red border |
| Harsh, jarring appearance | Soft, cohesive with app design |
| Hard to read on some screens | Clear, accessible contrast |

---

## Summary

| Change | Location | Purpose |
|--------|----------|---------|
| Update destructive variant | `toast.tsx` line 31 | Softer background/border styling |
| Update close button styling | `toast.tsx` line 70 | Matching accent colors |
