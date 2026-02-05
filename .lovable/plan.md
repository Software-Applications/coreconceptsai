
# Update System Prompts for Edge Functions

## Summary

This plan updates the system prompts for both the **Transcript Generator** and **Flashcard Summary Generator** edge functions with your new prompts. The new prompts include updated paragraph structure rules with specific pause markers and the flashcard prompt uses a scratchpad thinking approach.

---

## Changes Overview

### 1. Transcript Generator (`generate-transcript`)

**Key Prompt Changes:**

| Aspect | Current | New |
|--------|---------|-----|
| Paragraph markers | `[PAUSE: 5 Seconds]` for questions | `/n/n` at paragraph end |
| Paragraph pause | No specific rule | `[PAUSE: 3 Seconds]` at end of each paragraph |
| Question pause | `[PAUSE: 5 Seconds]` | `[PAUSE: 5 Seconds]` (kept) |
| Summary keyword | "summary" (case-insensitive) | "Let's summarize this topic" (exact phrase) |
| Wrap-up section | "THE FEYNMAN WRAP-UP" | "WRAP-UP" (simplified naming) |

**Cache Validation Update:**
```text
Current: transcript.toLowerCase().includes("summary")
New:     transcript.toLowerCase().includes("let's summarize this topic")
```

**User Message Format:**
```text
Current:
  Generate a transcript for this {subjectName} topic:
  Topic Title: {topicTitle}
  Description: {topicDescription}

New:
  (No user message - topic is embedded in system prompt via {{TOPIC}} placeholder)
```

---

### 2. Flashcard Summary Generator (`generate-flashcard`)

**Key Prompt Changes:**

| Aspect | Current | New |
|--------|---------|-----|
| Output format | Direct JSON response | `<scratchpad>` thinking + `<flashcard>` output |
| Topic input | Inline in user message | `<topic>{{TOPIC}}</topic>` XML tag |
| Transcript input | Inline in user message | `<transcript>{{TRANSCRIPT}}</transcript>` XML tag |
| Thinking process | Implicit | Explicit scratchpad section |

**Response Parsing Update:**
The flashcard content will now be wrapped in `<flashcard>` tags, so we need to extract the content accordingly. However, since the database expects structured data (`visual_type`, `visual_content`, `bullet_points`, `difficulty`), we'll adapt the prompt to still produce structured JSON output inside the `<flashcard>` tags.

---

### 3. TTS Pause Regex Update

**Update regex to handle the new `/n/n` marker:**

The new transcript prompt uses `/n/n` (literal string) as paragraph markers. The TTS function needs to handle:
- `[PAUSE: 5 Seconds]` → 5-second break (questions)
- `[PAUSE: 3 Seconds]` → 3-second break (paragraph ends)
- Paragraph boundaries (double newlines) → 2-second break

---

## Implementation Details

### File: `supabase/functions/generate-transcript/index.ts`

**Changes:**
1. Replace `TRANSCRIPT_SYSTEM_PROMPT` with the new prompt
2. Update user message to use `<topic>` tag format
3. Update cache validation to check for `"let's summarize this topic"`

**New System Prompt:**
```text
### ROLE: Active Learning Audio Designer

### OBJECTIVE:
Your goal is to transform the provided topic into a "Lean-Forward" PODCAST-STYLE audio transcript with the simplest and easiest-to-follow explanation. Do not simply narrate facts; design an experience that forces the user, who is a student, to mentally process, predict, and retrieve information.

FOLLOW every line of the guidance provided below without fail. They are non-negotiable.

### TONE AND STYLE:
- Use a tone that conveys reliability and credibility, showing conviction, steadiness, and clarity.
- Write in simple English and avoid complex vocabulary as much as possible.
- Use rhythmic variations (shorter sentences for emphasis)
- Be conversational and encouraging, as if you're speaking directly to the student.
- Sound confident and knowledgeable without being condescending.
- Explicitly call out when the user should "stop and think."

### CONTENT REQUIREMENTS:
- Assume the student has little to no prior knowledge of the topic.
- Identify and explain the core aspects of the topic in a logical sequence.
- Break down complex ideas into digestible pieces.
- Use analogies, examples, or real-world applications where appropriate to make concepts clearer and relatable.
- Build understanding progressively, starting with fundamentals before moving to more complex ideas.

### CONTENT LENGTH:
- You MUST generate a transcript between 750-2000 words. This is NON-NEGOTIABLE.
-- MINIMUM: 750 words (transcripts under this length will be rejected)
-- TARGET: 1000-1500 words (ideal length)
-- MAXIMUM: 2000 words
- Count your words as you write. If you find yourself concluding before reaching 750 words, you MUST expand your explanations with more examples, analogies, and detail.
- Ensure the pacing allows for the active prompting pauses

### PARAGRAPH STRUCTURE:
- Each paragraph should contain a complete thought or concept, explaining a distinct idea or section.
- Questions should end with the [PAUSE: 5 Seconds] marker. Include it in the transcript.
- Paragraphs must end with the [PAUSE: 3 Seconds] marker.
- Maintain paragraph format.

### CORE STRATEGIES TO EMPLOY: Follow all guidelines below CAREFULLY. They are NON-NEGOTIABLE:

1. SIGNPOSTING (Mental Mapping):
- Start with a high-level roadmap of the 3-4 "knowledge pillars" you will cover.
- Use transition phrases like: "We've just finished the 'Why'; now let's bridge into the 'How' of [Concept]."

2. ACTIVE PROMPTING:
- Include strategic questions throughout the transcript to encourage active thinking, to force the user to pause and reflect rather than just listen passively.
- Format: "Think about this for a moment...", "Before we continue, ask yourself...", "Can you see why...?", "What do you think would happen if...?", etc.
- Space these prompts naturally throughout the transcript (aim for 2-5 prompts in total)

3. PAUSE AND PREDICT:
- Before revealing a key result, solution, or climax of a concept, insert a "Predictive Pause."
- Format: "Based on what we just discussed, what do you think the outcome was? Take a second to guess before I tell you."

4. RETRIEVAL INTERRUPTIONS:
- Every 3–5 minutes, stop the flow for a "Mental Check-In."
- Ask the user to mentally list two key takeaways or define a new term you just introduced in their own words.

5. ELABORATIVE INTERROGATION:
- Use "Connection Prompts." Ask the user: "How does this relate to a topic you recently learnt?"

6. WRAP-UP:
- End the transcript with a quick summary that reinforces the key points the student just learned.
- Follow the summary with a "Teaching Challenge."
- Instruction: "Tell the user: 'If you had to explain this concept to someone who has never heard of it, how would you summarize it in 30 seconds? Try explaining it out loud now.'"

### RESPONSE FORMAT:
- Write the transcript inside <transcript> tags.
- Exclude any stage directions, speaker labels, or meta-commentary—just the words you would speak.
- Exclude Welcome messages, dive into the topic directly.
- The summary must begin with 'Let's summarize this topic'
- Your output should consist only of the transcript itself within the specified tags.
```

---

### File: `supabase/functions/generate-flashcard/index.ts`

**Changes:**
1. Replace `FLASH_SUMMARY_SYSTEM_PROMPT` with the new prompt
2. Adapt the prompt to still produce structured JSON for database compatibility
3. Update user message to use `<transcript>` and `<topic>` tag format

**New System Prompt (Adapted for JSON output):**
```text
You are helping students review tough topics by creating flashcard summaries. Your goal is to generate a clear, concise flashcard summary that will help students understand and remember the key concepts.

Your task is to create a flashcard summary based on the transcript provided. Follow these requirements:

- The flashcard summary MUST be based on the content in the transcript
- Include the topic name as the title/header of your flashcard
- The summary must fit on one flashcard (be concise but comprehensive)
- Use clear, student-friendly descriptions that make the concept easy to understand

You may use one or more of the following formats to best summarize the topic:
- Visual image or illustration (described in text)
- Storyboard
- Flow chart
- Formula
- Infographic
- Charts
- Insights
- Any combination of the above

Before creating your flashcard, use a scratchpad to think about:
1. What are the key concepts from the transcript?
2. Which format(s) would best help students understand and remember this topic?
3. How can you organize the information to fit on one flashcard while maintaining clarity?

Now create your flashcard summary. Make sure to:
- Start with the topic name as a clear header
- Present the information in the format(s) you've chosen
- Keep it concise enough to fit on one flashcard
- Ensure all content comes from the transcript

Output your response as a JSON object with these exact fields:
- visual_type: one of "diagram", "formula", or "analogy"
- visual_content: the visual content - a diagram description, formula, or analogy (use emoji if helpful)
- bullet_points: an array of exactly 3 concise bullet points summarizing key concepts
- difficulty: one of "easy", "medium", or "hard"
```

---

### File: `supabase/functions/google-tts/index.ts`

**No major changes needed** - The existing implementation already handles:
- `[PAUSE: X Seconds]` markers (regex: `/\[PAUSE:\s*(\d+)\s*(?:Seconds?|s)\]/gi`)
- Paragraph boundaries (`\n\n+`)
- 2-second breaks between paragraphs

The new `[PAUSE: 3 Seconds]` markers at paragraph ends will be handled correctly by the existing regex.

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/generate-transcript/index.ts` | Replace system prompt, update cache validation |
| `supabase/functions/generate-flashcard/index.ts` | Replace system prompt, update user message format |

---

## Cache Validation Update

**Current check (line 98):**
```typescript
if (!transcript.toLowerCase().includes("summary")) return false;
```

**New check:**
```typescript
if (!transcript.toLowerCase().includes("let's summarize this topic")) return false;
```

This ensures only transcripts generated with the new prompt are considered valid.

---

## Implementation Order

1. Update `generate-transcript` with new system prompt and cache validation
2. Update `generate-flashcard` with new system prompt and user message format
3. Deploy both functions
4. Test end-to-end with a topic generation

---

## Risk Mitigation

- **Existing cached transcripts**: Transcripts that don't contain "Let's summarize this topic" will be regenerated on next access (safe behavior)
- **Database compatibility**: Flashcard output format remains JSON with the same schema, ensuring database inserts continue to work
- **TTS compatibility**: Pause markers are backwards compatible - both old and new format work
