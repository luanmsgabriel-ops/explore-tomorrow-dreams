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
    
    // Attempt to return raw text to see if markers are there but JSON.parse fails
    const payloadIndex = html.indexOf("__PVOO_PAYLOAD =");
    const snapshotIndex = html.indexOf("PV_SNAPSHOT =");
    
    return new Response(JSON.stringify({
      html_length: html.length,
      payloadIndex,
      snapshotIndex,
      html_sample: html.substring(Math.max(0, payloadIndex), payloadIndex + 500)
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});