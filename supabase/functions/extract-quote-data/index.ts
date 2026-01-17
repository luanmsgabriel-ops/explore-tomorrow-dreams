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
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: "URL é obrigatória" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[extract-quote-data] Fetching URL:", url);

    // Fetch the webpage content
    let pageContent = "";
    try {
      const pageResponse = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });

      if (!pageResponse.ok) {
        throw new Error(`Failed to fetch page: ${pageResponse.status}`);
      }

      pageContent = await pageResponse.text();
      // Limit content size for AI processing
      pageContent = pageContent.substring(0, 50000);
    } catch (fetchError) {
      console.error("[extract-quote-data] Error fetching URL:", fetchError);
      return new Response(
        JSON.stringify({ error: "Não foi possível acessar a URL fornecida" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    const systemPrompt = `Você é um assistente especializado em extrair informações de cotações de viagem de páginas web.
Analise o conteúdo HTML fornecido e extraia as seguintes informações sobre a oferta de viagem:

Retorne SEMPRE um JSON válido com a seguinte estrutura:
{
  "destination_name": "Nome do destino (cidade, país ou região)",
  "title": "Título da oferta ou pacote",
  "total_price": número do valor total (apenas o número, sem R$ ou formatação),
  "cash_price": número do valor à vista (se houver desconto à vista, senão null),
  "installments": número de parcelas (se houver parcelamento, senão null),
  "installment_value": número do valor da parcela (se houver parcelamento, senão null),
  "inclusions": ["lista", "de", "itens", "inclusos"],
  "valid_until": "data de validade no formato YYYY-MM-DD" ou null se não encontrar,
  "description": "breve descrição do pacote ou destino",
  "tagline": "frase promocional atraente baseada na oferta"
}

Se não conseguir encontrar alguma informação, use null. Sempre tente extrair o máximo de informações possíveis.
Responda APENAS com o JSON, sem texto adicional.`;

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
          { role: "user", content: `Extraia as informações de viagem deste conteúdo HTML:\n\n${pageContent}` }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione créditos à sua conta." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Nenhuma resposta da IA");
    }

    console.log("[extract-quote-data] AI response:", content);

    // Parse the JSON response
    let extractedData;
    try {
      // Clean the response (remove markdown code blocks if present)
      let cleanContent = content.trim();
      if (cleanContent.startsWith("```json")) {
        cleanContent = cleanContent.slice(7);
      }
      if (cleanContent.startsWith("```")) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith("```")) {
        cleanContent = cleanContent.slice(0, -3);
      }
      extractedData = JSON.parse(cleanContent.trim());
    } catch (parseError) {
      console.error("[extract-quote-data] Error parsing AI response:", parseError);
      return new Response(
        JSON.stringify({ error: "Não foi possível extrair informações da página" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify(extractedData),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[extract-quote-data] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
