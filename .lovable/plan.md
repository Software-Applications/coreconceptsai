## Goal

Tighten the executive deck and the 60-second MP4 to address the five issues you flagged. Keep total runtime at 60 seconds, keep narration coherent, and make the demo segment look like the actual Core Concepts AI prototype.

## Changes

### 1. Title slide is thumbnail-only (no VO)

- Slide 1 stays in the deck and is used as the **MP4 poster/thumbnail** only.
- Video playback starts directly with the Problem narration at 0:00.
- New segment timing (60s total, no gap):
  ```text
  0:00 – 0:13   Problem        (slide 2)
  0:13 – 0:28   Solution       (slide 3)
  0:28 – 0:48   Live demo      (Remotion, real prototype)
  0:48 – 1:00   Business value (slide 5)
  ```

### 2. Problem slide — reformat + real in-app screenshot + inventor-tone opportunity

- Re-render Slide 2 in `core-concepts-ai-exec-deck.pptx`:
  - Fix line-height, alignment, and bullet spacing of the two voice-of-customer quotes (currently overflowing / inconsistent).
  - Highlight key phrases consistently (one accent color, bold weight, no mixed sizes).
  - Replace the current marketing screenshot with a **real screenshot captured from the running prototype** at `/` (Home with Core Concepts card visible) using the browser tool at 390×844, framed in the deck's dark phone bezel.
  - Rewrite the opportunity line in a bold inventor's tone, e.g.:
    > **"We're converting dead time into the highest-retention learning moment of the day."**
  - Move opportunity to a full-width band under the quotes so it reads as the punchline.
- Re-render Slide 2 to PNG for the MP4.

### 3. Solution slide — typography fix + multi-agent AI pipeline

- Slide 3 typography pass: unify header font (Georgia 36pt), body (Calibri 16pt), consistent leading, remove mixed sizes inside the Bloom's pyramid labels.
- Add a compact **multi-agent pipeline strip** above the pyramid:
  ```text
  [Architect] → [Script Writer] → [Audio Engineer]
  ```
  Each node in a violet rounded chip with a one-line role caption underneath. Arrow connectors in ice-blue.
- Keep the Bloom's pyramid + "lifts learners from Remember/Understand → Apply/Analyze" arrow but shrink slightly to make room for the pipeline strip.
- Update VO to call out the multi-agent pipeline explicitly.

### 4. Live demo — use the real prototype via Remotion

- Replace the PIL-rendered animation with a **Remotion scene that embeds real prototype screenshots** captured from the running app, sequenced and animated with `useCurrentFrame()` + `spring()`:
  1. `/` — Home with Core Concepts card
  2. Core Concepts hub — search drawer open with "epigenetics" typed
  3. Topic selected — generating overlay
  4. Audio player — transcript with active word highlight + 3px amber progress bar
- Capture flow: `browser--navigate_to_sandbox` at 390×844, drive the actual app, `browser--screenshot` at each step → save into `remotion/public/images/`.
- Compose in Remotion at 1920×1080:
  - Phone frame centered-right, subtle Ken Burns + tap ripple overlays at the exact tap coordinates.
  - **Left-side step caption** rendered at **17px (scaled to 1080p ≈ 38px on canvas)** — so it reads as 17px in a phone-sized preview but is clearly legible in the 1920×1080 MP4. Heading 28px on phone scale (62px canvas), body 17px (~38px canvas). No more 10–12px micro text.
  - One step caption per beat: "1. Open Core Concepts" / "2. Search a topic" / "3. Generate audio" / "4. Listen + retrieve".
- Render demo segment to `/tmp/seg_04_demo.mp4` (20s, 30fps, H.264) via the programmatic Remotion render script; mux with `04_demo.mp3`.

### 5. Business value slide — legible link + concrete benefits

- Slide 5 redo:
  - Replace the small footer URL with a **prominent CTA bar** at the bottom: white pill on violet, text `**coreconceptsai.lovable.app**` at 24pt bold, full clickable hyperlink (python-pptx `add_hyperlink`). Same hyperlink applied to the slide title for redundancy.
  - Expand the three benefits from one-liners to **headline + one-sentence proof**:
    1. **Mobile engagement.** Turns commute, gym, and chore time into 5–15 min active study sessions inside Pearson Plus.
    2. **Exam-window frequency.** Retrieval prompts and signposting drive repeat opens in the 14-day pre-exam window when usage spikes matter most.
    3. **Unit-cost efficiency.** Cached transcripts + chunked TTS reuse cut per-listen synthesis cost as the same topics are replayed across cohorts.
  - Layout: 3 vertical cards, violet number badge, bold header (Georgia 22pt), body (Calibri 14pt), 0.4" gutters.
- Re-render Slide 5 to PNG for the MP4.

## Narration (rewritten, ~155 words, ~60s @ 1.05x)

```text
[PROBLEM 0:00–0:13]
Students lose hours to dead time. Reading is slow. Audiobooks invite passive
fatigue — progress that fails the retention test. The found minutes — commutes,
the gym, chores — go completely unused.

[SOLUTION 0:13–0:28]
Core Concepts AI turns those minutes into active study. A multi-agent pipeline —
Architect, Script Writer, Audio Engineer — generates five-to-fifteen minute
explanations with retrieval prompts and narrative scaffolds that lift learners from remember-and-
understand into apply-and-analyze.

[DEMO 0:28–0:48]
Here's the flow. Open Core Concepts. Search a topic — epigenetics. Tap to
generate. Natural voice, live transcript, retrieval check-ins. The bus ride is
now a study session.

[VALUE 0:48–1:00]
Engineered to lift Pearson's "value per minute". Three metrics move: mobile engagement, exam-window frequency, and unit-cost efficiency from cached transcripts. 
```

## Technical execution order

1. Edit `core-concepts-ai-exec-deck.pptx` slides 2, 3, 5 with python-pptx; re-export to PDF → PNG.
2. Spin up Remotion project under `remotion/`, capture real prototype screenshots via `browser--navigate_to_sandbox` + `browser--screenshot`, drop into `remotion/public/images/`.
3. Build `remotion/src/scenes/Demo.tsx` with the 4-step flow and large left-side captions; render `seg_04_demo.mp4`.
4. Regenerate VO via `google-tts` edge function (`en-US-Neural2-J`, rate 1.05) as 4 segments aligned to the new timing; concat.
5. FFmpeg concat: `seg_02_problem.mp4` (slide 2 still) + `seg_03_solution.mp4` (slide 3 still) + `seg_04_demo.mp4` + `seg_05_value.mp4` (slide 5 still), mux with concatenated VO; output to `/mnt/documents/core-concepts-ai-60s.mp4` (versioned `_v2` if you want to keep the current one).
6. Save updated deck to `/mnt/documents/core-concepts-ai-exec-deck.pptx` (overwrite).
7. QA: ffprobe duration 59.5–60.5s; render 6 keyframes + every deck slide to JPG and inspect for typography, link legibility, and demo readability.

## Out of scope

- Background music, subtitles file, vertical 9:16 cut, voice swap. Easy follow-ups if you want them.