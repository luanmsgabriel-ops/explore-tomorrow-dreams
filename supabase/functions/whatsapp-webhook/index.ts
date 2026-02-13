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

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const TEO_SYSTEM_PROMPT = `Você é o Teo, o assistente virtual da Tomorrow Travel, uma agência de viagens premium. 
Você está conversando com um cliente pelo WhatsApp para coletar informações para uma cotação de viagem personalizada.

Seu objetivo é coletar as seguintes informações, UMA POR VEZ, de forma natural e amigável:
1. Nome completo do cliente
2. Destino desejado (ou ajudar a escolher sugerindo opções populares)
3. Datas de viagem pretendidas (ida e volta)
4. Número de viajantes (adultos e crianças)
5. Tipo de viagem (lua de mel, família, aventura, negócios, etc.)
6. Orçamento aproximado por pessoa
7. Preferências especiais (tipo de hotel, classe do voo, atividades desejadas)
8. Aeroporto de preferência para embarque

REGRAS IMPORTANTES:
- Seja conversacional, simpático e use emojis moderadamente ✈️🌴
- Colete UMA informação por vez, não bombardeie com perguntas
- Se o cliente não souber o destino, sugira 3-4 destinos populares
- Se o cliente der respostas vagas, peça para detalhar
- Quando TODAS as informações forem coletadas, faça um resumo e pergunte se está tudo correto
- Responda SEMPRE em português brasileiro
- Mantenha as respostas curtas (máximo 3 parágrafos)
- NÃO invente preços ou disponibilidade, apenas colete dados

Quando você identificar que uma informação foi fornecida, inclua no final da sua resposta uma linha especial no formato:
[DADOS:campo=valor]

Os campos possíveis são: nome, destino, datas, num_viajantes, tipo_viagem, orcamento, preferencias, aeroporto

Quando TODAS as informações estiverem coletadas e o cliente confirmar, inclua:
[STATUS:completed]

Se o cliente não quiser continuar ou pedir para falar com um humano:
[STATUS:human_takeover]`;

async function extractCollectedData(aiResponse: string, existingData: Record<string, any>): Promise<{ data: Record<string, any>; status: string | null }> {
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
    .trim();
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
        text: { body: message },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("WhatsApp API error:", errorText);
    throw new Error(`WhatsApp API error: ${response.status}`);
  }

  return response.json();
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

serve(async (req) => {
  // Handle CORS
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

      // Ignore status updates
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

      // Build messages for AI
      const historyForAi = (conversation.messages_history as any[] || []).map((msg: any) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
      }));
      historyForAi.push({ role: "user", content: messageText });

      // Get AI response
      const aiResponse = await getAiResponse(historyForAi);

      // Extract collected data and status
      const { data: newCollectedData, status: conversationStatus } = await extractCollectedData(
        aiResponse,
        (conversation.collected_data as Record<string, any>) || {}
      );

      // Clean response (remove data tags)
      const cleanResponse = cleanAiResponse(aiResponse);

      // Update conversation history
      const updatedHistory = [
        ...(conversation.messages_history as any[] || []),
        { role: "user", content: messageText, timestamp: new Date().toISOString() },
        { role: "assistant", content: cleanResponse, timestamp: new Date().toISOString() },
      ];

      // Determine new state
      let newState = conversationStatus === "completed"
        ? "completed"
        : conversationStatus === "human_takeover"
        ? "human_takeover"
        : determineConversationState(newCollectedData);

      // If completed, create quote request
      let quoteRequestId = conversation.quote_request_id;
      if (newState === "completed" && !quoteRequestId) {
        try {
          const quoteRequest = await createQuoteRequest(phoneNumber, newCollectedData);
          quoteRequestId = quoteRequest.id;
        } catch (err) {
          console.error("Error creating quote:", err);
        }
      }

      // Update conversation in DB
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

      // Send response via WhatsApp
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
      status: 200, // Always return 200 to Meta to avoid retries
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
