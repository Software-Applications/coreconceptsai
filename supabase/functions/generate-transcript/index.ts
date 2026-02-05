import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Retry delays: 1s, 2s, 5s
const RETRY_DELAYS = [1000, 2000, 5000];

const TRANSCRIPT_SYSTEM_PROMPT = `### ROLE: Active Learning Audio Designer

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
- Your output should consist only of the transcript itself within the specified tags.`;

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
  error?: string;
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
                    text: `<topic>
Topic Title: ${topicTitle}
${topicDescription ? `Description: ${topicDescription}` : ""}
Subject: ${subjectName || "General Education"}
</topic>

Create the transcript for the topic above.`,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 4096,
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

      // Extract from <transcript> tags if present
      const match = transcript.match(/<transcript>([\s\S]*?)<\/transcript>/);
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
      const response: TranscriptResponse = {
        success: true,
        status: "cached",
        transcript: existingTopic.transcript,
      };
      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate new transcript
    console.log("[Transcript] Cache invalid or force regenerate, generating new transcript...");
    const transcript = await generateTranscriptWithRetry(
      topicTitle,
      topicDescription,
      subjectName,
      GOOGLE_API_KEY
    );

    // Save to database - ONLY update transcript column, NEVER touch description
    const { error: updateError } = await supabase
      .from("topics")
      .update({ transcript })
      .eq("id", topicId);

    if (updateError) {
      console.error("[Transcript] Failed to save transcript:", updateError);
      // Still return success since we have the transcript
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
      transcript,
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
