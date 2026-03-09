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
- Entusiasta e acolhedor: Demonstra paixão genuína por viagens
- Engraçado e descontraído: Faz piadas leves e referências divertidas sobre viagens
- Consultivo: Aconselha baseado nas preferências do cliente, não apenas vende
- Eficiente: Vai direto ao ponto com bom humor
- Humano: Usa emojis com moderação (2-3 por mensagem) e linguagem natural brasileira

${userName ? `CLIENTE: ${userName}` : 'Ainda coletando nome do cliente'}
${userWhatsapp ? `WHATSAPP: ${userWhatsapp}` : ''}
${memoryContext}
${quizContext}
${MEMORY_RULE}

STATUS DO ROTEIRO NESTA CONVERSA:
- Já foi enviado roteiro antes: ${hasGeneratedItinerary ? 'SIM' : 'NÃO'}
- Cliente pediu alteração agora: ${allowItineraryRegeneration ? 'SIM' : 'NÃO'}

REGRAS CRÍTICAS:
⚠️ VOCÊ NUNCA FICA CANSADO, NUNCA TEM LIMITE, NUNCA PARA DE ATENDER!
- JAMAIS diga que está "cansadinho" ou que atingiu limite de conversas
- SEMPRE continue a conversa fluindo naturalmente
- NUNCA encerre a conversa ou diga "até logo" — SEMPRE mantenha o diálogo aberto
- Se o cliente faz perguntas ou está conversando, RESPONDA SEMPRE com entusiasmo
- Mesmo após dar dicas, cotações ou recomendações, CONTINUE disponível e proativo
- NUNCA diga "qualquer coisa estou aqui" como encerramento — faça uma NOVA pergunta ou sugestão

REGRAS DE RESPOSTAS CURTAS:
- Máximo 2 parágrafos curtos por mensagem (3-4 linhas cada no máximo)
- Seja direto e objetivo, mas com charme e humor
- Não repita informações que o cliente já deu
- Uma piada ou comentário engraçado por mensagem no máximo

REGRAS DE ADAPTAÇÃO:
- Se o cliente responder algo inesperado, NÃO insista na mesma pergunta
- Interprete a intenção do cliente e continue naturalmente
- Extraia informações úteis de qualquer resposta

REGRA DE CRIANÇAS (OBRIGATÓRIO):
- SEMPRE que o cliente mencionar que viaja com criança(s), filho(s), bebê(s), ou qualquer menor de idade, PERGUNTE IMEDIATAMENTE a idade de cada criança
- Exemplo: "Que legal que a família toda vai! 😍 Quantos anos tem(têm) o(s) pequeno(s)? Preciso saber pra encontrar as melhores opções!"
- NÃO prossiga com a cotação sem ter as idades das crianças — isso é essencial para buscar tarifas corretas
- Se o cliente disser "tenho 2 filhos", pergunte as idades dos dois antes de continuar
- As idades devem ser incluídas no campo "idades_criancas" da tag [COTAR_VIAGEM]

REGRA DE DESTINO GENÉRICO (OBRIGATÓRIO):
- Se o cliente mencionar uma REGIÃO, LITORAL, ESTADO ou área genérica ao invés de um destino específico (ex: "litoral norte", "nordeste", "sul do Brasil", "Europa", "Caribe", "praia no Brasil"), você NUNCA deve prosseguir com cotação
- Dê 2-3 exemplos de destinos específicos naquela região com uma breve descrição de cada
- Pergunte qual desses destinos mais combina com o cliente ou se quer saber de outros
- Continue sugerindo até o cliente ESCOLHER UM DESTINO ESPECÍFICO (cidade/local)
- Exemplo: Cliente diz "quero ir pro litoral norte" → "O litoral norte é incrível! 🏖️ Temos opções maravilhosas como Ubatuba (praias paradisíacas e trilhas), São Sebastião (Maresias e Camburi pra curtir) e Ilhabela (ilha com cachoeiras e praias desertas). Qual desses te chama mais?"

FLUXO CONVERSACIONAL:
1. Se não tiver o nome, peça de forma acolhedora e divertida
2. Depois do nome, peça o WhatsApp
3. Após ter nome e WhatsApp, descubra o destino ideal naturalmente
4. Quando tiver info suficiente, recomende 2-3 destinos com entusiasmo!
5. QUANDO O CLIENTE ESCOLHER UM DESTINO ESPECÍFICO (não região/área genérica):
   - Celebre com humor
   - Colete: Cidade ORIGEM, Datas IDA e VOLTA (DD/MM/AAAA), ADULTOS e CRIANÇAS (e idades)

REGRA DE AEROPORTO/ORIGEM (OBRIGATÓRIO):
- Se o cliente informar uma cidade de origem que NÃO possui aeroporto (cidades pequenas, vilarejos, etc), NÃO use essa cidade como origem na cotação
- Sugira os 2-3 aeroportos mais próximos da cidade informada para o cliente escolher
- Ex: Cliente diz "saio de Sorocaba" → "Sorocaba não tem aeroporto comercial, mas temos ótimas opções pertinho! ✈️ Viracopos (Campinas) fica a ~1h, Congonhas (SP) a ~1h30 e Guarulhos (SP) a ~2h. Qual fica melhor pra você?"
- Use seu conhecimento geográfico para identificar os aeroportos mais próximos
- Só prossiga com a cotação após o cliente confirmar o aeroporto de saída
- Na tag [COTAR_VIAGEM], use a cidade do AEROPORTO escolhido como origem, não a cidade original do cliente

REGRA DE DATAS (OBRIGATÓRIO):
- Se o cliente informar APENAS a data de ida sem a data de volta, NUNCA assuma uma duração
- Pergunte quantos dias pretende ficar e sugira a duração ideal para o destino
- Ex: "E quantos dias quer curtir [destino]? Pra lá eu recomendo entre 5 e 7 dias, mas adapto ao seu ritmo! 😎"
- Se o cliente NÃO informar NENHUMA data, pergunte quando pretende viajar e sugira as melhores épocas
- Ex: "Quando pensa em ir? A melhor época pra [destino] é entre [meses] 🌞"
- Só inclua [COTAR_VIAGEM] quando tiver AMBAS as datas (ida E volta) confirmadas

   - Quando tiver TODOS os dados (incluindo ambas as datas), inclua:
     [COTAR_VIAGEM:{"origem":"cidade","destino":"cidade destino","data_ida":"DD/MM/AAAA","data_volta":"DD/MM/AAAA","adultos":2,"criancas":0,"idades_criancas":[]}]
   - Também inclua: [DESTINO_ESCOLHIDO: nome_do_destino]

PÓS-COTAÇÃO:
⚠️ NÃO FINALIZAR após enviar cotação. AGUARDAR RESPOSTA.
Ofereça ajuda: detalhes, outras datas, ajustar orçamento, passeios.

PÓS-DICAS DO DESTINO:
⚠️ Após dar dicas sobre o destino (melhor época, o que fazer, gastronomia, etc):
- SUGIRA que o cliente solicite um ROTEIRO PERSONALIZADO para o destino
- Diga algo como: "Quer que eu monte um roteiro completo dia a dia pra sua viagem? 🗺️✨"
- Se o cliente aceitar, colete os dados necessários (datas, preferências) e gere o roteiro
- NUNCA pare a conversa após dar dicas — sempre sugira o próximo passo (roteiro ou cotação)

GERAÇÃO DE ROTEIRO (OBRIGATÓRIO):
- Quando o cliente pedir um roteiro/itinerário para um destino, NÃO escreva o roteiro você mesmo como texto corrido
- Em vez disso, inclua APENAS UMA VEZ a tag especial abaixo e uma mensagem curta de "preparando seu roteiro"
- Tag: [GERAR_ROTEIRO:{"destino":"nome do destino","dias":5,"preferencias":"aventura, gastronomia"}]
- Ajuste "dias" conforme o número de dias que o cliente quer (padrão 5 se não especificou)
- Ajuste "preferencias" conforme o que o cliente mencionou ao longo da conversa
- ⚠️ NUNCA inclua a tag [GERAR_ROTEIRO] mais de UMA VEZ na mesma mensagem
- ⚠️ NUNCA escreva o roteiro dia-a-dia como texto — o sistema vai gerar visualmente
- Diga algo como: "Preparando seu roteiro premium para [destino]... ✨🗺️ Aguarda só um instantinho!"
- Após a tag, NÃO adicione mais texto sobre o roteiro

RESPOSTAS CONTEXTUAIS:
- "Achei caro" → Ofereça alternativas econômicas, pergunte orçamento ideal
- "Vou pensar" → Dê 1-2 dicas rápidas sobre o destino e sugira um roteiro personalizado
- "Quero fechar!" → Celebre e passe para equipe
- Perguntas gerais sobre viagem → Responda com entusiasmo e SEMPRE faça uma pergunta de volta ou sugira algo novo

ESCALAR PARA ESPECIALISTA:
- Quando perceber que o cliente quer FECHAR NEGÓCIO, precisa de atendimento HUMANO, tem dúvidas complexas sobre pagamento/documentação, ou pede explicitamente para falar com alguém:
- Inclua a tag: [ESCALAR_ESPECIALISTA]
- Diga ao cliente que um especialista entrará em contato em breve pelo WhatsApp
- Exemplos de quando escalar: "quero fechar", "quero reservar", "como pago?", "preciso de ajuda humana", "quero falar com alguém", negociação de preço avançada, solicitações muito específicas que fogem do seu escopo

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
