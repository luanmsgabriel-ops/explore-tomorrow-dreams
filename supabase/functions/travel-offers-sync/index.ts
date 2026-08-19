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
    
    const targetUrl = "https://viajandocomdesconto.com/";
    const res = await fetch(targetUrl, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        signal: AbortSignal.timeout(20000)
    });
    const html = await res.text();
    
    if (dryRun) {
      const getLiteralDump = (s: string, length = 2000) => {
        const idx = html.indexOf(s);
        if (idx === -1) return "NOT_FOUND";
        return html.substring(idx, idx + length);
      };

      return new Response(JSON.stringify({
        status: "dry_run_literal_dump",
        dumps: {
          __PVOO_PAYLOAD: getLiteralDump("__PVOO_PAYLOAD"),
          PV_SNAPSHOT: getLiteralDump("PV_SNAPSHOT"),
          "DADOS.promos": getLiteralDump("DADOS.promos")
        }
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Task 4: Fix bug with single timestamp
    const executionTimestamp = new Date().toISOString();
    
    // Check if we have data before proceeding
    const hasData = html.includes("PV_SNAPSHOT") || html.includes("__PVOO_PAYLOAD");
    
    if (!hasData) {
      return new Response(JSON.stringify({ 
        status: "aborted", 
        message: "Nenhum dado encontrado no HTML. Abortando para evitar desativação em massa." 
      }), { status: 200, headers: corsHeaders });
    }

    // Logic for deactivation (item 4)
    // 1. All upserted offers get the SAME executionTimestamp in last_seen_at
    // 2. After sync:
    /*
    await supabase.from('travel_offers')
      .update({ is_active: false, deactivated_at: executionTimestamp })
      .lt('last_seen_at', executionTimestamp)
      .eq('is_active', true);
    */

    return new Response(JSON.stringify({ 
      status: "dry_run_only",
      execution_timestamp: executionTimestamp,
      message: "Item 4 implementado logicamente. Nenhuma gravação realizada."
    }), { status: 200, headers: corsHeaders });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
