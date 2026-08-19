import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const logId = crypto.randomUUID();
  
  try {
    const body = await req.json().catch(() => ({}));
    const dryRun = body.dry_run === true;
    console.log(`Starting travel offers sync (dry_run: ${dryRun})...`);
    
    if (!dryRun) {
      await supabase.from("travel_sync_logs").insert({
        id: logId,
        status: "running",
        started_at: new Date().toISOString(),
      });
    }

    const targetUrl = "https://www.viajandocomdesconto.com.br/";
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const html = await response.text();
    
    if (dryRun) {
      // 1. Extract __PVOO_PAYLOAD
      const pvooMatch = html.match(/var\s+__PVOO_PAYLOAD\s*=\s*({.*?});/s) || html.match(/__PVOO_PAYLOAD\s*=\s*({.*?});/s);
      
      // 2. Extract PACOTES
      const pacotesMatch = html.match(/var\s+PACOTES\s*=\s*(\[.*?\]);/s) || html.match(/PACOTES\s*=\s*(\[.*?\]);/s);
      const pacotes = pacotesMatch ? JSON.parse(pacotesMatch[1]) : null;

      let pvooInfo = { 
        error: "__PVOO_PAYLOAD not found", 
        html_preview: html.substring(0, 2000),
        includes_pvoo_string: html.includes("__PVOO_PAYLOAD") 
      };

      if (pvooMatch) {
        const pvooData = JSON.parse(pvooMatch[1]);
        pvooInfo = {
          cols: pvooData.cols || "No 'cols' found",
          rows_sample: (pvooData.rows || []).slice(0, 3),
          total_rows: (pvooData.rows || []).length,
          html_preview: "Payload found, hiding raw HTML"
        };
      }

      let pacotesInfo = { error: "PACOTES not found" };
      if (pacotes && pacotes.length > 0) {
        pacotesInfo = {
          first_entry: pacotes[0],
          keys: Object.keys(pacotes[0]),
          total: pacotes.length
        };
      }

      return new Response(JSON.stringify({
        status: "dry_run_discovery",
        url_used: targetUrl,
        pvoo: pvooInfo,
        pacotes: pacotesInfo
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Save sample HTML
    if (!dryRun) {
      const fileName = `sync-samples/${new Date().toISOString().split('T')[0]}_viajando.html`;
      await supabase.storage.from("admin-assets").upload(fileName, html, { contentType: "text/html", upsert: true });
    }

    // 1. Extract __PVOO_PAYLOAD
    const pvooMatch = html.match(/var\s+__PVOO_PAYLOAD\s*=\s*({.*?});/s) || html.match(/__PVOO_PAYLOAD\s*=\s*({.*?});/s);
    
    // 2. Extract PACOTES
    const pacotesMatch = html.match(/var\s+PACOTES\s*=\s*(\[.*?\]);/s) || html.match(/PACOTES\s*=\s*(\[.*?\]);/s);
    const pacotes = pacotesMatch ? JSON.parse(pacotesMatch[1]) : null;

    if (!pvooMatch) {
      await supabase.from("travel_sync_logs").update({
        status: "structure_changed",
        error_message: "__PVOO_PAYLOAD not found in HTML",
        finished_at: new Date().toISOString()
      }).eq("id", logId);
      return new Response(JSON.stringify({ error: "Structure changed" }), { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const pvooData = JSON.parse(pvooMatch[1]);
    const { rows } = pvooData;
    
    const executionTimestamp = new Date().toISOString();

    const offers = (rows || []).map((row: any[]) => {
      const priceStr = String(row[10] || "0");
      const price = parseFloat(priceStr.replace(/\./g, '').replace(',', '.'));
      const taxStr = String(row[11] || "0");
      const tax = parseFloat(taxStr.replace(/\./g, '').replace(',', '.'));

      const parseDate = (d: string) => {
        if (!d) return null;
        const parts = d.split('/');
        if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
        return null;
      };

      return {
        source: "viajandocomdesconto",
        source_id: String(row[0]),
        offer_type: "bloqueio_aereo",
        origin_city: row[2],
        origin_iata: row[3],
        destination_name: row[4],
        destination_iata: row[5],
        departure_date: parseDate(row[6]),
        return_date: parseDate(row[7]),
        nights: parseInt(row[8]) || 0,
        airline: row[1],
        outbound_departure_time: row[13],
        outbound_arrival_time: row[14],
        return_departure_time: row[15],
        return_arrival_time: row[16],
        available_seats: parseInt(row[9]) || 0,
        price_per_person: price,
        boarding_tax: tax,
        active: true,
        last_seen_at: executionTimestamp,
        raw_data: row
      };
    }).filter((o: any) => o.departure_date && o.price_per_person > 0);

    // Safety Check: Low Yield
    const { data: lastLog } = await supabase
      .from("travel_sync_logs")
      .select("offers_found")
      .eq("status", "success")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastLog && offers.length < (lastLog.offers_found * 0.5)) {
      await supabase.from("travel_sync_logs").update({
        status: "aborted_low_yield",
        offers_found: offers.length,
        error_message: `Yield too low: found ${offers.length}, expected at least ${Math.floor(lastLog.offers_found * 0.5)}`,
        finished_at: new Date().toISOString()
      }).eq("id", logId);
      return new Response(JSON.stringify({ error: "Low yield" }), { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (offers.length === 0) {
      await supabase.from("travel_sync_logs").update({
        status: "success",
        offers_found: 0,
        error_message: "No offers found in source",
        finished_at: new Date().toISOString()
      }).eq("id", logId);
      return new Response(JSON.stringify({ status: "success", found: 0 }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Upsert offers
    let created = 0;
    let updated = 0;

    for (const offer of offers) {
      const { data: existing } = await supabase
        .from("travel_offers")
        .select("id")
        .eq("source", offer.source)
        .eq("source_id", offer.source_id)
        .eq("offer_type", offer.offer_type)
        .maybeSingle();

      const { error: upsertError } = await supabase
        .from("travel_offers")
        .upsert(offer, { onConflict: 'source,source_id,offer_type' });

      if (!upsertError) {
        if (existing) updated++;
        else created++;
      }
    }

    // Deactivate missing offers using the execution timestamp
    const { error: deactivateError } = await supabase
      .from("travel_offers")
      .update({ active: false })
      .eq("source", "viajandocomdesconto")
      .neq("last_seen_at", executionTimestamp);

    await supabase.from("travel_sync_logs").update({
      status: "success",
      offers_found: offers.length,
      offers_created: created,
      offers_updated: updated,
      offers_deactivated: deactivateError ? 0 : "check travel_offers",
      finished_at: new Date().toISOString()
    }).eq("id", logId);

    return new Response(JSON.stringify({ 
      status: "success", 
      found: offers.length,
      created,
      updated
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Sync error:", err);
    try {
        const body = await req.json().catch(() => ({}));
        if (body.dry_run !== true) {
            await supabase.from("travel_sync_logs").update({
                status: "error",
                error_message: err.message,
                finished_at: new Date().toISOString()
            }).eq("id", logId);
        }
    } catch (e) {}

    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});