import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Test data: São Paulo to Maceió, ~30 days from now (2026-09-18)
    const testPayload = {
      origem: "São Paulo",
      destino: "Maceió",
      data_ida: "2026-09-18",
      data_volta: "2026-09-25",
      passageiros: {
        adultos: 2,
        criancas: 0,
        idades_criancas: []
      }
    };

    console.log("Running internal test with payload:", testPayload);

    const response = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/cotar-viagem`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`
      },
      body: JSON.stringify(testPayload)
    });

    const result = await response.json();
    return new Response(JSON.stringify({ 
      test_payload: testPayload,
      result 
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});
