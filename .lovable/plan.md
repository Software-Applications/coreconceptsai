
## Optimize Padding Across App for Better Screen Real Estate

### Overview
After thoroughly analyzing all components, I've identified several areas where padding is excessive and cumulative, reducing usable screen space in the mobile viewport. The main issues are:

1. **Double-padding on full-screen components**: The CSS `.mobile-frame-content` adds `padding-top: 40px`, but components also add `pt-14` (56px), creating ~96px total top clearance when only ~52px is needed.

2. **Cumulative section gaps on home page**: Multiple `py-2`, `py-3`, `py-4` values stack up, creating more vertical whitespace than necessary.

3. **Inconsistent vertical rhythm**: Some sections have generous padding while others are tighter, creating visual imbalance.

### Proposed Changes

#### 1. Fix CSS Mobile Frame Padding (Critical)
Remove the CSS-level `padding-top: 40px` from `.mobile-frame-content` since components already handle their own notch clearance with `pt-14`. This prevents double-padding.

| Location | Current | Proposed |
|----------|---------|----------|
| `src/index.css` `.mobile-frame-content` | `padding-top: 40px` | Remove this rule |

#### 2. Reduce Header Padding in Index.tsx
The home page header has more padding than needed.

| Element | Current | Proposed |
|---------|---------|----------|
| Header container | `pt-4 pb-2` + `mt-4` on h1 | `pt-2 pb-1` + `mt-2` on h1 |
| Subject chips section | `py-4` | `py-2` |
| Textbook section | `py-2 pb-4` | `py-2 pb-2` |
| Pinned cards section | `py-2 pb-4` | `py-1 pb-2` |
| Daily Download card | `py-3` | `py-2` |
| Related Videos section | `py-4` | `py-3` |
| Sticky section header | `pb-3 pt-1` | `pb-2 pt-1` |
| Videos/Practice sub-headers | `py-2` | `py-1.5` |

**Net savings**: ~40-50px vertical space on the home screen

#### 3. Adjust Full-Screen Sheet Headers
All full-screen sheets currently use `pt-14` (56px) for notch clearance. With the CSS fix above, we can reduce this slightly since the status bar is part of the frame, not the content area.

| Component | Current | Proposed |
|-----------|---------|----------|
| `DailyDownloadPlayer` header | `pt-14` | `pt-12` |
| `VideoPlayerSheet` header | `pt-14` | `pt-12` |
| `PracticeQuizSheet` header | `pt-14` | `pt-12` |
| `ReviewBoard` header | `pt-14` | `pt-12` |

#### 4. Optimize TopicSelectionSheet Spacing
The bottom sheet has generous padding that can be tightened.

| Element | Current | Proposed |
|---------|---------|----------|
| Handle area | `pt-3 pb-2` | `pt-2 pb-1.5` |
| Header | `pb-2` | `pb-1.5` |
| Search input | `pb-3` | `pb-2` |
| Chapter accordion content | `pt-2 space-y-2` | `pt-1.5 space-y-1.5` |

#### 5. Tighten BottomNav Vertical Padding
| Element | Current | Proposed |
|---------|---------|----------|
| Nav container | `pt-2` | `pt-1.5` |
| Nav buttons | `py-2` | `py-1.5` |

### Visual Impact

```text
BEFORE (approximate top section height):
┌─────────────────────────┐
│   Status Bar (36px)     │
├─────────────────────────┤
│   Empty space (40px)    │  ← CSS padding-top
├─────────────────────────┤
│   Header pt-4 (16px)    │
│   mt-4 (16px)           │
│   "Home" + underline    │
│   pb-2 (8px)            │
├─────────────────────────┤
│   Subject chips py-4    │
│   (32px total)          │
└─────────────────────────┘
Total: ~148px before content

AFTER:
┌─────────────────────────┐
│   Status Bar (36px)     │
├─────────────────────────┤
│   Header pt-2 (8px)     │
│   mt-2 (8px)            │
│   "Home" + underline    │
│   pb-1 (4px)            │
├─────────────────────────┤
│   Subject chips py-2    │
│   (16px total)          │
└─────────────────────────┘
Total: ~72px before content
```

### Files to Modify

| File | Changes |
|------|---------|
| `src/index.css` | Remove `padding-top: 40px` from `.mobile-frame-content` |
| `src/pages/Index.tsx` | Reduce header, section, and container padding values |
| `src/components/DailyDownloadPlayer.tsx` | Change header `pt-14` → `pt-12` |
| `src/components/VideoPlayerSheet.tsx` | Change header `pt-14` → `pt-12` |
| `src/components/PracticeQuizSheet.tsx` | Change header `pt-14` → `pt-12` |
| `src/components/ReviewBoard.tsx` | Change header `pt-14` → `pt-12` |
| `src/components/TopicSelectionSheet.tsx` | Reduce handle, header, and search padding |
| `src/components/BottomNav.tsx` | Reduce vertical padding |
| `src/components/topic-selection/ChapterAccordion.tsx` | Reduce content spacing |

### Preserved Aesthetics
- Maintains clear visual hierarchy with section headers
- Keeps appropriate touch targets (minimum 44px for interactive elements)
- Preserves readable text spacing and line heights
- Retains the minimalist, native-feel design

### Testing Considerations
- Verify content doesn't clip behind the Dynamic Island/status bar
- Check that touch targets remain appropriately sized
- Confirm visual balance in both light and dark modes
- Test scrolling behavior with reduced spacing
