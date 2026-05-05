
## Goal
Generate a polished 5-slide PPTX deck pitching Core Concepts AI to executives, using the provided product story as-is (aspirational framing), with real screenshots from the live app.

## Deliverable
`/mnt/documents/core-concepts-ai-exec-deck.pptx`

## Deck structure

**Slide 1 — Title**
- "Core Concepts AI"
- Subtitle: "Turning idle minutes into active study"
- Pearson+ executive-audience framing, date, presenter line

**Slide 2 — The Problem**
- Header: "Students lose hours of learning to dead time"
- Three stat-style callouts: Reading is slow · Audiobooks cause Passive Audio Fatigue · Found moments (commutes, gym, chores) go unused
- Closing line: "Pearson+ captures dedicated study blocks — but not the hours in between."

**Slide 3 — The Solution (with home screen screenshot)**
- Header: "AI-generated 5–15 min audio explanations, built for retention"
- Left: screenshot of the app home with the Core Concepts card visible
- Right: 4 bullet pillars from the story — Multi-agent pipeline (Architect → Script Writer → Audio Engineer), Active Prompting, Retrieval Interruptions, Narrative Scaffolding
- Footer tag: "Integrity-first. Concept mastery, not answer keys."

**Slide 4 — Use Case (with flow screenshots)**
- Header: "Maya, Bio undergrad. 22-min bus ride. One tough topic."
- Horizontal 3-step flow with screenshots:
  1. Opens Pearson+ on the bus → taps Core Concepts (home screenshot)
  2. Picks "Krebs Cycle" from her Biology chapter (topic selection screenshot)
  3. Listens with natural voice + transcript, pauses for retrieval check-ins (player screenshot)
- Outcome line: "Arrives on campus already primed for lecture."

**Slide 5 — Business Value**
- Header: "Why this moves Pearson+ metrics"
- Three columns:
  - **Engagement** — Listening minutes / active user / week
  - **Retention** — Login frequency in 14-day exam window (exam-aware highlighting)
  - **Efficiency** — Pre-generated transcript cache reduces redundant AI spend
- Bottom strip: "What's next — Bloom's-aligned MCQs · Level toggles (Beginner ↔ Advanced)"

## Visual design
- Palette: **Midnight Executive** (navy `#1E2761`, ice blue `#CADCFC`, white) — premium exec feel matching the app's primary navy/blue
- Accent: violet/purple gradient stripe on title + section headers, mirroring the app's Core Concepts AI brand badge
- Typography: Georgia headers / Calibri body
- Sandwich structure: dark navy on slides 1 & 5, light on 2–4
- One consistent motif: thin violet accent bar on the left of each content block
- All app screenshots framed in a subtle rounded device-style border with soft shadow

## How screenshots will be captured
1. `browser--navigate_to_sandbox` to `/` at iPhone-frame viewport (414x896) → screenshot home with Core Concepts card
2. Tap Core Concepts card → screenshot topic selection drawer
3. Open a topic → screenshot the audio player with transcript
4. Save to `/tmp/` and embed as base64 in pptx (per skill rules)

## Build approach
- Use `pptxgenjs` (Node) per the pptx skill
- Embed screenshots as base64 (never path refs)
- Render to PDF via LibreOffice → `pdftoppm` → visual QA every slide
- Iterate on overlap / contrast / clipping until clean
- Final output: `/mnt/documents/core-concepts-ai-exec-deck.pptx` delivered via `presentation-artifact` tag

## Notes on framing (per your choice)
Using the product story **as-is** — Active Prompting, Retrieval Interruptions, multi-agent pipeline, and Narrative Scaffolding will all be presented as live capabilities. Bloom's MCQs and level toggles stay in the "What's next" footer on slide 5, exactly as written in the story's Future Scope.
