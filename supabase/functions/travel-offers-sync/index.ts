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
      // Pedaços aleatórios do HTML para encontrar a declaração do PAYLOAD
      const parts = [];
      const step = 50000;
      for (let i = 0; i < html.length; i += step) {
        const chunk = html.substring(i, i + 10000);
        if (chunk.includes("PAYLOAD") || chunk.includes("mapa") || chunk.includes("blob")) {
          parts.push({ offset: i, content: chunk });
        }
      }

      const dataRefMatch = html.match(/var\s+DATA_REF\s*=\s*['"]([^'"]+)['"]/);

      return new Response(JSON.stringify({
        status: "dry_run_html_scanning",
        html_length: html.length,
        data_reference: dataRefMatch ? dataRefMatch[1] : "not_found",
        found_parts: parts
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
