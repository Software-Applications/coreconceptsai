

## Remove AI Badge Animation

### Current State
The AI badge has an animated shimmer effect that moves the gradient background from right to left. The gradient currently spans from `violet-500` → `primary` (blue) → `cyan-500`.

### Changes Required

**File: `src/components/AIBadge.tsx`**

1. **Remove the shimmer animation** (line 25):
   - Remove `bg-[length:200%_100%]` (oversized background for animation)
   - Remove `animate-ai-shimmer` (the animation class)

2. **Update gradient to static purple/violet** (line 24):
   - Change from: `from-violet-500 via-primary to-cyan-500`
   - Change to: `from-violet-500 to-purple-600` (static violet-to-purple gradient)

### Result
The badge will display a clean, static purple/violet gradient without any moving animation, while keeping the sparkles icon and pill shape.

