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

const TRANSCRIPT_SYSTEM_PROMPT = `### ROLE: Active Learning Audio Designer

### OBJECTIVE: Your goal is to transform the provided topic into a "Lean-Forward" PODCAST-STYLE audio transcript with the simplest and easiest-to-follow explanation. Do not simply narrate facts; design an experience that forces the user, who is a student, to mentally process, predict, and retrieve information.

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

### CORE STRATEGIES TO EMPLOY: Follow all guidelines below CAREFULLY. They are NON-NEGOTIABLE:

1. SIGNPOSTING (Mental Mapping):
- Start with a high-level roadmap of the 3-4 "knowledge pillars" you will cover.
- Use transition phrases like: "We've just finished the 'Why'; now let's bridge into the 'How' of [Concept]."

2. ACTIVE PROMPTING:
- Include strategic questions throughout the transcript to encourage active thinking, to force the user to pause and reflect rather than just listen passively.
- Format: "[PAUSE: 5 Seconds] Ask: 'Think about this for a moment...', 'Before we continue, ask yourself...', 'Can you see why...?', 'What do you think would happen if...?', etc."
- Space these prompts naturally throughout the transcript (aim for 2-5 prompts in total)

3. PAUSE AND PREDICT:
- Before revealing a key result, solution, or climax of a concept, insert a "Predictive Pause."
- Format: "[PAUSE: 5 Seconds] Ask: 'Based on what we just discussed, what do you think the outcome was? Take a second to guess before I tell you.'"

4. RETRIEVAL INTERRUPTIONS:
- Every 3–5 minutes, stop the flow for a "Mental Check-In."
- Ask the user to mentally list two key takeaways or define a new term you just introduced in their own words.

5. ELABORATIVE INTERROGATION:
- Use "Connection Prompts." Ask the user: "How does this relate to a topic you recently learnt?"

6. THE FEYNMAN WRAP-UP:
- End the transcript with a quick summary that reinforces the key points the student just learned.
- Follow the summary with a "Teaching Challenge."
- Instruction: "Tell the user: 'If you had to explain this concept to someone who has never heard of it, how would you summarize it in 30 seconds? Try explaining it out loud now.'"

### RESPONSE FORMAT:
- Write the transcript inside <transcript> tags.
- Do not include any stage directions, speaker labels, or meta-commentary—just the words you would speak.
- Do not include Welcome messages, dive into the topic directly.
- Your output should consist only of the transcript itself within the specified tags.`;

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
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent",
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
    // Includes retry logic for reliability
    console.log("Step 2: Generating flash summary...");
    
    const MAX_RETRIES = 3;
    let flashSummary: FlashSummaryData | null = null;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`Flash summary generation attempt ${attempt}/${MAX_RETRIES}...`);
        
        const summaryResponse = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent",
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
                  text: `Create a flashcard summary for this topic based on the transcript.

Topic: ${topicTitle}

Transcript:
${transcript.slice(0, 4000)}

IMPORTANT: Return ONLY a valid JSON object with these exact fields:
- "visual_type": one of "diagram", "formula", or "analogy"
- "visual_content": a short visual description (max 200 chars)
- "bullet_points": array of exactly 3 short strings
- "difficulty": one of "easy", "medium", or "hard"

Keep all string values SHORT to ensure valid JSON output.` 
                }]
              }],
              generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 800,
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
                      items: { type: "string" },
                      minItems: 3,
                      maxItems: 3
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
          console.error(`Summary generation error (attempt ${attempt}):`, summaryResponse.status, errorText);
          throw new Error(`Summary generation failed: ${summaryResponse.status}`);
        }

        const summaryData = await summaryResponse.json();
        const summaryText = summaryData.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!summaryText) {
          throw new Error("No summary text in response");
        }

        console.log(`Parsing flash summary JSON (attempt ${attempt})...`);
        const parsed = JSON.parse(summaryText);
        
        // Validate required fields
        if (!parsed.visual_type || !parsed.visual_content || !Array.isArray(parsed.bullet_points) || !parsed.difficulty) {
          throw new Error("Missing required fields in parsed JSON");
        }
        
        flashSummary = parsed as FlashSummaryData;
        console.log(`Flash summary parsed successfully on attempt ${attempt}`);
        break; // Success, exit retry loop
        
      } catch (parseError) {
        lastError = parseError instanceof Error ? parseError : new Error(String(parseError));
        console.error(`Attempt ${attempt} failed:`, lastError.message);
        
        if (attempt < MAX_RETRIES) {
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    if (!flashSummary) {
      // If all retries failed, use fallback summary
      console.warn("All attempts failed, using fallback summary");
      flashSummary = {
        visual_type: "diagram",
        visual_content: `📚 ${topicTitle}`,
        bullet_points: [
          `Key concept 1 from ${topicTitle}`,
          `Key concept 2 from ${topicTitle}`,
          `Key concept 3 from ${topicTitle}`
        ],
        difficulty: "medium"
      };
    }

    // Ensure we have exactly 3 bullet points
    if (flashSummary.bullet_points.length > 3) {
      flashSummary.bullet_points = flashSummary.bullet_points.slice(0, 3);
    } else if (flashSummary.bullet_points.length < 3) {
      while (flashSummary.bullet_points.length < 3) {
        flashSummary.bullet_points.push("Key concept from this topic");
      }
    }

    console.log("Flash summary ready:", flashSummary);

    // Step 3: Generate a short summary for the description field
    console.log("Step 3: Generating topic summary...");
    let topicSummary = "";
    try {
      const summaryResponse = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent",
        {
          method: "POST",
          headers: {
            "x-goog-api-key": GOOGLE_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ 
                text: `Generate a concise 1-2 sentence summary (under 150 characters) of what students will learn about "${topicTitle}". 
                
Based on this transcript excerpt:
${transcript.slice(0, 1500)}

Return ONLY the summary text, no quotes or extra formatting.` 
              }]
            }],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 100,
            }
          })
        }
      );

      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json();
        topicSummary = summaryData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
        // Ensure it's under 150 chars
        if (topicSummary.length > 150) {
          topicSummary = topicSummary.slice(0, 147) + "...";
        }
        console.log(`Topic summary generated: ${topicSummary}`);
      }
    } catch (summaryError) {
      console.warn("Failed to generate topic summary, will use existing description");
    }

    // Step 4: Save to database
    console.log("Step 4: Saving to database...");
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Update topic with transcript in dedicated column, and summary in description
    const updateData: { transcript: string; description?: string } = { transcript };
    
    // Only update description if we generated a summary or if current description looks like a transcript
    if (topicSummary) {
      updateData.description = topicSummary;
    }
    
    const { error: topicError } = await supabase
      .from("topics")
      .update(updateData)
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
