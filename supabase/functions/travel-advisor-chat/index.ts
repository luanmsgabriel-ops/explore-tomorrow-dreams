import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callGemini, transformGeminiStreamToSSE } from "../_shared/gemini-client.ts";
import { SALES_KNOWLEDGE } from "../_shared/sales-knowledge.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-forwarded-for, x-real-ip",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, sessionId, userName, userWhatsapp, quizAnswers } = await req.json();
    
    // Inicializa Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Save user message to database if sessionId is provided
    if (sessionId && messages.length > 0) {
      const lastUserMessage = messages[messages.length - 1];
      if (lastUserMessage?.role === "user") {
        await supabase.from("chat_messages").insert({
          session_id: sessionId,
          destination_id: "travel-advisor",
          role: "user",
          content: lastUserMessage.content,
          user_name: userName || null,
          user_whatsapp: userWhatsapp || null,
        });
      }
    }

    // Build quiz context for the AI
    let quizContext = "";
    if (quizAnswers) {
      quizContext = `
      
INFORMAÇÕES DO QUIZ (use isso para personalizar suas recomendações):
- Estilo de viagem preferido: ${quizAnswers.travelStyle || 'não informado'}
- Clima preferido: ${quizAnswers.climate || 'não informado'}
- Tipo de experiência: ${quizAnswers.experience || 'não informado'}
- Orçamento: ${quizAnswers.budget || 'não informado'}
- Companhia de viagem: ${quizAnswers.companion || 'não informado'}
`;
    }

const systemPrompt = `Você é o Téo, assistente virtual da Tomorrow Travel, especializado em viagens personalizadas e inesquecíveis! 🌍

IDENTIDADE E PERSONALIDADE:
- Entusiasta e acolhedor: Demonstra paixão genuína por viagens
- Engraçado e descontraído: Faz piadas leves e referências divertidas sobre viagens
- Consultivo: Aconselha baseado nas preferências do cliente, não apenas vende
- Eficiente: Vai direto ao ponto com bom humor
- Humano: Usa emojis com moderação (2-3 por mensagem) e linguagem natural brasileira

${userName ? `CLIENTE: ${userName}` : 'Ainda coletando nome do cliente'}
${userWhatsapp ? `WHATSAPP: ${userWhatsapp}` : ''}
${quizContext}

REGRAS CRÍTICAS:
⚠️ VOCÊ NUNCA FICA CANSADO, NUNCA TEM LIMITE, NUNCA PARA DE ATENDER!
- JAMAIS diga que está "cansadinho" ou que atingiu limite de conversas
- SEMPRE continue a conversa fluindo naturalmente

REGRAS DE RESPOSTAS CURTAS:
- Máximo 2 parágrafos curtos por mensagem (3-4 linhas cada no máximo)
- Seja direto e objetivo, mas com charme e humor
- Não repita informações que o cliente já deu
- Uma piada ou comentário engraçado por mensagem no máximo

REGRAS DE ADAPTAÇÃO:
- Se o cliente responder algo inesperado, NÃO insista na mesma pergunta
- Interprete a intenção do cliente e continue naturalmente
- Extraia informações úteis de qualquer resposta

FLUXO CONVERSACIONAL:
1. Se não tiver o nome, peça de forma acolhedora e divertida
2. Depois do nome, peça o WhatsApp
3. Após ter nome e WhatsApp, descubra o destino ideal naturalmente
4. Quando tiver info suficiente, recomende 2-3 destinos com entusiasmo!
5. QUANDO O CLIENTE ESCOLHER UM DESTINO:
   - Celebre com humor
   - Colete: Cidade ORIGEM, Datas IDA e VOLTA (DD/MM/AAAA), ADULTOS e CRIANÇAS (e idades)
   - Quando tiver TODOS os dados, inclua:
     [COTAR_VIAGEM:{"origem":"cidade","destino":"cidade destino","data_ida":"DD/MM/AAAA","data_volta":"DD/MM/AAAA","adultos":2,"criancas":0,"idades_criancas":[]}]
   - Também inclua: [DESTINO_ESCOLHIDO: nome_do_destino]

PÓS-COTAÇÃO:
⚠️ NÃO FINALIZAR após enviar cotação. AGUARDAR RESPOSTA.
Ofereça ajuda: detalhes, outras datas, ajustar orçamento, passeios.

RESPOSTAS CONTEXTUAIS:
- "Achei caro" → Ofereça alternativas econômicas, pergunte orçamento ideal
- "Vou pensar" → Dê 1-2 dicas rápidas sobre o destino
- "Quero fechar!" → Celebre e passe para equipe

LEMBRE-SE: Seja divertido, acolhedor e BREVE. Menos texto, mais impacto! 🚀` + SALES_KNOWLEDGE;

    const response = await callGemini(
      [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      { model: "google/gemini-3-flash-preview", stream: true }
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
      throw new Error(`AI error: ${response.status}`);
    }

    // Verifica se é resposta do Gemini direto (precisa transformar) ou Lovable AI (já é SSE)
    const contentType = response.headers.get("content-type") || "";
    const isGeminiDirect = !contentType.includes("text/event-stream");
    
    let streamBody = response.body;
    if (isGeminiDirect && streamBody) {
      // Transforma o stream do Gemini para SSE compatível
      streamBody = transformGeminiStreamToSSE(streamBody);
    }

    // We need to process the stream to save the assistant's response
    const reader = streamBody?.getReader();
    if (!reader) {
      throw new Error("No reader available");
    }

    let assistantContent = "";
    const decoder = new TextDecoder();

    // Create a transform stream to capture and forward the response
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();

    // Process the stream in the background
    (async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Forward the chunk
          await writer.write(value);

          // Parse the chunk to extract content
          const text = decoder.decode(value, { stream: true });
          const lines = text.split("\n");
          
          for (const line of lines) {
            if (line.startsWith("data: ") && line.trim() !== "data: [DONE]") {
              try {
                const json = JSON.parse(line.slice(6));
                const content = json.choices?.[0]?.delta?.content;
                if (content) {
                  assistantContent += content;
                }
              } catch {
                // Ignore parsing errors for incomplete chunks
              }
            }
          }
        }

        // Save assistant response to database after stream is complete
        if (sessionId && assistantContent) {
          await supabase.from("chat_messages").insert({
            session_id: sessionId,
            destination_id: "travel-advisor",
            role: "assistant",
            content: assistantContent,
            user_name: userName || null,
            user_whatsapp: userWhatsapp || null,
          });
        }
      } catch (error) {
        console.error("Error processing stream:", error);
      } finally {
        await writer.close();
      }
    })();

    return new Response(readable, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Error in travel advisor chat:", error);
    const errorMessage = error instanceof Error ? error.message : "Chat error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
