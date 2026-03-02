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
    const {
      destination,
      hotel,
      regime,
      category,
      flightOut,
      flightBack,
      stops,
      nights,
      totalPrice,
      pricePerPerson,
      installments,
      operadora,
      inclusions,
      departureDate,
      returnDate,
      passengers,
    } = await req.json();

    if (!destination) {
      return new Response(
        JSON.stringify({ error: "Destination is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Format price for display
    const formatPrice = (v: number) =>
      Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2 });

    // Build the visual prompt
    let details = "";
    if (hotel) details += `\n- Hotel: ${hotel}`;
    if (category) details += ` (${category})`;
    if (regime) details += `\n- Regime: ${regime}`;
    if (flightOut) details += `\n- Voo ida: ${flightOut}`;
    if (flightBack) details += `\n- Voo volta: ${flightBack}`;
    if (stops !== undefined) details += `\n- Paradas: ${stops}`;
    if (nights) details += `\n- ${nights} noites`;
    if (departureDate && returnDate) details += `\n- Período: ${departureDate} a ${returnDate}`;
    if (passengers) details += `\n- Passageiros: ${passengers}`;
    if (operadora) details += `\n- Operadora: ${operadora}`;

    let priceBlock = "";
    if (totalPrice) priceBlock += `\nPreço total: R$ ${formatPrice(totalPrice)}`;
    if (pricePerPerson) priceBlock += `\nPor pessoa: R$ ${formatPrice(pricePerPerson)}`;
    if (installments) priceBlock += `\nParcelamento: ${installments}x no cartão`;

    let inclusionsBlock = "";
    if (inclusions && Array.isArray(inclusions) && inclusions.length > 0) {
      inclusionsBlock = `\nInclusões: ${inclusions.join(", ")}`;
    }

    const prompt = `Create a professional, elegant travel quotation card image for a travel agency called "Tomorrow Travel".

DESIGN REQUIREMENTS:
- Modern, clean, premium design with a luxury travel feel
- Use a beautiful landscape photo of ${destination} as background with a dark gradient overlay
- The "Tomorrow Travel" agency name/logo must appear at the top
- Main title: destination name "${destination}" in large, bold, elegant typography
- All text must be clearly readable over the background

CONTENT TO DISPLAY:
${details}
${priceBlock}
${inclusionsBlock}

LAYOUT:
- Top: "Tomorrow Travel" branding with a subtle airplane/globe icon
- Center: Large destination name with a scenic background
- Middle section: Trip details (hotel, flights, dates) in organized cards/sections with icons
- Bottom section: Price prominently displayed in large bold text with a highlight/badge style
- If installments info exists, show it below the price
- Footer: "Sua viagem dos sonhos começa aqui ✈️" tagline

STYLE:
- Color palette: deep navy blue (#1a1f3a), gold/amber accents (#d4a853), white text
- Rounded corners on info cards
- Subtle shadows for depth
- Professional iconography (plane, hotel, calendar icons)
- The overall feel should be like a premium travel brochure

CRITICAL IMAGE DIMENSIONS - SQUARE FORMAT:
- EXACT ASPECT RATIO: 1:1 (SQUARE)
- EXACT DIMENSIONS: 1080 pixels x 1080 pixels
- The image MUST be a perfect SQUARE (equal width and height)

ALL TEXT MUST BE IN PORTUGUESE (Brazil).
Generate the image now.`;

    console.log("[QUOTE-VISUAL] Generating visual for:", destination);

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
      console.error("[QUOTE-VISUAL] AI error:", response.status, errText);
      throw new Error(`AI generation failed: ${response.status}`);
    }

    const data = await response.json();
    const imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageData) {
      console.error("[QUOTE-VISUAL] No image in response");
      throw new Error("No image generated");
    }

    // Upload to Supabase Storage
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
    const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
    const fileName = `quote-visuals/${Date.now()}-${destination.toLowerCase().replace(/\s+/g, "-")}.png`;

    const { error: uploadError } = await supabase.storage
      .from("destination-images")
      .upload(fileName, binaryData, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      console.error("[QUOTE-VISUAL] Upload error:", uploadError);
      // Return the base64 directly as fallback
      return new Response(
        JSON.stringify({ imageUrl: imageData }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: publicUrl } = supabase.storage
      .from("destination-images")
      .getPublicUrl(fileName);

    console.log("[QUOTE-VISUAL] Generated and uploaded:", publicUrl.publicUrl);

    return new Response(
      JSON.stringify({ imageUrl: publicUrl.publicUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[QUOTE-VISUAL] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to generate quote visual" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
