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
    
    // Verificando se o objeto PAYLOAD está presente em algum lugar, independentemente de ser var/const
    const regex1 = /PAYLOAD\s*=\s*{[\s\S]*?}/i;
    const regex2 = /__PVOO_PAYLOAD\s*=\s*{[\s\S]*?}/i;
    
    const match1 = html.match(regex1);
    const match2 = html.match(regex2);

    return new Response(JSON.stringify({
      html_length: html.length,
      payload_found: !!match1,
      pvoo_found: !!match2,
      payload_sample: match1 ? match1[0].substring(0, 1000) : "not_found",
      pvoo_sample: match2 ? match2[0].substring(0, 1000) : "not_found",
      // Pegar 5 blocos de 10k do HTML em intervalos
      part1: html.substring(0, 10000),
      part2: html.substring(100000, 110000),
      part3: html.substring(500000, 510000),
      part4: html.substring(1000000, 1010000),
      part5: html.substring(html.length - 10000)
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});