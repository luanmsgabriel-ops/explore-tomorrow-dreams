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
    
    const targetUrl = "https://www.viajandocomdesconto.com.br/pacotes";
    const res = await fetch(targetUrl, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        signal: AbortSignal.timeout(20000)
    });
    const html = await res.text();

    // Look for data inside the HTML body script tags
    // The previous dump showed tsx_app_main_1 and other TSXObject instances
    // We need to find where the actual list of offers is defined.
    
    if (dryRun) {
      // Return a targeted slice of the HTML to find the data structure
      // We'll search for 'tsx_' which seems to be the object prefix
      const tsxMatches = html.match(/tsx_[a-zA-Z0-9_]+\.attribute = \{[^}]+\}/g) || [];
      
      return new Response(JSON.stringify({
        status: "dry_run_discovery",
        url: targetUrl,
        tsx_matches: tsxMatches.slice(0, 50),
        html_contains_bloqueios: html.toLowerCase().includes("bloqueio"),
        html_contains_pacotes: html.toLowerCase().includes("pacote"),
        html_head: html.substring(0, 2000)
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