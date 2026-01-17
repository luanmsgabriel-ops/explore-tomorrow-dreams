const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pdfText } = await req.json();

    if (!pdfText || pdfText.trim().length < 50) {
      return new Response(
        JSON.stringify({ error: "Texto do PDF é obrigatório e deve ter conteúdo suficiente" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[extract-quote-pdf] Processing PDF text, length:", pdfText.length);

    const systemPrompt = `Você é um assistente especializado em extrair informações de cotações de viagem de documentos PDF convertidos em texto.
Analise o texto fornecido e extraia as seguintes informações sobre a oferta de viagem:

Retorne SEMPRE um JSON válido com a seguinte estrutura:
{
  "destination_name": "Nome do destino (cidade, país ou região principal)",
  "title": "Título da oferta ou pacote (ex: 7 noites em João Pessoa com aéreo)",
  "total_price": número do valor total (apenas o número, sem R$ ou formatação),
  "cash_price": número do valor à vista (se houver desconto à vista, senão null),
  "installments": número máximo de parcelas (se houver parcelamento, senão null),
  "installment_value": número do valor da parcela (se houver parcelamento, senão null),
  "inclusions": ["lista", "de", "itens", "inclusos", "na", "oferta"],
  "valid_until": "data de validade no formato YYYY-MM-DD" ou null se não encontrar,
  "description": "breve descrição do pacote ou destino",
  "tagline": "frase promocional atraente baseada na oferta",
  "travel_dates": {
    "start": "YYYY-MM-DD" ou null,
    "end": "YYYY-MM-DD" ou null
  },
  "travelers": {
    "adults": número de adultos ou null,
    "children": número de crianças ou null
  },
  "hotel": {
    "name": "nome do hotel" ou null,
    "room_type": "tipo do quarto" ou null,
    "meal_plan": "regime de refeições (ex: café da manhã, all inclusive)" ou null
  },
  "flights": {
    "origin": "aeroporto de origem" ou null,
    "destination": "aeroporto de destino" ou null,
    "airline": "companhia aérea" ou null
  },
  "additional_services": ["lista", "de", "serviços", "extras"] ou []
}

REGRAS IMPORTANTES:
1. Para inclusions, identifique itens como: hospedagem, aéreo, transfer, passeios, refeições, seguro viagem, etc.
2. Se o documento mencionar parcelas, extraia o número máximo de parcelas e o valor
3. O título deve ser atraente e resumir a oferta (ex: "7 noites em João Pessoa + Aéreo + Transfer")
4. A tagline deve ser uma frase promocional curta e atraente
5. Se não conseguir encontrar alguma informação, use null
6. Sempre tente extrair o máximo de informações possíveis

Responda APENAS com o JSON, sem texto adicional.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Extraia as informações de viagem deste documento PDF:\n\n${pdfText}` }
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

    console.log("[extract-quote-pdf] AI response received");

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
      console.error("[extract-quote-pdf] Error parsing AI response:", parseError);
      console.error("[extract-quote-pdf] Raw content:", content);
      return new Response(
        JSON.stringify({ error: "Não foi possível extrair informações do documento" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[extract-quote-pdf] Extracted data:", JSON.stringify(extractedData, null, 2));

    return new Response(
      JSON.stringify(extractedData),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[extract-quote-pdf] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
