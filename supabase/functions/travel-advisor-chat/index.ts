import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
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
6. Sempre mantenha a conversa leve, divertida e engajante
7. Use referências pop culture quando apropriado (filmes, séries, música)
8. Se o cliente já respondeu algo, NÃO repita a pergunta

ESTILO DE RESPOSTA:
- Máximo 3 parágrafos por mensagem
- Use emojis estrategicamente (2-4 por mensagem)
- Faça perguntas interativas
- Celebre cada resposta do cliente

EXEMPLO DE TOM:
"E aí, bora descobrir o destino dos seus SONHOS? 🌟 Vai ser tipo Netflix - mas ao invés de séries, a gente vai encontrar a viagem perfeita pra você! 🎬✨"`;

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

    // We need to process the stream to save the assistant's response
    const reader = response.body?.getReader();
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
