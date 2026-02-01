
## Create New Transcript Generation Screen

### Problem
When selecting a topic in Core Concepts that requires AI content generation, the current `GeneratingOverlay` component displays as a semi-transparent overlay with incorrect copy:
- **Current title**: "Finalizing Audio Brief" (implies finishing, not creating)
- **Current sub-copy**: "Analyzing transcript...", "Optimizing narration pace..." (implies processing existing content)

The copy is misleading since we're actually **generating** new content, not analyzing or finalizing existing content.

### Solution
Create a new full-screen rendering state within `DailyDownloadPlayer` that displays when AI content is being generated, with accurate copy that reflects the content creation process.

### Implementation Details

**1. Update `GeneratingOverlay.tsx`**
- Change title from "Finalizing Audio Brief" to "Generating Your Brief"
- Update rotating sub-copy messages to reflect content creation:
  - "Writing transcript for this topic..."
  - "Crafting key concepts and explanations..."
  - "Building your personalized summary..."
- Optionally add the topic title to provide context

**2. Update component interface**
- Add optional `topicTitle` prop to `GeneratingOverlay` for contextual display
- Pass topic information from `DailyDownloadPlayer`

**3. Updated copy options**

| Current (Incorrect) | New (Accurate) |
|---------------------|----------------|
| Finalizing Audio Brief | Generating Your Brief |
| Analyzing transcript for key academic terms... | Writing a concise transcript for this topic... |
| Optimizing narration pace for complex topics... | Crafting key concepts and explanations... |
| Finalizing high-fidelity audio output... | Preparing your personalized audio summary... |

### Files to Modify

| File | Change |
|------|--------|
| `src/components/GeneratingOverlay.tsx` | Update title and rotating messages; add optional `topicTitle` prop |
| `src/components/DailyDownloadPlayer.tsx` | Pass `topicTitle` to `GeneratingOverlay` |

### Technical Notes
- The overlay renders at z-index 30, covering the player content
- Animation uses `AnimatePresence` for smooth enter/exit transitions
- Messages rotate every 2 seconds with crossfade animation
- No structural changes needed - just copy updates
