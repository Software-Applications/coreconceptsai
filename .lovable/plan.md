

## Redesigning the AI Badge for Core Concepts

The current AI badge is a simple bordered box that doesn't communicate the "AI-powered" nature of the feature effectively. Let's create a distinctive, modern AI badge that immediately signals "this is AI-generated content."

---

### Design Approach

The new badge will feature:
- **Gradient background** with purple-to-blue tones (common AI visual language)
- **Subtle shimmer/shine animation** that suggests intelligence and activity
- **Sparkles icon** (✨) to reinforce the AI/magic feel
- **Consistent sizing** across all locations

---

### Visual Preview

```text
Current:   [AI]  (flat, boring, blends in)
                 ↓
New:       ✨ AI  (gradient, shimmer, distinctive)
```

---

### Implementation

**1. Create reusable AI Badge component**
- New file: `src/components/AIBadge.tsx`
- Contains the Sparkles icon, gradient styling, and optional shimmer animation
- Accepts size prop for different contexts (sm, md)

**2. Add shimmer keyframe animation**
- Update `src/index.css` with a subtle shimmer effect
- CSS animation that creates a moving highlight across the badge

**3. Update all 4 locations to use the new component**
- `DailyDownloadCard.tsx` - Home CTA
- `TopicSelectionSheet.tsx` - Bottom drawer header
- `DailyDownloadPlayer.tsx` - Audio player header
- `DailyDownloadFAB.tsx` - FAB tooltip

---

### Technical Details

**New AIBadge Component:**
```tsx
// Gradient: purple → blue (AI visual language)
// Icon: Sparkles from lucide-react
// Animation: subtle shimmer effect
// Sizes: sm (tooltip), md (headers)
```

**CSS Animation:**
```css
@keyframes ai-shimmer {
  0% { background-position: -100% 0; }
  100% { background-position: 200% 0; }
}
```

**Styling:**
- Gradient: `from-violet-500 via-primary to-cyan-500`
- Text: White for contrast
- Rounded pill shape
- Small Sparkles icon before text

---

### Files to Create/Modify

| File | Change |
|------|--------|
| `src/components/AIBadge.tsx` | New reusable component |
| `src/index.css` | Add shimmer animation |
| `src/components/DailyDownloadCard.tsx` | Use AIBadge |
| `src/components/TopicSelectionSheet.tsx` | Use AIBadge |
| `src/components/DailyDownloadPlayer.tsx` | Use AIBadge |
| `src/components/DailyDownloadFAB.tsx` | Use AIBadge |

