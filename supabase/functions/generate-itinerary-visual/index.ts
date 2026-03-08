import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { destination, days, clientName } = await req.json();

    if (!destination || !days || !Array.isArray(days)) {
      return new Response(
        JSON.stringify({ error: "destination and days[] are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Determine color theme based on destination keywords
    const destLower = destination.toLowerCase();
    let colorTheme = "deep navy blue (#1a1f3a) and gold (#d4a853)"; // default
    let bgStyle = "luxury city skyline at golden hour";
    
    if (/praia|beach|maldiv|carib|cancun|punta|bali|noronha|litoral|ilha|island|costa|riviera|mar|ocean|cabo|aruba|cura[çc]ao/.test(destLower)) {
      colorTheme = "deep ocean blue (#0a3d62) and turquoise (#38ada9) with white accents";
      bgStyle = "pristine tropical beach with crystal clear turquoise water";
    } else if (/floresta|selva|jungle|amazon|chapada|bonito|foz|catarat|parque|serra|montanha|patagonia|torres|iguaçu/.test(destLower)) {
      colorTheme = "deep emerald green (#0a6332) and warm amber (#d4a853) with earth tones";
      bgStyle = "lush green rainforest with dramatic waterfalls";
    } else if (/histori|colonial|ouro preto|roma|paris|lisboa|london|florença|atenas|cairo|petra|machu|cusco/.test(destLower)) {
      colorTheme = "warm gold (#b8860b) and burgundy (#800020) with cream accents";
      bgStyle = "ancient historic architecture at sunset with warm golden light";
    } else if (/neve|ski|alpes|aspen|whistler|suíça|switzerland|iceland|islândia|lapland|noruega/.test(destLower)) {
      colorTheme = "icy blue (#4a90d9) and silver (#c0c0c0) with white accents";
      bgStyle = "snow-capped mountains with northern lights";
    }

    // Build structured day content for the prompt
    let daysContent = "";
    for (const day of days) {
      daysContent += `\n\n📅 ${day.day}${day.theme ? ` - ${day.theme}` : ""}`;
      if (day.activities && Array.isArray(day.activities)) {
        for (const act of day.activities) {
          daysContent += `\n  ${act.time || ""} ${act.emoji || "•"} ${act.name}`;
        }
      }
    }

    const totalDays = days.length;
    const greeting = clientName ? `Roteiro exclusivo para ${clientName}` : "Roteiro Personalizado";

    const prompt = `Create a stunning, magazine-quality travel itinerary card image.

DESIGN REQUIREMENTS:
- Premium editorial design inspired by Condé Nast Traveler and Airbnb Experiences
- Background: beautiful ${bgStyle} photo of ${destination} with a sophisticated dark gradient overlay (60-70% opacity)
- Color palette: ${colorTheme}
- Clean, modern typography with generous whitespace
- Format: PORTRAIT 1080x1350 pixels (4:5 aspect ratio, perfect for WhatsApp/Instagram)

HEADER SECTION:
- Top banner: "Tomorrow Travel" branding with small airplane icon ✈️
- Large, bold destination name: "${destination}" in elegant serif/display font
- Subtitle: "${greeting}" in lighter weight
- "${totalDays} dias de aventura" badge

ITINERARY CONTENT:
${daysContent}

LAYOUT RULES:
- Each day in a semi-transparent card/section with rounded corners
- Day headers with bold text and themed icon
- Activities listed with time, name, and emoji in clean rows
- Use subtle divider lines between days
- Generous spacing between sections — let it breathe
- Activities text should be clearly readable (minimum 14pt equivalent)

FOOTER:
- "Tomorrow Travel" logo area
- "Preparado por Téo ✈️" tagline
- Subtle decorative line

STYLE:
- Think premium travel magazine spread
- Sophisticated gradients and soft shadows
- Icons/emojis should feel integrated, not cluttered
- Overall feel: aspirational, luxurious, yet approachable
- NO generic stock photo look — make it feel curated and exclusive

ALL TEXT MUST BE IN PORTUGUESE (Brazil).
CRITICAL: Image must be exactly 1080x1350 pixels (portrait 4:5).
Generate the image now.`;

    console.log("[ITINERARY-VISUAL] Generating for:", destination, `(${totalDays} days)`);

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
      console.error("[ITINERARY-VISUAL] AI error:", response.status, errText);
      throw new Error(`AI generation failed: ${response.status}`);
    }

    const data = await response.json();
    const imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageData) {
      console.error("[ITINERARY-VISUAL] No image in response");
      throw new Error("No image generated");
    }

    // Upload to Supabase Storage
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
    const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
    const fileName = `itinerary-visuals/${Date.now()}-${destination.toLowerCase().replace(/\s+/g, "-")}.png`;

    const { error: uploadError } = await supabase.storage
      .from("destination-images")
      .upload(fileName, binaryData, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      console.error("[ITINERARY-VISUAL] Upload error:", uploadError);
      return new Response(
        JSON.stringify({ imageUrl: imageData }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: publicUrl } = supabase.storage
      .from("destination-images")
      .getPublicUrl(fileName);

    console.log("[ITINERARY-VISUAL] Generated and uploaded:", publicUrl.publicUrl);

    return new Response(
      JSON.stringify({ imageUrl: publicUrl.publicUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[ITINERARY-VISUAL] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to generate itinerary visual" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
