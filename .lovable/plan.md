

## Update Topic Card Hover to Use Subtle Primary Tint

### Problem
The topic cards in the selection drawer use the CommandItem component which has a built-in hover state using the `accent` color (orange/amber at `hsl(38 92% 50%)`). This creates a heavy, visually dominant hover effect that's inconsistent with other components.

### Current Pattern in Codebase

| Component | Hover Style | Color |
|-----------|-------------|-------|
| Subject Chips | `hover:bg-primary/5` | Subtle blue tint |
| Chapter Drawer Items | `hover:bg-primary/5` | Subtle blue tint |
| Topic Cards (CommandItem) | `data-[selected]:bg-accent` | Heavy orange/amber |

### Design System Recommendation

Per the color standardization pattern:
> "Component hover states use a subtle primary tint (`hover:bg-primary/5`) instead of the orange/amber `accent` color."

This confirms the user's instinct - the current hover is too heavy and should match the subtle primary tint pattern.

### Solution

Update `src/components/ui/command.tsx` to override the `accent` hover with the subtle `primary/5` pattern:

**Line 108** - CommandItem styling:

```tsx
// Before:
"relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled=true]:pointer-events-none data-[selected='true']:bg-accent data-[selected=true]:text-accent-foreground data-[disabled=true]:opacity-50"

// After:
"relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled=true]:pointer-events-none data-[selected='true']:bg-primary/5 data-[selected=true]:text-foreground data-[disabled=true]:opacity-50"
```

### Changes Summary

| Aspect | Before | After |
|--------|--------|-------|
| Selection background | `bg-accent` (orange) | `bg-primary/5` (subtle blue) |
| Selection text | `text-accent-foreground` | `text-foreground` (stays readable) |

### Result
- Topic card hover matches Subject Chips and Chapter Drawer items
- Consistent with the navy-blue theme
- Subtle, non-distracting interaction feedback
- Follows established design patterns

### File to Change
| File | Change |
|------|--------|
| `src/components/ui/command.tsx` | Update CommandItem selection colors from `accent` to `primary/5` |

