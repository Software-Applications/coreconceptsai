

# Plan: Fix Unsmooth Horizontal Scroll on Desktop Mouse Drag

## Problem Summary
When using mouse click-and-drag on desktop in the pinned cards, videos, and practice sets rows, the scrolling feels choppy and not smooth. The user wants native momentum scrolling on touch devices while improving the custom drag behavior on desktop.

## Root Cause Analysis
The `useDragScrollHorizontal` hook directly manipulates `element.scrollLeft` during pointer move events without any smoothing, easing, or momentum. This causes:
1. **Abrupt, frame-by-frame position changes** - no interpolation between drag positions
2. **No momentum after release** - scrolling stops immediately when the user releases
3. **Blocking touch on touch devices** - the hook captures all pointer events including touch, preventing native momentum scrolling

## Solution Overview
1. **Disable custom drag for touch devices** - allow native browser momentum scrolling on touch
2. **Add smooth momentum/inertia for mouse drag** - track velocity during drag and apply deceleration after release
3. **Use CSS `scroll-behavior: smooth`** - already applied but needs the momentum animation to work with it

## Technical Changes

### File: `src/hooks/useDragScroll.ts`

#### 1. Skip custom drag handling for touch/pen inputs
Modify `useDragScrollHorizontal` to only handle mouse events, allowing native touch scrolling:

```typescript
const handlePointerDown = (e: PointerEvent) => {
  // Only handle mouse events - let touch use native scrolling
  if (e.pointerType !== 'mouse') return;
  if (e.button !== 0) return;
  // ... rest of handler
};
```

#### 2. Track velocity during drag
Add velocity tracking to calculate momentum:

```typescript
let lastX = 0;
let lastTime = 0;
let velocity = 0;

const handlePointerMove = (e: PointerEvent) => {
  if (!isDown || e.pointerType !== 'mouse') return;
  
  const now = performance.now();
  const deltaTime = now - lastTime;
  
  if (deltaTime > 0) {
    velocity = (e.clientX - lastX) / deltaTime;
  }
  
  lastX = e.clientX;
  lastTime = now;
  // ... scroll position update
};
```

#### 3. Apply momentum animation on release
Add smooth deceleration using `requestAnimationFrame`:

```typescript
const applyMomentum = () => {
  if (Math.abs(velocity) < 0.01) {
    velocity = 0;
    return;
  }
  
  element.scrollLeft -= velocity * 16; // ~16ms per frame
  velocity *= 0.95; // friction/deceleration
  
  animationFrameId = requestAnimationFrame(applyMomentum);
};

const endPointerDrag = () => {
  if (!isDown) return;
  isDown = false;
  
  // Start momentum animation
  applyMomentum();
};
```

#### 4. Cancel momentum on new interaction
Stop any running momentum animation when user starts a new drag:

```typescript
let animationFrameId: number | null = null;

const handlePointerDown = (e: PointerEvent) => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  // ... rest of handler
};
```

#### 5. Cleanup animation frame on unmount
Ensure proper cleanup:

```typescript
return () => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
  // ... remove event listeners
};
```

### File: `src/pages/Index.tsx`
Remove unnecessary scroll-related CSS classes that may interfere:
- Remove `scroll-smooth` from the horizontal scroll containers (interferes with JS-controlled scrolling)
- Keep `overscroll-x-contain`, `snap-x snap-mandatory` for snap behavior

## Expected Behavior After Fix
| Input Method | Behavior |
|--------------|----------|
| Desktop mouse drag | Smooth momentum scrolling with deceleration after release |
| Desktop trackpad | Native browser momentum scrolling |
| Touch (mobile/tablet) | Native browser momentum scrolling |
| Capacitor app | Native iOS/Android momentum scrolling |

## Files to Modify
1. `src/hooks/useDragScroll.ts` - Update `useDragScrollHorizontal` hook
2. `src/pages/Index.tsx` - Remove conflicting `scroll-smooth` classes from horizontal containers

