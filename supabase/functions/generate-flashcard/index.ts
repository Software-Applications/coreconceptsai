import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Retry delays: 1s, 2s, 5s
const RETRY_DELAYS = [1000, 2000, 5000];

const FLASH_SUMMARY_SYSTEM_PROMPT = `You are helping students review tough topics by creating flashcard summaries. Your goal is to generate a clear, concise flashcard summary that will help students understand and remember the key concepts.

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
- difficulty: one of "easy", "medium", or "hard"`;

interface FlashSummaryData {
  visual_type: "diagram" | "formula" | "analogy";
  visual_content: string;
  bullet_points: string[];
  difficulty: "easy" | "medium" | "hard";
}

interface FlashcardRequest {
  topicId: string;
  topicTitle: string;
  transcript: string;
}

interface FlashcardResponse {
  success: boolean;
  status: "cached" | "generated" | "failed";
  flashSummary?: {
    id: string;
    topic_id: string;
    visual_type: string;
    visual_content: string;
    bullet_points: string[];
    difficulty: string;
    ai_generated: boolean;
  };
  error?: string;
}

// Sleep helper
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Generate flashcard with retry logic
async function generateFlashcardWithRetry(
  topicTitle: string,
  transcript: string,
  apiKey: string
): Promise<FlashSummaryData> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      console.log(`[Flashcard] Attempt ${attempt + 1}/3`);

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
              parts: [{ text: FLASH_SUMMARY_SYSTEM_PROMPT }],
            },
            contents: [
              {
                parts: [
                  {
                    text: `<transcript>
${transcript.slice(0, 4000)}
</transcript>

<topic>
${topicTitle}
</topic>

Create the flashcard summary for the topic above based on the transcript provided.

IMPORTANT: Return ONLY a valid JSON object with these exact fields:
- "visual_type": one of "diagram", "formula", or "analogy"
- "visual_content": a short visual description (max 200 chars)
- "bullet_points": array of exactly 3 short strings
- "difficulty": one of "easy", "medium", or "hard"

Keep all string values SHORT to ensure valid JSON output.`,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 800,
              responseMimeType: "application/json",
              responseSchema: {
                type: "object",
                properties: {
                  visual_type: {
                    type: "string",
                    enum: ["diagram", "formula", "analogy"],
                  },
                  visual_content: { type: "string" },
                  bullet_points: {
                    type: "array",
                    items: { type: "string" },
                    minItems: 3,
                    maxItems: 3,
                  },
                  difficulty: {
                    type: "string",
                    enum: ["easy", "medium", "hard"],
                  },
                },
                required: ["visual_type", "visual_content", "bullet_points", "difficulty"],
              },
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const summaryText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!summaryText) {
        throw new Error("No summary text in response");
      }

      const parsed = JSON.parse(summaryText) as FlashSummaryData;

      // Validate required fields
      if (
        !parsed.visual_type ||
        !parsed.visual_content ||
        !Array.isArray(parsed.bullet_points) ||
        !parsed.difficulty
      ) {
        throw new Error("Missing required fields in parsed JSON");
      }

      // Ensure exactly 3 bullet points
      if (parsed.bullet_points.length > 3) {
        parsed.bullet_points = parsed.bullet_points.slice(0, 3);
      } else if (parsed.bullet_points.length < 3) {
        while (parsed.bullet_points.length < 3) {
          parsed.bullet_points.push("Key concept from this topic");
        }
      }

      console.log("[Flashcard] Generated successfully");
      return parsed;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.error(`[Flashcard] Attempt ${attempt + 1} failed:`, lastError.message);

      if (attempt < 2) {
        await sleep(RETRY_DELAYS[attempt]);
      }
    }
  }

  // Return fallback if all retries failed
  console.warn("[Flashcard] All attempts failed, using fallback");
  return {
    visual_type: "diagram",
    visual_content: `📚 Key concepts`,
    bullet_points: [
      "Key concept 1 from this topic",
      "Key concept 2 from this topic",
      "Key concept 3 from this topic",
    ],
    difficulty: "medium",
  };
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

    const { topicId, topicTitle, transcript }: FlashcardRequest = await req.json();

    if (!topicId || !topicTitle || !transcript) {
      const response: FlashcardResponse = {
        success: false,
        status: "failed",
        error: "topicId, topicTitle, and transcript are required",
      };
      return new Response(JSON.stringify(response), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[Flashcard] Processing for topic: ${topicTitle}`);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check cache first
    const { data: existingSummary } = await supabase
      .from("flash_summaries")
      .select("*")
      .eq("topic_id", topicId)
      .maybeSingle();

    if (existingSummary) {
      console.log("[Flashcard] Returning cached flashcard");
      const response: FlashcardResponse = {
        success: true,
        status: "cached",
        flashSummary: existingSummary,
      };
      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate new flashcard
    console.log("[Flashcard] No cache found, generating new flashcard...");
    const flashData = await generateFlashcardWithRetry(topicTitle, transcript, GOOGLE_API_KEY);

    // Insert to database - NEVER touch topics table
    const { data: insertedSummary, error: insertError } = await supabase
      .from("flash_summaries")
      .insert({
        topic_id: topicId,
        visual_type: flashData.visual_type,
        visual_content: flashData.visual_content,
        bullet_points: flashData.bullet_points,
        difficulty: flashData.difficulty,
        ai_generated: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error("[Flashcard] Failed to save:", insertError);
      throw insertError;
    }

    console.log("[Flashcard] Saved to database");

    const response: FlashcardResponse = {
      success: true,
      status: "generated",
      flashSummary: insertedSummary,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[Flashcard] Error:", err);

    const response: FlashcardResponse = {
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
