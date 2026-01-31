

# Plan: Add Hover Padding to Prevent Card Clipping

## Problem
When hovering on Pinned Cards, Video Cards, and Practice Cards, the cards get clipped at the top. This happens because:
1. The `cardHover` animation lifts cards up by 2px (`y: -2`) and scales them to 1.02
2. The scroll container wrappers only have `-my-1 py-1` (4px vertical padding)
3. This doesn't provide enough space for the hover animation, causing the top to be cut off

## Solution
Increase the vertical padding on the wrapper divs from `-my-1 py-1` to `-my-2 py-2` (8px padding) to accommodate the hover lift and scale effect.

## Changes

### File: `src/pages/Index.tsx`

**1. Pinned Cards container (around line 302)**
Change:
```tsx
<div className="-mx-4 px-4 -my-1 py-1">
```
To:
```tsx
<div className="-mx-4 px-4 -my-2 py-2">
```

**2. Videos container (around line 363)**
Change:
```tsx
<div className="-mx-4 px-4 -my-1 py-1">
```
To:
```tsx
<div className="-mx-4 px-4 -my-2 py-2">
```

**3. Practice Sets container (around line 384)**
Change:
```tsx
<div className="-mx-4 px-4 -my-1 py-1">
```
To:
```tsx
<div className="-mx-4 px-4 -my-2 py-2">
```

## Why This Works
- The negative margin (`-my-2`) pulls the container back into the layout so spacing isn't affected
- The positive padding (`py-2`) creates 8px of breathing room inside for the hover animation
- This allows cards to lift and scale without being clipped by `overflow: hidden`

## Files to Modify
- `src/pages/Index.tsx` - Update 3 container divs

