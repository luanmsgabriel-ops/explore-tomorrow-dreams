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

  const body = await req.json().catch(() => ({}));
  const dryRun = body.dry_run === true;

  try {
    const targetUrl = "https://viajandocomdesconto.com/";
    const res = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(30000)
    });
    const html = await res.text();
    
    // Devolver trechos do HTML para inspeção
    const snippets: Record<string, string> = {};
    const keys = ["PAYLOAD", "__PVOO_PAYLOAD", "PV_SNAPSHOT", "DADOS.promos"];
    
    keys.forEach(key => {
        const idx = html.indexOf(key);
        if (idx !== -1) {
            snippets[key] = html.substring(idx, idx + 500);
        } else {
            snippets[key] = "NOT FOUND";
        }
    });

    return new Response(JSON.stringify({
      status: "inspecting",
      html_length: html.length,
      snippets
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});