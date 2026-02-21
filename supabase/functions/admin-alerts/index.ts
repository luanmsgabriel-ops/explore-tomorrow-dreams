import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WHATSAPP_ACCESS_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN")!;
const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID")!;

const ADMIN_PHONE_NUMBER = "5515998389220";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function sendWhatsAppMessage(to: string, message: string): Promise<void> {
  try {
    await fetch(`https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
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
    });
  } catch (e) {
    console.error("[ADMIN-ALERTS] Failed to send WhatsApp:", e);
  }
}

serve(async (req) => {
  try {
    const alerts: string[] = [];
    const now = new Date();

    // 1. Check for quotes pending > 2 hours
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
    const { data: oldPending } = await supabase
      .from("travel_quote_requests")
      .select("id, destination, origin, phone_number, created_at")
      .eq("status", "pending")
      .lt("created_at", twoHoursAgo);

    if (oldPending && oldPending.length > 0) {
      let msg = `🚨 *ALERTA: COTAÇÕES PENDENTES HÁ MAIS DE 2H*\n\n`;
      msg += `Total: ${oldPending.length} cotação(ões)\n\n`;
      oldPending.forEach((q, i) => {
        const created = new Date(q.created_at);
        const diffMin = Math.floor((now.getTime() - created.getTime()) / 60000);
        const hours = Math.floor(diffMin / 60);
        const mins = diffMin % 60;
        msg += `${i + 1}. *${q.destination}* (${q.origin})\n`;
        msg += `   ⏰ Aguardando: ${hours}h${mins > 0 ? `${mins}min` : ""}\n\n`;
      });
      msg += `💡 *Ação sugerida:* Responda "pendentes" para ver detalhes ou "processar cotação [ID]" para acionar.`;
      alerts.push(msg);
    }

    // 2. Check for failed quotes in last 2 hours
    const { data: recentFailed } = await supabase
      .from("travel_quote_requests")
      .select("id, destination, error_message, updated_at")
      .eq("status", "failed")
      .gte("updated_at", twoHoursAgo);

    if (recentFailed && recentFailed.length > 0) {
      let msg = `🚨 *ALERTA: FALHAS NO PROCESSAMENTO*\n\n`;
      msg += `${recentFailed.length} cotação(ões) falharam recentemente:\n\n`;
      recentFailed.forEach((q, i) => {
        msg += `${i + 1}. *${q.destination}*\n`;
        msg += `   ❌ Erro: ${(q.error_message || "Desconhecido").substring(0, 80)}\n\n`;
      });
      msg += `💡 *Ação sugerida:* Responda "reprocessar [ID]" para tentar novamente.`;
      alerts.push(msg);
    }

    // 3. Check for demand spike (more than 5 quotes in the last hour)
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
    const { data: recentQuotes } = await supabase
      .from("travel_quote_requests")
      .select("id")
      .gte("created_at", oneHourAgo);

    if (recentQuotes && recentQuotes.length >= 5) {
      alerts.push(
        `📈 *ALERTA: PICO DE DEMANDA*\n\n` +
        `${recentQuotes.length} cotações recebidas na última hora!\n\n` +
        `💡 *Ação sugerida:* Verifique as cotações pendentes e monitore o processamento.`
      );
    }

    // Send alerts
    for (const alert of alerts) {
      await sendWhatsAppMessage(ADMIN_PHONE_NUMBER, alert);
      // Small delay between messages
      await new Promise(r => setTimeout(r, 1000));
    }

    // Log
    if (alerts.length > 0) {
      await supabase.from("admin_access_logs").insert({
        phone_number: "SYSTEM",
        command_text: "proactive_alert",
        query_type: "proactive_alert",
        response_summary: `${alerts.length} alerta(s) enviado(s)`,
      });
    }

    console.log(`[ADMIN-ALERTS] Checked. ${alerts.length} alerts sent.`);

    return new Response(JSON.stringify({ success: true, alerts_sent: alerts.length }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[ADMIN-ALERTS] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
