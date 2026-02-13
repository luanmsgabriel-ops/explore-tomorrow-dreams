import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const WHATSAPP_ACCESS_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN")!;
const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID")!;
const WHATSAPP_VERIFY_TOKEN = Deno.env.get("WHATSAPP_VERIFY_TOKEN")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const EXTERNAL_API_URL = "http://212.85.21.28:5000/cotar_viagem";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const TEO_SYSTEM_PROMPT = `Você é o Teo, assistente da Tomorrow Travel — uma agência que realiza sonhos de viagem com o melhor custo-benefício. Nada de vibe "premium elitista", aqui é sobre tornar viagens incríveis acessíveis pra todo mundo! 🌍✨

Você tá conversando pelo WhatsApp pra montar uma cotação personalizada. Sua vibe é descontraída, divertida, tipo um amigo que manja tudo de viagem. Fala de um jeito natural, leve, com humor quando cabe. A pessoa tem que sentir que tá trocando ideia com alguém que entende ela de verdade.

Colete essas infos UMA POR VEZ, no flow da conversa:
1. Primeiro nome e sobrenome
2. Destino desejado (ou sugira 2-3 opções se a pessoa não souber)
3. Datas de viagem (ida e volta)
4. Quantas pessoas vão (adultos e crianças)
5. Tipo de viagem (lua de mel, família, aventura, etc.)
6. Orçamento aproximado por pessoa
7. Preferências (hotel, voo, atividades)
8. Aeroporto de embarque preferido

REGRAS:
- Respostas CURTAS — máximo 2 parágrafos, direto ao ponto
- Use emojis com moderação, sem exagero ✈️🌴
- Uma pergunta por vez, sem bombardear
- Português brasileiro sempre
- NÃO invente preços, só colete dados
- Seja genuíno, engraçado quando der, e mostre empolgação real pelo destino do cliente

Quando identificar uma info, adicione no final:
[DADOS:campo=valor]

Campos: nome, destino, datas, num_viajantes, tipo_viagem, orcamento, preferencias, aeroporto

COTAÇÃO AUTOMÁTICA:
Quando tiver destino, datas, aeroporto de saída e número de viajantes (adultos e crianças), DISPARE A BUSCA DE COTAÇÃO adicionando no final da mensagem:
[COTAR_VIAGEM:{"origem":"cidade de saída","destino":"destino","data_ida":"DD/MM/AAAA","data_volta":"DD/MM/AAAA","adultos":N,"criancas":N,"idades_criancas":[]}]

Tudo coletado e confirmado pelo cliente:
[STATUS:completed]

Cliente quer falar com humano:
[STATUS:human_takeover]`;

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
    .replace(/\[DADOS:\w+=.+?\]/g, "")
    .replace(/\[STATUS:\w+\]/g, "")
    .replace(/\[COTAR_VIAGEM:\s*\{.*?\}\s*\]/gs, "")
    .replace(/\[DESTINO_ESCOLHIDO:\s*[^\]]+\]/gi, "")
    .trim();
}

function parseQuotationTag(content: string): Record<string, any> | null {
  const match = content.match(/\[COTAR_VIAGEM:\s*(\{.*\})\s*\]/s);
  if (!match) return null;
  try {
    return JSON.parse(match[1].replace(/\n/g, " ").trim());
  } catch (e) {
    console.error("Failed to parse COTAR_VIAGEM tag:", e);
    return null;
  }
}

function determineConversationState(collectedData: Record<string, any>): string {
  if (!collectedData.nome) return "collecting_name";
  if (!collectedData.destino) return "collecting_destination";
  if (!collectedData.datas) return "collecting_dates";
  if (!collectedData.num_viajantes) return "collecting_people";
  if (!collectedData.tipo_viagem) return "collecting_preferences";
  if (!collectedData.orcamento) return "collecting_preferences";
  if (!collectedData.preferencias) return "collecting_preferences";
  if (!collectedData.aeroporto) return "collecting_preferences";
  return "summary_confirmation";
}

async function sendWhatsAppMessage(to: string, message: string) {
  // WhatsApp has a 4096 char limit per message, split if needed
  const maxLen = 4000;
  const parts = [];
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
      `https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: { body: part },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("WhatsApp API error:", errorText);
      throw new Error(`WhatsApp API error: ${response.status}`);
    }
  }
}

async function getAiResponse(messagesHistory: any[]): Promise<string> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: TEO_SYSTEM_PROMPT },
        ...messagesHistory,
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("AI gateway error:", response.status, errorText);
    throw new Error(`AI gateway error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "Desculpe, tive um problema. Pode repetir?";
}

async function requestQuotation(quotationData: Record<string, any>, verificationCode?: string): Promise<{ status: string; data: any }> {
  const payload: Record<string, any> = {
    origem: quotationData.origem,
    destino: quotationData.destino,
    data_ida: quotationData.data_ida,
    data_volta: quotationData.data_volta,
    passageiros: {
      adultos: quotationData.adultos || 1,
      criancas: quotationData.criancas || 0,
      idades_criancas: quotationData.idades_criancas || [],
    },
    operadora: "all",
  };

  if (verificationCode) {
    payload.verification_code = verificationCode;
  }

  console.log("WhatsApp quotation request:", JSON.stringify(payload));

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 150000);

  try {
    const response = await fetch(EXTERNAL_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const responseText = await response.text();
    console.log("Quotation API response:", response.status, responseText.substring(0, 2000));

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw: responseText };
    }

    if (responseData.status === "pending_code" || responseData.pending_code) {
      return { status: "pending_code", data: responseData };
    }

    return { status: "success", data: responseData };
  } catch (err) {
    clearTimeout(timeoutId);
    console.error("Quotation API error:", err);
    return { status: "error", data: null };
  }
}

function formatQuotationResults(data: any): string {
  if (!data) return "Não foi possível obter resultados.";

  const results = data.resultados || data.results || (Array.isArray(data) ? data : null);
  if (results && Array.isArray(results)) {
    if (results.length === 0) return "😕 Nenhuma cotação encontrada para essas datas.";

    let formatted = "✈️ *Cotações encontradas:*\n\n";
    results.forEach((r: any, i: number) => {
      formatted += `*${i + 1}. ${r.operadora || r.companhia || "Operadora"}*\n`;
      if (r.preco || r.valor || r.price) {
        formatted += `💰 Valor: R$ ${Number(r.preco || r.valor || r.price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}\n`;
      }
      if (r.voo_ida || r.flight_out) formatted += `🛫 Ida: ${r.voo_ida || r.flight_out}\n`;
      if (r.voo_volta || r.flight_back) formatted += `🛬 Volta: ${r.voo_volta || r.flight_back}\n`;
      if (r.paradas !== undefined) formatted += `🔄 Paradas: ${r.paradas}\n`;
      if (r.duracao || r.duration) formatted += `⏱️ Duração: ${r.duracao || r.duration}\n`;
      formatted += "\n";
    });
    return formatted;
  }

  if (data.preco || data.valor || data.price) {
    return `✈️ *Cotação encontrada:*\n💰 Valor: R$ ${Number(data.preco || data.valor || data.price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
  }

  return `✈️ *Resultado da cotação:*\n${JSON.stringify(data, null, 2)}`;
}

async function createQuoteRequest(phoneNumber: string, collectedData: Record<string, any>) {
  const { data, error } = await supabase.from("quote_requests").insert({
    client_name: collectedData.nome || null,
    email: `whatsapp_${phoneNumber}@placeholder.com`,
    whatsapp: phoneNumber,
    destination_name: collectedData.destino || null,
    travel_date: collectedData.datas || null,
    num_people: collectedData.num_viajantes || null,
    travel_type: collectedData.tipo_viagem || null,
    preferred_airport: collectedData.aeroporto || null,
    special_requests: collectedData.preferencias || null,
    source_channel: "whatsapp",
    notes: `Orçamento: ${collectedData.orcamento || "Não informado"}`,
    status: "pending",
  }).select("id").single();

  if (error) {
    console.error("Error creating quote request:", error);
    throw error;
  }

  return data;
}

// ========== Main Server ==========

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // GET: Webhook verification from Meta
    if (req.method === "GET") {
      const url = new URL(req.url);
      const mode = url.searchParams.get("hub.mode");
      const token = url.searchParams.get("hub.verify_token");
      const challenge = url.searchParams.get("hub.challenge");

      if (mode === "subscribe" && token === WHATSAPP_VERIFY_TOKEN) {
        console.log("Webhook verified successfully");
        return new Response(challenge, { status: 200 });
      }
      return new Response("Forbidden", { status: 403 });
    }

    // POST: Incoming message or manual send
    if (req.method === "POST") {
      const body = await req.json();

      // Handle manual message send from admin panel
      if (body.manual_send) {
        const { phone_number, message } = body;
        if (!phone_number || !message) {
          return new Response(JSON.stringify({ error: "phone_number and message are required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        console.log(`Manual send to ${phone_number}: ${message}`);
        await sendWhatsAppMessage(phone_number, message);

        return new Response(JSON.stringify({ status: "ok", manual_sent: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Meta sends various webhook events; we only care about messages
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;

      if (!value?.messages || value.messages.length === 0) {
        return new Response(JSON.stringify({ status: "ok" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const message = value.messages[0];
      const phoneNumber = message.from;
      const messageText = message.text?.body || "";
      const contactName = value.contacts?.[0]?.profile?.name || null;

      console.log(`Message from ${phoneNumber}: ${messageText}`);

      // Get or create conversation
      let { data: conversation } = await supabase
        .from("whatsapp_conversations")
        .select("*")
        .eq("phone_number", phoneNumber)
        .single();

      if (!conversation) {
        const { data: newConv, error: insertError } = await supabase
          .from("whatsapp_conversations")
          .insert({
            phone_number: phoneNumber,
            client_name: contactName,
            conversation_state: "greeting",
            collected_data: {},
            messages_history: [],
            is_ai_active: true,
          })
          .select()
          .single();

        if (insertError) {
          console.error("Error creating conversation:", insertError);
          throw insertError;
        }
        conversation = newConv;
      }

      // If AI is disabled, just store the message and skip AI response
      if (!conversation.is_ai_active) {
        const updatedHistory = [
          ...(conversation.messages_history as any[] || []),
          { role: "user", content: messageText, timestamp: new Date().toISOString() },
        ];

        await supabase
          .from("whatsapp_conversations")
          .update({ messages_history: updatedHistory })
          .eq("id", conversation.id);

        return new Response(JSON.stringify({ status: "ok", ai_disabled: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const collectedData = (conversation.collected_data as Record<string, any>) || {};

      // Check if conversation is waiting for a verification code
      if (collectedData._quotation_pending_code && collectedData._quotation_request) {
        console.log("Processing verification code:", messageText.trim());
        const quotResult = await requestQuotation(collectedData._quotation_request, messageText.trim());

        // Clear pending state
        const updatedData = { ...collectedData };
        delete updatedData._quotation_pending_code;
        delete updatedData._quotation_request;

        let responseMsg: string;
        if (quotResult.status === "success" && quotResult.data) {
          responseMsg = formatQuotationResults(quotResult.data);
          responseMsg += "\n\nQuer que eu te ajude com mais alguma coisa? 😊";
        } else if (quotResult.status === "pending_code") {
          // Still pending, ask again
          updatedData._quotation_pending_code = true;
          updatedData._quotation_request = collectedData._quotation_request;
          responseMsg = "❌ Código inválido ou expirado. Por favor, verifique seu e-mail e envie o código correto.";
        } else {
          responseMsg = "😕 Não consegui buscar a cotação. Tente novamente mais tarde ou fale com um de nossos consultores!";
        }

        const updatedHistory = [
          ...(conversation.messages_history as any[] || []),
          { role: "user", content: messageText, timestamp: new Date().toISOString() },
          { role: "assistant", content: responseMsg, timestamp: new Date().toISOString() },
        ];

        await supabase
          .from("whatsapp_conversations")
          .update({
            collected_data: updatedData,
            messages_history: updatedHistory,
          })
          .eq("id", conversation.id);

        await sendWhatsAppMessage(phoneNumber, responseMsg);

        return new Response(JSON.stringify({ status: "ok", quotation_code_processed: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Build messages for AI
      const historyForAi = (conversation.messages_history as any[] || []).map((msg: any) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
      }));
      historyForAi.push({ role: "user", content: messageText });

      // Get AI response
      const aiResponse = await getAiResponse(historyForAi);

      // Extract collected data and status
      const { data: newCollectedData, status: conversationStatus } = extractCollectedData(
        aiResponse,
        collectedData
      );

      // Check if AI triggered a quotation request
      const quotationData = parseQuotationTag(aiResponse);

      // Clean response (remove all tags)
      let cleanResponse = cleanAiResponse(aiResponse);

      // Handle quotation if triggered
      if (quotationData) {
        console.log("AI triggered quotation request:", JSON.stringify(quotationData));
        
        // Send the clean message first
        if (cleanResponse) {
          await sendWhatsAppMessage(phoneNumber, cleanResponse);
        }

        // Send searching message
        await sendWhatsAppMessage(phoneNumber, "🔍 Buscando cotações nas operadoras... isso pode levar alguns segundos!");

        const quotResult = await requestQuotation(quotationData);

        let quotationMsg: string;
        if (quotResult.status === "pending_code") {
          // Store quotation state for verification code
          newCollectedData._quotation_pending_code = true;
          newCollectedData._quotation_request = quotationData;
          quotationMsg = "📧 Um código de verificação foi enviado para o e-mail cadastrado na operadora.\n\nPor favor, envie o código aqui para eu finalizar a busca! 🔑";
        } else if (quotResult.status === "success" && quotResult.data) {
          quotationMsg = formatQuotationResults(quotResult.data);
          quotationMsg += "\n\nQuer que eu te ajude com mais alguma coisa? 😊";
        } else {
          quotationMsg = "😕 Não consegui buscar cotações no momento. Mas não se preocupe, nosso time vai buscar as melhores opções pra você! 🙌";
        }

        // Update history with all messages
        const updatedHistory = [
          ...(conversation.messages_history as any[] || []),
          { role: "user", content: messageText, timestamp: new Date().toISOString() },
          { role: "assistant", content: cleanResponse, timestamp: new Date().toISOString() },
          { role: "assistant", content: quotationMsg, timestamp: new Date().toISOString() },
        ];

        let newState = conversationStatus === "completed" ? "completed"
          : conversationStatus === "human_takeover" ? "human_takeover"
          : determineConversationState(newCollectedData);

        let quoteRequestId = conversation.quote_request_id;
        if (newState === "completed" && !quoteRequestId) {
          try {
            const quoteRequest = await createQuoteRequest(phoneNumber, newCollectedData);
            quoteRequestId = quoteRequest.id;
          } catch (err) {
            console.error("Error creating quote:", err);
          }
        }

        await supabase
          .from("whatsapp_conversations")
          .update({
            client_name: newCollectedData.nome || conversation.client_name || contactName,
            conversation_state: newState,
            collected_data: newCollectedData,
            messages_history: updatedHistory,
            quote_request_id: quoteRequestId,
            is_ai_active: newState !== "human_takeover",
          })
          .eq("id", conversation.id);

        await sendWhatsAppMessage(phoneNumber, quotationMsg);

        return new Response(JSON.stringify({ status: "ok", state: newState, quotation: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Standard flow (no quotation)
      const updatedHistory = [
        ...(conversation.messages_history as any[] || []),
        { role: "user", content: messageText, timestamp: new Date().toISOString() },
        { role: "assistant", content: cleanResponse, timestamp: new Date().toISOString() },
      ];

      let newState = conversationStatus === "completed" ? "completed"
        : conversationStatus === "human_takeover" ? "human_takeover"
        : determineConversationState(newCollectedData);

      let quoteRequestId = conversation.quote_request_id;
      if (newState === "completed" && !quoteRequestId) {
        try {
          const quoteRequest = await createQuoteRequest(phoneNumber, newCollectedData);
          quoteRequestId = quoteRequest.id;
        } catch (err) {
          console.error("Error creating quote:", err);
        }
      }

      await supabase
        .from("whatsapp_conversations")
        .update({
          client_name: newCollectedData.nome || conversation.client_name || contactName,
          conversation_state: newState,
          collected_data: newCollectedData,
          messages_history: updatedHistory,
          quote_request_id: quoteRequestId,
          is_ai_active: newState !== "human_takeover",
        })
        .eq("id", conversation.id);

      await sendWhatsAppMessage(phoneNumber, cleanResponse);

      return new Response(JSON.stringify({ status: "ok", state: newState }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response("Method not allowed", { status: 405 });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
