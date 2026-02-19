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

const TEO_SYSTEM_PROMPT = `Você é o Téo, assistente virtual da Tomorrow Travel, especializado em viagens personalizadas e inesquecíveis! 🌍

IDENTIDADE E PERSONALIDADE:
- Entusiasta e acolhedor: Demonstra paixão genuína por viagens
- Engraçado e descontraído: Faz piadas leves e referências divertidas sobre viagens
- Consultivo: Aconselha baseado nas preferências do cliente, não apenas vende
- Eficiente: Vai direto ao ponto com bom humor
- Humano: Usa emojis com moderação (2-3 por mensagem) e linguagem natural brasileira

Você está conversando pelo WhatsApp para montar uma cotação personalizada.

REGRAS DE RESPOSTAS CURTAS:
- Máximo 2 parágrafos curtos por mensagem (3-4 linhas cada no máximo)
- Seja direto e objetivo, mas com charme e humor
- Não repita informações que o cliente já deu
- Uma piada ou comentário engraçado por mensagem no máximo

FLUXO DE ATENDIMENTO:
1. RECEPÇÃO - Cumprimente com bom humor e pergunte naturalmente sobre a viagem
2. COLETA - Colete: Nome, Origem, Destino, Datas, Passageiros (adultos/crianças e idades)
   - Seja paciente, uma pergunta por vez
   - Mostre entusiasmo pelo destino escolhido

IMPORTANTE - MENSAGEM COMPLETA:
Se o usuário enviar UMA MENSAGEM com TODAS as informações (destino, datas, viajantes, origem), extraia TUDO de uma vez e DISPARE IMEDIATAMENTE a tag [COTAR_VIAGEM]. NÃO fique fazendo perguntas se os dados já foram fornecidos.

3. CONFIRMAÇÃO - Quando tiver tudo, confirme de forma breve e informe que vai buscar cotações (~1 minuto)

4. PÓS-COTAÇÃO:
   ⚠️ NÃO FINALIZAR após enviar cotação. AGUARDAR RESPOSTA.
   Ofereça ajuda: detalhes, outras datas, ajustar orçamento, passeios.

5. RESPOSTAS CONTEXTUAIS:
   - "Achei caro" → Alternativas econômicas, pergunte orçamento ideal
   - "Vou pensar" → 1-2 dicas rápidas sobre o destino
   - "Quero fechar!" → Celebre e passe para equipe

REGRAS:
- NÃO invente preços, só colete dados
- Sempre personalize com nome do cliente
- NUNCA finalize a conversa até o cliente fechar ou desistir

Quando identificar uma info, adicione no final:
[DADOS:campo=valor]

Campos: nome, destino, datas, num_viajantes, tipo_viagem, orcamento, preferencias, aeroporto

COTAÇÃO AUTOMÁTICA:
Quando tiver destino, datas, origem e passageiros, DISPARE:
[COTAR_VIAGEM:{"origem":"cidade","destino":"destino","data_ida":"DD/MM/AAAA","data_volta":"DD/MM/AAAA","adultos":N,"criancas":N,"idades_criancas":[]}]

IMPORTANTE: Datas como "do dia 15 a 22 de junho 2026" → data_ida="15/06/2026", data_volta="22/06/2026".

Tudo coletado e confirmado:
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

async function saveQuotationRequest(
  quotationData: Record<string, any>,
  phoneNumber: string,
  clientName?: string,
  preferences?: string
): Promise<{ success: boolean; id?: string }> {
  // Parse dates from DD/MM/YYYY to YYYY-MM-DD
  const parseDate = (d: string) => {
    const parts = d.split("/");
    if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    return d;
  };

  const { data, error } = await supabase
    .from("travel_quote_requests")
    .insert({
      phone_number: phoneNumber,
      origin: quotationData.origem,
      destination: quotationData.destino,
      departure_date: parseDate(quotationData.data_ida),
      return_date: parseDate(quotationData.data_volta),
      adults: quotationData.adultos || 1,
      children: quotationData.criancas || 0,
      children_ages: quotationData.idades_criancas || [],
      customer_name: clientName || null,
      preferences: preferences || null,
      status: "pending",
      raw_request: quotationData,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error saving travel quote request:", error);
    return { success: false };
  }

  console.log("Travel quote request saved:", data.id);
  return { success: true, id: data.id };
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

  console.log("WhatsApp quotation request (direct):", JSON.stringify(payload));

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 300000);

  try {
    const response = await fetch(EXTERNAL_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const responseText = await response.text();
    console.log("=== QUOTATION API RAW RESPONSE ===");
    console.log("Status:", response.status);
    console.log("Body (first 3000 chars):", responseText.substring(0, 3000));
    console.log("=== END RAW RESPONSE ===");

    if (!response.ok) {
      return { status: "error", data: null };
    }

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      return { status: "error", data: null };
    }

    if (responseData.error || responseData.erro) {
      return { status: "error", data: null };
    }

    if (responseData.status === "pending_code" || responseData.pending_code) {
      return { status: "pending_code", data: responseData };
    }

    return { status: "success", data: responseData };
  } catch (err) {
    clearTimeout(timeoutId);
    return { status: "error", data: null };
  }
}

function formatQuotationResults(data: any): string {
  if (!data) return "Não foi possível obter resultados.";

  const results = data.resultados || data.results || (Array.isArray(data) ? data : null);
  if (results && Array.isArray(results)) {
    if (results.length === 0) return "😕 Nenhuma cotação encontrada para essas datas.";

    let formatted = "✈️ *Cotações encontradas!* ✈️\n";
    formatted += "━━━━━━━━━━━━━━━━━━\n\n";

    results.forEach((r: any, i: number) => {
      const hotelName = r.hotel || r.hotel_name || r.hospedagem || null;
      const operadora = r.operadora || r.companhia || "Operadora";
      const preco = r.preco || r.valor || r.price || r.total || null;

      formatted += `🔹 *Opção ${i + 1}*\n`;
      formatted += `📌 Operadora: *${operadora}*\n`;

      if (hotelName) {
        formatted += `🏨 Hotel: *${hotelName}*\n`;
      }
      if (r.regime || r.meal_plan || r.pensao) {
        formatted += `🍽️ Regime: ${r.regime || r.meal_plan || r.pensao}\n`;
      }
      if (r.categoria || r.category || r.estrelas) {
        formatted += `⭐ Categoria: ${r.categoria || r.category || r.estrelas}\n`;
      }
      if (r.voo_ida || r.flight_out) formatted += `🛫 Ida: ${r.voo_ida || r.flight_out}\n`;
      if (r.voo_volta || r.flight_back) formatted += `🛬 Volta: ${r.voo_volta || r.flight_back}\n`;
      if (r.paradas !== undefined) formatted += `🔄 Paradas: ${r.paradas}\n`;
      if (r.duracao || r.duration) formatted += `⏱️ Duração: ${r.duracao || r.duration}\n`;
      if (r.noites || r.nights) formatted += `🌙 Noites: ${r.noites || r.nights}\n`;

      if (preco) {
        const valorFormatado = Number(preco).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
        formatted += `\n💰 *Valor Total: R$ ${valorFormatado}*\n`;
      }
      if (r.preco_por_pessoa || r.valor_por_pessoa || r.price_per_person) {
        const ppFormatado = Number(r.preco_por_pessoa || r.valor_por_pessoa || r.price_per_person).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
        formatted += `👤 Por pessoa: R$ ${ppFormatado}\n`;
      }
      if (r.parcelas || r.installments) {
        formatted += `💳 ${r.parcelas || r.installments}x no cartão\n`;
      }

      formatted += "\n━━━━━━━━━━━━━━━━━━\n\n";
    });

    return formatted.trim();
  }

  // Single result object
  const hotelName = data.hotel || data.hotel_name || data.hospedagem || null;
  const preco = data.preco || data.valor || data.price || data.total || null;

  if (preco || hotelName) {
    let msg = "✈️ *Cotação encontrada!* ✈️\n";
    msg += "━━━━━━━━━━━━━━━━━━\n\n";
    if (hotelName) msg += `🏨 Hotel: *${hotelName}*\n`;
    if (data.regime || data.meal_plan) msg += `🍽️ Regime: ${data.regime || data.meal_plan}\n`;
    if (preco) {
      const valorFormatado = Number(preco).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
      msg += `\n💰 *Valor Total: R$ ${valorFormatado}*\n`;
    }
    return msg.trim();
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

      // Handle manual message send from admin panel or external systems (e.g. Manus)
      if (body.manual_send || body.handler === "manual_send" || body.action === "manual_send") {
        const phone = body.phone_number || body.phone;
        const message = body.message;
        if (!phone || !message) {
          return new Response(JSON.stringify({ error: "phone_number and message are required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        console.log(`Manual send to ${phone}: ${message.substring(0, 100)}...`);
        await sendWhatsAppMessage(phone, message);

        // Save manual message to conversation history so it appears in admin panel
        try {
          const { data: conv } = await supabase
            .from("whatsapp_conversations")
            .select("id, messages_history")
            .eq("phone_number", phone)
            .order("updated_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (conv) {
            const updatedHistory = [
              ...((conv.messages_history as any[]) || []),
              { role: "assistant", content: message, timestamp: new Date().toISOString() },
            ];

            await supabase
              .from("whatsapp_conversations")
              .update({ messages_history: updatedHistory })
              .eq("id", conv.id);

            console.log(`Manual message saved to conversation ${conv.id}`);
          }
        } catch (histErr) {
          console.error("Error saving manual message to history:", histErr);
        }

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
      const messageType = message.type; // text, image, video, audio, document, etc.

      // Extract image URL if message is an image
      let imageUrl: string | null = null;
      if (messageType === "image" && message.image?.id) {
        try {
          // Get media URL from WhatsApp API
          const mediaResponse = await fetch(
            `https://graph.facebook.com/v21.0/${message.image.id}`,
            {
              headers: { Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}` },
            }
          );
          if (mediaResponse.ok) {
            const mediaData = await mediaResponse.json();
            // Download the actual image
            const imageResponse = await fetch(mediaData.url, {
              headers: { Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}` },
            });
            if (imageResponse.ok) {
              const imageBlob = await imageResponse.blob();
              const fileName = `review-photos/${phoneNumber}/${Date.now()}.jpg`;
              const { data: uploadData, error: uploadError } = await supabase.storage
                .from("destination-images")
                .upload(fileName, imageBlob, { contentType: "image/jpeg", upsert: true });
              
              if (!uploadError && uploadData) {
                const { data: publicUrlData } = supabase.storage
                  .from("destination-images")
                  .getPublicUrl(fileName);
                imageUrl = publicUrlData.publicUrl;
                console.log("Image uploaded successfully:", imageUrl);
              } else {
                console.error("Image upload error:", uploadError);
              }
            }
          }
        } catch (imgErr) {
          console.error("Error processing image:", imgErr);
        }
      }

      console.log(`Message from ${phoneNumber} (type: ${messageType}): ${messageText}`);

      // Check if there's an active review for this phone number
      const { data: activeReview } = await supabase
        .from("travel_reviews")
        .select("id")
        .eq("phone_number", phoneNumber)
        .eq("conversation_status", "in_progress")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (activeReview) {
        // Route to review webhook
        console.log(`Routing to review webhook for review ${activeReview.id}`);
        const reviewUrl = `${SUPABASE_URL}/functions/v1/review-webhook`;
        const reviewResponse = await fetch(reviewUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({
            action: "process_review_message",
            phone_number: phoneNumber,
            message_text: messageText || (imageUrl ? "Enviou uma foto" : ""),
            review_id: activeReview.id,
            image_url: imageUrl,
          }),
        });

        const reviewResult = await reviewResponse.json();
        console.log("Review webhook result:", reviewResult);

        return new Response(JSON.stringify({ status: "ok", routed_to: "review", ...reviewResult }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

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

      // If AI is disabled or conversation is completed, just store the message and skip AI response
      if (!conversation.is_ai_active || conversation.conversation_state === "completed") {
        const updatedHistory = [
          ...(conversation.messages_history as any[] || []),
          { role: "user", content: messageText, timestamp: new Date().toISOString() },
        ];

        await supabase
          .from("whatsapp_conversations")
          .update({ messages_history: updatedHistory })
          .eq("id", conversation.id);

        return new Response(JSON.stringify({ status: "ok", ai_disabled: true, state: conversation.conversation_state }), {
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
          responseMsg = "Eita, parece que a tecnologia resolveu tirar férias antes de você! 😅🏖️\n\nMas relaxa, isso não vai atrasar seu sonho não! Nosso time de especialistas já tá de olho no seu pedido e vai montar uma cotação COMPLETA com toda a experiência que você merece — daquelas que dá vontade de postar no Instagram inteiro! 📸✨\n\nVamos te chamar aqui mesmo no WhatsApp rapidinho. Enquanto isso, já vai separando o protetor solar! ☀️🧴";
          // Mark as failed and finalize
          updatedData._quotation_failed = true;
          // Create lead if needed
          if (!conversation.quote_request_id) {
            try {
              const quoteRequest = await createQuoteRequest(phoneNumber, updatedData);
              await supabase.from("whatsapp_conversations").update({ quote_request_id: quoteRequest.id }).eq("id", conversation.id);
            } catch (err) {
              console.error("Error creating quote on verification failure:", err);
            }
          }
        }

        const updatedHistory = [
          ...(conversation.messages_history as any[] || []),
          { role: "user", content: messageText, timestamp: new Date().toISOString() },
          { role: "assistant", content: responseMsg, timestamp: new Date().toISOString() },
        ];

        const isFinalized = !!updatedData._quotation_failed;

        await supabase
          .from("whatsapp_conversations")
          .update({
            collected_data: updatedData,
            messages_history: updatedHistory,
            ...(isFinalized ? { conversation_state: "completed", is_ai_active: false } : {}),
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

        // Save quotation request to table for Manus polling
        const saveResult = await saveQuotationRequest(
          quotationData,
          phoneNumber,
          newCollectedData.nome || conversation.client_name || contactName,
          newCollectedData.preferencias || newCollectedData.tipo_viagem || null
        );

        let quotationMsg: string;
        let quoteRequestId = conversation.quote_request_id;

        if (saveResult.success) {
          quotationMsg = `Recebi sua solicitação! 🌴✨\n\nEstou processando as melhores opções para ${quotationData.destino}. Aguarde aproximadamente 1 minuto! ✈️🏨`;
        } else {
          quotationMsg = "Opa, o sistema deu aquela travadinha clássica de segunda-feira! 😂🔧\n\nMas fica tranquilo(a)! A gente não vai deixar sua viagem dos sonhos escapar, não! Nosso time de especialistas já foi acionado e tá preparando uma cotação personalizada com tudo que você merece — porque viagem boa é viagem bem planejada! 🗺️✨\n\nVamos te retornar aqui no WhatsApp bem rapidinho. Pode ir escolhendo a playlist da viagem enquanto isso! 🎶🌴";
          // Create lead as fallback
          if (!quoteRequestId) {
            try {
              const quoteRequest = await createQuoteRequest(phoneNumber, newCollectedData);
              quoteRequestId = quoteRequest.id;
            } catch (err) {
              console.error("Error creating quote on failure:", err);
            }
          }
        }

        // Update history with all messages
        const updatedHistory = [
          ...(conversation.messages_history as any[] || []),
          { role: "user", content: messageText, timestamp: new Date().toISOString() },
          { role: "assistant", content: cleanResponse, timestamp: new Date().toISOString() },
          { role: "assistant", content: quotationMsg, timestamp: new Date().toISOString() },
        ];

        // After quotation is triggered, keep conversation active to handle Manus response
        // Do NOT set to "completed" here - wait for Manus to process and respond
        let newState = conversationStatus === "human_takeover" ? "human_takeover"
          : saveResult.success ? "awaiting_quotation"
          : "completed";

        if (newState === "completed" && !quoteRequestId) {
          try {
            const quoteRequest = await createQuoteRequest(phoneNumber, newCollectedData);
            quoteRequestId = quoteRequest.id;
          } catch (err) {
            console.error("Error creating quote:", err);
          }
        }

        // Keep AI active when awaiting quotation so Téo can handle follow-up
        const keepAiActive = newState === "awaiting_quotation";

        await supabase
          .from("whatsapp_conversations")
          .update({
            client_name: newCollectedData.nome || conversation.client_name || contactName,
            conversation_state: newState,
            collected_data: newCollectedData,
            messages_history: updatedHistory,
            quote_request_id: quoteRequestId,
            is_ai_active: keepAiActive || (newState !== "human_takeover" && newState !== "completed"),
          })
          .eq("id", conversation.id);

        await sendWhatsAppMessage(phoneNumber, quotationMsg);

        return new Response(JSON.stringify({ status: "ok", state: newState, quotation: true, saved: saveResult.success }), {
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
          is_ai_active: newState !== "human_takeover" && newState !== "completed",
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
