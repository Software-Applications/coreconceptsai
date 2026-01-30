
Goal
- Fix the “Generating AI content” toast so it:
  1) only appears when generation is actually running
  2) closes immediately when generation finishes (success or error)
  3) never stacks/overlaps with itself or a “content ready” toast

What’s happening (root cause analysis)
- In `src/components/DailyDownloadPlayer.tsx`, the generation toast is created inside an effect, stored in `generatingToastId.current`, and dismissed in another effect.
- But the component also calls `generateContent.reset()` in a separate effect on `[topic?.id]`.
- Because React runs effects after render (and in the order they’re declared), this reset can happen:
  - right after the mutation is started, while the request is still in-flight, or
  - during topic changes / refetches that change `topic` identity.
- Resetting the mutation state during an in-flight request can cause:
  - the “start generation” effect to re-trigger (because `isPending` flips false and `isSuccess` is reset), creating a new toast,
  - `generatingToastId.current` to be overwritten by newer toast IDs,
  - older toasts to never get dismissed (the “dismiss” effect only dismisses the latest stored ID),
  - visible overlap/stacking and the “never closes” behavior.

Additionally (important UX/data detail)
- In `src/pages/Index.tsx`, you store the entire `selectedTopic` object in state. After the generation finishes and queries invalidate/refetch, the topic data in `allTopics` updates, but `selectedTopic` may still point at the old object. This can make the UI look like content isn’t “available yet” even when it is, and can keep `needsAIContent` computed as true longer than it should.

Implementation plan (code changes)

A) Make the generation toast lifecycle “single instance”, never stack
File: `src/components/DailyDownloadPlayer.tsx`

1) Remove or heavily guard the mutation reset effect
- Current code:
  - Effect that runs on `[topic?.id]` and calls `generateContent.reset()`
- Change:
  - Either remove it entirely (preferred if topic changes only occur via unmount/remount), OR
  - move/reset safely (see option below)

Recommended safe option:
- Delete the standalone `generateContent.reset()` effect.
Why:
- `DailyDownloadPlayer` is mounted conditionally by `selectedTopic`. Closing the player unmounts it, and re-opening remounts it, which naturally resets mutation state.
- Even if topic changes occur while mounted (e.g., you later refactor to derive topic from query), we can reset in a controlled “topic changed” handler, not in a free-floating effect that can race with in-flight requests.

2) Add a hard “dismiss previous toast before creating a new one”
- In the auto-generate effect, before calling `sonnerToast.custom(...)`, do:
  - if `generatingToastId.current` exists => `sonnerToast.dismiss(generatingToastId.current)` and set it to null
- This guarantees no overlap even if the effect runs twice for any reason.

3) Prevent re-entrant creation for the same topic
- Add a ref such as:
  - `const generatingForTopicId = useRef<string | null>(null);`
- When starting generation:
  - if `generatingForTopicId.current === topic.id`, do nothing (already started)
  - else set it to `topic.id` and proceed
- When generation completes (success/error):
  - clear `generatingForTopicId.current = null`

4) Close toast on ALL completion paths, not just isSuccess/isError booleans
- Keep the “dismiss” effect, but make it more robust:
  - Use `generateContent.status` (idle | pending | success | error) as the single source of truth, or
  - Use `isPending` transitions:
    - if toast exists AND `!isPending` => dismiss
- This avoids edge cases where booleans are reset/changed out-of-order.

5) Add an unmount/close cleanup
- Add:
  - `useEffect(() => { return () => { if (generatingToastId.current) sonnerToast.dismiss(generatingToastId.current); generatingToastId.current = null; }; }, []);`
- Also add cleanup when the player closes (e.g., when `isOpen` becomes false) if needed:
  - If `!isOpen`, dismiss any existing generating toast.

B) Align “Generating” and “Ready” toasts by removing the success toast (recommended)
File: `src/components/DailyDownloadPlayer.tsx`

Problem:
- Even with correct dismissal, “Content Ready” can appear so quickly after dismiss that it feels like overlap, and it’s visually inconsistent with the custom generating toast.

Change:
- Remove the success toast entirely:
  - Delete the `sonnerToast.success("Content Ready", ...)` block.
- Keep only:
  - generating toast while pending
  - optional error toast on failure (or also remove error toast if you want absolute simplicity)

Result:
- The user sees one consistent toast (generating), then it disappears when content is ready—no second toast.

Optional alternative if you still want confirmation:
- Replace (not add) the same toast by reusing the toast ID (Sonner supports updating by ID via `id` option); we can “swap” the content to a short “Ready” state for ~1s and then dismiss. This avoids stacking while keeping confirmation.

C) Ensure “content is available” actually updates in the UI (prevents re-generation + feels instant)
File: `src/pages/Index.tsx`

Change how you store selection:
1) Replace:
- `const [selectedTopic, setSelectedTopic] = useState<DailyDownloadTopic | null>(null);`
with:
- `const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);`

2) Derive the selected topic from the latest query data:
- `const selectedTopic = useMemo(() => subjectTopics.find(t => t.id === selectedTopicId) ?? null, [subjectTopics, selectedTopicId]);`

3) Update handlers:
- When selecting:
  - setSelectedTopicId(topic.id)
- When closing:
  - setSelectedTopicId(null)

Why this matters:
- After `useGenerateContent` invalidates `['topics']`, the refetch updates `subjectTopics`. With this change, the open player immediately receives the updated topic object (fresh description/flash summary), which also makes `needsAIContent` flip false naturally.
- This reduces “generate again” scenarios and makes “close toast when content is available” feel correct to the user.

Verification / Acceptance criteria (manual test)
1) Fresh topic with missing AI content
- Open Core Concepts AI → select a topic that triggers generation.
- Expected:
  - Exactly one generating toast appears.
  - No duplicate generating toasts appear (even if the component re-renders).
  - When generation finishes:
    - generating toast dismisses within the same moment (no lingering).
    - no success toast appears (if we remove it), so no overlap.

2) Close while generating
- Start generation, then immediately close the player.
- Expected:
  - generating toast disappears on close (cleanup works).
  - no stuck toast remains on the home screen.

3) Re-open same topic after generation
- Re-open the same topic.
- Expected:
  - no generating toast shows (because `needsAIContent` is now false with fresh query-derived data).
  - content is shown immediately (updated topic object).

4) Error path (simulate by breaking the edge function or disconnecting)
- Expected:
  - generating toast dismisses.
  - optional single error toast shows (or nothing, depending on the chosen simplification).
  - no overlap.

Files to change
- `src/components/DailyDownloadPlayer.tsx`
  - remove/guard mutation reset
  - enforce single generating toast instance
  - add cleanup
  - remove success toast (recommended) to avoid overlap
- `src/pages/Index.tsx`
  - store `selectedTopicId` instead of whole topic object
  - derive selected topic from `subjectTopics`

Notes / trade-offs
- Removing the success toast is the simplest way to guarantee no overlap and align the UX. The updated content in the UI becomes the “success signal.”
- If you want a success signal later, we can do a “replace-in-place” toast using the same toast ID (no stacking) as a follow-up improvement.