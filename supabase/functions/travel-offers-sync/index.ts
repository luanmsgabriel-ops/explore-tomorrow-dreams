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

  try {
    const body = await req.json().catch(() => ({}));
    const dryRun = body.dry_run === true;
    
    // Attempting a common subdirectory for this CMS
    const targetUrl = "https://www.viajandocomdesconto.com.br/hotsite/pacotes";
    const res = await fetch(targetUrl, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        signal: AbortSignal.timeout(20000)
    });
    const html = await res.text();
    
    if (dryRun) {
      const allDataMatches = html.match(/tsx_[a-zA-Z0-9_]+\.data = \[[\s\S]*?\];/g) || [];
      return new Response(JSON.stringify({
        status: "dry_run_hotsite_pacotes_discovery",
        url: targetUrl,
        http_status: res.status,
        total_data_blocks: allDataMatches.length,
        largest_data_block_sample: allDataMatches.sort((a,b) => b.length - a.length)[0]?.substring(0, 5000) || "none"
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ status: "skipped" }), { status: 200, headers: corsHeaders });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});