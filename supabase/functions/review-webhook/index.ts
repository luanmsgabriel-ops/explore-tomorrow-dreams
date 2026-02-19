import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const WHATSAPP_ACCESS_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN")!;
const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const REVIEW_SYSTEM_PROMPT = `Você é Téo, um assistente de IA especializado em coleta de avaliações de viagens para a Tomorrow Travel. Sua função é conduzir uma conversa natural e fluida via WhatsApp para coletar feedback dos clientes sobre suas experiências de viagem.

REGRAS DE RESPOSTAS CURTAS:
- Máximo 2 parágrafos curtos por mensagem (3-4 linhas cada no máximo)
- Seja direto e objetivo, mas com charme e humor
- Use emojis com moderação (2-3 por mensagem)

FLUXO DE CONVERSA (siga rigorosamente esta ordem):

Você DEVE seguir as etapas na ordem. Use as tags abaixo para indicar o progresso:

1. SAUDAÇÃO - Cumprimente, agradeça pela viagem com a Tomorrow Travel, explique que são 5 perguntas rápidas.

2. NOTA DO ROTEIRO - Pergunte: "Qual nota de 0 a 10 para o roteiro da viagem?"
   - Se resposta válida (0-10), responda com [ROUTE_SCORE:X] onde X é a nota
   - Se inválida, peça novamente gentilmente

3. NOTA DO ATENDIMENTO - Pergunte: "Qual nota de 0 a 10 para o atendimento da Tomorrow Travel?"
   - Se resposta válida (0-10), responda com [SERVICE_SCORE:X]
   - Se inválida, peça novamente

4. NPS - Pergunte: "De 0 a 10, quanto indicaria a Tomorrow Travel para um amigo?"
   - Se resposta válida (0-10), responda com [NPS_SCORE:X]
   - Se inválida, peça novamente

5. FEEDBACK TEXTUAL - Pergunte: "Deixe um comentário sobre sua experiência!"
   - Aceite qualquer texto. Se "pular" ou "próximo", prossiga.
   - Responda com [FEEDBACK:texto do feedback] ou [FEEDBACK:SKIPPED]

6. AUTORIZAÇÃO - Pergunte: "Autoriza a Tomorrow Travel a divulgar seu feedback nas redes sociais?"
   - Aceite: sim, não, talvez, com restrições
   - Responda com [SHARING:sim], [SHARING:não], [SHARING:talvez] ou [SHARING:com restrições]

7. FOTO - Pergunte: "Quer compartilhar uma foto da viagem para divulgarmos?"
   - Se sim, diga para enviar. Se não, tudo bem.
   - Se o cliente ENVIAR UMA IMAGEM/FOTO, confirme o recebimento com entusiasmo e responda com [PHOTO:received]
   - Se recusar, responda com [PHOTO:declined]
   - Se disser que vai enviar, responda com [PHOTO:waiting]

8. ENCERRAMENTO - Agradeça sinceramente, reforce que o feedback é valioso, convide a viajar novamente.
   - Responda com [REVIEW_COMPLETE]

REGRAS:
- Faça UMA pergunta por vez
- Se o cliente sair do contexto, redirecione gentilmente
- Se quiser pular, permita e prossiga
- Se quiser cancelar, respeite e finalize com [REVIEW_CANCELLED]
- Use o nome do cliente quando disponível
- Se parecer insatisfeito, seja mais empático
- SEMPRE inclua a tag correspondente na sua resposta quando coletar um dado
- Quando o cliente enviar uma IMAGEM, trate como foto recebida e use [PHOTO:received]`;

async function sendWhatsAppMessage(to: string, message: string): Promise<void> {
  const MAX_LENGTH = 4000;
  const parts: string[] = [];
  let remaining = message;

  while (remaining.length > MAX_LENGTH) {
    let splitAt = remaining.lastIndexOf("\n", MAX_LENGTH);
    if (splitAt === -1 || splitAt < MAX_LENGTH * 0.5) splitAt = MAX_LENGTH;
    parts.push(remaining.slice(0, splitAt));
    remaining = remaining.slice(splitAt).trimStart();
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
        { role: "system", content: REVIEW_SYSTEM_PROMPT },
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

function extractReviewData(aiResponse: string, currentData: Record<string, any>): Record<string, any> {
  const updated = { ...currentData };

  const routeMatch = aiResponse.match(/\[ROUTE_SCORE:(\d+)\]/);
  if (routeMatch) updated.route_score = parseInt(routeMatch[1]);

  const serviceMatch = aiResponse.match(/\[SERVICE_SCORE:(\d+)\]/);
  if (serviceMatch) updated.service_score = parseInt(serviceMatch[1]);

  const npsMatch = aiResponse.match(/\[NPS_SCORE:(\d+)\]/);
  if (npsMatch) updated.nps_score = parseInt(npsMatch[1]);

  const feedbackMatch = aiResponse.match(/\[FEEDBACK:(.*?)\]/s);
  if (feedbackMatch) updated.feedback_text = feedbackMatch[1] === "SKIPPED" ? null : feedbackMatch[1];

  const sharingMatch = aiResponse.match(/\[SHARING:(.*?)\]/);
  if (sharingMatch) updated.allows_sharing = sharingMatch[1];

  const photoMatch = aiResponse.match(/\[PHOTO:(.*?)\]/);
  if (photoMatch) updated.photo_status = photoMatch[1];

  if (aiResponse.includes("[REVIEW_COMPLETE]")) updated.completed = true;
  if (aiResponse.includes("[REVIEW_CANCELLED]")) updated.cancelled = true;

  return updated;
}

function determineStep(data: Record<string, any>): string {
  if (data.completed) return "done";
  if (data.cancelled) return "done";
  if (data.photo_status === "received" || data.photo_status === "declined") return "done";
  if (data.photo_status === "waiting") return "photo";
  if (data.allows_sharing !== undefined) return "photo";
  if (data.feedback_text !== undefined || data.feedback_skipped) return "sharing";
  if (data.nps_score !== undefined) return "feedback";
  if (data.service_score !== undefined) return "nps_score";
  if (data.route_score !== undefined) return "service_score";
  return "route_score";
}

function cleanResponse(text: string): string {
  return text
    .replace(/\[ROUTE_SCORE:\d+\]/g, "")
    .replace(/\[SERVICE_SCORE:\d+\]/g, "")
    .replace(/\[NPS_SCORE:\d+\]/g, "")
    .replace(/\[FEEDBACK:.*?\]/gs, "")
    .replace(/\[SHARING:.*?\]/g, "")
    .replace(/\[PHOTO:.*?\]/g, "")
    .replace(/\[REVIEW_COMPLETE\]/g, "")
    .replace(/\[REVIEW_CANCELLED\]/g, "")
    .trim();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method === "POST") {
      const body = await req.json();

      // Handle "start_review" action from admin panel
      if (body.action === "start_review") {
        const { phone_number, client_name, destination_name, trip_id } = body;
        if (!phone_number) {
          return new Response(JSON.stringify({ error: "phone_number is required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Create review record
        const { data: review, error: insertError } = await supabase
          .from("travel_reviews")
          .insert({
            phone_number,
            client_name: client_name || null,
            destination_name: destination_name || null,
            trip_id: trip_id || null,
            conversation_status: "in_progress",
            current_step: "greeting",
            messages_history: [],
          })
          .select()
          .single();

        if (insertError) {
          console.error("Error creating review:", insertError);
          throw insertError;
        }

        // Build greeting message
        const greetingContext = client_name ? `Olá, ${client_name}!` : "Olá!";
        const destContext = destination_name ? ` para ${destination_name}` : "";
        const greetingMsg = `${greetingContext} 👋 Aqui é o Téo da Tomorrow Travel! ✈️\n\nQueremos saber como foi sua viagem${destContext}! São só 5 perguntinhas rápidas, prometo que é rapidinho! 😊\n\nPra começar: qual nota de 0 a 10 você daria pro roteiro da viagem?`;

        // Send greeting via WhatsApp
        await sendWhatsAppMessage(phone_number, greetingMsg);

        // Update review with greeting in history
        await supabase
          .from("travel_reviews")
          .update({
            current_step: "route_score",
            messages_history: [
              { role: "assistant", content: greetingMsg, timestamp: new Date().toISOString() },
            ],
          })
          .eq("id", review.id);

        return new Response(JSON.stringify({ status: "ok", review_id: review.id }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Handle incoming WhatsApp message for an active review
      if (body.action === "process_review_message") {
        const { phone_number, message_text, review_id, image_url } = body;

        // Find the active review for this phone
        let review;
        if (review_id) {
          const { data } = await supabase
            .from("travel_reviews")
            .select("*")
            .eq("id", review_id)
            .single();
          review = data;
        } else {
          const { data } = await supabase
            .from("travel_reviews")
            .select("*")
            .eq("phone_number", phone_number)
            .eq("conversation_status", "in_progress")
            .order("created_at", { ascending: false })
            .limit(1)
            .single();
          review = data;
        }

        if (!review) {
          return new Response(JSON.stringify({ status: "no_active_review" }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const history = (review.messages_history as any[] || []);
        const historyForAi = history.map((m: any) => ({
          role: m.role,
          content: m.content,
        }));

        // If the user sent an image, tell the AI about it
        const userMessageContent = image_url
          ? `${message_text || ""} [O cliente enviou uma foto/imagem]`.trim()
          : message_text;
        historyForAi.push({ role: "user", content: userMessageContent });

        // Add context about client
        if (review.client_name) {
          historyForAi.unshift({
            role: "system",
            content: `O nome do cliente é ${review.client_name}. ${review.destination_name ? `Ele viajou para ${review.destination_name}.` : ""}`,
          });
        }

        const aiResponse = await getAiResponse(historyForAi);
        const extractedData = extractReviewData(aiResponse, {
          route_score: review.route_score,
          service_score: review.service_score,
          nps_score: review.nps_score,
          feedback_text: review.feedback_text,
          allows_sharing: review.allows_sharing,
          photo_status: undefined,
          completed: false,
          cancelled: false,
        });

        const clean = cleanResponse(aiResponse);
        const newStep = determineStep(extractedData);
        const isComplete = extractedData.completed || extractedData.cancelled;

        const updatedHistory = [
          ...history,
          { role: "user", content: message_text, timestamp: new Date().toISOString(), ...(image_url ? { image_url } : {}) },
          { role: "assistant", content: clean, timestamp: new Date().toISOString() },
        ];

        // Map allows_sharing to valid enum
        let allowsSharing = extractedData.allows_sharing;
        if (allowsSharing && !["sim", "não", "talvez", "com restrições"].includes(allowsSharing)) {
          allowsSharing = null;
        }

        // Save photo_url if image was sent and AI recognized it
        const photoUrl = image_url || review.photo_url;

        await supabase
          .from("travel_reviews")
          .update({
            route_score: extractedData.route_score ?? review.route_score,
            service_score: extractedData.service_score ?? review.service_score,
            nps_score: extractedData.nps_score ?? review.nps_score,
            feedback_text: extractedData.feedback_text ?? review.feedback_text,
            allows_sharing: allowsSharing ?? review.allows_sharing,
            photo_url: photoUrl,
            current_step: newStep,
            conversation_status: isComplete ? (extractedData.cancelled ? "cancelled" : "complete") : "in_progress",
            messages_history: updatedHistory,
          })
          .eq("id", review.id);

        // Send response via WhatsApp
        if (clean) {
          await sendWhatsAppMessage(phone_number, clean);
        }

        return new Response(JSON.stringify({ status: "ok", step: newStep, complete: isComplete }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Unknown action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response("Method not allowed", { status: 405 });
  } catch (error) {
    console.error("Review webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
