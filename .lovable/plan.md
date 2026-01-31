

## Add "Explore" CTA to Core Concepts AI Button

This will add a clear "Explore" call-to-action pill to the right side of the Core Concepts AI button, making it more inviting and actionable.

### What Will Change

An "Explore" CTA badge will be added to the button:
- **Position**: Right-aligned within the button
- **Style**: Primary-colored pill badge that stands out against the navy background
- **Content**: "Explore" text with a small chevron icon

### Visual Layout

```text
┌─────────────────────────────────────────────────────────┐
│  🎧  Core Concepts [AI]                    [ Explore → ]│
│      AI explanations of tough topics                    │
└─────────────────────────────────────────────────────────┘
```

### Technical Changes

**File: `src/components/CoreConceptsHub.tsx`**

Add the CTA element after the title `div` (line 76), before the closing `</div>` of the flex container:

```tsx
{/* Explore CTA */}
<div className="flex-shrink-0 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center gap-1">
  Explore <ChevronRight className="w-3 h-3" />
</div>
```

The `ChevronRight` icon is already imported at the top of the file, so no additional imports are needed.

### Styling Details

- `flex-shrink-0` - Prevents the CTA from shrinking
- `px-3 py-1.5` - Comfortable pill padding
- `rounded-full` - Fully rounded pill shape
- `bg-primary text-primary-foreground` - Uses primary accent color for visibility
- `text-xs font-medium` - Small but readable text
- `flex items-center gap-1` - Aligns text and chevron icon

