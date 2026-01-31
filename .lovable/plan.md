

## Shrink Textbook Card

Transform the current prominent textbook card into a compact, unobtrusive reference element that prioritizes the app's primary study tools while still providing quick access to textbook information.

---

### Current State

The textbook section currently occupies significant screen real estate:
- Full-width card with 3-column layout
- Large cover image (80×104px)
- Section header ("Textbook")
- Vertical padding creating visual weight

This pushes the primary study tools (Core Concepts AI, Pinned Cards, Videos, Practice) further down the screen.

---

### Proposed Design: Compact Inline Banner

**Visual Layout:**
```text
┌────────────────────────────────────────────────┐
│  [📖 40x52]  Biology Textbook, 5th Ed.   [→]  │
│              Campbell & Reece                  │
└────────────────────────────────────────────────┘
```

**Key Changes:**

1. **Remove section header** - Eliminate the "Textbook" h2 heading entirely
2. **Shrink cover thumbnail** - Reduce from 80×104px to ~40×52px (50% smaller)
3. **Single-line title** - Truncate with ellipsis if needed
4. **Add external link indicator** - Small chevron or external link icon to signal it opens externally
5. **Reduce vertical padding** - Tighten from py-2 to py-1

---

### Technical Changes

**File: `src/pages/Index.tsx`**

Lines 238-260 will be updated:

- Remove the `<div className="mb-3">` header block containing the h2
- Reduce outer container padding from `py-2 pb-2` to `py-1`
- Shrink image container from `w-20 h-[104px]` to `w-10 h-[52px]`
- Reduce card padding from `p-3` to `p-2`
- Reduce gap from `gap-4` to `gap-3`
- Add a ChevronRight icon on the right side to indicate external action
- Optionally truncate long titles with `truncate` class

---

### Before vs After Comparison

| Aspect | Before | After |
|--------|--------|-------|
| Section header | "Textbook" (h2) | None |
| Cover size | 80×104px | 40×52px |
| Card padding | p-3 | p-2 |
| Vertical space | ~140px total | ~70px total |
| Visual priority | High | Low/supporting |

---

### Space Savings

This change will recover approximately **70px of vertical space**, pushing Core Concepts AI and Pinned Cards closer to the top of the viewport where students can access them immediately.

