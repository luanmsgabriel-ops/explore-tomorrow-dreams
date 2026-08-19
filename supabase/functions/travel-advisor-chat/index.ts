import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callGemini, transformGeminiStreamToSSE } from "../_shared/gemini-client.ts";
import { SALES_KNOWLEDGE } from "../_shared/sales-knowledge.ts";
import { fetchClientMemory, formatMemoryForPrompt, MEMORY_RULE, updateClientMemory } from "../_shared/client-memory.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-forwarded-for, x-real-ip",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, sessionId, userName, userWhatsapp, quizAnswers, hasGeneratedItinerary = false, allowItineraryRegeneration = false } = await req.json();
    
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

    // Fetch client memory
    const clientMemory = await fetchClientMemory(supabase, userWhatsapp);
    const memoryContext = clientMemory ? formatMemoryForPrompt(clientMemory) : "";
    if (clientMemory) {
      console.log("[MEMORY] Found memory for", userWhatsapp, "- name:", clientMemory.client_name);
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
- Entusiasta, engraçado, consultivo e humano. Use emojis com moderação (2-3 por mensagem).
- NUNCA encerre a conversa. SEMPRE mantenha o diálogo aberto.

REGRAS DE COTAÇÃO (MUITO IMPORTANTE):
1. O Téo coleta: origem, destino, data ida, data volta, adultos, crianças e idades.
2. SEMPRE confirme esses dados com o cliente antes de processar.
3. Após a confirmação, o Téo NÃO entrega cotação fechada/garantida.
4. Você deve incluir a tag [COTAR_VIAGEM:...] na sua resposta interna.
5. Ao responder ao cliente:
   - Informe que um consultor especialista entrará em contato em breve (prazo de até 2 horas em horário comercial) para finalizar a cotação oficial.
   - Apresente as opções que o sistema retornou como "Possibilidades na nossa base".
   - Apresente no máximo TRÊS opções, de forma curta e organizada.
   - Se a opção de "Melhor Preço" for mais barata que a data original, destaque a economia de forma direta e pergunte se ele tem flexibilidade.
   - PERGUNTE EXPLICITAMENTE quais dessas opções o cliente quer que o consultor cote para ele.
   - Se o cliente escolher, ou se ele pedir outra coisa, informe que anotou tudo para o consultor.

REGRAS DE APRESENTAÇÃO DE VALORES:
- SEMPRE informe: valor por pessoa, taxa de embarque somada à parte, prazo de emissão.
- SEMPRE informe que a disponibilidade está sujeita a confirmação e não é reserva garantida.

REGRAS CRÍTICAS:
⚠️ VOCÊ NUNCA FICA CANSADO!
- REGRA DE CRIANÇAS: Pergunte idades imediatamente.
- REGRA DE DESTINO GENÉRICO: Sugira destinos específicos até o cliente escolher um.
- REGRA DE AEROPORTO/ORIGEM: Se o embarque for em uma cidade vizinha ou aeroporto diferente do solicitado (ex: São Paulo -> Viracopos/Campinas), você DEVE avisar o cliente claramente que a oferta é partindo desse aeroporto específico.
- REGRA DE DATAS: Precisa de IDA e VOLTA confirmadas.

TAGS ESPECIAIS:
- [COTAR_VIAGEM:{"origem":"cidade","destino":"cidade","data_ida":"DD/MM/AAAA","data_volta":"DD/MM/AAAA","adultos":2,"criancas":0,"idades_criancas":[]}]
- [DESTINO_ESCOLHIDO: nome]
- [ESCALAR_ESPECIALISTA] (use quando o cliente quiser fechar ou precisar de humano)

LEMBRE-SE: Seja divertido, breve e focado em ajudar o cliente a escolher a melhor opção! 🚀` + SALES_KNOWLEDGE;


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

        // Update client memory (fire-and-forget)
        if (userWhatsapp && assistantContent) {
          const allMessages = [
            ...messages.map((m: any) => ({ role: m.role, content: m.content })),
            { role: "assistant", content: assistantContent },
          ];
          updateClientMemory(supabase, userWhatsapp, userName || null, allMessages, clientMemory).catch(
            (err) => console.error("[MEMORY] Background update error:", err)
          );
        }

        // Check for escalation tag
        if (assistantContent.includes("[ESCALAR_ESPECIALISTA]")) {
          try {
            // Build conversation summary from recent messages
            const recentMessages = messages.slice(-10).map((m: { role: string; content: string }) => 
              `${m.role === 'user' ? '👤 Cliente' : '🤖 Téo'}: ${m.content}`
            ).join('\n\n');

            const clientWhatsappLink = userWhatsapp 
              ? `https://wa.me/55${userWhatsapp.replace(/\D/g, '')}`
              : 'WhatsApp não informado';

            const summaryText = `🚨 *ESCALAÇÃO - Téo solicitou especialista*\n\n` +
              `👤 *Cliente:* ${userName || 'Não informado'}\n` +
              `📱 *WhatsApp:* ${userWhatsapp || 'Não informado'}\n` +
              `🔗 *Link direto:* ${clientWhatsappLink}\n\n` +
              `📋 *Resumo da conversa:*\n${recentMessages}\n\n` +
              `⚡ Por favor, entre em contato com o cliente o mais rápido possível!`;

            // Send WhatsApp message to admin
            const whatsappToken = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
            const phoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
            
            if (whatsappToken && phoneNumberId) {
              await fetch(
                `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
                {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${whatsappToken}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    messaging_product: "whatsapp",
                    to: "5515998389220",
                    type: "text",
                    text: { body: summaryText },
                  }),
                }
              );
              console.log("Escalation WhatsApp sent to admin");
            }

            // Send email notification
            await supabase.functions.invoke("send-admin-notification", {
              body: {
                type: "escalation",
                data: {
                  client_name: userName || "Não informado",
                  client_whatsapp: userWhatsapp || "Não informado",
                  client_whatsapp_link: clientWhatsappLink,
                  conversation_summary: recentMessages,
                  source: "Téo Chat (Website)",
                },
              },
            });
            console.log("Escalation email notification sent");
          } catch (escalationError) {
            console.error("Error sending escalation notifications:", escalationError);
          }
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
