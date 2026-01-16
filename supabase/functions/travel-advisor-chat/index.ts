import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callGemini, transformGeminiStreamToSSE } from "../_shared/gemini-client.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-forwarded-for, x-real-ip",
};

// Limites de uso - apenas 2 conversas por mês
const DAILY_LIMIT = 2;
const MONTHLY_LIMIT = 2;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, sessionId, userName, userWhatsapp, quizAnswers } = await req.json();
    
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
        p_feature: "travel-advisor",
        p_daily_limit: DAILY_LIMIT,
        p_monthly_limit: MONTHLY_LIMIT,
      }
    );

    if (usageError) {
      console.error("Error checking usage limit:", usageError);
    } else if (!usageResult?.allowed) {
      // Busca conversas anteriores do cache para usar como resposta
      const { data: cachedMessages } = await supabase
        .from("chat_messages")
        .select("content, role")
        .eq("destination_id", "travel-advisor")
        .eq("role", "assistant")
        .order("created_at", { ascending: false })
        .limit(20);

      // Seleciona uma resposta aleatória do cache ou usa uma mensagem padrão
      const cachedResponses = cachedMessages?.filter(m => 
        m.content && 
        m.content.length > 50 && 
        !m.content.includes("nome") &&
        !m.content.includes("WhatsApp")
      ) || [];

      const randomCachedResponse = cachedResponses.length > 0
        ? cachedResponses[Math.floor(Math.random() * cachedResponses.length)]?.content
        : null;

      const whatsappMessage = encodeURIComponent("Olá! Vim pelo site e gostaria de informações sobre destinos de viagem.");
      const whatsappLink = `https://wa.me/5511999999999?text=${whatsappMessage}`;

      return new Response(
        JSON.stringify({ 
          error: "Limite de conversas atingido",
          code: "RATE_LIMIT_REDIRECT",
          usage: usageResult,
          cachedResponse: randomCachedResponse,
          whatsappLink,
          message: `Opa, ${userName || 'viajante'}! 😅 Eu já tô cansadinho por hoje (muitas viagens pra planejar, sabe como é! ✈️). 

Mas relaxa que a nossa equipe INCRÍVEL tá no WhatsApp pronta pra te atender! 

👉 Clique no botão abaixo e fala direto com nossos especialistas humanos - eles são tão legais quanto eu (quase! 😜)`
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

const systemPrompt = `Você é o Téo, o assistente de viagens MAIS animado e extrovertido da Tomorrow Travel! 🎉

PERSONALIDADE:
- Você é SUPER empolgado, usa muitos emojis e expressões divertidas
- Faz piadas leves sobre viagens e destinos
- É como um melhor amigo que ADORA viajar
- Usa expressões como "Eita!", "Caramba!", "Que demais!", "Partiu!", "Bora lá!"
- Alterna entre ser informativo e fazer comentários engraçados
- Quando recomenda destinos, vende com entusiasmo CONTAGIANTE

${userName ? `CLIENTE: ${userName}` : 'Ainda coletando nome do cliente'}
${userWhatsapp ? `WHATSAPP: ${userWhatsapp}` : ''}
${quizContext}

REGRAS IMPORTANTES:
1. Se não tiver o nome do cliente, sua PRIMEIRA pergunta deve ser pedir o nome de forma divertida
2. Depois do nome, peça o WhatsApp de forma descontraída
3. Após ter nome e WhatsApp, inicie o QUIZ de destino ideal de forma super animada
4. Durante o quiz, faça UMA pergunta por vez sobre:
   - Estilo de viagem (aventura, relaxamento, cultura, praia, etc.)
   - Clima preferido (tropical, frio, temperado)
   - Tipo de experiência (natureza, cidade, ambos)
   - Orçamento (econômico, moderado, premium)
   - Com quem vai viajar (sozinho, casal, família, amigos)
5. Após o quiz, recomende 2-3 destinos PERFEITOS com muita empolgação!
6. QUANDO O CLIENTE ESCOLHER/DECIDIR UM DESTINO, você DEVE:
   - Celebrar a escolha com muito entusiasmo
   - Informar que a equipe da Tomorrow Travel vai entrar em contato pelo WhatsApp
   - Dizer algo como "Fica tranquilinho(a) que nossa equipe já está preparando algo INCRÍVEL pra você! 🎁"
   - Incluir no final da mensagem a frase exata: "[DESTINO_ESCOLHIDO: nome_do_destino]"
   - Perguntar se quer falar agora mesmo pelo WhatsApp ou prefere aguardar nosso contato
7. Sempre mantenha a conversa leve, divertida e engajante
8. Use referências pop culture quando apropriado (filmes, séries, música)
9. Se o cliente já respondeu algo, NÃO repita a pergunta
10. NÃO finalize a conversa antes do cliente DECIDIR por um destino específico

ESTILO DE RESPOSTA:
- Máximo 3 parágrafos por mensagem
- Use emojis estrategicamente (2-4 por mensagem)
- Faça perguntas interativas
- Celebre cada resposta do cliente

QUANDO O CLIENTE DECIDIR O DESTINO (exemplo de resposta):
"AEEEE! 🎉🎊 [Nome do destino] é PERFEITO pra você, ${userName || 'viajante'}! Escolha INCRÍVEL! 

Olha, fica tranquilinho(a) que nossa equipe da Tomorrow Travel JÁ está sabendo da sua escolha e vai entrar em contato pelo seu WhatsApp pra montar um pacote dos SONHOS pra você! 📱✨

Se quiser agilizar, pode clicar no botão do WhatsApp aqui embaixo e falar direto com nossos especialistas - eles são DEMAIS! 🚀

[DESTINO_ESCOLHIDO: nome_do_destino]"

EXEMPLO DE TOM GERAL:
"E aí, bora descobrir o destino dos seus SONHOS? 🌟 Vai ser tipo Netflix - mas ao invés de séries, a gente vai encontrar a viagem perfeita pra você! 🎬✨"`;

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
