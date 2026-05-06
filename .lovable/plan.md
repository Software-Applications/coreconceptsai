## Goal

Deliver a 60-second MP4 product video for Core Concepts AI that walks through Problem → Solution → Live Demo → Business Value, narrated with an energetic, confident Google TTS voice.

## Deliverable

`/mnt/documents/core-concepts-ai-60s.mp4` (1920x1080, ~60s, H.264 + AAC)

## Structure (60 seconds total)


| Time      | Section                  | Visual                                                         | Narration beat                                                                                                                                                                                                                                                            |
| --------- | ------------------------ | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0:00–0:12 | **Problem**              | Slide 2 (rendered from deck)                                   | "Students lose hours of learning to dead time. Reading is slow. Audiobooks cause passive audio fatigue. And the found moments — commutes, the gym, chores — go completely unused."                                                                                        |
| 0:12–0:27 | **Solution**             | Slide 3 (rendered from deck)                                   | "**Core Concepts AI** turns those minutes into active study. A multi-agent pipeline — Architect, Script Writer, Audio Engineer — generates 5 to 15 minute audio explanations with active prompting and retrieval check-ins. **Built for retention, not just listening.**" |
| 0:27–0:48 | **Live Demo** (use case) | 3 live prototype screenshots animated as a flow, with captions | "Meet Maya. Bio undergrad, 22-minute bus ride, one tough topic. She opens Pearson Plus, taps Core Concepts, picks Krebs Cycle from her chapter, and listens — **natural voice, live transcript, retrieval prompts**. She arrives on campus already primed for lecture."   |
| 0:48–0:60 | **Business Value**       | Slide 5 (rendered from deck)                                   | "Three metrics move: mobile app engagement, frequency in the 14-day exam window, and efficiency from cached transcripts. Core Concepts AI — turning idle minutes into active study."                                                                                      |


## Voice & tone

- Voice: `en-US-Neural2-J` (male, warm + confident) **or** `en-US-Neural2-F` (female, energetic) — I'll pick J as default, swap easily
- Speaking rate: `1.05` (slightly above normal for energy)
- One continuous narration track, generated via the existing `google-tts` edge function (Google Cloud TTS). No new API key, no new connector.

## Technical approach

```text
1. Render deck slides → PNG
   - LibreOffice headless: pptx → pdf → pdftoppm → slide_2.png, slide_3.png, slide_5.png

2. Capture live prototype screenshots
   - browser--navigate_to_sandbox at 414x896
     a. /  → home with Core Concepts card highlighted
     b. tap Core Concepts → topic selection (Krebs Cycle area)
     c. tap topic → audio player with transcript visible
   - Save to /tmp/demo_1.png, demo_2.png, demo_3.png

3. Generate voiceover
   - Single ~150-word script, written for ~60s at rate 1.05
   - Call the deployed google-tts edge function (supabase--curl_edge_functions) with full script
   - Save returned base64 MP3 → /tmp/vo.mp3
   - Probe duration with ffprobe; tune script length if off by >2s

4. Build video with ffmpeg
   - Each segment = still image (or Ken Burns slow zoom on demo shots) for its duration
   - Demo segment: 3 phone-frame shots, ~7s each, with subtle zoom + caption overlay
   - Concat segments with crossfade transitions (xfade, 0.4s)
   - Mux with vo.mp3 as audio track
   - Output: 1920x1080, 30fps, H.264 yuv420p, AAC 192k

5. QA
   - ffprobe to confirm duration is 58–62s
   - Extract 6 keyframes (every 10s) and inspect for layout/caption issues
   - Re-encode if anything is clipped or off-time
```

## Visual treatment for demo segment

- Phone screenshots framed in a dark navy device bezel (matches deck's Midnight Executive theme)
- Subtle Ken Burns zoom (1.0 → 1.05 over 7s) on each shot for liveliness
- Caption strip at bottom: "1. Open Core Concepts" / "2. Pick a topic" / "3. Listen + retrieve"
- Violet accent bar on left edge of caption (matches deck motif)

## Assumptions (confirm or override)

- **Voice**: Neural2-J (male, confident). Want female (Neural2-F) instead? Say so.
- **TTS provider**: Google Cloud TTS via existing edge function. Not Gemini native TTS.
- **Music**: No background music (60s is tight; voice-only keeps it punchy and clear). Add later if you want.
- **Aspect**: 16:9 1920x1080. Want 9:16 vertical for social? Easy swap.

## Out of scope

- New TTS connector setup
- Subtitles/SRT file (can add if you want)
- Multiple voice variants