

# Remove Visual Summary Cards (Flash Summary System)

## Overview

Remove the entire flash summary / visual summary card system from both the UI and backend. This includes the swipeable flashcard that appears after audio completion, the pinned cards system, the review board, and the backend edge function that generates flashcards.

## What Gets Removed

### UI Components (delete files)
- `src/components/FlashSummaryCard.tsx` — the swipeable card shown after audio completes
- `src/components/PinnedCardPreview.tsx` — thumbnail preview in "My Saved Cards" carousel
- `src/components/ExpandedCardModal.tsx` — full-screen view of a pinned card
- `src/components/ReviewBoard.tsx` — the "Review Board" drawer showing all pinned cards

### Hooks (delete files)
- `src/hooks/usePinnedCards.ts` — manages pinning/unpinning flash summary cards
- `src/hooks/useAIGeneration.ts` — calls `generate-content` (references flashcard generation)

### Backend (delete directory)
- `supabase/functions/generate-flashcard/` — Gemini-powered flashcard generation edge function
- Remove `[functions.generate-flashcard]` from `supabase/config.toml`

### Data types cleanup
- `src/data/dailyDownloadData.ts` — remove `FlashSummary` and `PinnedCard` interfaces (keep `DailyDownloadTopic` but remove `flashSummary` field)

---

## Files Modified

### `src/pages/Index.tsx`
- Remove imports: `ReviewBoard`, `ExpandedCardModal`, `usePinnedCards`
- Remove state: `showReviewBoard`, `expandedPinnedCard`
- Remove `usePinnedCards()` hook call and all derived state (`subjectPinnedCards`)
- Remove `pinnedCards`/`onOpenReviewBoard`/`onCardClick` props from `CoreConceptsHub`
- Remove `onPinCard` prop from `DailyDownloadPlayer`
- Remove `ReviewBoard` and `ExpandedCardModal` JSX blocks

### `src/components/CoreConceptsHub.tsx`
- Remove "My Saved Cards" accordion section entirely
- Remove `pinnedCards`, `onOpenReviewBoard`, `onCardClick` props
- Remove `PinnedCardPreview` import
- Remove `isExpanded` state and localStorage persistence for saved cards

### `src/components/DailyDownloadPlayer.tsx`
- Remove `FlashSummaryCard` import
- Remove `showFlashCard` state
- Remove flash card modal JSX (lines 842-871)
- Remove `handleDismissFlashCard` and `handlePinFlashCard` callbacks
- Remove `onPinCard` prop
- After audio completion/celebration, just close the player instead of showing flash card

### `src/hooks/useStreamingContent.ts`
- Remove `generateFlashcard` function and `FlashSummary` interface
- Remove `flashSummary` state and all references
- Remove the parallel flashcard generation call during content streaming
- Keep transcript and audio generation intact

### `src/hooks/useTopics.ts`
- Remove `flash_summaries(*)` from Supabase query joins
- Remove `FlashSummary` type export
- Remove `flashSummary` field from `DailyDownloadTopic` interface and transformation logic

### `supabase/config.toml`
- Remove `[functions.generate-flashcard]` section

---

## Database

The `flash_summaries` and `pinned_cards` tables will remain in the database (no destructive migration). They simply won't be queried anymore. This is safer than dropping tables.

---

## Summary of Impact
- ~4 component files deleted, ~1 hook file deleted, 1 edge function deleted
- ~5 files modified to remove references
- No new features added — pure removal
- Audio player still works; it just closes after completion instead of showing a flashcard

