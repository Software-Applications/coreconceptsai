

# Add Visual Progress Bar to Topic Cards

## What changes
Add a thin progress bar at the bottom of topic cards that have been partially listened to (the "Resume" state). The bar shows how far the user got as a percentage of the transcript length.

## How it works
- `useAudioProgress` already stores `charIndex` per topic
- Each topic has a `transcript` field with the full text
- Progress percentage = `charIndex / transcript.length`
- A thin bar (2-3px) renders at the bottom of topic cards only for partially-listened topics

## Technical details

### 1. Add `getProgressPercent` to `useAudioProgress`
New method that takes `(topicId, totalLength)` and returns a 0-100 number using the stored `charIndex`.

### 2. Update `TopicCard` component
- Add new optional prop `progressPercent?: number`
- When `hasResume` is true and `progressPercent > 0`, render a thin progress bar at the card bottom (inside the rounded border)
- Use a `warning` color to match the existing resume styling
- Replace the "Resume" text badge with something like "Resume · 42%"

### 3. Update `TopicSelectionSheet` and `SearchResultsSection`
- Pass `progressPercent` when rendering `TopicCard`, computed from `getProgress(topicId)` and `topic.transcript.length`

### 4. Update inline topic cards in `TopicSelectionSheet`
The sheet has several inline card renderings (not using `TopicCard`). Add the same thin progress bar to those instances.

## Files modified
- `src/hooks/useAudioProgress.ts` -- add `getProgressPercent`
- `src/components/topic-selection/TopicCard.tsx` -- add progress bar UI
- `src/components/TopicSelectionSheet.tsx` -- pass progress percent, add bars to inline cards
- `src/components/topic-selection/SearchResultsSection.tsx` -- pass progress percent

