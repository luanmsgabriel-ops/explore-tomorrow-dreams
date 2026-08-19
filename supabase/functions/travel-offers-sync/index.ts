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
    
    // We'll search the root URL which reported has_pacotes: true
    const targetUrl = "https://viajandocomdesconto.com.br/";
    const res = await fetch(targetUrl, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        signal: AbortSignal.timeout(20000)
    });
    const html = await res.text();
    
    if (dryRun) {
      // Return targeted info from the root
      const tsxMatches = html.match(/tsx_[a-zA-Z0-9_]+\.attribute = \{[^}]+\}/g) || [];
      const dataMatches = html.match(/tsx_[a-zA-Z0-9_]+\.data = \[[\s\S]*?\];/g) || [];
      
      return new Response(JSON.stringify({
        status: "dry_run_root_discovery",
        url: targetUrl,
        tsx_matches: tsxMatches.slice(0, 50),
        data_matches_count: dataMatches.length,
        data_sample: dataMatches.length > 0 ? dataMatches[0].substring(0, 2000) : "no data matches found",
        html_contains_rows: html.includes("rows"),
        html_contains_cols: html.includes("cols"),
        html_contains_pvoo: html.includes("__PVOO_PAYLOAD")
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