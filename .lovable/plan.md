## Goal

Rebuild `core-concepts-ai-60s.mp4` using the four uploaded slide screenshots as the static visuals, with a simulated prototype animation for the demo segment (matching the style from the second iteration). Reuse the existing VO segments — no script changes.

## Inputs

- `user-uploads://image-50.png` → **Thumbnail / Slide 1** (Title — "Core Concepts AI"). No VO. Used as the MP4 poster only; playback starts at the Problem.
- `user-uploads://image-51.png` → **Slide 2 — Problem** (paired with existing `02_problem.mp3`)
- `user-uploads://image-52.png` → **Slide 3 — Solution** (paired with existing `03_solution.mp3`)
- `user-uploads://image-53.png` → **Slide 5 — Business Value** (paired with existing `05_value.mp3`)
- **Demo segment (Slide 4)** — recreated as a simulated animation in the style of the second MP4 iteration (PIL-rendered phone bezel + composed prototype frames + large left-side step caption), paired with existing `04_demo.mp3`.

## Timing (60s total)

```text
0:00 – 0:14   Problem        (image-51 still + 02_problem.mp3)
0:14 – 0:28   Solution       (image-52 still + 03_solution.mp3)
0:28 – 0:44   Demo           (simulated animation + 04_demo.mp3)
0:44 – 1:00   Business value (image-53 still + 05_value.mp3)
```

Title slide (image-50) is encoded as the first frame / poster only — not part of timed playback.

## Demo segment (simulated, ~16s)

Recreate the second-iteration approach:

1. Copy the 6 prototype screenshots already captured in `/tmp/proto/` (Home, Core Concepts hub, Search drawer with "epigenetics", Topic selected, Generating overlay, Audio player) — re-capture via `browser--navigate_to_sandbox` at 390×844 if they're no longer present.
2. Compose a 1920×1080 canvas using **PIL**:
   - Phone bezel centered-right with the prototype screenshot inside.
   - Left-side step caption (~38px on canvas ≈ 17px phone-scale), bold, one beat per step.
   - Subtle crossfade between steps.
3. Beats (4 steps × ~4s):
   - "1. Open Core Concepts"
   - "2. Search a topic"
   - "3. Generate audio"
   - "4. Listen + retrieve"
4. Render frames at 30fps → encode `seg_04_demo.mp4` with H.264, mux with `04_demo.mp3`.

## Execution steps

1. Copy uploads into `/tmp/slides/`:
   - `code--copy user-uploads://image-50.png /tmp/slides/slide-01.png` (and 51→02, 52→03, 53→05).
2. Re-encode each still slide as a video segment of length matching its VO + 0.4s `apad`:
   ```bash
   ffmpeg -loop 1 -i /tmp/slides/slide-02.png -i /tmp/vo/02_problem.mp3 \
     -af "apad=pad_dur=0.4" -c:v libx264 -tune stillimage -pix_fmt yuv420p \
     -r 30 -vf "scale=1920:1080" -c:a aac -b:a 192k -shortest /tmp/seg_02.mp4
   ```
   Repeat for slides 3 and 5.
3. Build demo segment per "Demo segment" section above → `/tmp/seg_04_demo.mp4`.
4. Concat: `seg_02 + seg_03 + seg_04_demo + seg_05` → `/mnt/documents/core-concepts-ai-60s.mp4`.
5. Encode `image-50.png` as the MP4 poster via `-vf` thumbnail attach (or simply leave as the file's preview thumbnail by adding a 0.04s lead-in frame of slide-01 — preferred so video players show the title on hover without affecting timed VO).
6. QA:
   - `ffprobe` confirms duration 59.5–60.5s.
   - Extract 1 keyframe from each segment (problem / solution / demo midpoint / value) and inspect that the correct uploaded screenshot is shown and demo captions are legible.

## Out of scope

- VO edits (script unchanged from the latest 60s cut).
- Deck (`.pptx`) edits — slides are taken as-is from the user-provided screenshots.
- Background music, subtitles, vertical 9:16 cut.

## Deliverable

`/mnt/documents/core-concepts-ai-60s.mp4` (overwrites current).
