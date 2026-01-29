

# Real-Time AI Content Generation with Google AI Studio

## Overview

This plan replaces the current Lovable AI gateway integration with **direct calls to Google's Generative Language API**, allowing your app to generate transcripts and flash summaries on-the-fly when a user selects a topic.

## How Google AI Studio Agents Work

When you create an "agent" in Google AI Studio, you're essentially configuring:
1. A **system prompt** (instructions for the model)
2. A **model** (like Gemini 2.5 Flash or Nano Banana)
3. Optional **tools** and **structured output** settings

To call this from your app, you use the **Google Generative Language API** with your API key and replicate the agent's configuration in the API request.

## Architecture

```text
User selects topic
        │
        ▼
┌──────────────────┐      ┌─────────────────────────────┐
│  Frontend        │      │  Supabase Edge Functions    │
│  (React)         │─────▶│                             │
│                  │      │  ┌─────────────────────┐    │
│  TopicSelection  │      │  │ generate-content    │    │
│  or Player opens │      │  │                     │    │
└──────────────────┘      │  │ 1. Call Gemini API  │    │
                          │  │    (transcript)     │    │
                          │  │                     │    │
                          │  │ 2. Call Gemini API  │    │
                          │  │    (flash summary)  │    │
                          │  │                     │    │
                          │  │ 3. Save to DB       │    │
                          │  │ 4. Return results   │    │
                          │  └─────────────────────┘    │
                          └─────────────────────────────┘
                                       │
                                       ▼
                          ┌─────────────────────────────┐
                          │  Google Generative AI API   │
                          │  generativelanguage.        │
                          │  googleapis.com             │
                          │                             │
                          │  • Transcript Agent config  │
                          │  • Flash Summary Agent      │
                          │    (Nano Banana model)      │
                          └─────────────────────────────┘
```

## Implementation Steps

### Step 1: Add Your Google API Key as a Secret

You'll need to add your Google AI Studio API key to Supabase secrets so the edge function can use it securely.

**How to get your API key:**
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Click "Get API Key" in the top navigation
3. Create or select a project
4. Copy the generated API key

### Step 2: Create Unified Edge Function

Replace the two existing Lovable AI edge functions with a single `generate-content` function that:
- Accepts a topic ID
- Calls Google's API twice (once for transcript, once for flash summary)
- Uses your configured agent prompts
- Saves results to the database
- Returns the generated content

**API Endpoint Format:**
```
POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
Headers:
  x-goog-api-key: AIzaSyCP8o_j3rb-sscCFnuuzO3QLi332kMlpCs
  Content-Type: application/json
```

**Models Available:**
- `gemini-flash-lite-latest` - For transcript generation
- `gemini-3-pro-image-preview` (Nano Banana) - For visual flash summaries

### Step 3: Configure Agent Prompts in Edge Function

The edge function will contain your agent configurations (the same system prompts you use in AI Studio):

**Transcript Agent Config:**
- Model: `gemini-flash-lite-latest`
- System prompt: 
You are one of the best educators and excel at breaking down tough topics with the simplest and easiest-to-follow explanations. Your task is to generate a podcast-style transcript that teaches a student about a specific topic.

Here is the topic you need to create a transcript for:

<topic>
{{TOPIC}}
</topic>

Your goal is to create an educational podcast transcript that helps a student who doesn't understand this topic well and is looking for your help to break it down and understand it better.

Follow these guidelines carefully:

TONE AND STYLE:
- Use a tone that conveys reliability and credibility, showing conviction, steadiness, and clarity
- Write in simple English and avoid complex vocabulary as much as possible
- Be conversational and engaging, as if you're speaking directly to the student
- Sound confident and knowledgeable without being condescending

CONTENT REQUIREMENTS:
- Assume the student has little to no prior knowledge of the topic
- Identify and explain the core aspects of the topic in a logical sequence
- Break down complex ideas into digestible pieces
- Use analogies, examples, or real-world applications where appropriate to make concepts clearer
- Build understanding progressively, starting with fundamentals before moving to more complex ideas

STRUCTURE:
- Begin with an engaging introduction that explains what the topic is and why it matters
- Develop the main content by explaining the core concepts systematically
- End with a summary that reinforces the key points the student just learned

ACTIVE PROMPTING:
- Include strategic pauses and questions throughout the transcript to encourage active thinking
- Use phrases like "Think about this for a moment...", "Before we continue, ask yourself...", "Can you see why...?", "What do you think would happen if...?"
- These prompts should force the student to pause and reflect rather than just listen passively
- Space these prompts naturally throughout the transcript (aim for 2-5 prompts in total)

LENGTH:
- The transcript should be appropriate for a 5-15 minute podcast
- This typically translates to approximately 750-2000 words
- Ensure the pacing allows for the active prompting pauses

FORMAT YOUR RESPONSE:
Write your complete podcast transcript inside <transcript> tags. The transcript should flow naturally as spoken dialogue from you (the educator) to the student. Include the active prompting questions and pauses as part of the natural flow of the transcript. Do not include any stage directions, speaker labels, or meta-commentary—just the words you would speak.

Your output should consist only of the transcript itself within the specified tags.
- Output: Plain text (750-2000 words)

**Flash Summary Agent Config:**
- Model: `gemini-3-pro-image-preview` (Nano Banana)
- System prompt:
You are helping students review tough topics by creating flashcard summaries. Your goal is to generate a clear, concise flashcard summary that will help students understand and remember the key concepts.

Here is the transcript or explanation for the topic:

<transcript>
{{TRANSCRIPT}}
</transcript>

The topic you need to create a flashcard for is:

<topic>
{{TOPIC}}
</topic>

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

<scratchpad>
[Your planning thoughts here]
</scratchpad>

Now create your flashcard summary. Make sure to:
- Start with the topic name as a clear header
- Present the information in the format(s) you've chosen
- Keep it concise enough to fit on one flashcard
- Ensure all content comes from the transcript

Write your complete flashcard inside <flashcard> tags. Your final output should contain only the flashcard content, not the scratchpad.

- Output: Structured JSON with visual_type, visual_content, bullet_points, difficulty

### Step 4: Trigger Generation on Topic Selection

Modify the app flow to:
1. Check if topic already has AI-generated content
2. If not, call the edge function to generate it
3. Show loading state while generating
4. Cache results in database for future visits

### Step 5: Update UI for Loading States

Add visual feedback when content is being generated:
- Skeleton loading for flash cards
- "Generating transcript..." indicator
- Progress indication for longer generations

## Files to Change

| File | Action | Purpose |
|------|--------|---------|
| `supabase/functions/generate-content/index.ts` | Create | Unified content generation with Google API |
| `supabase/functions/generate-summary/index.ts` | Delete | No longer needed |
| `supabase/functions/generate-transcript/index.ts` | Delete | No longer needed |
| `supabase/config.toml` | Update | Remove old functions, add new one |
| `src/hooks/useAIGeneration.ts` | Update | Call new unified endpoint |
| `src/hooks/useTopics.ts` | Update | Add auto-generation trigger |
| `src/components/DailyDownloadPlayer.tsx` | Update | Show loading states, remove manual AI button |
| `.lovable/plan.md` | Update | Document new approach |

## Technical Details

### Google Generative AI API Request Format

```typescript
// Transcript generation
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`,
  {
    method: 'POST',
    headers: {
      'x-goog-api-key': GOOGLE_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: "Your transcript agent system prompt here..." }]
      },
      contents: [{
        parts: [{ text: `Generate a transcript for: ${topicTitle}` }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      }
    })
  }
);
```

### Structured Output for Flash Summaries

For the flash summary agent, use the `responseSchema` to get structured JSON:

```typescript
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`,
  {
    method: 'POST',
    headers: {
      'x-goog-api-key': GOOGLE_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: "Your flash summary agent system prompt here..." }]
      },
      contents: [{
        parts: [{ text: `Create a flash summary for: ${topicTitle}` }]
      }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            visual_type: { type: "string", enum: ["diagram", "formula", "analogy"] },
            visual_content: { type: "string" },
            bullet_points: { type: "array", items: { type: "string" } },
            difficulty: { type: "string", enum: ["easy", "medium", "hard"] }
          },
          required: ["visual_type", "visual_content", "bullet_points", "difficulty"]
        }
      }
    })
  }
);
```

### Caching Strategy

Generated content is saved to the database so:
- First visit to a topic triggers generation
- Subsequent visits use cached content
- Users can manually regenerate if desired

## User Experience Flow

1. **User opens Topic Selection Sheet**
2. **User taps a topic** → DailyDownloadPlayer opens
3. **If no transcript exists:**
   - Show loading skeleton
   - Edge function generates transcript + flash summary
   - Results appear (typically 3-8 seconds)
4. **If content exists:** Display immediately from cache
5. **Optional:** User can tap "Regenerate" to create fresh content

## What You'll Need to Provide

1. **Google API Key** - From AI Studio (I'll prompt you to add it as a secret)
2. **Transcript Agent System Prompt** - Copy from your AI Studio agent configuration
3. **Flash Summary Agent System Prompt** - Copy from your Nano Banana agent

## Estimated Time

The implementation should take approximately 15-20 minutes once you provide the prompts and API key.

