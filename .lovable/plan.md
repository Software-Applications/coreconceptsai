

# Make Suggested Topics Header More Actionable

## Overview
Update the "Suggested Topics" section header to be more engaging and action-oriented, encouraging users to tap and explore.

---

## Options

| Approach | Text | Vibe |
|----------|------|------|
| A | "Pick a topic to listen" | Direct instruction |
| B | "Tap to start listening" | Clear CTA |
| C | "Choose a topic" | Simple action |
| D | "Start listening" | Minimal, punchy |

---

## Recommended Approach
**Option A: "Pick a topic to listen"** - This is clear, friendly, and tells users exactly what to do while indicating the audio nature of the content.

---

## Changes

### File: `src/components/TopicSelectionSheet.tsx`

**Update line 482**

Current:
```tsx
<CommandGroup heading={`Suggested Topics (${topics.length})`}>
```

New:
```tsx
<CommandGroup heading="Pick a topic to listen">
```

Note: Removing the count keeps the header cleaner and more action-focused. The number of available topics is less important than guiding the user to take action.

---

## Visual Result

```text
┌─────────────────────────────────────────┐
│  Core Concepts [AI]                  ✕  │
│  AI explanations of tough topics ·      │
│  AI can make mistakes.                  │
│─────────────────────────────────────────│
│  🔍 Search topics...                    │
│  ┌─────────────────────────────────┐    │
│  │ Recent  │  DNA  │  Enzymes      │    │
│  └─────────────────────────────────┘    │
│─────────────────────────────────────────│
│  Pick a topic to listen                 │  ← Action-oriented
│─────────────────────────────────────────│
│  🎧 ATP Synthesis                    >  │
│  🎧 Cell Division                    >  │
```

---

## Technical Details
Single line text change - updates the CommandGroup heading prop.

