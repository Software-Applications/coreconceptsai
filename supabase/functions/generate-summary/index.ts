import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface FlashSummary {
  visualType: "diagram" | "formula" | "analogy";
  visualContent: string;
  bulletPoints: string[];
  difficulty: "easy" | "medium" | "hard";
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials not configured");
    }

    const { topicId, topicTitle, topicDescription, subjectName } = await req.json();

    if (!topicId || !topicTitle) {
      return new Response(
        JSON.stringify({ error: "topicId and topicTitle are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Generating flash summary for topic: ${topicTitle}`);

    // Build the prompt for structured output
    const systemPrompt = `You are an expert educational content creator specializing in creating concise, memorable flash card summaries for students. 

Your task is to create a flash summary for a study topic. The summary should:
1. Have a visual element (diagram description, formula, or analogy)
2. Include exactly 3 bullet points that capture the key concepts
3. Be appropriate for the difficulty level of the content

Always respond using the suggest_flash_summary function with properly structured data.`;

    const userPrompt = `Create a flash card summary for this ${subjectName || "educational"} topic:

Topic Title: ${topicTitle}
${topicDescription ? `Description: ${topicDescription}` : ""}

Generate an engaging, educational flash summary that helps students quickly understand and remember the key concepts.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_flash_summary",
              description: "Generate a structured flash card summary for a study topic",
              parameters: {
                type: "object",
                properties: {
                  visualType: {
                    type: "string",
                    enum: ["diagram", "formula", "analogy"],
                    description: "The type of visual representation for the concept",
                  },
                  visualContent: {
                    type: "string",
                    description: "The visual content - a diagram description, formula, or analogy (use emoji if helpful)",
                  },
                  bulletPoints: {
                    type: "array",
                    items: { type: "string" },
                    minItems: 3,
                    maxItems: 3,
                    description: "Exactly 3 concise bullet points summarizing key concepts",
                  },
                  difficulty: {
                    type: "string",
                    enum: ["easy", "medium", "hard"],
                    description: "The difficulty level of the content",
                  },
                },
                required: ["visualType", "visualContent", "bulletPoints", "difficulty"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_flash_summary" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI response received:", JSON.stringify(data, null, 2));

    // Extract the tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "suggest_flash_summary") {
      throw new Error("Invalid AI response - no tool call found");
    }

    const flashSummary: FlashSummary = JSON.parse(toolCall.function.arguments);
    console.log("Parsed flash summary:", flashSummary);

    // Save to database
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check if flash summary already exists for this topic
    const { data: existing } = await supabase
      .from("flash_summaries")
      .select("id")
      .eq("topic_id", topicId)
      .maybeSingle();

    let result;
    if (existing) {
      // Update existing
      const { data: updated, error } = await supabase
        .from("flash_summaries")
        .update({
          visual_type: flashSummary.visualType,
          visual_content: flashSummary.visualContent,
          bullet_points: flashSummary.bulletPoints,
          difficulty: flashSummary.difficulty,
          ai_generated: true,
        })
        .eq("id", existing.id)
        .select()
        .single();

      if (error) throw error;
      result = updated;
    } else {
      // Insert new
      const { data: inserted, error } = await supabase
        .from("flash_summaries")
        .insert({
          topic_id: topicId,
          visual_type: flashSummary.visualType,
          visual_content: flashSummary.visualContent,
          bullet_points: flashSummary.bulletPoints,
          difficulty: flashSummary.difficulty,
          ai_generated: true,
        })
        .select()
        .single();

      if (error) throw error;
      result = inserted;
    }

    console.log("Flash summary saved to database:", result.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        flashSummary: result,
        message: "Flash summary generated successfully" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("generate-summary error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
