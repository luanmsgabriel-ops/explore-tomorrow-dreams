import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SALES_KNOWLEDGE } from "../_shared/sales-knowledge.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const INSTAGRAM_ACCESS_TOKEN = Deno.env.get("INSTAGRAM_ACCESS_TOKEN");
const WHATSAPP_VERIFY_TOKEN = Deno.env.get("WHATSAPP_VERIFY_TOKEN"); // reuse same verify token
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ========== Teo System Prompt (Instagram version) ==========

const TEO_SYSTEM_PROMPT = `Você é o Téo, assistente virtual da Tomorrow Travel, especializado em viagens personalizadas e inesquecíveis! 🌍

IDENTIDADE E PERSONALIDADE:
- Entusiasta e acolhedor: Demonstra paixão genuína por viagens
- Engraçado e descontraído: Faz piadas leves e referências divertidas sobre viagens
- Consultivo: Aconselha baseado nas preferências do cliente, não apenas vende
- Eficiente: Vai direto ao ponto com bom humor
- Humano: Usa emojis com moderação (2-3 por mensagem) e linguagem natural brasileira

Você está conversando pelo Instagram Direct para ajudar clientes a planejarem viagens.

REGRAS DE RESPOSTAS ULTRA-CURTAS:
- MÁXIMO 2 linhas por mensagem durante a coleta de dados
- MÁXIMO 3 linhas nas demais mensagens
- PROIBIDO mais de 1 parágrafo durante a coleta
- Seja direto, sem enrolação, sem repetir o que o cliente disse
- Um emoji ou piada curta por mensagem, no máximo
- NÃO faça comentários longos sobre o destino, apenas reaja brevemente (ex: "Boa escolha! 🔥")

REGRA DE PRIORIDADE:
- Se o cliente perguntar algo (dúvida, curiosidade, dica, info sobre destino, qualquer assunto), RESPONDA primeiro. Não force a coleta de dados.
- Acompanhe a conversa naturalmente. Você é um consultor de viagens, não um formulário.
- O fluxo de coleta só começa quando o cliente demonstra interesse em cotar ("quero cotar", "quanto custa", "quero viajar pra X") ou quando você sugere a cotação.
- Se o cliente já informou o destino em uma pergunta, guarde essa info e use quando for cotar.

FLUXO DE ATENDIMENTO:
1. RECEPÇÃO - Cumprimente brevemente e pergunte o nome (1-2 linhas apenas)
2. COLETA (ULTRA-BREVE - máximo 2 linhas por mensagem):
   - Pergunte ORIGEM e DESTINO na MESMA mensagem (sem comentários extras)
   - Pergunte DATAS e QUANTIDADE DE PESSOAS na MESMA mensagem
   - Se tiver crianças, pergunte as idades
   - NÃO comente sobre o destino, NÃO faça piadas longas, apenas colete os dados

IMPORTANTE - MENSAGEM COMPLETA:
Se o usuário enviar UMA MENSAGEM com TODAS as informações, extraia TUDO de uma vez e vá direto para o RESUMO DE VALIDAÇÃO.

3. VALIDAÇÃO (OBRIGATÓRIA antes de cotar):
   "Deixa eu confirmar os dados ✈️
   📍 Origem: X
   📍 Destino: Y
   📅 Ida: DD/MM | Volta: DD/MM
   👥 N adultos, N crianças (idades)
   Tá tudo certo? Posso buscar as melhores opções pra vocês? 🔥"

4. PÓS-COTAÇÃO:
   Ofereça ajuda: detalhes, outras datas, ajustar orçamento, passeios.

5. TRANSIÇÃO PARA WHATSAPP:
   Quando tiver todos os dados e o cliente confirmar, convide-o a continuar pelo WhatsApp:
   "Vou te passar pro nosso WhatsApp pra enviar a cotação completa! 📲 Me chama lá: wa.me/5511999999999"
   
   ⚠️ Como o Instagram não permite enviar cotações completas, sempre direcione para o WhatsApp após coletar os dados.

REGRAS:
- NÃO invente preços, só colete dados
- Sempre personalize com nome do cliente
- Mensagens ULTRA-CURTAS: máximo 2 linhas na coleta, 3 linhas no resto
- NÃO repita o que o cliente já informou
- Humor em doses mínimas

Quando identificar uma info, adicione no final:
[DADOS:campo=valor]

Campos: nome, destino, datas, num_viajantes, tipo_viagem, orcamento, preferencias

Tudo coletado e confirmado:
[STATUS:completed]

Cliente quer falar com humano:
[STATUS:human_takeover]

REGRA CRÍTICA DE ANO: O ano atual é ${new Date().getFullYear()}.`;

// ========== Helper Functions ==========

function extractCollectedData(aiResponse: string, existingData: Record<string, any>): { data: Record<string, any>; status: string | null } {
  const newData = { ...existingData };
  let status: string | null = null;

  const dataMatches = aiResponse.matchAll(/\[DADOS:(\w+)=(.+?)\]/g);
  for (const match of dataMatches) {
    newData[match[1]] = match[2];
  }

  const statusMatch = aiResponse.match(/\[STATUS:(\w+)\]/);
  if (statusMatch) {
    status = statusMatch[1];
  }

  return { data: newData, status };
}

function cleanAiResponse(response: string): string {
  return response
    .replace(/\[DADOS:\w+=.*?\]/g, "")
    .replace(/\[STATUS:\w+\]/g, "")
    .replace(/\[COTAR_VIAGEM:\s*\{.*?\}\s*\]/gs, "")
    .replace(/\[DESTINO_ESCOLHIDO:\s*[^\]]+\]/gi, "")
    .replace(/\[ALTERAR_COTACAO:\s*[^\]]+\]/gi, "")
    .trim();
}

function determineConversationState(collectedData: Record<string, any>): string {
  if (!collectedData.nome) return "collecting_name";
  if (!collectedData.destino) return "collecting_destination";
  if (!collectedData.datas) return "collecting_dates";
  if (!collectedData.num_viajantes) return "collecting_people";
  return "summary_confirmation";
}

async function getAiResponse(messagesHistory: any[]): Promise<string> {
  const models = ["google/gemini-2.5-flash", "openai/gpt-5-mini", "google/gemini-2.5-flash-lite"];
  
  for (const model of models) {
    try {
      console.log(`[IG] Trying AI model: ${model}`);
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: TEO_SYSTEM_PROMPT + SALES_KNOWLEDGE },
            ...messagesHistory,
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[IG] AI error ${model}: ${response.status} ${errorText}`);
        continue;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        console.log(`[IG] AI response from ${model} ✓`);
        return content;
      }
    } catch (err) {
      console.error(`[IG] Error ${model}:`, err.message);
      continue;
    }
  }
  
  return "Oi! 😊 Estou com um probleminha técnico agora, mas não se preocupe! Me manda uma mensagem no nosso WhatsApp que a equipe te atende rapidinho! ✈️";
}

async function sendInstagramMessage(recipientId: string, message: string): Promise<void> {
  if (!INSTAGRAM_ACCESS_TOKEN) {
    console.error("[IG] INSTAGRAM_ACCESS_TOKEN not configured");
    return;
  }

  // Instagram has a 1000 char limit per message, split if needed
  const maxLen = 950;
  const parts: string[] = [];
  let remaining = message;
  while (remaining.length > maxLen) {
    const splitIdx = remaining.lastIndexOf("\n", maxLen);
    const idx = splitIdx > 0 ? splitIdx : maxLen;
    parts.push(remaining.substring(0, idx));
    remaining = remaining.substring(idx).trimStart();
  }
  if (remaining) parts.push(remaining);

  for (const part of parts) {
    const response = await fetch(
      `https://graph.instagram.com/v21.0/me/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${INSTAGRAM_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipient: { id: recipientId },
          message: { text: part },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[IG] Instagram Send API error:", response.status, errorText);
      throw new Error(`Instagram Send API error: ${response.status}`);
    }
  }
}

// ========== Main Server ==========

serve(async (req: Request) => {
  const url = new URL(req.url);

  // CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // ========== Webhook Verification (GET) ==========
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    console.log("[IG] Webhook verification:", { mode, token: token?.substring(0, 5) + "..." });

    if (mode === "subscribe" && token === WHATSAPP_VERIFY_TOKEN) {
      console.log("[IG] Webhook verified ✓");
      return new Response(challenge, { status: 200 });
    }

    return new Response("Forbidden", { status: 403 });
  }

  // ========== Incoming Messages (POST) ==========
  if (req.method === "POST") {
    try {
      const body = await req.json();
      console.log("[IG] Webhook received:", JSON.stringify(body).substring(0, 500));

      // Instagram webhook structure
      const entry = body.entry?.[0];
      if (!entry) {
        return new Response("OK", { status: 200, headers: corsHeaders });
      }

      const messaging = entry.messaging?.[0];
      if (!messaging || !messaging.message) {
        // Could be a read receipt, echo, etc. — ignore
        return new Response("OK", { status: 200, headers: corsHeaders });
      }

      // Skip echo messages (sent by us)
      if (messaging.message.is_echo) {
        return new Response("OK", { status: 200, headers: corsHeaders });
      }

      const senderId = messaging.sender?.id;
      const messageText = messaging.message?.text;

      if (!senderId || !messageText) {
        console.log("[IG] No sender or text, ignoring");
        return new Response("OK", { status: 200, headers: corsHeaders });
      }

      console.log(`[IG] Message from ${senderId}: ${messageText}`);

      // Fetch or create conversation
      let { data: conversation, error: convError } = await supabase
        .from("instagram_conversations")
        .select("*")
        .eq("instagram_user_id", senderId)
        .maybeSingle();

      if (convError) {
        console.error("[IG] Error fetching conversation:", convError);
      }

      if (!conversation) {
        // Try to get user profile name
        let userName: string | null = null;
        try {
          const profileResp = await fetch(
            `https://graph.instagram.com/v21.0/${senderId}?fields=name,username&access_token=${INSTAGRAM_ACCESS_TOKEN}`
          );
          if (profileResp.ok) {
            const profile = await profileResp.json();
            userName = profile.name || profile.username || null;
          }
        } catch (e) {
          console.log("[IG] Could not fetch user profile:", e);
        }

        const { data: newConv, error: insertError } = await supabase
          .from("instagram_conversations")
          .insert({
            instagram_user_id: senderId,
            user_name: userName,
            messages_history: [],
            collected_data: {},
            conversation_state: "greeting",
            is_ai_active: true,
          })
          .select()
          .single();

        if (insertError) {
          console.error("[IG] Error creating conversation:", insertError);
          return new Response("OK", { status: 200, headers: corsHeaders });
        }
        conversation = newConv;
      }

      // If AI is not active, skip
      if (!conversation.is_ai_active) {
        console.log(`[IG] AI inactive for ${senderId}, skipping`);
        return new Response("OK", { status: 200, headers: corsHeaders });
      }

      // Build message history
      const messagesHistory = conversation.messages_history || [];
      messagesHistory.push({ role: "user", content: messageText });

      // Get AI response
      const aiResponse = await getAiResponse(messagesHistory);
      const cleanedResponse = cleanAiResponse(aiResponse);

      // Extract collected data
      const { data: updatedData, status: conversationStatus } = extractCollectedData(
        aiResponse,
        conversation.collected_data || {}
      );

      // Update conversation state
      const newState = conversationStatus === "completed"
        ? "completed"
        : conversationStatus === "human_takeover"
          ? "human_takeover"
          : determineConversationState(updatedData);

      // Add assistant response to history
      messagesHistory.push({ role: "assistant", content: aiResponse });

      // Update conversation in DB
      await supabase
        .from("instagram_conversations")
        .update({
          messages_history: messagesHistory,
          collected_data: updatedData,
          conversation_state: newState,
          user_name: updatedData.nome || conversation.user_name,
          is_ai_active: conversationStatus !== "human_takeover",
        })
        .eq("id", conversation.id);

      // Send response via Instagram
      if (cleanedResponse) {
        await sendInstagramMessage(senderId, cleanedResponse);
      }

      return new Response("OK", { status: 200, headers: corsHeaders });

    } catch (error) {
      console.error("[IG] Error processing webhook:", error);
      return new Response("OK", { status: 200, headers: corsHeaders });
    }
  }

  return new Response("Method not allowed", { status: 405, headers: corsHeaders });
});
