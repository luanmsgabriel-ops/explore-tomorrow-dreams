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
      const getLiteralDump = (s: string, length = 60000) => {
        const idx = html.indexOf(s);
        if (idx === -1) return "NOT_FOUND";
        return html.substring(idx, idx + length);
      };

      // Tentar localizar a definição exata do objeto PAYLOAD
      let payloadBlock = "not_found";
      const payloadStartIdx = html.indexOf("const PAYLOAD = {");
      if (payloadStartIdx !== -1) {
        // Capturar um bloco grande para garantir que pegamos o mapa e o blob
        payloadBlock = html.substring(payloadStartIdx, payloadStartIdx + 120000);
      }

      // Tentar extrair chaves específicas para facilitar a leitura no log
      const mapaMatch = payloadBlock.match(/mapa\s*:\s*({[\s\S]*?}),\s*usd/i);
      const blobMatch = payloadBlock.match(/blob\s*:\s*[`"']([\s\S]*?)[`"']/i);
      const usdMatch = payloadBlock.match(/usd\s*:\s*([\d.]+)/i);

      const dataRefMatch = html.match(/var\s+DATA_REF\s*=\s*['"]([^'"]+)['"]/);
      
      const snapshotLiteral = getLiteralDump("PV_SNAPSHOT", 20000);
      const backupCount = (snapshotLiteral.match(/['"]fonte['"]\s*:\s*['"]backup['"]/g) || []).length;
      const others = [...snapshotLiteral.matchAll(/['"]fonte['"]\s*:\s*['"](?!backup)([^'"]+)['"]/g)].map(m => m[1]);

      return new Response(JSON.stringify({
        status: "dry_run_full_payload_extraction",
        data_reference: dataRefMatch ? dataRefMatch[1] : "not_found",
        usd_value: usdMatch ? usdMatch[1] : "not_found",
        snapshot_stats: {
          backup: backupCount,
          others_count: others.length,
          other_values_unique: [...new Set(others)]
        },
        // Enviar pedaços do bloco para não estourar limite de log mas ver o conteúdo
        payload_mapa_start: mapaMatch ? mapaMatch[1].substring(0, 5000) : "mapa_not_captured",
        payload_blob_start: blobMatch ? blobMatch[1].substring(0, 5000) : "blob_not_captured",
        payload_blob_total_length: blobMatch ? blobMatch[1].length : 0,
        full_payload_header: payloadBlock.substring(0, 2000)
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
