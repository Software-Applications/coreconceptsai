

## Reduce Gap Above Practice Sets Section

### Issue Identified
Looking at the code, the **Videos section** container (line 363) has `mb-5` (20px margin-bottom), which creates excessive vertical space before the **Practice Sets** section.

### Current Structure
```
Videos Section Container (mb-5 = 20px gap)
├── Sticky header (py-1.5)
└── Horizontal scroll of video cards (pb-4 = 16px)
                                        ↓
               Total gap: 20px + inherent spacing
                                        ↓
Practice Sets Section (mb-4)
├── Sticky header (py-1.5)
└── Horizontal scroll of practice cards (pb-4)
```

### Proposed Change

| File | Location | Current | Proposed |
|------|----------|---------|----------|
| `src/pages/Index.tsx` | Line 363, Videos section container | `mb-5` | `mb-3` |

This reduces the margin from 20px to 12px, which still provides adequate visual separation while tightening the layout.

### Visual Impact
- Reduces the gap above "Practice Sets" by ~8px
- Maintains visual hierarchy with the sticky headers
- Creates more consistent vertical rhythm between sections

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Index.tsx` | Change Videos section `mb-5` → `mb-3` |

