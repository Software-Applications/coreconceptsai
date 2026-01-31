

## Apply Secondary Fill Style to Core Concepts AI Button

This change will update the Core Concepts AI button from the current bold primary fill to a softer, more subtle secondary fill that blends better with the overall UI while still being clearly interactive.

### What Will Change

The Core Concepts AI button will get a gentler appearance using the theme's secondary color palette:
- **Background**: Soft gray-blue (`bg-secondary`) instead of bold primary blue
- **Text**: Dark text (`text-secondary-foreground`) for good readability
- **Border**: Subtle primary accent border (`border-primary/20`) to maintain brand connection
- **Hover state**: Light primary tint (`hover:bg-primary/10`) for clear interactivity
- **Icons**: Primary-colored icons to draw attention while keeping button subtle

### Visual Comparison

| Element | Current (Primary Fill) | New (Secondary Fill) |
|---------|----------------------|---------------------|
| Background | Bold blue (`bg-primary`) | Soft gray (`bg-secondary`) |
| Text | White (`text-primary-foreground`) | Dark (`text-secondary-foreground`) |
| Headphones icon | White circle | Primary-tinted circle |
| Chevron | White | Primary color |

### Technical Changes

**File: `src/components/CoreConceptsHub.tsx`**

1. Update button classes:
   - Change `bg-primary text-primary-foreground` to `bg-secondary text-secondary-foreground`
   - Add subtle border: `border border-primary/20`
   - Update hover states: `hover:bg-primary/10 hover:border-primary/40`
   - Keep shadow for depth: `shadow-sm`

2. Update icon container:
   - Change `bg-primary-foreground/20` to `bg-primary/15`
   - Change icon color to `text-primary`

3. Update text colors:
   - Title: `text-foreground` (dark text)
   - Subtitle: `text-muted-foreground`

4. Update badge counter:
   - Use `bg-primary text-primary-foreground` for visibility

5. Update chevron indicator:
   - Container: `bg-primary/15`
   - Icon: `text-primary`

This creates a button that feels native to the UI while still being clearly tappable, with the primary color used as an accent rather than the dominant fill.

