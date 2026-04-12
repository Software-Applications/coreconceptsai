

# Show Topic Duration on Topic Cards

## What changes
Display the topic duration (e.g. "5:30") as a small muted label on each topic card, next to the description. Only shown when the duration is available and not "0:00".

## Technical details

### `src/components/topic-selection/TopicCard.tsx`
- Import `Clock` icon from lucide-react
- After the description `<p>` tag (line 82-84), add a small duration label with a clock icon when `topic.duration` exists and isn't "0:00"
- Style: `text-xs text-muted-foreground` with a tiny clock icon, placed below the description

### `src/components/TopicSelectionSheet.tsx`
- Add the same duration display to any inline topic card renderings

## Files modified
- `src/components/topic-selection/TopicCard.tsx`
- `src/components/TopicSelectionSheet.tsx`

