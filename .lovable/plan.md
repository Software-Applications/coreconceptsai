
# Alternative Toast Design Options

Based on the app's design language (navy theme, soft backgrounds, semantic colors), here are **4 design alternatives** for the destructive/error toast:

---

## Option A: Navy Card with Red Accent Strip

A clean card-like design with a small colored accent on the left edge:

```text
┌──────────────────────────────┐
│▌ Invalid topic              ×│
│▌ Please enter a valid topic  │
└──────────────────────────────┘
 ↑ 3px red accent strip
```

**Styling:**
- Background: `bg-card` (white)
- Left border: `border-l-4 border-destructive`
- Text: `text-foreground`
- Shadow: `shadow-lg`

---

## Option B: Glassmorphism with Icon

Modern frosted glass effect with a prominent warning icon:

```text
┌──────────────────────────────┐
│ ⚠️  Invalid topic           ×│
│     Please enter valid topic │
└──────────────────────────────┘
```

**Styling:**
- Background: `bg-background/95 backdrop-blur-md`
- Border: `border border-border`
- Icon: Red `AlertTriangle` icon
- Text: `text-foreground`

---

## Option C: Subtle Warm Tint (Similar to FlashSummaryCard)

Following the pattern used in `FlashSummaryCard` for difficulty indicators:

```text
┌──────────────────────────────┐
│ Invalid topic               ×│
│ Please enter a valid topic   │
└──────────────────────────────┘
```

**Styling:**
- Background: `bg-destructive/15` (warm rose tint, slightly more visible)
- Border: `border border-destructive/20`
- Text: `text-foreground`
- Title: Add `text-destructive` to the title only

---

## Option D: Dark Navy Toast (Bold & Premium)

Inverted style for high visibility:

```text
┌──────────────────────────────┐
│ Invalid topic               ×│
│ Please enter a valid topic   │
└──────────────────────────────┘
```

**Styling:**
- Background: `bg-navy-900` (dark navy)
- Border: `border border-destructive/50`
- Text: `text-white`
- Icon: Red accent icon

---

## My Recommendation: **Option A (Accent Strip)**

This design:
- Follows common UI patterns (like Stripe, Linear)
- Provides clear visual distinction without being overwhelming
- Works well with the existing light card backgrounds in the app
- Is subtle yet clearly indicates an error state

---

## Technical Notes

- All options use the existing color tokens from the design system
- The close button styling will be updated to match each option
- For Option B, I would add an `AlertTriangle` icon from lucide-react
- Implementation affects only `src/components/ui/toast.tsx`
