import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const { messages, destination } = await req.json();
    
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
        p_feature: "chat",
        p_daily_limit: DAILY_LIMIT,
        p_monthly_limit: MONTHLY_LIMIT,
      }
    );

    if (usageError) {
      console.error("Error checking usage limit:", usageError);
    } else if (!usageResult?.allowed) {
      const reason = usageResult.reason === "daily_limit" 
        ? `Você atingiu o limite diário de ${DAILY_LIMIT} conversas. Tente novamente amanhã.`
        : `Você atingiu o limite mensal de ${MONTHLY_LIMIT} conversas. Tente novamente no próximo mês.`;
      
      return new Response(
        JSON.stringify({ 
          error: reason,
          code: "RATE_LIMIT",
          usage: usageResult
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Você é um assistente de viagens especializado da Tomorrow Travel.
Você está ajudando um cliente que está interessado em viajar para: ${destination}

Você deve:
- Responder perguntas sobre o destino de forma precisa e útil
- Fornecer informações sobre clima, melhor época para visitar, cultura local
- Sugerir passeios, restaurantes e experiências
- Dar dicas práticas sobre documentação, moeda, idioma
- Ser amigável, entusiasta e profissional
- Manter respostas concisas mas informativas

Se o cliente perguntar sobre preços ou reservas, sugira que solicite uma cotação personalizada.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
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
      throw new Error(`AI gateway error: ${response.status}`);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Error in destination chat:", error);
    const errorMessage = error instanceof Error ? error.message : "Chat error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
