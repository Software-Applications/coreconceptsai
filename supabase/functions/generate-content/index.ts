import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface FlashSummaryData {
  visual_type: "diagram" | "formula" | "analogy";
  visual_content: string;
  bullet_points: string[];
  difficulty: "easy" | "medium" | "hard";
}

const TRANSCRIPT_SYSTEM_PROMPT = `You are one of the best educators and excel at breaking down tough topics with the simplest and easiest-to-follow explanations. Your task is to generate a podcast-style transcript that teaches a student about a specific topic.

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

Your output should consist only of the transcript itself within the specified tags.`;

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

Before creating your flashcard, think about:
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

    const { topicId, topicTitle, topicDescription, subjectName } = await req.json();

    if (!topicId || !topicTitle) {
      return new Response(
        JSON.stringify({ error: "topicId and topicTitle are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Generating content for topic: ${topicTitle}`);

    // Step 1: Generate transcript using Google Gemini
    console.log("Step 1: Generating transcript...");
    const transcriptResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent",
      {
        method: "POST",
        headers: {
          "x-goog-api-key": GOOGLE_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: TRANSCRIPT_SYSTEM_PROMPT }]
          },
          contents: [{
            parts: [{ 
              text: `Generate a transcript for this ${subjectName || "educational"} topic:

Topic Title: ${topicTitle}
${topicDescription ? `Description: ${topicDescription}` : ""}

Create an engaging, educational transcript that helps a student understand this topic.` 
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4096,
          }
        })
      }
    );

    if (!transcriptResponse.ok) {
      const errorText = await transcriptResponse.text();
      console.error("Transcript generation error:", transcriptResponse.status, errorText);
      throw new Error(`Transcript generation failed: ${transcriptResponse.status}`);
    }

    const transcriptData = await transcriptResponse.json();
    let transcript = transcriptData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!transcript) {
      throw new Error("No transcript generated from AI");
    }

    // Extract content from <transcript> tags if present
    const transcriptMatch = transcript.match(/<transcript>([\s\S]*?)<\/transcript>/);
    if (transcriptMatch) {
      transcript = transcriptMatch[1].trim();
    }

    console.log(`Transcript generated (${transcript.length} chars)`);

    // Step 2: Generate flash summary using Google Gemini with structured output
    console.log("Step 2: Generating flash summary...");
    const summaryResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
      {
        method: "POST",
        headers: {
          "x-goog-api-key": GOOGLE_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: FLASH_SUMMARY_SYSTEM_PROMPT }]
          },
          contents: [{
            parts: [{ 
              text: `Create a flashcard summary for this topic based on the transcript:

Topic: ${topicTitle}

Transcript:
${transcript}

Output valid JSON only.` 
            }]
          }],
          generationConfig: {
            temperature: 0.5,
            maxOutputTokens: 1024,
            responseMimeType: "application/json",
            responseSchema: {
              type: "object",
              properties: {
                visual_type: { 
                  type: "string", 
                  enum: ["diagram", "formula", "analogy"] 
                },
                visual_content: { type: "string" },
                bullet_points: { 
                  type: "array", 
                  items: { type: "string" } 
                },
                difficulty: { 
                  type: "string", 
                  enum: ["easy", "medium", "hard"] 
                }
              },
              required: ["visual_type", "visual_content", "bullet_points", "difficulty"]
            }
          }
        })
      }
    );

    if (!summaryResponse.ok) {
      const errorText = await summaryResponse.text();
      console.error("Summary generation error:", summaryResponse.status, errorText);
      throw new Error(`Summary generation failed: ${summaryResponse.status}`);
    }

    const summaryData = await summaryResponse.json();
    const summaryText = summaryData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!summaryText) {
      throw new Error("No summary generated from AI");
    }

    console.log("Parsing flash summary JSON...");
    let flashSummary: FlashSummaryData;
    try {
      flashSummary = JSON.parse(summaryText);
    } catch (parseError) {
      console.error("Failed to parse summary JSON:", summaryText);
      throw new Error("Invalid JSON response from summary generation");
    }

    // Ensure we have exactly 3 bullet points
    if (flashSummary.bullet_points.length > 3) {
      flashSummary.bullet_points = flashSummary.bullet_points.slice(0, 3);
    } else if (flashSummary.bullet_points.length < 3) {
      while (flashSummary.bullet_points.length < 3) {
        flashSummary.bullet_points.push("Key concept from this topic");
      }
    }

    console.log("Flash summary parsed:", flashSummary);

    // Step 3: Save to database
    console.log("Step 3: Saving to database...");
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Update topic description with transcript
    const { error: topicError } = await supabase
      .from("topics")
      .update({ description: transcript })
      .eq("id", topicId);

    if (topicError) {
      console.error("Failed to update topic:", topicError);
    }

    // Upsert flash summary
    const { data: existingSummary } = await supabase
      .from("flash_summaries")
      .select("id")
      .eq("topic_id", topicId)
      .maybeSingle();

    let flashSummaryResult;
    if (existingSummary) {
      const { data: updated, error } = await supabase
        .from("flash_summaries")
        .update({
          visual_type: flashSummary.visual_type,
          visual_content: flashSummary.visual_content,
          bullet_points: flashSummary.bullet_points,
          difficulty: flashSummary.difficulty,
          ai_generated: true,
        })
        .eq("id", existingSummary.id)
        .select()
        .single();

      if (error) throw error;
      flashSummaryResult = updated;
    } else {
      const { data: inserted, error } = await supabase
        .from("flash_summaries")
        .insert({
          topic_id: topicId,
          visual_type: flashSummary.visual_type,
          visual_content: flashSummary.visual_content,
          bullet_points: flashSummary.bullet_points,
          difficulty: flashSummary.difficulty,
          ai_generated: true,
        })
        .select()
        .single();

      if (error) throw error;
      flashSummaryResult = inserted;
    }

    console.log("Content saved successfully!");

    return new Response(
      JSON.stringify({ 
        success: true, 
        transcript,
        flashSummary: flashSummaryResult,
        message: "Content generated successfully" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("generate-content error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
