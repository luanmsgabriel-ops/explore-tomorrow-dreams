import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const adminEmail = Deno.env.get("ADMIN_NOTIFICATION_EMAIL");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: 'quote_request' | 'chat_session' | 'ai_itinerary' | 'ai_image';
  data: Record<string, any>;
}

const getEmailContent = (type: string, data: Record<string, any>) => {
  const baseStyle = `
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #f97316, #ea580c); color: white; padding: 20px; border-radius: 10px 10px 0 0; }
      .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
      .footer { background: #1f2937; color: white; padding: 15px; border-radius: 0 0 10px 10px; text-align: center; }
      .highlight { color: #f97316; font-weight: bold; }
      .info-row { padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
      .label { font-weight: bold; color: #6b7280; }
    </style>
  `;

  switch (type) {
    case 'quote_request':
      return {
        subject: `🎯 Nova Solicitação de Cotação - ${data.destination_name || 'Destino não especificado'}`,
        html: `
          ${baseStyle}
          <div class="container">
            <div class="header">
              <h1>🎯 Nova Solicitação de Cotação!</h1>
            </div>
            <div class="content">
              <p>Um novo cliente está aguardando sua cotação:</p>
              <div class="info-row"><span class="label">📍 Destino:</span> <span class="highlight">${data.destination_name || 'Não especificado'}</span></div>
              <div class="info-row"><span class="label">📧 E-mail:</span> ${data.email || 'N/A'}</div>
              <div class="info-row"><span class="label">📱 WhatsApp:</span> ${data.whatsapp || 'N/A'}</div>
              <div class="info-row"><span class="label">📅 Data da viagem:</span> ${data.travel_date || 'Não informada'}</div>
              <div class="info-row"><span class="label">👥 Pessoas:</span> ${data.num_people || 'N/A'}</div>
              <div class="info-row"><span class="label">✈️ Aeroporto:</span> ${data.preferred_airport || 'N/A'}</div>
              ${data.special_requests ? `<div class="info-row"><span class="label">📝 Pedidos especiais:</span> ${data.special_requests}</div>` : ''}
            </div>
            <div class="footer">
              <p>Tomorrow Travel - Acesse o painel administrativo para mais detalhes</p>
            </div>
          </div>
        `
      };

    case 'chat_session':
      return {
        subject: `💬 Nova Conversa de Chat - ${data.user_name || 'Cliente'}`,
        html: `
          ${baseStyle}
          <div class="container">
            <div class="header">
              <h1>💬 Nova Conversa Iniciada!</h1>
            </div>
            <div class="content">
              <p>Um cliente iniciou uma conversa no chat:</p>
              <div class="info-row"><span class="label">👤 Nome:</span> <span class="highlight">${data.user_name || 'N/A'}</span></div>
              <div class="info-row"><span class="label">📱 WhatsApp:</span> ${data.user_whatsapp || 'N/A'}</div>
              <div class="info-row"><span class="label">📍 Destino:</span> ${data.destination_name || 'N/A'}</div>
            </div>
            <div class="footer">
              <p>Tomorrow Travel - Acesse o painel administrativo para ver a conversa</p>
            </div>
          </div>
        `
      };

    case 'ai_itinerary':
      return {
        subject: `📋 Novo Roteiro IA Gerado - ${data.destination_name || 'Destino'}`,
        html: `
          ${baseStyle}
          <div class="container">
            <div class="header">
              <h1>📋 Novo Roteiro Gerado!</h1>
            </div>
            <div class="content">
              <p>Um cliente gerou um roteiro personalizado:</p>
              <div class="info-row"><span class="label">📍 Destino:</span> <span class="highlight">${data.destination_name || 'N/A'}</span></div>
              <div class="info-row"><span class="label">📧 E-mail:</span> ${data.user_email || 'N/A'}</div>
              <div class="info-row"><span class="label">📱 WhatsApp:</span> ${data.user_whatsapp || 'N/A'}</div>
              <div class="info-row"><span class="label">🎭 Clima:</span> ${data.travel_mood || 'Não especificado'}</div>
              ${data.quote_requested ? '<div class="info-row"><span class="label">⚡ Status:</span> <span class="highlight">COTAÇÃO SOLICITADA!</span></div>' : ''}
            </div>
            <div class="footer">
              <p>Tomorrow Travel - Acesse o painel administrativo para ver o roteiro completo</p>
            </div>
          </div>
        `
      };

    case 'ai_image':
      return {
        subject: `🎨 Nova Imagem IA Gerada - ${data.destination_name || 'Destino'}`,
        html: `
          ${baseStyle}
          <div class="container">
            <div class="header">
              <h1>🎨 Nova Imagem Gerada!</h1>
            </div>
            <div class="content">
              <p>Um cliente gerou uma imagem personalizada:</p>
              <div class="info-row"><span class="label">📍 Destino:</span> <span class="highlight">${data.destination_name || 'N/A'}</span></div>
              <div class="info-row"><span class="label">📧 E-mail:</span> ${data.user_email || 'N/A'}</div>
              <div class="info-row"><span class="label">📱 WhatsApp:</span> ${data.user_whatsapp || 'N/A'}</div>
              <div class="info-row"><span class="label">🖼️ Prompt:</span> ${data.prompt || 'N/A'}</div>
            </div>
            <div class="footer">
              <p>Tomorrow Travel - Acesse o painel administrativo para ver a imagem</p>
            </div>
          </div>
        `
      };

    default:
      return {
        subject: '📢 Nova Interação - Tomorrow Travel',
        html: `
          ${baseStyle}
          <div class="container">
            <div class="header">
              <h1>📢 Nova Interação!</h1>
            </div>
            <div class="content">
              <p>Há uma nova interação aguardando sua atenção no painel administrativo.</p>
              <pre>${JSON.stringify(data, null, 2)}</pre>
            </div>
            <div class="footer">
              <p>Tomorrow Travel</p>
            </div>
          </div>
        `
      };
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!adminEmail) {
      throw new Error("ADMIN_NOTIFICATION_EMAIL not configured");
    }

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const { type, data }: NotificationRequest = await req.json();
    
    console.log(`Sending notification for type: ${type}`, data);

    const emailContent = getEmailContent(type, data);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Tomorrow Travel <onboarding@resend.dev>",
        to: [adminEmail],
        subject: emailContent.subject,
        html: emailContent.html,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Resend API error: ${error}`);
    }

    const emailResponse = await res.json();
    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
