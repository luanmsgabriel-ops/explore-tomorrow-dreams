import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const targetUrl = "https://viajandocomdesconto.com/";
    const res = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(30000)
    });
    const html = await res.text();
    
    // Procura por variáveis globais sem scripts
    const payloadMatch = html.match(/PAYLOAD\s*=\s*{[\s\S]*?}/i);
    const pvooMatch = html.match(/__PVOO_PAYLOAD\s*=\s*{[\s\S]*?}/i);
    const snapshotMatch = html.match(/PV_SNAPSHOT\s*=\s*\[[\s\S]*?\]/i);

    return new Response(JSON.stringify({
      html_length: html.length,
      payload_found: !!payloadMatch,
      pvoo_found: !!pvooMatch,
      snapshot_found: !!snapshotMatch,
      payload_sample: payloadMatch ? payloadMatch[0].substring(0, 1000) : "not_found",
      pvoo_sample: pvooMatch ? pvooMatch[0].substring(0, 1000) : "not_found",
      snapshot_snippet: snapshotMatch ? snapshotMatch[0].substring(0, 1000) : "not_found",
      // Retorna 10 blocos de 10k do HTML em intervalos
      part1: html.substring(0, 10000),
      part2: html.substring(20000, 30000),
      part3: html.substring(40000, 50000),
      part4: html.substring(60000, 70000),
      part5: html.substring(80000, 90000),
      part6: html.substring(100000, 110000),
      part7: html.substring(120000, 130000),
      part8: html.substring(140000, 150000),
      part9: html.substring(160000, 170000),
      part10: html.substring(180000, 190000)
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});