import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { destination, clientName, dayNumber, totalDays, weather, activitySuggestion, funFact, specialNotes } = await req.json();

    console.log(`[DAILY-STORY] Generating story for ${clientName} in ${destination}, day ${dayNumber}/${totalDays}`);

    // Build the image generation prompt
    const weatherLine = weather 
      ? `${weather.temp}°C, ${weather.description} ${weather.emoji}` 
      : "Clima agradável";

    const prompt = `Create a stunning Instagram Story card (1080x1920 portrait format) for a travel daily briefing. 
Design requirements:
- Style: Premium travel magazine aesthetic, like Condé Nast Traveler meets Instagram Stories
- Background: A beautiful, dreamy photograph of ${destination} as the main background with a dark gradient overlay (60% opacity from bottom)
- Top section: Small elegant logo area with "Tomorrow Travel ✈️" in white, thin font
- Date badge: Stylish rounded badge showing "DIA ${dayNumber} de ${totalDays}" in accent color
- Destination: Large, bold serif typography showing "${destination}" in white
- Weather widget: Modern glassmorphism card showing "${weatherLine}" with weather icon
- Activity section: Elegant card with heading "✨ SUGESTÃO DO DIA" and text "${activitySuggestion}" in clean sans-serif
- Fun fact section: Small card with "💡 Curiosidade" heading and "${funFact}" text
- Client greeting: "Bom dia, ${clientName}! 🌅" in friendly handwritten-style font at the top
- Footer: "Téo • Seu concierge de viagem" in small elegant text
- Color scheme: Rich gradients matching the destination vibe (tropical=turquoise/coral, European=gold/navy, nature=emerald/amber)
- Typography: Mix of elegant serif for destination name, modern sans-serif for info, handwritten for greeting
- Visual effects: Subtle bokeh dots, thin golden border lines as section dividers
- Overall feel: Luxurious, warm, personal — like receiving a morning briefing from a 5-star hotel concierge

IMPORTANT: All text must be in Portuguese (Brazil). The image should be visually stunning and make the traveler excited about their day.`;

    // Call Gemini Image Generation
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[DAILY-STORY] Gemini error:", response.status, errText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`Gemini error: ${response.status}`);
    }

    const data = await response.json();
    const imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageData) {
      console.error("[DAILY-STORY] No image in response");
      return new Response(JSON.stringify({ error: "No image generated" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Upload to Supabase Storage
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
    const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
    const fileName = `daily-stories/${clientName.replace(/\s+/g, "-").toLowerCase()}/${Date.now()}-day${dayNumber}.png`;

    const { error: uploadError } = await supabase.storage
      .from("destination-images")
      .upload(fileName, binaryData, { contentType: "image/png", upsert: true });

    if (uploadError) {
      console.error("[DAILY-STORY] Upload error:", uploadError);
      throw new Error("Failed to upload story image");
    }

    const { data: publicUrlData } = supabase.storage
      .from("destination-images")
      .getPublicUrl(fileName);

    console.log("[DAILY-STORY] Story generated:", publicUrlData.publicUrl);

    return new Response(JSON.stringify({ 
      imageUrl: publicUrlData.publicUrl,
      success: true 
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("[DAILY-STORY] Error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
