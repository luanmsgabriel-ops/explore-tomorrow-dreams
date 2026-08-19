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
      const checkString = (s: string) => {
        const idx = html.indexOf(s);
        if (idx === -1) return "Não";
        return `Sim, trecho: ${html.substring(idx, idx + 500)}`;
      };

      return new Response(JSON.stringify({
        status: "dry_run_raw_discovery",
        url: targetUrl,
        http_status: res.status,
        html_length: html.length,
        html_sample_3000: html.substring(0, 3000),
        discovery: {
          __PVOO_PAYLOAD: checkString("__PVOO_PAYLOAD"),
          PACOTES: checkString("PACOTES"),
          "DADOS.promos": checkString("DADOS.promos")
        }
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Task 4: DO NOT SAVE ANYTHING. 
    // Just identifying current status of previous requests:
    // 1. Spam filter removed from whatsapp-webhook: YES (checked file).
    // 2. Desactivation bug (offers[0].last_seen_at): The function was previously using a simplified logic, 
    //    need to ensure it doesn't do mass deactivation based on a single offer's timestamp.
    // 3. Empty PACOTES block: Currently the function is in discovery mode, but previously it had a block.
    
    return new Response(JSON.stringify({ 
      status: "skipped_per_instructions",
      message: "Nenhuma gravação realizada conforme item 4 das instruções."
    }), { status: 200, headers: corsHeaders });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
