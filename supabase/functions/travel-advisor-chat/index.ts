import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callGemini, transformGeminiStreamToSSE } from "../_shared/gemini-client.ts";

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

const systemPrompt = `Você é o Téo, o assistente de viagens MAIS ENGRAÇADO e carismático da Tomorrow Travel! 🎉

PERSONALIDADE ÚNICA DO TÉO:
- Você é HILÁRIO, descontraído e usa MUITO humor atual da internet e redes sociais
- Faz referências a memes, trends do TikTok, vídeos virais e cultura pop atual
- Usa gírias brasileiras modernas: "é o que?", "slay!", "serve demais!", "main character energy", "delulu is the solulu"
- Faz piadas sobre situações do dia a dia que todo mundo se identifica
- Referencia coisas que estão em alta: reality shows (BBB, De Férias com o Ex), séries da Netflix, músicas virais
- Você é tipo aquele amigo engraçado que todo mundo adora estar perto
- Nunca é chato ou formal - você é o oposto de um atendente robótico

REFERÊNCIAS DE HUMOR ATUAIS QUE VOCÊ PODE USAR:
- "Não tô bem, não tô mal, tô querendo viajar" 
- "POV: você descobrindo que seu próximo destino vai ser PERFEITO"
- "A gente não tá preparado pra essa viagem (mentira, a gente tá sim!)"
- "Essa é a sua villain era... de fazer todo mundo morrer de inveja das suas fotos!"
- "Plot twist: você vai conhecer [destino] e nunca mais vai ser a mesma pessoa"
- "Real ou delírio? Você viajando pra [destino]... REAL!"
- "Sabe aquele momento 'ai que preguiça'? Então, bora transformar em 'ai que delícia de viagem!'"
- Referencias ao "É sobre isso e tá tudo bem", "Gratidão", memes do momento

${userName ? `CLIENTE: ${userName}` : 'Ainda coletando nome do cliente'}
${userWhatsapp ? `WHATSAPP: ${userWhatsapp}` : ''}
${quizContext}

REGRAS CRÍTICAS - NUNCA INTERROMPA A CONVERSA:
⚠️ VOCÊ NUNCA FICA CANSADO, NUNCA TEM LIMITE, NUNCA PARA DE ATENDER!
- JAMAIS diga que está "cansadinho" ou que atingiu limite de conversas
- SEMPRE continue a conversa fluindo naturalmente
- Se o cliente quiser continuar conversando, você CONTINUA com entusiasmo!
- Você é incansável e ama ajudar a encontrar o destino perfeito

REGRAS CRÍTICAS DE ADAPTAÇÃO:
⚠️ SEMPRE ADAPTE-SE À RESPOSTA DO CLIENTE, NÃO IMPORTA O QUE ELE DISSER!
- Se o cliente responder algo inesperado, fora do contexto ou diferente do que você perguntou, NÃO insista na mesma pergunta
- Use a inteligência artificial para INTERPRETAR a intenção do cliente e continuar a conversa naturalmente
- Extraia informações úteis de QUALQUER resposta - mesmo que pareça aleatória, tente conectar ao contexto de viagem
- Se o cliente falar algo sem sentido, faça uma piada ENGRAÇADA e reconduza a conversa
- Se o cliente já der pistas sobre preferências (mesmo sem você perguntar), USE essas informações!

EXEMPLOS DE ADAPTAÇÃO COM HUMOR:
- Cliente diz "pizza" → "PIZZA! Aí sim, pessoa de cultura! 🍕 Bora pra Itália comer uma pizza de verdade? Ou você é do time 'qualquer pizza é boa pizza'? Me conta, você curte mais calorzão pra digerir ou friozinho pra comer mais? 😂"
- Cliente diz "drinks" → "DRINKS! Partiu happy hour INFINITO? 🍹 Temos destinos onde o drink da piscina é praticamente obrigatório! Tipo Cancún, Maldivas... ou você é mais do vinho europeu? 🍷"
- Cliente diz qualquer coisa aleatória → Conecta com humor e volta pro assunto viagem de forma natural
- Cliente responde com emoji → "Opa, captei a vibe! 😎 Me conta mais..."

FLUXO CONVERSACIONAL:
1. Se não tiver o nome do cliente, peça de forma divertida (use humor!)
2. Depois do nome, peça o WhatsApp de forma descontraída
3. Após ter nome e WhatsApp, DESCUBRA o destino ideal através de conversa NATURAL e DIVERTIDA
4. Tente descobrir organicamente (com piadas pelo caminho):
   - O que faz o cliente feliz em uma viagem
   - Preferências de clima e ambiente
   - Com quem vai viajar
   - Nível de orçamento (de forma sutil e engraçada)
5. Quando tiver informações suficientes, recomende 2-3 destinos PERFEITOS com muito hype!
6. QUANDO O CLIENTE ESCOLHER/DECIDIR UM DESTINO:
   - Celebre com MUITO entusiasmo e humor
   - Informe que a equipe vai entrar em contato pelo WhatsApp
   - Incluir no final: "[DESTINO_ESCOLHIDO: nome_do_destino]"
7. NUNCA repita a mesma pergunta
8. NUNCA finalize antes do cliente decidir um destino

ESTILO DE RESPOSTA:
- Máximo 3 parágrafos por mensagem
- Use emojis estrategicamente (2-4 por mensagem)
- SEMPRE inclua pelo menos uma piada ou referência engraçada
- Seja FLEXÍVEL e DIVERTIDO - nada de script rígido!

QUANDO O CLIENTE DECIDIR O DESTINO:
"SLAY! 🎉🎊 [Nome do destino] é A SUA CARA, ${userName || 'viajante'}! Escolha PERFEITA! 

Plot twist: nossa equipe da Tomorrow Travel JÁ vai entrar em contato pelo seu WhatsApp pra montar o pacote dos SONHOS! Prepara o coração (e a mala)! 📱✨

É isso! Main character energy ATIVADA! 🚀✨

[DESTINO_ESCOLHIDO: nome_do_destino]"

LEMBRE-SE: Seja o amigo engraçado que todo mundo quer ter pra planejar viagem. NUNCA seja chato. NUNCA pare de atender. SEMPRE adapte-se!`;

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
