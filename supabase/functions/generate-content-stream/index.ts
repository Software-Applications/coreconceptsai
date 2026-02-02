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

### PARAGRAPH STRUCTURE:
- Use clear paragraph breaks (double newlines) between distinct ideas or sections
- Each paragraph should contain a complete thought or concept (2-4 sentences typically)
- Reflective questions MUST end with the [PAUSE: 5 Seconds] tag
- Keep paragraphs focused and well-separated for better audio pacing

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

Output your response as a JSON object with these exact fields:
- visual_type: one of "diagram", "formula", or "analogy"
- visual_content: the visual content - a diagram description, formula, or analogy (use emoji if helpful)
- bullet_points: an array of exactly 3 concise bullet points summarizing key concepts
- difficulty: one of "easy", "medium", or "hard"`;

// Parse streaming response to extract text
function extractTextFromStreamChunk(chunk: string): string {
  try {
    const lines = chunk.split('\n').filter(line => line.trim());
    let text = '';
    
    for (const line of lines) {
      try {
        const data = JSON.parse(line);
        const candidates = data.candidates || [];
        for (const candidate of candidates) {
          const parts = candidate.content?.parts || [];
          for (const part of parts) {
            if (part.text) {
              text += part.text;
            }
          }
        }
      } catch {
        // Skip invalid JSON lines
      }
    }
    return text;
  } catch {
    return '';
  }
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

    const { topicId, topicTitle, topicDescription, subjectName, forceRegenerate } = await req.json();

    if (!topicId || !topicTitle) {
      return new Response(
        JSON.stringify({ error: "topicId and topicTitle are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[Stream] Starting content generation for: ${topicTitle}`);

    // Create Supabase client for database operations
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check for cached transcript in database
    const { data: existingTopic } = await supabase
      .from("topics")
      .select("transcript, description")
      .eq("id", topicId)
      .single();

    // Create SSE response stream
    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (type: string, data: Record<string, unknown>) => {
          const event = JSON.stringify({ type, ...data });
          controller.enqueue(encoder.encode(`data: ${event}\n\n`));
        };

        try {
          // Check if we have a cached transcript (at least 500 chars = meaningful content)
          // Skip cache if forceRegenerate is true
          if (!forceRegenerate && existingTopic?.transcript && existingTopic.transcript.length > 500) {
            console.log("[Stream] Found cached transcript, sending full transcript");
            
            // Send metadata indicating cached content
            sendEvent("metadata", { status: "streaming", cached: true });
            
            // Send full transcript in a single event
            sendEvent("transcript", { 
              text: existingTopic.transcript, 
              cached: true 
            });
            
            // Try to get existing flash summary
            const { data: existingSummary } = await supabase
              .from("flash_summaries")
              .select("*")
              .eq("topic_id", topicId)
              .maybeSingle();
            
            if (existingSummary) {
              sendEvent("summary", { flashSummary: existingSummary });
            }
            
            sendEvent("done", { 
              fullTranscript: existingTopic.transcript, 
              fromCache: true
            });
            
            console.log("[Stream] Cached content streaming complete!");
            controller.close();
            return;
          }

          // No cached transcript - generate via AI
          console.log("[Stream] No cached transcript, starting Gemini generation...");
          
          sendEvent("metadata", { status: "generating", cached: false });
          
          const streamResponse = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:streamGenerateContent?alt=sse",
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

          if (!streamResponse.ok) {
            const errorText = await streamResponse.text();
            console.error("[Stream] Gemini error:", streamResponse.status, errorText);
            throw new Error(`Transcript generation failed: ${streamResponse.status}`);
          }

          const reader = streamResponse.body?.getReader();
          if (!reader) throw new Error("No response body");

          const decoder = new TextDecoder();
          let buffer = "";
          let fullTranscript = "";

          // Collect full transcript from streaming response (do NOT emit chunks)
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            
            // Parse SSE events
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              
              const jsonStr = line.slice(6).trim();
              if (!jsonStr || jsonStr === '[DONE]') continue;
              
              const text = extractTextFromStreamChunk(jsonStr);
              if (text) {
                fullTranscript += text;
              }
            }
          }

          // Clean up transcript - extract from <transcript> tags if present
          let cleanTranscript = fullTranscript.trim();
          const transcriptMatch = cleanTranscript.match(/<transcript>([\s\S]*?)<\/transcript>/);
          if (transcriptMatch) {
            cleanTranscript = transcriptMatch[1].trim();
          }

          console.log(`[Stream] Transcript complete: ${cleanTranscript.split(/\s+/).length} words`);

          // Send full transcript in a single event
          sendEvent("transcript", { 
            text: cleanTranscript, 
            cached: false 
          });

          // Generate flash summary
          console.log("[Stream] Generating flash summary...");
          let flashSummary: FlashSummaryData | null = null;
          
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
                  systemInstruction: {
                    parts: [{ text: FLASH_SUMMARY_SYSTEM_PROMPT }]
                  },
                  contents: [{
                    parts: [{ 
                      text: `Create a flashcard summary for this topic based on the transcript.

Topic: ${topicTitle}

Transcript:
${cleanTranscript.slice(0, 4000)}

IMPORTANT: Return ONLY a valid JSON object.` 
                    }]
                  }],
                  generationConfig: {
                    temperature: 0.3,
                    maxOutputTokens: 800,
                    responseMimeType: "application/json",
                    responseSchema: {
                      type: "object",
                      properties: {
                        visual_type: { type: "string", enum: ["diagram", "formula", "analogy"] },
                        visual_content: { type: "string" },
                        bullet_points: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 3 },
                        difficulty: { type: "string", enum: ["easy", "medium", "hard"] }
                      },
                      required: ["visual_type", "visual_content", "bullet_points", "difficulty"]
                    }
                  }
                })
              }
            );

            if (summaryResponse.ok) {
              const summaryData = await summaryResponse.json();
              const summaryText = summaryData.candidates?.[0]?.content?.parts?.[0]?.text;
              if (summaryText) {
                flashSummary = JSON.parse(summaryText) as FlashSummaryData;
                console.log("[Stream] Flash summary generated");
              }
            }
          } catch (e) {
            console.warn("[Stream] Flash summary generation failed:", e);
          }

          // Use fallback if needed
          if (!flashSummary) {
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

          // Ensure exactly 3 bullet points
          if (flashSummary.bullet_points.length > 3) {
            flashSummary.bullet_points = flashSummary.bullet_points.slice(0, 3);
          } else if (flashSummary.bullet_points.length < 3) {
            while (flashSummary.bullet_points.length < 3) {
              flashSummary.bullet_points.push("Key concept from this topic");
            }
          }

          // Save transcript only - NEVER overwrite curated descriptions
          console.log("[Stream] Saving transcript to database for caching");

          const { error: topicError } = await supabase
            .from("topics")
            .update({ transcript: cleanTranscript })
            .eq("id", topicId);

          if (topicError) {
            console.error("[Stream] Topic update error:", topicError);
          }

          // If this was a user-requested topic, also mark the request as fulfilled
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
            console.log("[Stream] Request marked as fulfilled");
          }

          // Upsert flash summary
          const { data: existingSummary } = await supabase
            .from("flash_summaries")
            .select("id")
            .eq("topic_id", topicId)
            .maybeSingle();

          let flashSummaryResult;
          if (existingSummary) {
            const { data: updated } = await supabase
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
            flashSummaryResult = updated;
          } else {
            const { data: inserted } = await supabase
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
            flashSummaryResult = inserted;
          }

          // Send summary event
          sendEvent("summary", { flashSummary: flashSummaryResult });

          // Send done event
          sendEvent("done", { 
            fullTranscript: cleanTranscript,
            fromCache: false
          });

          console.log("[Stream] Complete!");
          controller.close();

        } catch (error) {
          console.error("[Stream] Error:", error);
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          sendEvent("error", { message: errorMessage });
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (error) {
    console.error("[Stream] Setup error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
