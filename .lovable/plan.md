

## Rename "Trending Topics" to "Trending Concepts"

### Overview

Simple text update to rename the section header from "Trending Topics" to "Trending Concepts", which better aligns with the parent "Core Concepts" branding.

### Arrow Position Decision

**Keep chevron on the right** for consistency with the "My Saved Cards" section. Both collapsible sections should follow the same pattern:
- Left: Icon + Label + Count
- Right: Chevron arrow

This is the standard accordion pattern and maintains visual harmony across both sub-sections.

---

### Technical Implementation

**File: `src/components/CoreConceptsHub.tsx`**

Update line 227:
```typescript
// Before
<h3 className="text-xs font-medium text-muted-foreground">Trending Topics</h3>

// After
<h3 className="text-xs font-medium text-muted-foreground">Trending Concepts</h3>
```

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/CoreConceptsHub.tsx` | Rename "Trending Topics" to "Trending Concepts" on line 227 |

