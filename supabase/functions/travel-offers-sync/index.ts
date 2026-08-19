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

  const startTime = new Date().toISOString();
  
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

    // Brasilia Date calculation (UTC-3)
    const nowUtc = new Date();
    const brDateStr = new Intl.DateTimeFormat('fr-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(nowUtc); // YYYY-MM-DD

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

    const convertDate = (aammdd: string) => {
      if (!aammdd || aammdd.length !== 6) return null;
      return `20${aammdd.substring(0, 2)}-${aammdd.substring(2, 4)}-${aammdd.substring(4, 6)}`;
    };

    const convertTime = (hhmm: string) => {
      if (!hhmm || hhmm.length !== 4) return null;
      return `${hhmm.substring(0, 2)}:${hhmm.substring(2, 4)}`;
    };

    // Helper for source_id generation (Crypto is available in Deno)
    const generateId = async (input: string) => {
      const msgUint8 = new TextEncoder().encode(input);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 64);
    };

    for (const line of lines) {
      const cols = line.split("|");
      if (cols.length < 16) continue;

      const deadline = convertDate(cols[8]);
      // EXCLUSION RULE: discard if deadline is before today (Brasilia)
      if (deadline && deadline < brDateStr) continue;

      const originIata = cols[0];
      const destinationIata = cols[1];
      const originName = mapa[originIata] ? mapa[originIata][0] : originIata;
      const destinationName = mapa[destinationIata] ? mapa[destinationIata][1] : destinationIata;

      if (!mapa[originIata] || !mapa[destinationIata]) mapErrors++;

      const departureDate = convertDate(cols[2]);
      const returnDate = convertDate(cols[3]);
      const price = parseFloat(cols[6]);
      const airline = cols[15];

      // Deterministic hash: origem + destino + data partida + data retorno + companhia + tarifa
      const idSource = `${originIata}|${destinationIata}|${departureDate}|${returnDate}|${airline}|${price}`;
      
      parsedOffers.push({
        source: "viajandocomdesconto",
        source_id: await generateId(idSource),
        offer_type: "bloqueio_aereo",
        origin_iata: originIata,
        origin_city: originName,
        destination_iata: destinationIata,
        destination_name: destinationName,
        departure_date: departureDate,
        return_date: returnDate,
        price_per_person: price,
        currency: cols[7] === "0" ? "BRL" : "USD",
        airline: airline,
        boarding_tax: parseFloat(cols[13]) || 0,
        nights: parseInt(cols[4]) || 0,
        available_seats: parseInt(cols[5]) || 0,
        issue_deadline: deadline,
        outbound_departure_time: convertTime(cols[9]),
        outbound_arrival_time: convertTime(cols[10]),
        return_departure_time: convertTime(cols[11]),
        return_arrival_time: convertTime(cols[12]),
        last_seen_at: executionTimestamp,
        active: true
      });
    }

    if (Array.isArray(snapshot)) {
      for (const item of snapshot) {
        let depDate: string | null = null;
        let retDate: string | null = null;
        
        // Parse date "01/10/2026 a 07/10/2026"
        if (item.data && typeof item.data === 'string') {
          const parts = item.data.split(/\s+a\s+/);
          if (parts.length === 2) {
            const [d1, m1, y1] = parts[0].split('/');
            const [d2, m2, y2] = parts[1].split('/');
            if (d1 && m1 && y1) depDate = `${y1}-${m1}-${d1}`;
            if (d2 && m2 && y2) retDate = `${y2}-${m2}-${d2}`;
          }
        }

        const price = parseFloat(String(item.por).replace(/[^0-9.]/g, ""));
        const name = item.nome || "";
        const originIata = item.origem_iata || "";
        const destination = item.destino || "";

        // Package source_id: nome do pacote + origem_iata + destino + data de ida + data de volta + preço
        const idSource = `pkg|${name}|${originIata}|${destination}|${depDate}|${retDate}|${price}`;

        parsedOffers.push({
          source: "viajandocomdesconto",
          source_id: await generateId(idSource),
          offer_type: "pacote",
          destination_name: destination,
          origin_iata: originIata,
          origin_city: item.origem_cidade,
          departure_date: depDate,
          return_date: retDate,
          price_per_person: price,
          currency: "BRL",
          boarding_tax: parseFloat(item.taxa) || 0,
          last_seen_at: executionTimestamp,
          active: true,
          alternative_dates: item.outras || null,
          raw_data: { 
            title: name,
            uf: item.uf,
            min_label: item.min_label
          }
        });
      }
    }

    if (parsedOffers.length === 0) {
      throw new Error("Nenhuma oferta processada (lista vazia). Abortando para segurança.");
    }

    // Deduplicate in memory
    const uniqueOffers = new Map();
    for (const offer of parsedOffers) {
      uniqueOffers.set(`${offer.source_id}-${offer.offer_type}`, offer);
    }
    const finalOffers = Array.from(uniqueOffers.values());

    let created = 0;
    let updated = 0;

    const CHUNK_SIZE = 200;
    for (let i = 0; i < finalOffers.length; i += CHUNK_SIZE) {
      const chunk = finalOffers.slice(i, i + CHUNK_SIZE);
      
      // We need to know which are new and which are updates for the log
      const { data: existing } = await supabaseClient
        .from("travel_offers")
        .select("source_id, offer_type")
        .in("source_id", chunk.map(c => c.source_id))
        .eq("source", "viajandocomdesconto");

      const existingKeys = new Set((existing || []).map(e => `${e.source_id}-${e.offer_type}`));
      
      chunk.forEach(c => {
        if (existingKeys.has(`${c.source_id}-${c.offer_type}`)) updated++;
        else created++;
      });

      const { error } = await supabaseClient
        .from("travel_offers")
        .upsert(chunk, { onConflict: "source,source_id,offer_type" });
      if (error) throw error;
    }

    const { data: deactivatedData } = await supabaseClient
      .from("travel_offers")
      .update({ active: false })
      .lt("last_seen_at", executionTimestamp)
      .eq("source", "viajandocomdesconto")
      .select("id");

    const deactivatedCount = deactivatedData?.length || 0;

    await supabaseClient.from("travel_sync_logs").insert({
      source: "viajandocomdesconto",
      status: "success",
      offers_found: finalOffers.length,
      offers_created: created,
      offers_updated: updated,
      offers_deactivated: deactivatedCount,
      map_errors: mapErrors,
      started_at: startTime,
      finished_at: new Date().toISOString()
    });

    return new Response(JSON.stringify({
      status: "success",
      total_offers: finalOffers.length,
      created,
      updated,
      deactivated: deactivatedCount,
      map_errors: mapErrors
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err: any) {
    console.error("Sync error:", err);
    await createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    ).from("travel_sync_logs").insert({
      source: "viajandocomdesconto",
      status: "error",
      error_message: err.message,
      started_at: startTime,
      finished_at: new Date().toISOString()
    });

    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});