

## Add Clever Rotating Loading Messages for AI Content Generation

### Overview
Enhance the AI content generation loading overlay with rotating academic-themed messages that cycle through clever phrases while the AI is "thinking." This keeps the academic vibe and makes the wait time feel more engaging.

### Messages to Rotate
```
"Synthesizing core principles..."
"Translating complex theories into simple insights..."
"Distilling the essentials for you..."
```

### Location
The changes will be made to **DailyDownloadPlayer.tsx** in the "Generating overlay" section (lines 447-467).

### Design

**Current UI:**
```text
┌─────────────────────────────────────┐
│                                     │
│          [Sparkles Icon]            │
│                                     │
│      Generating Content             │
│                                     │
│   AI is creating a personalized     │
│   transcript and flash summary...   │
│                                     │
└─────────────────────────────────────┘
```

**New UI (with rotating messages):**
```text
┌─────────────────────────────────────┐
│                                     │
│          [Sparkles Icon]            │
│                                     │
│    "Synthesizing core principles..."│  ← Rotates every 3s
│                                     │
│   Creating your personalized        │
│   explanation                       │
│                                     │
└─────────────────────────────────────┘
```

### Changes

**src/components/DailyDownloadPlayer.tsx**

1. **Add loading messages array** - Define the three clever loading messages as a constant at the top of the file or inside the component

2. **Add rotating message state** - Create a `loadingMessageIndex` state that cycles through the messages

3. **Add interval effect** - When `isGenerating` is true, start an interval that updates the message index every 3 seconds. Clean up the interval when generation completes

4. **Update the overlay** - Replace the static "Generating Content" title with the rotating message. Keep a smaller static subtitle for context

5. **Add smooth transitions** - Use `AnimatePresence` with `motion.p` to fade between messages for polish

### Technical Details

```text
// Message rotation logic:
- Messages array: 3 items
- Rotation interval: 3000ms (3 seconds)
- Animation: fade in/out (opacity 0 → 1 → 0)
- State resets to 0 when overlay closes
```

### Visual Polish
- The rotating message will be styled as the main headline (larger, bold)
- Smooth crossfade animation between messages using framer-motion
- A smaller static line beneath provides context: "Creating your personalized explanation"

