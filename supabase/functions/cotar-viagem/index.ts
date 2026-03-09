import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://wimdgvdpefkmjzzsklnt.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { origem, destino, data_ida, data_volta, passageiros } = body;

    if (!origem || !destino || !data_ida || !data_volta || !passageiros) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios: origem, destino, data_ida, data_volta, passageiros" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[cotar-viagem] Buscando cotação via API Infotravel: ${origem} → ${destino}`);

    // Call cativa-quotation Edge Function directly
    const cativaUrl = `${SUPABASE_URL}/functions/v1/cativa-quotation`;
    const response = await fetch(cativaUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        origem,
        destino,
        data_ida,
        data_volta,
        adultos: passageiros.adultos || 1,
        criancas: passageiros.criancas || 0,
        idades_criancas: passageiros.idades_criancas || [],
      }),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error("[cotar-viagem] Erro da API Infotravel:", responseData);
      throw new Error(responseData.error || "Erro ao buscar cotação");
    }

    console.log(`[cotar-viagem] Sucesso! ${responseData.total_opcoes || 0} opções encontradas`);

    return new Response(
      JSON.stringify(responseData),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("[cotar-viagem] Erro:", error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message || "Erro ao buscar cotação" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
