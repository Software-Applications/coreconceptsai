import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    const { topicId, topicTitle, topicDescription, subjectName, bulletPoints } = await req.json();

    if (!topicId || !topicTitle) {
      return new Response(
        JSON.stringify({ error: "topicId and topicTitle are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Generating transcript for topic: ${topicTitle}`);

    // Build the prompt for transcript generation
    const systemPrompt = `You are a friendly, engaging educational podcast host who explains complex topics in a conversational, easy-to-understand way.

Your task is to create a spoken transcript that will be read aloud by a text-to-speech system. The transcript should:
1. Be conversational and engaging (as if speaking directly to a student)
2. Explain the topic clearly with examples
3. Be approximately 2-3 minutes when read aloud (300-500 words)
4. Include natural pauses (use "..." for pauses)
5. Reference the key bullet points naturally in the explanation
6. Start with a brief, friendly introduction and end with a quick recap

Do NOT use markdown formatting, headers, or bullet points in your response - this is meant to be spoken aloud.`;

    const userPrompt = `Create a spoken educational transcript for this ${subjectName || "educational"} topic:

Topic Title: ${topicTitle}
${topicDescription ? `Description: ${topicDescription}` : ""}
${bulletPoints ? `Key Points to Cover:\n${bulletPoints.map((bp: string, i: number) => `${i + 1}. ${bp}`).join('\n')}` : ""}

Generate an engaging, conversational explanation that a student would enjoy listening to while studying.`;

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
    const transcript = data.choices?.[0]?.message?.content;

    if (!transcript) {
      throw new Error("No transcript generated from AI");
    }

    console.log(`Generated transcript (${transcript.length} chars)`);

    // Update the topic description with the generated transcript
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const { error: updateError } = await supabase
      .from("topics")
      .update({ description: transcript })
      .eq("id", topicId);

    if (updateError) {
      console.error("Failed to update topic:", updateError);
      // Don't throw - still return the transcript even if save fails
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        transcript,
        wordCount: transcript.split(/\s+/).length,
        message: "Transcript generated successfully" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("generate-transcript error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
