
## Add Trust-Building Introduction to Core Concepts AI

### Overview
Add introductory copy to the Core Concepts AI topic selection sheet that builds trust in the AI's accuracy while reinforcing its promise of simplicity. This is the first meaningful interaction point where users decide to engage with the feature.

### Location
The copy will be added to **TopicSelectionSheet.tsx** as a hero section between the header and the topic list. This placement ensures users see the value proposition before browsing topics.

### Design

**Visual Layout:**
```text
┌─────────────────────────────────────┐
│           (drag handle)             │
├─────────────────────────────────────┤
│  Core Concepts [AI]           [X]   │
├─────────────────────────────────────┤
│                                     │
│    Master the Fundamentals          │  ← New hero section
│                                     │
│    Tough topics shouldn't be a      │
│    barrier to your progress. Our    │
│    AI breaks down high-level        │
│    academic concepts into simple,   │
│    digestible explanations. It's    │
│    the "Aha!" moment you've been    │
│    looking for, designed to help    │
│    you learn—and retain—better.     │
│                                     │
│    [Start Exploring ↓]              │  ← Scroll indicator
│                                     │
├─────────────────────────────────────┤
│  Chapter 1 - Topic Name             │
│  Chapter 2 - Topic Name             │
│  ...                                │
└─────────────────────────────────────┘
```

### Changes

**src/components/TopicSelectionSheet.tsx**

1. **Update header section** - Replace the existing subtitle "Simplest AI explanations of tough topics" with the new value proposition

2. **Add hero introduction block** - Insert a styled section between the header and topic list containing:
   - "Master the Fundamentals" as a headline
   - The descriptive paragraph about breaking down complex concepts
   - A subtle "Start Exploring" button that scrolls to the topic list

3. **Styling**:
   - Headline: Large, bold text (text-lg or text-xl)
   - Body text: Muted foreground color, comfortable line height
   - Subtle gradient or accent background to distinguish from topic list
   - Animate entrance for polish

4. **Optional: First-time only display** - Consider showing the full intro only on first visit, then collapsing to a minimal header on subsequent visits (can be added later)

### Content
```
Master the Fundamentals

Tough topics shouldn't be a barrier to your progress. Our AI breaks down 
high-level academic concepts into simple, digestible explanations. It's 
the "Aha!" moment you've been looking for, designed to help you learn—and 
retain—better.

[Start Exploring]
```

### Technical Notes
- The "Start Exploring" button will use `scrollIntoView` to smoothly scroll to the first chapter
- Animation will use framer-motion for consistency with the rest of the app
- The hero section will be contained within the scrollable area so it scrolls away naturally
