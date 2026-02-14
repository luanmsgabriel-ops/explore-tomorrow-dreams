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

    // If only verification_code, forward directly
    if (verification_code && !origem) {
      const payload = { verification_code };
      console.log("[fetch-quotation] Enviando código de verificação:", JSON.stringify(payload));

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000);

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
        throw fetchError;
      }

      clearTimeout(timeoutId);
      const responseText = await response.text();
      console.log("[fetch-quotation] Verification status:", response.status);
      console.log("[fetch-quotation] Verification body:", responseText.substring(0, 3000));

      let responseData;
      try { responseData = JSON.parse(responseText); } catch { responseData = { raw: responseText }; }

      return new Response(JSON.stringify(responseData), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    if (verification_code) {
      payload.verification_code = verification_code;
    }

    console.log("[fetch-quotation] Enviando para API externa:", JSON.stringify(payload));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 min timeout

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
      const isAbort = (fetchError instanceof DOMException && fetchError.name === "AbortError") ||
        (fetchError instanceof Error && fetchError.message?.includes("abort"));
      if (isAbort) {
        console.error("[fetch-quotation] Timeout após 300s");
        return new Response(
          JSON.stringify({ error: "A cotação está demorando mais que o esperado. Tente novamente em alguns minutos." }),
          { status: 504, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.error("[fetch-quotation] Erro no fetch:", fetchError);
      return new Response(
        JSON.stringify({ error: "Não foi possível conectar ao servidor de cotações." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    clearTimeout(timeoutId);

    const responseText = await response.text();
    console.log("[fetch-quotation] Status da API:", response.status);
    console.log("[fetch-quotation] Resposta (primeiros 3000 chars):", responseText.substring(0, 3000));

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      console.error("[fetch-quotation] Resposta não é JSON válido:", responseText.substring(0, 2000));
      return new Response(
        JSON.stringify({
          error: "O servidor retornou uma resposta inválida.",
          raw_response: responseText.substring(0, 500),
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify(responseData),
      {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[fetch-quotation] Erro geral:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro ao buscar cotação" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
