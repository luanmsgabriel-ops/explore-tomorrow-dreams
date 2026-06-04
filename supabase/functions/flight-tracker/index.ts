// flight-tracker: runs every 10 minutes via pg_cron.
// Polls AviationStack for active flight tracking subscriptions and
// sends WhatsApp updates when the status or delay changes.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const AVIATIONSTACK_API_KEY = Deno.env.get("AVIATIONSTACK_API_KEY")!;
const WHATSAPP_ACCESS_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN")!;
const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function sendWhatsApp(to: string, message: string) {
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
    },
  );
}

const AIRPORT_TZ: Record<string, string> = {
  GRU: "America/Sao_Paulo", CGH: "America/Sao_Paulo", VCP: "America/Sao_Paulo",
  GIG: "America/Sao_Paulo", SDU: "America/Sao_Paulo", BSB: "America/Sao_Paulo",
  CNF: "America/Sao_Paulo", CWB: "America/Sao_Paulo", POA: "America/Sao_Paulo",
  FLN: "America/Sao_Paulo", SSA: "America/Bahia", REC: "America/Recife",
  FOR: "America/Fortaleza", NAT: "America/Fortaleza", BEL: "America/Belem",
  MAO: "America/Manaus", CGB: "America/Cuiaba", CGR: "America/Campo_Grande",
  MCZ: "America/Maceio", AJU: "America/Maceio", THE: "America/Fortaleza",
  SLZ: "America/Fortaleza", PMW: "America/Araguaina", PVH: "America/Porto_Velho",
  RBR: "America/Rio_Branco", BVB: "America/Boa_Vista", MGF: "America/Sao_Paulo",
  LDB: "America/Sao_Paulo", JPA: "America/Fortaleza", IGU: "America/Sao_Paulo",
  MIA: "America/New_York", JFK: "America/New_York", EWR: "America/New_York",
  LAX: "America/Los_Angeles", ORD: "America/Chicago", MCO: "America/New_York",
  LIS: "Europe/Lisbon", MAD: "Europe/Madrid", CDG: "Europe/Paris",
  LHR: "Europe/London", FRA: "Europe/Berlin", FCO: "Europe/Rome",
  EZE: "America/Argentina/Buenos_Aires", SCL: "America/Santiago",
  BOG: "America/Bogota", LIM: "America/Lima", MEX: "America/Mexico_City",
  PTY: "America/Panama", CUN: "America/Cancun",
};

function resolveTz(apiTz?: string | null, iata?: string | null): string | null {
  if (apiTz && apiTz !== "UTC" && apiTz !== "\\N") return apiTz;
  if (iata && AIRPORT_TZ[iata.toUpperCase()]) return AIRPORT_TZ[iata.toUpperCase()];
  return apiTz || null;
}

function fmtTime(iso?: string | null, apiTz?: string | null, iata?: string | null): string {
  if (!iso) return "—";
  try {
    const raw = String(iso);
    const tz = resolveTz(apiTz, iata);
    const offset = raw.match(/([+-]\d{2}:?\d{2}|Z)$/)?.[1] || null;
    const isUtcLikeOffset = offset === "Z" || /^[+-]00:?00$/.test(offset || "");
    if (isUtcLikeOffset && tz && tz !== "UTC") {
      const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
      if (m) return `${m[3]}/${m[2]} ${m[4]}:${m[5]}`;
    }
    if (tz) {
      const d = new Date(raw);
      if (!isNaN(d.getTime())) {
        const parts = new Intl.DateTimeFormat("pt-BR", {
          timeZone: tz, hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", hour12: false,
        }).formatToParts(d);
        const g = (t: string) => parts.find((p) => p.type === t)?.value || "";
        return `${g("day")}/${g("month")} ${g("hour")}:${g("minute")}`;
      }
    }
    const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
    if (m) return `${m[3]}/${m[2]} ${m[4]}:${m[5]}`;
    return raw;
  } catch {
    return iso;
  }
}

export async function fetchFlight(flightIata: string, flightDate: string) {
  const url = `https://api.aviationstack.com/v1/flights?access_key=${AVIATIONSTACK_API_KEY}&flight_iata=${flightIata}&flight_date=${flightDate}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`AviationStack ${res.status}`);
  const data = await res.json();
  return data.data?.[0] ?? null;
}

export function buildStatusMessage(flight: any, flightIata: string): string {
  const status = flight.flight_status ?? "desconhecido";
  const dep = flight.departure ?? {};
  const arr = flight.arrival ?? {};
  const delay = dep.delay ?? 0;
  const statusEmoji: Record<string, string> = {
    scheduled: "🕒",
    active: "✈️",
    landed: "🛬",
    cancelled: "❌",
    incident: "⚠️",
    diverted: "↪️",
  };
  const emoji = statusEmoji[status] ?? "ℹ️";
  return (
    `${emoji} *Voo ${flightIata}* — ${status.toUpperCase()}\n\n` +
    `🛫 *Origem:* ${dep.airport ?? "—"} (${dep.iata ?? "—"})\n` +
    `   Previsto: ${fmtTime(dep.scheduled)}\n` +
    `   Estimado: ${fmtTime(dep.estimated)}\n` +
    (delay ? `   ⏱️ Atraso: ${delay} min\n` : "") +
    `\n🛬 *Destino:* ${arr.airport ?? "—"} (${arr.iata ?? "—"})\n` +
    `   Previsto: ${fmtTime(arr.scheduled)}\n` +
    `   Estimado: ${fmtTime(arr.estimated)}\n` +
    (arr.actual ? `   ✅ Pousou: ${fmtTime(arr.actual)}\n` : "")
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const today = new Date().toISOString().split("T")[0];

    // Auto-deactivate subscriptions for past flights
    await supabase
      .from("flight_tracking_subscriptions")
      .update({ active: false })
      .lt("flight_date", today)
      .eq("active", true);

    const { data: subs, error } = await supabase
      .from("flight_tracking_subscriptions")
      .select("*")
      .eq("active", true)
      .gte("flight_date", today);

    if (error) throw error;
    if (!subs?.length) {
      return new Response(JSON.stringify({ status: "ok", checked: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let notified = 0;
    for (const sub of subs) {
      try {
        const flight = await fetchFlight(sub.flight_iata, sub.flight_date);
        if (!flight) continue;

        const status = flight.flight_status ?? null;
        const delay = flight.departure?.delay ?? 0;
        const changed =
          status !== sub.last_status ||
          delay !== (sub.last_delay_minutes ?? 0);

        if (changed) {
          const msg = buildStatusMessage(flight, sub.flight_iata);
          await sendWhatsApp(sub.phone_number, msg);
          notified++;

          await supabase
            .from("flight_tracking_subscriptions")
            .update({
              last_status: status,
              last_delay_minutes: delay,
              last_notified_at: new Date().toISOString(),
              // Stop tracking once landed/cancelled
              active: !["landed", "cancelled"].includes(status),
            })
            .eq("id", sub.id);
        }
      } catch (e) {
        console.error(`[flight-tracker] sub ${sub.id}:`, e);
      }
    }

    return new Response(
      JSON.stringify({ status: "ok", checked: subs.length, notified }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("[flight-tracker] error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
