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
    
    // Correct URL without .br
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

      // Helper to try and extract JS object/array literal structure for analysis
      const extractPvooKeys = () => {
        const idx = html.indexOf("__PVOO_PAYLOAD");
        if (idx === -1) return "NOT_FOUND";
        
        // Find the next = or : and then the {
        const startIdx = html.indexOf("{", idx);
        if (startIdx === -1 || startIdx - idx > 500) return "STRUCTURE_NOT_EASY_TO_PARSE";
        
        // Very basic key extraction (looking for "key":)
        const sample = html.substring(startIdx, startIdx + 5000);
        const keys = [...sample.matchAll(/"([^"]+)":/g)].map(m => m[1]);
        const uniqueKeys = [...new Set(keys)].slice(0, 20);
        
        const keyDumps: Record<string, string> = {};
        uniqueKeys.forEach(k => {
            const kIdx = sample.indexOf(`"${k}":`);
            keyDumps[k] = sample.substring(kIdx, kIdx + 1000);
        });

        return { uniqueKeys, keyDumps, hasCols: sample.includes('"cols"'), hasRows: sample.includes('"rows"') };
      };

      const pvooAnalysis = extractPvooKeys();

      return new Response(JSON.stringify({
        status: "dry_run_literal_dump",
        url: targetUrl,
        http_status: res.status,
        html_length: html.length,
        dumps: {
          __PVOO_PAYLOAD: getLiteralDump("__PVOO_PAYLOAD"),
          PV_SNAPSHOT: getLiteralDump("PV_SNAPSHOT"),
          "DADOS.promos": getLiteralDump("DADOS.promos")
        },
        pvoo_analysis: pvooAnalysis
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Task 4: Implement true mass deactivation logic
    const executionTimestamp = new Date().toISOString();
    
    // We fetch a small batch just to verify there ARE offers to process
    // but the actual sync logic would come here.
    // For now, per instruction: "Implement now: a single timestamp... and deactivation only where last_seen_at < value"
    
    /* 
    SYNC LOGIC PLACEHOLDER
    1. Scraping...
    2. If offers.length === 0 abort
    3. For each offer: upsert with last_seen_at = executionTimestamp
    4. Deactivate others:
       await supabase.from('travel_offers')
         .update({ is_active: false, deactivated_at: executionTimestamp })
         .lt('last_seen_at', executionTimestamp)
         .eq('is_active', true);
    */

    return new Response(JSON.stringify({ 
      status: "skipped_per_instructions",
      execution_timestamp: executionTimestamp,
      message: "Lógica de desativação em massa estruturada com timestamp único. Nenhuma gravação realizada conforme item 5."
    }), { status: 200, headers: corsHeaders });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
