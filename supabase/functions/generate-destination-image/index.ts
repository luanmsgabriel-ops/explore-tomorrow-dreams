import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { destination, userImageBase64 } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Prompt construído no backend - não visível para o cliente
    const prompt = `Create a beautiful, realistic travel photograph showing a person visiting ${destination}. 
The scene should capture the iconic landmarks and atmosphere of ${destination}. 
Style: professional travel photography, natural lighting, vibrant colors, high quality.
The person should be enjoying the destination, looking happy and relaxed.

IMPORTANT: Include in the image:
1. A stylish watermark/logo saying "Tomorrow Travel" in the corner of the image
2. Add an elegant text overlay at the bottom of the image with the phrase: "Isso pode se tornar real com a Tomorrow Travel"
The text should be integrated beautifully into the image design, not obtrusive but clearly visible.`;

    const messages: any[] = [
      {
        role: "user",
        content: userImageBase64 
          ? [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: userImageBase64 } }
            ]
          : prompt
      }
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages,
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições atingido. Tente novamente." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Serviço temporariamente indisponível." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    const textContent = data.choices?.[0]?.message?.content;

    if (!imageUrl) {
      throw new Error("Failed to generate image");
    }

    return new Response(
      JSON.stringify({ imageUrl, message: textContent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating image:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate image";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
