import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WHATSAPP_ACCESS_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN")!;
const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID")!;
const ADMIN_PHONE_NUMBER = "5515998389220";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function sendWhatsAppMessage(to: string, message: string): Promise<void> {
  try {
    await fetch(
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
  } catch (e) {
    console.error("[OFFER-APPROVAL] WhatsApp send error:", e);
  }
}

/**
 * Parses approval/rejection commands from WhatsApp messages.
 * Supported formats:
 *   APROVAR ABCD1234
 *   REJEITAR ABCD1234
 *   aprovar abcd1234
 */
function parseApprovalCommand(text: string): { action: "approve" | "reject"; token: string } | null {
  const normalized = text.trim().toUpperCase().replace(/\s+/g, " ");

  const approveMatch = normalized.match(/^APROVAR\s+([A-Z0-9]{8})$/);
  if (approveMatch) {
    return { action: "approve", token: approveMatch[1] };
  }

  const rejectMatch = normalized.match(/^REJEITAR\s+([A-Z0-9]{8})$/);
  if (rejectMatch) {
    return { action: "reject", token: rejectMatch[1] };
  }

  return null;
}

/**
 * Finds an offer by its short token (first 8 chars of UUID).
 */
async function findOfferByToken(token: string): Promise<{ id: string; title: string; total_price: number } | null> {
  // First try the approval tokens table
  const { data: tokenData } = await supabase
    .from("offer_approval_tokens")
    .select("offer_id, status")
    .eq("short_token", token)
    .single();

  if (tokenData) {
    if (tokenData.status !== "pending") {
      return null; // Already processed
    }
    const { data: offer } = await supabase
      .from("promotional_offers")
      .select("id, title, total_price")
      .eq("id", tokenData.offer_id)
      .single();
    return offer;
  }

  // Fallback: search by UUID prefix
  const { data: offers } = await supabase
    .from("promotional_offers")
    .select("id, title, total_price")
    .eq("approval_status", "pending")
    .ilike("id::text", `${token.toLowerCase()}%`);

  return offers?.[0] || null;
}

/**
 * Approves an offer: sets is_active=true, approval_status='approved'
 */
async function approveOffer(offerId: string, approvedBy: string): Promise<boolean> {
  const { error } = await supabase
    .from("promotional_offers")
    .update({
      is_active: true,
      approval_status: "approved",
      approved_by: approvedBy,
      approved_at: new Date().toISOString(),
    })
    .eq("id", offerId);

  if (error) {
    console.error("[OFFER-APPROVAL] Error approving offer:", error);
    return false;
  }

  // Update token status
  await supabase
    .from("offer_approval_tokens")
    .update({ status: "approved", resolved_at: new Date().toISOString(), resolved_by: approvedBy })
    .eq("offer_id", offerId);

  return true;
}

/**
 * Rejects an offer: keeps is_active=false, sets approval_status='rejected'
 */
async function rejectOffer(offerId: string, rejectedBy: string): Promise<boolean> {
  const { error } = await supabase
    .from("promotional_offers")
    .update({
      is_active: false,
      approval_status: "rejected",
      approved_by: rejectedBy,
      approved_at: new Date().toISOString(),
    })
    .eq("id", offerId);

  if (error) {
    console.error("[OFFER-APPROVAL] Error rejecting offer:", error);
    return false;
  }

  // Update token status
  await supabase
    .from("offer_approval_tokens")
    .update({ status: "rejected", resolved_at: new Date().toISOString(), resolved_by: rejectedBy })
    .eq("offer_id", offerId);

  return true;
}

/**
 * Main handler: called by whatsapp-webhook when admin sends APROVAR/REJEITAR
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { message_text, phone_number } = body;

    if (!message_text || !phone_number) {
      return new Response(
        JSON.stringify({ error: "message_text and phone_number are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Only process messages from admin
    const cleanPhone = phone_number.replace(/\D/g, "");
    const isAdmin = cleanPhone === ADMIN_PHONE_NUMBER || cleanPhone === ADMIN_PHONE_NUMBER.replace("55", "");

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ handled: false, reason: "not_admin" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse command
    const command = parseApprovalCommand(message_text);
    if (!command) {
      return new Response(
        JSON.stringify({ handled: false, reason: "not_approval_command" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[OFFER-APPROVAL] ${command.action.toUpperCase()} token: ${command.token}`);

    // Find offer
    const offer = await findOfferByToken(command.token);
    if (!offer) {
      await sendWhatsAppMessage(
        phone_number,
        `❌ Oferta com código *${command.token}* não encontrada ou já foi processada.`
      );
      return new Response(
        JSON.stringify({ handled: true, success: false, reason: "offer_not_found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Execute action
    if (command.action === "approve") {
      const success = await approveOffer(offer.id, phone_number);
      if (success) {
        const msg =
          `✅ *OFERTA APROVADA E PUBLICADA!*\n\n` +
          `📌 ${offer.title}\n` +
          `💰 ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(offer.total_price)}\n\n` +
          `A oferta já está visível no site para os clientes! 🎉`;
        await sendWhatsAppMessage(phone_number, msg);

        // Log action
        await supabase.from("admin_access_logs").insert({
          phone_number,
          command_text: message_text,
          query_type: "offer_approval",
          response_summary: `Oferta aprovada: ${offer.id} - ${offer.title}`,
        });
      } else {
        await sendWhatsAppMessage(phone_number, `❌ Erro ao aprovar a oferta. Tente novamente.`);
      }
    } else {
      const success = await rejectOffer(offer.id, phone_number);
      if (success) {
        const msg =
          `🗑️ *OFERTA REJEITADA*\n\n` +
          `📌 ${offer.title}\n\n` +
          `A oferta foi descartada e não será publicada.`;
        await sendWhatsAppMessage(phone_number, msg);

        await supabase.from("admin_access_logs").insert({
          phone_number,
          command_text: message_text,
          query_type: "offer_rejection",
          response_summary: `Oferta rejeitada: ${offer.id} - ${offer.title}`,
        });
      } else {
        await sendWhatsAppMessage(phone_number, `❌ Erro ao rejeitar a oferta. Tente novamente.`);
      }
    }

    return new Response(
      JSON.stringify({ handled: true, success: true, action: command.action, offer_id: offer.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[OFFER-APPROVAL] Error:", error);
    return new Response(
      JSON.stringify({ handled: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
