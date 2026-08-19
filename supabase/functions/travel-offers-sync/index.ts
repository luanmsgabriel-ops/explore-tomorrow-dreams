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
      const getLiteralDump = (s: string, length = 10000) => {
        const idx = html.indexOf(s);
        if (idx === -1) return "NOT_FOUND";
        return html.substring(idx, idx + length);
      };

      const dumpPayloadFull = getLiteralDump("__PVOO_PAYLOAD", 20000); // Pegar mais para achar o mapa
      
      // Tentar extrair PAYLOAD.mapa completo
      let mapaJson = "not_extracted";
      const mapaMatch = dumpPayloadFull.match(/PAYLOAD\.mapa\s*=\s*({[\s\S]+?});/);
      if (mapaMatch) mapaJson = mapaMatch[1];

      // Tentar extrair o blob (pelo menos as primeiras linhas)
      let blobSnippet = "not_extracted";
      const blobMatch = dumpPayloadFull.match(/blob\s*:\s*[`"']([\s\S]+?)[`"']/);
      if (blobMatch) blobSnippet = blobMatch[1].substring(0, 2000);

      const dataRefMatch = html.match(/var\s+DATA_REF\s*=\s*['"]([^'"]+)['"]/);
      const dataRef = dataRefMatch ? dataRefMatch[1] : "not_found";

      return new Response(JSON.stringify({
        status: "dry_run_detailed_discovery",
        data_reference: dataRef,
        mapa_bruto: mapaJson,
        blob_amostra: blobSnippet,
        // Dumps originais para segurança
        dumps: {
          __PVOO_PAYLOAD: dumpPayloadFull.substring(0, 5000),
          PV_SNAPSHOT: getLiteralDump("PV_SNAPSHOT", 5000)
        }
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const executionTimestamp = new Date().toISOString();
    const hasData = html.includes("PV_SNAPSHOT") || html.includes("__PVOO_PAYLOAD");
    
    if (!hasData) {
      return new Response(JSON.stringify({ 
        status: "aborted", 
        message: "Nenhum dado encontrado no HTML. Abortando para evitar desativação em massa." 
      }), { status: 200, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ 
      status: "dry_run_active",
      execution_timestamp: executionTimestamp,
      message: "Pronto para o parser. Aguardando validação do dump."
    }), { status: 200, headers: corsHeaders });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
