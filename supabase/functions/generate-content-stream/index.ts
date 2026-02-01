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
Write your complete podcast transcript. The transcript should flow naturally as spoken dialogue from you (the educator) to the student. Include the active prompting questions and pauses as part of the natural flow of the transcript. Do not include any stage directions, speaker labels, or meta-commentary—just the words you would speak.`;

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

// Estimate words for 30 seconds of audio at normal speaking rate (~150 words/min)
const WORDS_PER_30_SEC = 75;

// Count words in text
function countWords(text: string): number {
  return text.split(/\s+/).filter(w => w.length > 0).length;
}

// Split cached transcript into chunks for streaming
function splitIntoChunks(text: string, wordsPerChunk: number): string[] {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let currentChunk = '';
  let currentWords = 0;
  
  for (const sentence of sentences) {
    const sentenceWords = sentence.split(/\s+/).length;
    if (currentWords + sentenceWords > wordsPerChunk && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
      currentWords = sentenceWords;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
      currentWords += sentenceWords;
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

// Parse streaming response to extract text
function extractTextFromStreamChunk(chunk: string): string {
  try {
    // Handle multiple JSON objects in chunk
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

    const { topicId, topicTitle, topicDescription, subjectName } = await req.json();

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
          if (existingTopic?.transcript && existingTopic.transcript.length > 500) {
            console.log("[Stream] Found cached transcript, streaming from database");
            
            // Stream pre-existing transcript in chunks
            const chunks = splitIntoChunks(existingTopic.transcript, WORDS_PER_30_SEC);
            
            // Send metadata indicating cached content
            sendEvent("metadata", { status: "streaming", cached: true });
            
            for (let i = 0; i < chunks.length; i++) {
              console.log(`[Stream] Sending cached chunk ${i}: ${countWords(chunks[i])} words`);
              sendEvent("chunk", { 
                index: i, 
                text: chunks[i], 
                isLast: i === chunks.length - 1,
                cached: true 
              });
            }
            
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
              fromCache: true,
              totalChunks: chunks.length
            });
            
            console.log("[Stream] Cached content streaming complete!");
            controller.close();
            return;
          }

          // No cached transcript - generate via AI
          console.log("[Stream] No cached transcript, starting Gemini streaming...");
          
          sendEvent("metadata", { status: "streaming", cached: false });
          
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
            throw new Error(`Transcript streaming failed: ${streamResponse.status}`);
          }

          const reader = streamResponse.body?.getReader();
          if (!reader) throw new Error("No response body");

          const decoder = new TextDecoder();
          let buffer = "";
          let chunkBuffer = "";
          let chunkIndex = 0;
          let fullTranscript = "";

          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              // Emit any remaining text as final chunk
              if (chunkBuffer.trim()) {
                console.log(`[Stream] Emitting final chunk ${chunkIndex}: ${countWords(chunkBuffer)} words`);
                sendEvent("chunk", { 
                  index: chunkIndex, 
                  text: chunkBuffer.trim(), 
                  isLast: true 
                });
                fullTranscript += chunkBuffer;
              }
              break;
            }

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
                chunkBuffer += text;
                
                // Check if we have enough words for a chunk (~30 sec audio)
                const wordCount = countWords(chunkBuffer);
                if (wordCount >= WORDS_PER_30_SEC) {
                  // Find a sentence boundary to split at
                  const sentences = chunkBuffer.split(/(?<=[.!?])\s+/);
                  let chunkText = "";
                  let remaining = "";
                  let currentWordCount = 0;
                  
                  for (let i = 0; i < sentences.length; i++) {
                    const sentenceWords = countWords(sentences[i]);
                    if (currentWordCount + sentenceWords <= WORDS_PER_30_SEC + 20) {
                      chunkText += (chunkText ? " " : "") + sentences[i];
                      currentWordCount += sentenceWords;
                    } else {
                      remaining = sentences.slice(i).join(" ");
                      break;
                    }
                  }
                  
                  if (chunkText.trim()) {
                    console.log(`[Stream] Emitting chunk ${chunkIndex}: ${countWords(chunkText)} words`);
                    sendEvent("chunk", { 
                      index: chunkIndex, 
                      text: chunkText.trim(), 
                      isLast: false 
                    });
                    fullTranscript += chunkText + " ";
                    chunkIndex++;
                  }
                  
                  chunkBuffer = remaining;
                }
              }
            }
          }

          console.log(`[Stream] Transcript complete: ${countWords(fullTranscript)} words, ${chunkIndex + 1} chunks`);

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
${fullTranscript.slice(0, 4000)}

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

          // Generate topic summary for description
          let topicSummary = "";
          try {
            const descResponse = await fetch(
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
                      text: `Generate a concise 1-2 sentence summary (under 150 characters) of what students will learn about "${topicTitle}". Based on: ${fullTranscript.slice(0, 1500)}. Return ONLY the summary text.` 
                    }]
                  }],
                  generationConfig: { temperature: 0.3, maxOutputTokens: 100 }
                })
              }
            );

            if (descResponse.ok) {
              const descData = await descResponse.json();
              topicSummary = descData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
              if (topicSummary.length > 150) topicSummary = topicSummary.slice(0, 147) + "...";
            }
          } catch (e) {
            console.warn("[Stream] Topic summary generation failed:", e);
          }

          // Always save transcript for all topics (enables caching)
          console.log("[Stream] Saving transcript to database for caching");

          const updateData: { transcript: string; description?: string } = { 
            transcript: fullTranscript.trim() 
          };
          if (topicSummary) updateData.description = topicSummary;

          const { error: topicError } = await supabase
            .from("topics")
            .update(updateData)
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
            fullTranscript: fullTranscript.trim(),
            totalChunks: chunkIndex + 1,
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