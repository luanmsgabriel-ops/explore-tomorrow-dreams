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
    const { destination, preferences, email, whatsapp } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Você é um especialista em viagens da Tomorrow Travel, uma agência de viagens premium. 
Sua função é criar roteiros de viagem personalizados, detalhados e inspiradores.

Ao criar o roteiro, inclua:
- Dia a dia da viagem com atividades específicas
- Melhores horários para cada atividade
- Dicas de restaurantes e gastronomia local
- Sugestões de hospedagem por faixa de preço
- Dicas práticas (moeda, fuso horário, clima esperado)
- O que levar na mala
- Pontos de atenção e dicas de segurança

Use formatação Markdown para organizar o conteúdo.
Seja entusiasta e inspire o viajante!`;

    const userPrompt = `Crie um roteiro de viagem completo para: ${destination}

Preferências do viajante: ${preferences || 'Não especificadas - crie um roteiro equilibrado entre cultura, natureza e gastronomia'}

O roteiro deve ter entre 5-7 dias e ser detalhado.`;

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
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em alguns minutos." }),
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

    const data = await response.json();
    const itinerary = data.choices?.[0]?.message?.content;

    if (!itinerary) {
      throw new Error("Failed to generate itinerary");
    }

    return new Response(
      JSON.stringify({ itinerary, destination, email, whatsapp }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating itinerary:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate itinerary";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
