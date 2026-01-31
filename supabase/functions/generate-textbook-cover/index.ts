import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface GenerateRequest {
  subjectId: string;
  textbookTitle: string;
  prompt: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { subjectId, textbookTitle, prompt } = await req.json() as GenerateRequest;

    console.log(`Generating cover for subject ${subjectId}: ${textbookTitle}`);

    // Generate image using Nano banana API
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log("AI response received");

    const imageUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!imageUrl) {
      throw new Error("No image generated from AI");
    }

    // Extract base64 data from data URL
    const base64Match = imageUrl.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!base64Match) {
      throw new Error("Invalid image data format");
    }

    const imageFormat = base64Match[1];
    const base64Data = base64Match[2];
    const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

    // Generate unique filename
    const fileName = `${subjectId}-${Date.now()}.${imageFormat}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("textbook-covers")
      .upload(fileName, binaryData, {
        contentType: `image/${imageFormat}`,
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("textbook-covers")
      .getPublicUrl(fileName);

    const publicUrl = publicUrlData.publicUrl;
    console.log("Image uploaded:", publicUrl);

    // Update the subject's textbook_image_url
    const { error: updateError } = await supabase
      .from("subjects")
      .update({ textbook_image_url: publicUrl })
      .eq("id", subjectId);

    if (updateError) {
      console.error("Update error:", updateError);
      throw new Error(`Failed to update subject: ${updateError.message}`);
    }

    console.log(`Successfully updated subject ${subjectId} with new cover`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        imageUrl: publicUrl,
        subjectId 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating textbook cover:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
