

# Plan: Add Visual Container Around Core Concepts Hub

## Goal
Wrap both the Core Concepts AI bar and the My Saved Cards section in a single container with a subtle border/background to visually separate the entire hub from the rest of the page content.

---

## Current Structure
```text
┌── Sticky Container (transparent background) ─────────────────────┐
│                                                                   │
│  ┌── Core Concepts Bar (has gradient + border) ───────────────┐  │
│  │ 🎧 Core Concepts AI                                   →    │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│     📌 My Saved Cards (no container)                             │
│     ┌────┐ ┌────┐ ┌────┐                                        │
│     │card│ │card│ │card│                                        │
│     └────┘ └────┘ └────┘                                        │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```
**Issue:** Saved Cards section has no visual boundary, feels disconnected.

---

## Proposed Design
```text
┌── Sticky Container ──────────────────────────────────────────────┐
│  ┌── Unified Visual Container (subtle border + bg) ───────────┐  │
│  │                                                              │  │
│  │  ┌── Core Concepts Bar (gradient) ───────────────────────┐  │  │
│  │  │ 🎧 Core Concepts AI                              →    │  │  │
│  │  └───────────────────────────────────────────────────────┘  │  │
│  │                                                              │  │
│  │  ────────────── subtle separator ────────────────           │  │
│  │                                                              │  │
│  │     📌 My Saved Cards (2)                    See All →      │  │
│  │     ┌────┐ ┌────┐ ┌────┐                                    │  │
│  │     │card│ │card│ │card│                                    │  │
│  │     └────┘ └────┘ └────┘                                    │  │
│  │                                                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────┘
```

---

## Technical Changes

### File: `src/components/CoreConceptsHub.tsx`

**Change 1:** Add a wrapper `div` around both sections with subtle styling

```tsx
return (
  <div className="sticky top-0 z-20 -mx-4 px-4 bg-background/95 backdrop-blur-sm py-1.5">
    {/* Unified container with subtle border */}
    <div className="rounded-xl bg-card/50 border border-border/50 overflow-hidden">
      
      {/* Core Concepts AI Bar - remove outer border, keep gradient */}
      <motion.div
        className="bg-gradient-to-r from-primary/15 via-primary/10 to-primary/5"
        ...
      >
        <button ...>
          {/* Existing content */}
        </button>
      </motion.div>

      {/* Separator line */}
      <div className="border-t border-border/50" />

      {/* Saved Cards Section */}
      <div className="px-3 py-2">
        {/* Section Header */}
        {/* Cards or Empty State */}
      </div>
      
    </div>
  </div>
);
```

**Change 2:** Remove the individual border from Core Concepts bar (outer container now has the border)

Current:
```tsx
className="rounded-xl bg-gradient-to-r from-primary/15 via-primary/10 to-primary/5 border border-primary/20"
```

New:
```tsx
className="bg-gradient-to-r from-primary/15 via-primary/10 to-primary/5"
```

**Change 3:** Move Saved Cards content padding inside and adjust horizontal scroll

The horizontal card scroll needs special handling since it extends edge-to-edge. We'll keep the `-mx-3 px-3` pattern for the scroll container.

---

## Styling Details

| Element | Style |
|---------|-------|
| Outer wrapper | `rounded-xl bg-card/50 border border-border/50 overflow-hidden` |
| Core Concepts bar | `bg-gradient-to-r from-primary/15 via-primary/10 to-primary/5` (no border) |
| Separator | `border-t border-border/50` |
| Saved Cards container | `px-3 py-2` |
| Cards scroll | `-mx-3 px-3` to extend to edges within container |

---

## File to Modify

| File | Action |
|------|--------|
| `src/components/CoreConceptsHub.tsx` | EDIT - Add wrapper container, adjust padding, add separator |

---

## Benefits

1. **Visual unity:** Both features clearly grouped together
2. **Separation:** Distinct from other page content below
3. **Subtle design:** `bg-card/50` and `border-border/50` are understated
4. **Consistent:** Uses existing design tokens (`card`, `border`)

