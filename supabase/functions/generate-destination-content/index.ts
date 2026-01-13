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
    const { destinationName, type } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let prompt = "";
    
    if (type === "description") {
      prompt = `Crie uma descrição atraente e envolvente para o destino turístico "${destinationName}". 
      A descrição deve ter 2-3 frases, destacando os principais atrativos e a experiência única que o viajante terá.
      Responda APENAS com a descrição, sem títulos ou formatação adicional.`;
    } else if (type === "full") {
      prompt = `Crie informações completas para o destino turístico "${destinationName}" em formato JSON com os seguintes campos:
      - description: descrição atraente de 2-3 frases
      - bestTime: melhor época para visitar (ex: "Março a Outubro")
      - idealDuration: duração ideal da viagem (ex: "5 a 7 dias")
      - forWho: público ideal (ex: "Casais e aventureiros")
      - category: categoria do destino (ex: "Praia", "Aventura", "Cultural", "Natureza", "Histórico", "Romântico", "Luxo")
      
      Responda APENAS com o JSON válido, sem markdown ou formatação adicional.`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "Você é um especialista em turismo e viagens. Crie conteúdo atraente e informativo sobre destinos turísticos."
          },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to generate content");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});