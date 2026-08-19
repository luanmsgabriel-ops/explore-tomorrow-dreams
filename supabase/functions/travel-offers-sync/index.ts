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

    // Attempting various likely URLs for the engine/data
    const urlsToTry = [
        "https://viajandocomdesconto.com.br/",
        "https://www.viajandocomdesconto.com.br/bloqueios",
        "https://www.viajandocomdesconto.com.br/pacotes"
    ];

    let results = [];

    for (const url of urlsToTry) {
        try {
            const res = await fetch(url, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                },
                signal: AbortSignal.timeout(10000)
            });
            const text = await res.text();
            results.push({
                url,
                status: res.status,
                length: text.length,
                has_pvoo: text.includes("__PVOO_PAYLOAD"),
                has_pacotes: text.includes("PACOTES"),
                sample: text.substring(0, 500)
            });
        } catch (e) {
            results.push({ url, error: e.message });
        }
    }

    if (dryRun) {
      return new Response(JSON.stringify({
        status: "dry_run_multi_discovery",
        results
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // For non-dry-run, just use the main discovery logic (simplified for now to avoid crashes)
    return new Response(JSON.stringify({ status: "not_implemented_for_real_run" }), { status: 501, headers: corsHeaders });

  } catch (err) {
    console.error("Sync error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});