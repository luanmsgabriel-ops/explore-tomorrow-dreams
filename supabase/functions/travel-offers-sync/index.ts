import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const targetUrl = "https://viajandocomdesconto.com/";
    const res = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(30000)
    });
    const html = await res.text();
    const executionTimestamp = new Date().toISOString();

    if (html.length < 1000) {
      throw new Error(`HTML muito curto (${html.length} bytes). Status: ${res.status}`);
    }

    const findJSON = (marker: string) => {
      const startIdx = html.indexOf(marker);
      if (startIdx === -1) return null;
      const dataStart = html.indexOf("{", startIdx);
      const arrayStart = html.indexOf("[", startIdx);
      
      const realStart = (dataStart !== -1 && (arrayStart === -1 || dataStart < arrayStart)) ? dataStart : arrayStart;
      if (realStart === -1) return null;
      
      const firstChar = html[realStart];
      const lastChar = firstChar === "{" ? "}" : "]";
      
      let braceCount = 0;
      let endIdx = -1;
      for (let i = realStart; i < html.length; i++) {
        if (html[i] === firstChar) braceCount++;
        else if (html[i] === lastChar) braceCount--;
        
        if (braceCount === 0) {
          endIdx = i + 1;
          break;
        }
      }
      if (endIdx === -1) return null;
      try {
        return JSON.parse(html.substring(realStart, endIdx));
      } catch {
        return null;
      }
    };

    const payload = findJSON("__PVOO_PAYLOAD =");
    const snapshot = findJSON("PV_SNAPSHOT =");

    if (!payload || !snapshot) {
      return new Response(JSON.stringify({
        message: "Nenhum dado encontrado no HTML. Abortando.",
        status: "aborted",
        html_length: html.length,
        has_payload: !!payload,
        has_snapshot: !!snapshot
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { blob, mapa } = payload;
    if (!blob || !mapa) {
      throw new Error("Estrutura do PAYLOAD inválida (blob ou mapa ausente).");
    }

    const lines = blob.split("\n").filter((l: string) => l.trim().length > 0);
    const parsedOffers = [];
    let mapErrors = 0;

    const generateHash = async (text: string) => {
      const msgUint8 = new TextEncoder().encode(text);
      const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, "0")).join("").substring(0, 32);
    };

    const convertDate = (aammdd: string) => {
      if (!aammdd || aammdd.length !== 6) return null;
      return `20${aammdd.substring(0, 2)}-${aammdd.substring(2, 4)}-${aammdd.substring(4, 6)}`;
    };

    const convertTime = (hhmm: string) => {
      if (!hhmm || hhmm.length !== 4) return null;
      return `${hhmm.substring(0, 2)}:${hhmm.substring(2, 4)}`;
    };

    for (const line of lines) {
      const cols = line.split("|");
      if (cols.length < 16) continue;

      const originIata = cols[0];
      const destinationIata = cols[1];
      const departureDate = convertDate(cols[2]);
      const returnDate = convertDate(cols[3]);
      const price = parseFloat(cols[6]);
      const currency = cols[7] === "0" ? "BRL" : "USD";
      const airline = cols[15];

      const originName = mapa[originIata] ? mapa[originIata][0] : originIata;
      const destinationName = mapa[destinationIata] ? mapa[destinationIata][1] : destinationIata;

      if (!mapa[originIata] || !mapa[destinationIata]) mapErrors++;

      const sourceId = await generateHash(`${originIata}${destinationIata}${cols[2]}${cols[3]}${airline}${cols[6]}`);

      parsedOffers.push({
        source: "viajandocomdesconto",
        source_id: sourceId,
        offer_type: "bloqueio_aereo",
        origin_iata: originIata,
        origin_city: originName,
        destination_iata: destinationIata,
        destination_name: destinationName,
        departure_date: departureDate,
        return_date: returnDate,
        price: price,
        currency: currency,
        airline: airline,
        tax: parseFloat(cols[13]) || 0,
        nights: parseInt(cols[4]) || 0,
        seats_available: parseInt(cols[5]) || 0,
        deadline_date: convertDate(cols[8]),
        outbound_departure_time: convertTime(cols[9]),
        outbound_arrival_time: convertTime(cols[10]),
        inbound_departure_time: convertTime(cols[11]),
        inbound_arrival_time: convertTime(cols[12]),
        last_seen_at: executionTimestamp
      });
    }

    if (Array.isArray(snapshot)) {
      for (const item of snapshot) {
        const sourceId = await generateHash(`pkg-${item.nome}-${item.origem_iata}-${item.destino}-${item.por}`);
        parsedOffers.push({
          source: "viajandocomdesconto",
          source_id: sourceId,
          offer_type: "pacote",
          title: item.nome,
          destination_name: item.destino,
          origin_iata: item.origem_iata,
          origin_city: item.origem_cidade,
          departure_date: item.ida ? convertDate(item.ida.replace(/\//g, "").substring(2, 8)) : null,
          return_date: item.volta ? convertDate(item.volta.replace(/\//g, "").substring(2, 8)) : null,
          price: parseFloat(String(item.por).replace(/[^0-9.]/g, "")),
          currency: "BRL",
          tax: parseFloat(item.taxa) || 0,
          last_seen_at: executionTimestamp
        });
      }
    }

    const { error: upsertError } = await supabaseClient
      .from("travel_offers")
      .upsert(parsedOffers, { onConflict: "source,source_id,offer_type" });

    if (upsertError) throw upsertError;

    const { error: deactivateError } = await supabaseClient
      .from("travel_offers")
      .update({ is_active: false })
      .lt("last_seen_at", executionTimestamp)
      .eq("source", "viajandocomdesconto");

    if (deactivateError) throw deactivateError;

    await supabaseClient.from("travel_sync_logs").insert({
      source: "viajandocomdesconto",
      offers_count: parsedOffers.length,
      map_errors: mapErrors,
      status: "success"
    });

    return new Response(JSON.stringify({
      status: "success",
      total_offers: parsedOffers.length,
      map_errors: mapErrors
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});