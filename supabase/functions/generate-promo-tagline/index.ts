import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callGemini } from "../_shared/gemini-client.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { destinationName, title, totalPrice, cashPrice, installments, inclusions } = await req.json();

    if (!destinationName || !totalPrice) {
      throw new Error('Destination name and total price are required');
    }

    const prompt = `Você é um copywriter premiado especializado em turismo de luxo. Crie uma LEGENDA IRRESISTÍVEL para aparecer no popup promocional de uma agência de viagens.

🎯 OFERTA:
- Destino: ${destinationName}
- Título: ${title}
- Valor: R$ ${totalPrice}
${cashPrice ? `- À vista: ${cashPrice}` : ''}
${installments ? `- Parcelamento: ${installments}` : ''}
${inclusions ? `- Incluso: ${inclusions}` : ''}

📝 INSTRUÇÕES:
Crie uma legenda de 1-2 frases que:
1. DESPERTE EMOÇÃO e desejo imediato de viajar
2. Use palavras poderosas (sonho, paraíso, exclusivo, imperdível, única chance)
3. Crie URGÊNCIA (agora, não perca, última oportunidade)
4. Seja MEMORÁVEL e faça o cliente querer clicar em "Ver Mais"
5. NÃO inclua preços, números ou emojis

Exemplos de legendas impactantes:
- "Seu sonho de conhecer o paraíso está a um clique. Esta é a sua chance!"
- "Experiências assim acontecem uma vez na vida. Não deixe passar."
- "O destino dos seus sonhos te espera. Aproveite antes que acabe!"

Responda APENAS com a legenda, sem aspas, explicações ou formatação.`;

    const response = await callGemini(
      [{ role: 'user', content: prompt }],
      { model: 'google/gemini-2.5-flash', maxTokens: 150 }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI error:', errorText);
      throw new Error(`AI error: ${response.status}`);
    }

    const data = await response.json();
    const tagline = data.choices?.[0]?.message?.content?.trim();

    if (!tagline) {
      throw new Error('Failed to generate tagline');
    }

    return new Response(
      JSON.stringify({ tagline }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error: unknown) {
    console.error('Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
