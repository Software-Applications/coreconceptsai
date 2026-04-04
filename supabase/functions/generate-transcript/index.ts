import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Retry delays: 1s, 2s, 5s
const RETRY_DELAYS = [1000, 2000, 5000];

const TRANSCRIPT_SYSTEM_PROMPT = `PROMPT 1: The Architect (Structure & Analogy)

### ROLE: Pedagogical Instructional Designer & Curriculum Architect

### INPUT VARIABLES:
Topic: {{TOPIC}}
Analogy Choice: [AI will auto select the best style based on the topic's {{TOPIC}} complexity]. Use the instruction in 'DYNAMIC ANALOGY SELECTION' section to make the selection.

### DYNAMIC ANALOGY SELECTION
Before generating the transcript, evaluate the {{TOPIC}} and select the most effective analogy style from the following list. DO NOT ask the user; choose the one that offers the best pedagogical value in distilling the complexity and nuances in the topic:
# The Infrastructure Style: Use if the topic is about systems, logic, or foundations (e.g., software architecture).
# The Ecosystem Style: Use if the topic is about interdependence, balance, or cascading effects (e.g., biology or economics).
# The Orchestration Style: Use if the topic is about timing, coordination, or multiple simultaneous processes (e.g., project management).
# The Market Style: Use if the topic is about incentives, trade-offs, or human behavior (e.g., psychology or game theory).
# The Translation Style: Use if the topic is about how information changes as it moves through a medium (e.g., data science).

### TASK:
Analyze the topic {{TOPIC}} and create a "LEARNING BLUEPRINT" for a Lean-Forward PODCAST-STYLE audio transcript.

### CONTENT REQUIREMENTS:
# Learning Goal: Student must identify the different constituent parts of the topic {{TOPIC}} and organize them into a logical framework that explains the underlying relationships and organizational principles.
# Knowledge Floor: Assume the student has zero prior knowledge of the topic.
# Content Flow:
- DETERMINE up to 4 critical "KNOWLEDGE PILLARS" of the topic {{TOPIC}} in a logical sequence. The "KNOWLEDGE PILLARS" must be distinct, logical and sequential.
- BUILD a KNOWLEDGE GRAPH for each "KNOWLEDGE PILLAR".
- For each "KNOWLEDGE PILLAR", follow this pedagogical framework:
-- The core concept
-- A deep dive into the concept by applying the auto-selected analogy choice to make the concept clearer and relatable.
-- Up to 2 analogies by applying the auto-selected analogy choice
-- Examples (OPTIONAL, BUT PREFERRED)
-- Real world application (OPTIONAL)
-- Common misconceptions (OPTIONAL, BUT PREFERRED)
-- An explanation for how the current "KNOWLEDGE PILLAR" is associated with the LEADING or TRAILING "KNOWLEDGE PILLAR".
- GENERATE content progressively, starting with fundamentals before evolving into more complex ideas, leveraging the KNOWLEDGE GRAPH.

### SENSE CHECK
If you failed in any, assess the prompt again before returning an error message, explaining why
# Is the topic {{TOPIC}} sensical?
# Did you make an Analogy choice?
# Did you understand that your goal is to create a "LEARNING BLUEPRINT"?
# Did you understand and apply the 3 main bullets described in CONTENT REQUIREMENTS section?

### STEP-BY-STEP GENERATION
1. ANALYZE the topic {{TOPIC}} and select an Analogy choice.
2. UNDERSTAND the task described in "TASK" section.
3. APPLY requirements in "CONTENT REQUIREMENTS" section

### OUTPUT:
# Container: WRITE the entire output inside <BLUEPRINT> tags
# Dive directly into the topic. EXCLUDE everything unrelated to the {{TOPIC}}
# Do not include welcome messages or "Sure, I can help with that."
# The output in <BLUEPRINT> tags must have the following format:
- Topic Name: {{TOPIC NAME}}
- Selected Analogy: [Style Name & Reasoning]
-- Knowledge Pillar 1: [Title & Details]
-- Knowledge Pillar 2: [Title & Details]
-- Knowledge Pillar 3: [Title & Details]
-- Knowledge Pillar 4: [Title & Details]
# DO NOT print this output. Send it to 'PROMPT 2: The Script Writer'

---

PROMPT 2: The Script Writer

### ROLE: Advanced Educational Scriptwriter

### INPUT:
Blueprint: [OUTPUT FROM <BLUEPRINT> tags]

### TASK:
# TRANSFORM: Convert the "Blueprint" into a LEAN-FORWARD PODCAST-STYLE transcript to support audio narration.
# PEDAGOGY OVER NARRATIVE: Do not simply narrate facts; design an experience that forces the student to mentally process, predict, and retrieve information.
# COMPLIANCE: Logic, flow, and structure are non-negotiable.
# SCOPE: Strictly adhere to the "Blueprint". DO NOT Hallucinate

### TONE AND STYLE:
# Narration: Convey reliability, credibility, and conviction. Use simple English; avoid jargon unless immediately defined.
# Pacing: Use rhythmic variations (short sentences for impact, longer for explanation).
# Presence: Conversational and encouraging. Speak directly to the student ("You").
# Authority: Sound knowledgeable without being condescending.

### LENGTH REQUIREMENTS:
# Target Length: Up to 2000 words. Strict Minimum: 750 words; Strict Maximum: 2500 words
# Anti-fluff Expansion Strategy: If you find yourself under the word count, DO NOT REPEAT YOURSELF. Instead expand by adding:
-- Why this topic matters explaining the stakes of the concept.
-- How this topic is related to other topics in the field of Study.

### CORE STRATEGIES:
FOLLOW all guidelines below carefully. They are NON-NEGOTIABLE:

# Signposting (The Mental Map):
- Start with a high-level roadmap:
-- Topic Introduction
-- A simple logical explanation of what will be covered in the podcast, with references to the "KNOWLEDGE PILLARS"
- Apply when transitioning from one KNOWLEDGE PILLAR to another.
- Use transition phrases such as "We've just finished the 'Why'; now let's bridge into the 'How' of [Concept].", during transitions.
- TAGGING: When introducing a new KNOWLEDGE PILLAR or transitioning, use a bold **[SIGNPOST]** placeholder

# Active Prompting:
- INCLUDE up to 4 strategic questions or reflections throughout the transcript to encourage active thinking, to force the user to pause and reflect rather than just listen passively.
- EXAMPLES: "Think about this for a moment...", "Before we continue, ask yourself...", "Can you see why...?", "What do you think would happen if...?", "How does this relate to a topic you recently learnt…?", etc.
- Space these strategic questions or reflections naturally throughout the transcript (aim for 2-4 in total).
- Strict Maximum: 4; Strict Minimum: 2
- TAGGING: When prompting the user to pause and reflect on a question, use a bold **[PROMPT]** placeholder

# Retrieval Interruptions (Every 2-4 paragraphs):
- Stop the flow for a "Mental Check-In", once for every 2-4 paragraphs
- Ask the user to mentally define a new term or list two takeaways to encourage the student to reflect actively.
- TAGGING: For retrieval interruption and "mental check-ins", use a bold **[RETRIEVAL]** placeholder

# Pause and Predict:
- Before revealing a key result or climax, insert: "Based on what we just discussed, what do you think the outcome was? Take a second to guess before I tell you" or a similar phrase that is better suited, to encourage the student to pause and think actively.
- TAGGING: Before revealing a result, use a bold **[PREDICT]** placeholder

# Wrap-Up & Teaching Challenge:
- After explaining all the "KNOWLEDGE PILLARS" and their key concepts, Summarize the key points briefly.
- End the transcript with a teaching challenge, insert: "Tell the user: 'If you had to explain this concept to someone who has never heard of it, how would you summarize it in 30 seconds? Try explaining it out loud now.'" or a similar phrase that is better suited, to encourage the student to reflect actively.
- TAGGING: Before the final "Teaching Challenge", use a bold **[TEACH]** placeholder

### STRUCTURAL & FORMATTING RULES:
# Linear Flow: The transcript must flow include below, in the same order
- Introduction
- Knowledge Pillars
- Wrap-up.
# The Anchor Phrase: The final Wrap-Up section—and only that section—must begin with the phrase: "Let's summarize this topic."
# Paragraphs: Each paragraph must contain one complete thought.
# Line Breaks: Use double line breaks (\\n\\n) between every paragraph.
# No Stage Directions: EXCLUDE speaker labels (e.g., "HOST:"), technical cues (e.g., "[Music fades]"), or meta-commentary. The output must be spoken text only.

### OUTPUT:
# Container: WRITE the entire output inside <TRANSCRIPT> tags
# Exclude speaker labels and meta-commentary.
# Generate the output only if the validation passes.

### VALIDATION:
Perform the following validation steps on the transcript in <TRANSCRIPT> tags. If any criteria fail, run this prompt again
# Does the transcript have a linear flow: Introduction, Knowledge Pillars and Wrap up?
# Does each paragraph have one complete thought?
# Do paragraphs have double line breaks between them?
# Does the transcript exclude meta commentary and speaker labels.
# Does the transcript include 3+ core strategies described above?
# Does the transcript meet the length requirements?
# Does the transcript meet the tone and style requirements?

IMPORTANT: Your final output must contain ONLY the <TRANSCRIPT> tags with the transcript inside. Do NOT output the <BLUEPRINT> tags in your response.`;

interface TranscriptRequest {
  topicId: string;
  topicTitle: string;
  topicDescription?: string;
  subjectName?: string;
  forceRegenerate?: boolean;
}

interface TranscriptResponse {
  success: boolean;
  status: "cached" | "generated" | "failed";
  transcript?: string;
  ssmlTranscript?: string;
  error?: string;
}

// Placeholder tags used in the new prompt
const PLACEHOLDER_TAGS = /\*?\*?\[(?:SIGNPOST|PROMPT|RETRIEVAL|PREDICT|TEACH)\]\*?\*?/g;

// Strip placeholder tags for clean display transcript
function stripPlaceholders(text: string): string {
  return text.replace(PLACEHOLDER_TAGS, '').replace(/\n{3,}/g, '\n\n').trim();
}

// Cache validation: length > 750 AND contains "let's summarize this topic" (case-insensitive)
function isValidCachedTranscript(transcript: string | null): boolean {
  if (!transcript) return false;
  if (transcript.length <= 750) return false;
  if (!transcript.toLowerCase().includes("let's summarize this topic")) return false;
  return true;
}

// Sleep helper
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Generate transcript with retry logic
async function generateTranscriptWithRetry(
  topicTitle: string,
  topicDescription: string | undefined,
  subjectName: string | undefined,
  apiKey: string
): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      console.log(`[Transcript] Attempt ${attempt + 1}/3`);

      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent",
        {
          method: "POST",
          headers: {
            "x-goog-api-key": apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: TRANSCRIPT_SYSTEM_PROMPT }],
            },
            contents: [
              {
                parts: [
                  {
                    text: `Topic: ${topicTitle}
${topicDescription ? `Description: ${topicDescription}` : ""}
Subject: ${subjectName || "General Education"}

Analyze this topic. First, internally create a Learning Blueprint (Prompt 1). Then, transform it into a podcast-style transcript (Prompt 2). Output ONLY the final transcript inside <TRANSCRIPT> tags.`,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 8192,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      let transcript = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!transcript) {
        throw new Error("No transcript generated from AI");
      }

      // Extract from <TRANSCRIPT> tags if present (case-insensitive fallback)
      const match = transcript.match(/<TRANSCRIPT>([\s\S]*?)<\/TRANSCRIPT>/i);
      if (match) {
        transcript = match[1].trim();
      }

      console.log(`[Transcript] Generated ${transcript.split(/\s+/).length} words`);
      return transcript;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.error(`[Transcript] Attempt ${attempt + 1} failed:`, lastError.message);

      if (attempt < 2) {
        await sleep(RETRY_DELAYS[attempt]);
      }
    }
  }

  throw lastError || new Error("Failed to generate transcript after 3 attempts");
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY");
    if (!GOOGLE_API_KEY) {
      throw new Error("GOOGLE_API_KEY is not configured");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials not configured");
    }

    const { topicId, topicTitle, topicDescription, subjectName, forceRegenerate }: TranscriptRequest = await req.json();

    if (!topicId || !topicTitle) {
      const response: TranscriptResponse = {
        success: false,
        status: "failed",
        error: "topicId and topicTitle are required",
      };
      return new Response(JSON.stringify(response), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[Transcript] Processing: ${topicTitle} (forceRegenerate: ${forceRegenerate})`);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check cache first
    const { data: existingTopic } = await supabase
      .from("topics")
      .select("transcript")
      .eq("id", topicId)
      .single();

    // Return cached if valid and not forcing regeneration
    if (!forceRegenerate && existingTopic?.transcript && isValidCachedTranscript(existingTopic.transcript)) {
      console.log("[Transcript] Returning cached transcript");
      
      // Check if cached transcript has new-style placeholders
      const hasNewPlaceholders = /\[(?:SIGNPOST|PROMPT|RETRIEVAL|PREDICT|TEACH)\]/.test(existingTopic.transcript);
      
      const response: TranscriptResponse = {
        success: true,
        status: "cached",
        transcript: hasNewPlaceholders ? stripPlaceholders(existingTopic.transcript) : existingTopic.transcript,
        ssmlTranscript: hasNewPlaceholders ? existingTopic.transcript : undefined,
      };
      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate new transcript
    console.log("[Transcript] Cache invalid or force regenerate, generating new transcript...");
    const rawTranscript = await generateTranscriptWithRetry(
      topicTitle,
      topicDescription,
      subjectName,
      GOOGLE_API_KEY
    );

    // Clean transcript for display (strip placeholders)
    const cleanTranscript = stripPlaceholders(rawTranscript);

    // Save raw transcript (with placeholders) to database for TTS usage
    const { error: updateError } = await supabase
      .from("topics")
      .update({ transcript: rawTranscript })
      .eq("id", topicId);

    if (updateError) {
      console.error("[Transcript] Failed to save transcript:", updateError);
    } else {
      console.log("[Transcript] Saved to database");
    }

    // Mark topic request as fulfilled if applicable
    const { data: topicRequest } = await supabase
      .from("topic_requests")
      .select("id")
      .ilike("query", topicTitle.trim())
      .eq("status", "pending")
      .maybeSingle();

    if (topicRequest) {
      await supabase
        .from("topic_requests")
        .update({ status: "fulfilled" })
        .eq("id", topicRequest.id);
      console.log("[Transcript] Topic request marked as fulfilled");
    }

    const response: TranscriptResponse = {
      success: true,
      status: "generated",
      transcript: cleanTranscript,
      ssmlTranscript: rawTranscript,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[Transcript] Error:", err);

    const response: TranscriptResponse = {
      success: false,
      status: "failed",
      error: err instanceof Error ? err.message : "Unknown error",
    };

    return new Response(JSON.stringify(response), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
