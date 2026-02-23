import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callGemini } from "../_shared/gemini-client.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-forwarded-for, x-real-ip",
};

// Limites de uso
const DAILY_LIMIT = 2;
const MONTHLY_LIMIT = 4;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { destination, userImageBase64 } = await req.json();
    
    // Obtém IP do cliente
    const forwardedFor = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    const clientIp = forwardedFor?.split(",")[0]?.trim() || realIp || "unknown";
    
    // Inicializa Supabase com service role para verificar limites
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verifica limite de uso
    const { data: usageResult, error: usageError } = await supabase.rpc(
      "check_ai_usage_limit",
      {
        p_ip_address: clientIp,
        p_feature: "image",
        p_daily_limit: DAILY_LIMIT,
        p_monthly_limit: MONTHLY_LIMIT,
      }
    );

    if (usageError) {
      console.error("Error checking usage limit:", usageError);
    } else if (!usageResult?.allowed) {
      const reason = usageResult.reason === "daily_limit" 
        ? `Você atingiu o limite diário de ${DAILY_LIMIT} imagens. Tente novamente amanhã.`
        : `Você atingiu o limite mensal de ${MONTHLY_LIMIT} imagens. Tente novamente no próximo mês.`;
      
      return new Response(
        JSON.stringify({ 
          error: reason,
          code: "RATE_LIMIT",
          usage: usageResult
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prompt construído no backend - não visível para o cliente
    const prompt = `Create a beautiful, realistic travel photograph showing a person visiting ${destination}. 
The scene should capture the iconic landmarks and atmosphere of ${destination}. 
Style: professional travel photography, natural lighting, vibrant colors, high quality.
The person should be enjoying the destination, looking happy and relaxed.

MANDATORY BRANDING REQUIREMENT:
In the bottom right corner, include a stylish logo with the letters "TT" intertwined in teal (#2DD4BF) and gold (#D4A574) colors, with a golden airplane silhouette. Below the logo, write "TOMORROW TRAVEL" in elegant gold lettering.

The logo should be professional and not obstruct the main travel scene.`;

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

    const response = await callGemini(
      messages,
      { model: "google/gemini-2.5-flash-image", generateImage: true }
    );

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
      console.error("AI error:", response.status, errorText);
      throw new Error(`AI error: ${response.status}`);
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
