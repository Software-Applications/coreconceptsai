import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Patterns that indicate the description field contains a transcript
const TRANSCRIPT_PATTERNS = [
  /^hello/i,
  /^welcome/i,
  /^hey there/i,
  /^hi there/i,
  /^good morning/i,
  /^today we/i,
  /^in this/i,
  /^let's dive/i,
  /^let me explain/i,
  /^so,? today/i,
];

function looksLikeTranscript(description: string | null): boolean {
  if (!description) return false;
  if (description.length > 300) return true; // Summaries should be short
  return TRANSCRIPT_PATTERNS.some(pattern => pattern.test(description.trim()));
}

serve(async (req) => {
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

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Parse request body for optional filters
    let topicId: string | null = null;
    let dryRun = false;
    let limit = 50;
    
    try {
      const body = await req.json();
      topicId = body.topicId || null;
      dryRun = body.dryRun === true;
      limit = body.limit || 50;
    } catch {
      // No body provided, process all topics
    }

    console.log(`Regenerate summaries - topicId: ${topicId}, dryRun: ${dryRun}, limit: ${limit}`);

    // Fetch topics that need summary regeneration
    let query = supabase
      .from("topics")
      .select("id, title, description, transcript")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (topicId) {
      query = query.eq("id", topicId);
    }

    const { data: topics, error: fetchError } = await query;

    if (fetchError) {
      throw new Error(`Failed to fetch topics: ${fetchError.message}`);
    }

    if (!topics || topics.length === 0) {
      return new Response(
        JSON.stringify({ message: "No topics found", processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${topics.length} topics to check`);

    // Filter topics that need regeneration
    const topicsToRegenerate = topics.filter(topic => {
      // If transcript column is empty but description looks like a transcript
      if (!topic.transcript && looksLikeTranscript(topic.description)) {
        return true;
      }
      // If we have a transcript but description also looks like one (needs summary)
      if (topic.transcript && looksLikeTranscript(topic.description)) {
        return true;
      }
      return false;
    });

    console.log(`${topicsToRegenerate.length} topics need summary regeneration`);

    if (dryRun) {
      return new Response(
        JSON.stringify({ 
          message: "Dry run complete",
          totalChecked: topics.length,
          needsRegeneration: topicsToRegenerate.length,
          topics: topicsToRegenerate.map(t => ({ id: t.id, title: t.title, descriptionLength: t.description?.length || 0 }))
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: { id: string; title: string; success: boolean; error?: string; summary?: string }[] = [];

    for (const topic of topicsToRegenerate) {
      try {
        console.log(`Processing topic: ${topic.title} (${topic.id})`);

        // Use existing transcript or description as source
        const sourceText = topic.transcript || topic.description || "";
        
        if (!sourceText || sourceText.length < 50) {
          console.log(`Skipping ${topic.id} - insufficient source text`);
          results.push({ id: topic.id, title: topic.title, success: false, error: "Insufficient source text" });
          continue;
        }

        // Generate a concise summary
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
                  text: `Generate a concise 1-2 sentence summary (under 150 characters) of what students will learn about "${topic.title}". 

Based on this content:
${sourceText.slice(0, 2000)}

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

        if (!summaryResponse.ok) {
          const errorText = await summaryResponse.text();
          console.error(`API error for ${topic.id}:`, errorText);
          results.push({ id: topic.id, title: topic.title, success: false, error: `API error: ${summaryResponse.status}` });
          continue;
        }

        const summaryData = await summaryResponse.json();
        let summary = summaryData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

        if (!summary) {
          results.push({ id: topic.id, title: topic.title, success: false, error: "No summary generated" });
          continue;
        }

        // Ensure it's under 150 chars
        if (summary.length > 150) {
          summary = summary.slice(0, 147) + "...";
        }

        console.log(`Generated summary for ${topic.id}: ${summary}`);

        // Update the topic - move transcript if needed, update description
        const updateData: { description: string; transcript?: string } = { description: summary };
        
        // If transcript column is empty but description has the transcript, move it
        if (!topic.transcript && topic.description && topic.description.length > 300) {
          updateData.transcript = topic.description;
        }

        const { error: updateError } = await supabase
          .from("topics")
          .update(updateData)
          .eq("id", topic.id);

        if (updateError) {
          console.error(`Update error for ${topic.id}:`, updateError);
          results.push({ id: topic.id, title: topic.title, success: false, error: updateError.message });
          continue;
        }

        results.push({ id: topic.id, title: topic.title, success: true, summary });
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (topicError) {
        const errorMsg = topicError instanceof Error ? topicError.message : "Unknown error";
        console.error(`Error processing ${topic.id}:`, errorMsg);
        results.push({ id: topic.id, title: topic.title, success: false, error: errorMsg });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log(`Regeneration complete: ${successCount} succeeded, ${failureCount} failed`);

    return new Response(
      JSON.stringify({ 
        message: "Summary regeneration complete",
        totalChecked: topics.length,
        processed: topicsToRegenerate.length,
        succeeded: successCount,
        failed: failureCount,
        results
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("regenerate-summaries error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
