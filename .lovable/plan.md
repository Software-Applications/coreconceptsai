

# Add AI Disclaimer to Core Concepts Drawer

## Overview
Add "AI can make mistakes." disclaimer to the header subtitle in the Core Concepts drawer.

---

## Approach
Combine the disclaimer with the existing subtitle using a middle dot (·) separator for a clean, compact presentation.

---

## Changes

### File: `src/components/TopicSelectionSheet.tsx`

**Update the subtitle (line 234)**

Current:
```tsx
<p className="text-xs text-muted-foreground mt-0.5">AI explanations of tough topics</p>
```

New:
```tsx
<p className="text-xs text-muted-foreground mt-0.5">AI explanations of tough topics · AI can make mistakes.</p>
```

---

## Visual Result

```
┌─────────────────────────────────────────┐
│  Core Concepts [AI]                  ✕  │
│  AI explanations of tough topics ·      │
│  AI can make mistakes.                  │
│─────────────────────────────────────────│
│  🔍 Search topics...                    │
```

The disclaimer will appear in muted text directly below the title, ensuring users see it when opening the drawer without being intrusive.

---

## Technical Details

Single line change - updating the subtitle paragraph content. No new components or dependencies required.

