import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TEO_VOICE_ID = "cjVigY5qzO86Huf0OWal"; // Eric voice

// Follow-up messages organized by stage (day 1, 3, 7, 14)
const TEO_FOLLOW_UP_DAY1 = (name: string, dest: string) =>
  `Oi ${name}! Tudo bem? 😊\n\nVi que te enviei algumas opções de viagem para ${dest} ontem. Conseguiu dar uma olhada?\n\nSe tiver alguma dúvida ou quiser ajustar algo, é só me chamar! Estou aqui para ajudar.\n\nAh, e se preferir, posso te mostrar outras opções de datas ou hotéis! 🏨✈️`;

const TEO_FOLLOW_UP_DAY3 = (name: string, dest: string) =>
  `Olá ${name}! 👋\n\nPercebi que você ainda não fechou a viagem para ${dest}.\n\nQueria te avisar que:\n⚠️ Os preços podem variar (geralmente sobem quanto mais perto da data)\n⚠️ A disponibilidade dos hotéis pode mudar\n\nSe ainda tiver interesse, posso:\n✅ Atualizar os preços para você\n✅ Buscar novas opções\n✅ Te ajudar com qualquer dúvida\n\nO que você acha? Ainda está planejando essa viagem? 🌍`;

const TEO_FOLLOW_UP_DAY7 = (name: string, dest: string) =>
  `Oi ${name}! Tudo bem por aí? 😊\n\nFaz uma semana que conversamos sobre sua viagem para ${dest}.\n\nEntendo que às vezes precisamos de um tempo para decidir, mas queria te dar um toque:\n\n💡 Os melhores preços costumam ser de 60-90 dias antes da viagem\n💡 Hotéis bem avaliados esgotam rápido em alta temporada\n\nSe mudou de ideia ou quer planejar para outra data, sem problemas! Estou aqui quando precisar.\n\nMas se ainda tiver interesse, me avisa que atualizo tudo para você! 🚀`;

const TEO_FOLLOW_UP_DAY14 = (name: string, dest: string) =>
  `Oi ${name}! 😊\n\nPercebi que faz um tempo que não conversamos sobre sua viagem para ${dest}.\n\nVou deixar sua cotação arquivada aqui, mas se mudar de ideia ou quiser planejar uma viagem no futuro, é só me chamar!\n\nEstarei sempre aqui para te ajudar a realizar seus sonhos de viagem! ✈️🌍\n\nAté breve! 👋`;

// Legacy array for backward compat
const TEO_FOLLOW_UP_MESSAGES = [
  TEO_FOLLOW_UP_DAY1,
  TEO_FOLLOW_UP_DAY3,
  TEO_FOLLOW_UP_DAY7,
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const WHATSAPP_ACCESS_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
    const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const ADMIN_EMAIL = Deno.env.get("ADMIN_NOTIFICATION_EMAIL");
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");

    // Helper: generate audio from text via ElevenLabs TTS
    async function convertTextToAudio(text: string): Promise<ArrayBuffer | null> {
      if (!ELEVENLABS_API_KEY) return null;
      try {
        const response = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${TEO_VOICE_ID}?output_format=mp3_44100_128`,
          {
            method: "POST",
            headers: {
              "xi-api-key": ELEVENLABS_API_KEY,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              text,
              model_id: "eleven_multilingual_v2",
              voice_settings: {
                stability: 0.3,
                similarity_boost: 0.75,
                style: 0.5,
                use_speaker_boost: true,
              },
            }),
          }
        );
        if (!response.ok) {
          console.error("ElevenLabs TTS error:", response.status, await response.text());
          return null;
        }
        return await response.arrayBuffer();
      } catch (err) {
        console.error("ElevenLabs TTS exception:", err);
        return null;
      }
    }

    // Helper: upload audio to storage
    async function uploadAudioToStorage(audioBuffer: ArrayBuffer, phone: string): Promise<string | null> {
      const fileName = `teo-audio/${phone}/${Date.now()}.mp3`;
      const { error } = await supabase.storage
        .from("destination-images")
        .upload(fileName, new Blob([audioBuffer], { type: "audio/mpeg" }), {
          contentType: "audio/mpeg",
          upsert: true,
        });
      if (error) {
        console.error("Audio upload error:", error);
        return null;
      }
      const { data: publicUrlData } = supabase.storage
        .from("destination-images")
        .getPublicUrl(fileName);
      return publicUrlData.publicUrl;
    }

    // Helper: send audio via WhatsApp
    async function sendWhatsAppAudio(to: string, audioUrl: string) {
      const response = await fetch(
        `https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to,
            type: "audio",
            audio: { link: audioUrl },
          }),
        }
      );
      if (!response.ok) {
        console.error("WhatsApp Audio error:", await response.text());
      }
    }

    // Find quotes that need follow-up:
    // - status is 'quoted' or 'pending' or 'in_progress'
    // - follow_up_enabled is true
    // - follow_up_stage < 4 (not yet archived)
    const { data: quotes, error: quotesError } = await supabase
      .from("quote_requests")
      .select("*")
      .in("status", ["pending", "in_progress", "quoted"])
      .eq("follow_up_enabled", true)
      .lt("follow_up_stage", 4)
      .order("created_at", { ascending: true });

    if (quotesError) {
      console.error("Error fetching quotes for follow-up:", quotesError);
      return new Response(JSON.stringify({ error: quotesError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date();
    const followUpResults: any[] = [];

    // Follow-up schedule: stage 0→1 after 1 day, 1→2 after 3 days, 2→3 after 7 days, 3→4 after 14 days
    const STAGE_CONFIG = [
      { minDays: 1, nextStage: 1, getMessage: TEO_FOLLOW_UP_DAY1 },
      { minDays: 3, nextStage: 2, getMessage: TEO_FOLLOW_UP_DAY3 },
      { minDays: 7, nextStage: 3, getMessage: TEO_FOLLOW_UP_DAY7 },
      { minDays: 14, nextStage: 4, getMessage: TEO_FOLLOW_UP_DAY14 },
    ];

    for (const quote of (quotes || [])) {
      const currentStage = quote.follow_up_stage || 0;
      const config = STAGE_CONFIG[currentStage];
      if (!config) continue;

      const createdAt = new Date(quote.created_at);
      const diffDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

      // Skip if not enough days have passed for this stage
      if (diffDays < config.minDays) continue;

      const clientName = quote.client_name || "Viajante";
      const destination = quote.destination_name || "seu destino dos sonhos";
      const phone = quote.whatsapp?.replace(/\D/g, "");

      // 1. Send WhatsApp message via Teo
      if (phone && WHATSAPP_ACCESS_TOKEN && WHATSAPP_PHONE_NUMBER_ID) {
        const message = config.getMessage(clientName, destination);

        try {
          // Stage 0 (Day 1): Send curiosity audio + "Urgente!!" before the regular message
          if (currentStage === 0 && ELEVENLABS_API_KEY) {
            try {
              const audioText = `Ei ${clientName}! Ficou curioso né? hahaha! É só para te lembrar que eu ainda tô aqui, pronto para te ajudar a montar a viagem perfeita! Me chama quando quiser!`;
              const audioBuffer = await convertTextToAudio(audioText);
              if (audioBuffer) {
                const audioUrl = await uploadAudioToStorage(audioBuffer, phone);
                if (audioUrl) {
                  await sendWhatsAppAudio(phone, audioUrl);
                  console.log(`Curiosity audio sent to ${phone}`);
                  // Small delay before sending "Urgente!!"
                  await new Promise(resolve => setTimeout(resolve, 2000));
                }
              }
            } catch (audioErr) {
              console.error(`Error sending curiosity audio to ${phone}:`, audioErr);
            }

            // Send "Urgente!!" text
            await fetch(
              `https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
              {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  messaging_product: "whatsapp",
                  recipient_type: "individual",
                  to: phone,
                  type: "text",
                  text: { body: "Urgente!! 🚨" },
                }),
              }
            );
            // Small delay before follow-up text
            await new Promise(resolve => setTimeout(resolve, 1500));
          }

          const waResponse = await fetch(
            `https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
            {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: phone,
                type: "text",
                text: { body: message },
              }),
            }
          );

          const waResult = await waResponse.json();
          console.log(`WhatsApp follow-up sent to ${phone}:`, waResult);

          followUpResults.push({
            quote_id: quote.id,
            client: clientName,
            phone,
            whatsapp_sent: waResponse.ok,
            audio_sent: currentStage === 0,
          });
        } catch (waError) {
          console.error(`Error sending WhatsApp to ${phone}:`, waError);
          followUpResults.push({
            quote_id: quote.id,
            client: clientName,
            phone,
            whatsapp_sent: false,
            error: waError.message,
          });
        }
      }

      // 2. Send email notification to admin
      if (RESEND_API_KEY && ADMIN_EMAIL) {
        try {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${RESEND_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "Tomorrow Travel <onboarding@resend.dev>",
              to: [ADMIN_EMAIL],
              subject: `🔔 Follow-up Dia ${config.minDays}: ${clientName} - ${destination}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #f59e0b;">🔔 Follow-up Automático - Dia ${config.minDays}</h2>
                  <p>O Teo enviou a mensagem de follow-up <strong>etapa ${config.nextStage}/4</strong> (dia ${config.minDays}) para um cliente.</p>
                  <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                    <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Cliente</td><td style="padding: 8px; border: 1px solid #ddd;">${clientName}</td></tr>
                     <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Follow-up</td><td style="padding: 8px; border: 1px solid #ddd;">Etapa ${config.nextStage} de 4 (Dia ${config.minDays})</td></tr>
                    <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Destino</td><td style="padding: 8px; border: 1px solid #ddd;">${destination}</td></tr>
                    <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">WhatsApp</td><td style="padding: 8px; border: 1px solid #ddd;">${quote.whatsapp || "N/A"}</td></tr>
                    <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">E-mail</td><td style="padding: 8px; border: 1px solid #ddd;">${quote.email || "N/A"}</td></tr>
                    <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Status</td><td style="padding: 8px; border: 1px solid #ddd;">${quote.status}</td></tr>
                    <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Criado em</td><td style="padding: 8px; border: 1px solid #ddd;">${new Date(quote.created_at).toLocaleDateString("pt-BR")}</td></tr>
                  </table>
                  <p style="color: #666;">${config.nextStage === 4 ? 'Cotação será arquivada automaticamente. Cliente não respondeu após 14 dias.' : 'Recomendamos entrar em contato com o cliente para retomar a negociação. 💛'}</p>
                </div>
              `,
            }),
          });
          console.log(`Admin email notification sent for quote ${quote.id}`);
        } catch (emailError) {
          console.error(`Error sending admin email for quote ${quote.id}:`, emailError);
        }
      }

      // 3. Update follow-up stage
      const updateData: Record<string, any> = {
        follow_up_stage: config.nextStage,
        follow_up_sent_at: now.toISOString(),
      };
      
      // Archive on day 14 (stage 4)
      if (config.nextStage === 4) {
        updateData.status = 'archived';
        updateData.follow_up_message_sent = true;
      }

      await supabase
        .from("quote_requests")
        .update(updateData)
        .eq("id", quote.id);
    }

    const summary = {
      checked: quotes?.length || 0,
      followed_up: followUpResults.length,
      results: followUpResults,
    };

    console.log("Auto follow-up summary:", JSON.stringify(summary));

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in auto-follow-up:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
