import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const EXTERNAL_API_URL = "http://212.85.21.28:5000/cotar_viagem";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { origem, destino, data_ida, data_volta, passageiros, operadora, verification_code } = body;

    // Validate required fields
    if (!origem || !destino || !data_ida || !data_volta || !passageiros) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios: origem, destino, data_ida, data_volta, passageiros" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload: Record<string, any> = {
      origem,
      destino,
      data_ida,
      data_volta,
      passageiros: {
        adultos: passageiros.adultos || 1,
        criancas: passageiros.criancas || 0,
        idades_criancas: passageiros.idades_criancas || [],
      },
      operadora: operadora || "all",
    };

    // If a verification code is provided, include it
    if (verification_code) {
      payload.verification_code = verification_code;
    }

    console.log("Sending quotation request:", JSON.stringify(payload));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 150000); // 2.5 min timeout

    let response: Response;
    try {
      response = await fetch(EXTERNAL_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof DOMException && fetchError.name === "AbortError") {
        console.error("Request to external API timed out after 150s");
        return new Response(
          JSON.stringify({ error: "A cotação está demorando mais que o esperado. Tente novamente em alguns minutos." }),
          { status: 504, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw fetchError;
    }

    clearTimeout(timeoutId);

    const responseText = await response.text();
    console.log("External API response status:", response.status);

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw: responseText };
    }

    return new Response(
      JSON.stringify(responseData),
      {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in cotar-viagem:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro ao buscar cotação" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
