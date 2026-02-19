import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TEO_FOLLOW_UP_MESSAGES = [
  (name: string, dest: string) =>
    `E aí, ${name}! 🌴 Sou o Teo da Tomorrow Travel! Lembra daquela viagem incrível pra ${dest} que a gente conversou? Ainda tá nos planos? Porque as melhores ofertas não ficam esperando na praia pra sempre! 🏖️😄\n\nSe quiser, posso atualizar a cotação rapidinho pra você!`,
  (name: string, dest: string) =>
    `Oi ${name}! 👋 Teo aqui! Tô passando pra lembrar que ${dest} tá te esperando com os braços abertos! 🤗✈️\n\nA gente tinha conversado sobre essa viagem e eu não quero que você perca as melhores condições. Bora retomar? É só me dar um "oi" que eu atualizo tudo pra você! 😉🌟`,
  (name: string, dest: string) =>
    `Fala ${name}! 🙌 Aqui é o Teo! Tava aqui pensando... sabe o que combina com ${dest}? VOCÊ! 😂🌊\n\nA cotação que fizemos ainda pode ser atualizada com condições especiais. Quer dar uma olhada? Prometo que vai valer a pena! 💛✨`,
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

    // Find quotes that need follow-up:
    // - status is 'quoted' or 'pending' or 'in_progress'
    // - follow_up_message_sent is false
    // - created_at is older than follow_up_days (default 3)
    // - also check quote_requests table
    const { data: quotes, error: quotesError } = await supabase
      .from("quote_requests")
      .select("*")
      .in("status", ["pending", "in_progress", "quoted"])
      .eq("follow_up_message_sent", false)
      .eq("follow_up_enabled", true)
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

    for (const quote of (quotes || [])) {
      const followUpDays = quote.follow_up_days || 3;
      const createdAt = new Date(quote.created_at);
      const diffDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

      // Skip if not enough days have passed
      if (diffDays < followUpDays) continue;

      // Skip if follow_up_date is set and hasn't arrived yet
      if (quote.follow_up_date) {
        const followUpDate = new Date(quote.follow_up_date);
        if (now < followUpDate) continue;
      }

      const clientName = quote.client_name || "Viajante";
      const destination = quote.destination_name || "seu destino dos sonhos";
      const phone = quote.whatsapp?.replace(/\D/g, "");

      // 1. Send WhatsApp message via Teo
      if (phone && WHATSAPP_ACCESS_TOKEN && WHATSAPP_PHONE_NUMBER_ID) {
        const randomMsg = TEO_FOLLOW_UP_MESSAGES[Math.floor(Math.random() * TEO_FOLLOW_UP_MESSAGES.length)];
        const message = randomMsg(clientName, destination);

        try {
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
              subject: `🔔 Follow-up automático: ${clientName} - ${destination}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #f59e0b;">🔔 Follow-up Automático Enviado</h2>
                  <p>O Teo enviou uma mensagem de follow-up para um cliente que não fechou após <strong>${followUpDays} dias</strong>.</p>
                  <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                    <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Cliente</td><td style="padding: 8px; border: 1px solid #ddd;">${clientName}</td></tr>
                    <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Destino</td><td style="padding: 8px; border: 1px solid #ddd;">${destination}</td></tr>
                    <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">WhatsApp</td><td style="padding: 8px; border: 1px solid #ddd;">${quote.whatsapp || "N/A"}</td></tr>
                    <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">E-mail</td><td style="padding: 8px; border: 1px solid #ddd;">${quote.email || "N/A"}</td></tr>
                    <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Status</td><td style="padding: 8px; border: 1px solid #ddd;">${quote.status}</td></tr>
                    <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Criado em</td><td style="padding: 8px; border: 1px solid #ddd;">${new Date(quote.created_at).toLocaleDateString("pt-BR")}</td></tr>
                  </table>
                  <p style="color: #666;">Recomendamos entrar em contato com o cliente para retomar a negociação. 💛</p>
                </div>
              `,
            }),
          });
          console.log(`Admin email notification sent for quote ${quote.id}`);
        } catch (emailError) {
          console.error(`Error sending admin email for quote ${quote.id}:`, emailError);
        }
      }

      // 3. Mark follow-up as sent
      await supabase
        .from("quote_requests")
        .update({
          follow_up_message_sent: true,
          follow_up_sent_at: now.toISOString(),
        })
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
