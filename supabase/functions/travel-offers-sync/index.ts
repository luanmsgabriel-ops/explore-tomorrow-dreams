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
    
    // Devolver trechos do HTML para inspeção usando Regex para encontrar os objetos
    const payloadMatch = html.match(/PAYLOAD\s*=\s*{[\s\S]*?}/i);
    const pvooMatch = html.match(/__PVOO_PAYLOAD\s*=\s*{[\s\S]*?}/i);
    const snapshotMatch = html.match(/PV_SNAPSHOT\s*=\s*\[[\s\S]*?\]/i);

    return new Response(JSON.stringify({
      html_length: html.length,
      payload_found: !!payloadMatch,
      pvoo_found: !!pvooMatch,
      snapshot_found: !!snapshotMatch,
      payload_snippet: payloadMatch ? payloadMatch[0].substring(0, 1000) : "not_found",
      pvoo_snippet: pvooMatch ? pvooMatch[0].substring(0, 1000) : "not_found",
      snapshot_snippet: snapshotMatch ? snapshotMatch[0].substring(0, 1000) : "not_found",
      html_start: html.substring(0, 2000)
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});