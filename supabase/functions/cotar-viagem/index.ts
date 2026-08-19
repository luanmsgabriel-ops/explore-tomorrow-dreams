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

    const body = await req.json();
    const { origem, destino, data_ida, data_volta, passageiros } = body;
    const totalPassageiros = (passageiros?.adultos || 0) + (passageiros?.criancas || 0);

    const nowUtc = new Date();
    const brDateStr = new Intl.DateTimeFormat('fr-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(nowUtc);

    const destFuzzy = destino.trim(); // No normalization here for query
    const originFuzzy = origem.trim();

    const targetDep = new Date(data_ida + "T12:00:00");
    const dMin = new Date(targetDep);
    dMin.setDate(dMin.getDate() - 7);
    const dMax = new Date(targetDep);
    dMax.setDate(dMax.getDate() + 7);

    // 1. Resolve IATA
    const resolveIATA = async (input: string) => {
      const clean = input.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
      const { data } = await supabaseClient.from("travel_iata_map").select("code").eq("code", clean).single();
      if (data) return [data.code];
      const iataMatch = clean.match(/\(([A-Z]{3})\)/);
      if (iataMatch) return [iataMatch[1]];
      return [];
    };

    const originCodes = await resolveIATA(origem);
    const destCodes = await resolveIATA(destino);

    let query = supabaseClient
      .from("travel_offers")
      .select("*")
      .eq("active", true)
      .gt("price_per_person", 0)
      .or(`issue_deadline.gte.${brDateStr},issue_deadline.is.null`)
      .or(`available_seats.gte.${totalPassageiros},available_seats.is.null`)
      .gte("departure_date", dMin.toISOString().split("T")[0])
      .lte("departure_date", dMax.toISOString().split("T")[0]);

    // Destination filters
    if (destCodes.length > 0) {
      query = query.or(`destination_iata.in.(${destCodes.join(",")}),destination_name.ilike.%${destFuzzy}%`);
    } else {
      query = query.ilike("destination_name", `%${destFuzzy}%`);
    }
    
    // Origin filters
    if (originCodes.length > 0) {
      query = query.or(`origin_iata.in.(${originCodes.join(",")}),origin_city.ilike.%${originFuzzy}%`);
    } else {
      query = query.ilike("origin_city", `%${originFuzzy}%`);
    }

    console.log(`Searching for ${origem} -> ${destino}`);
    const { data: offers, error } = await query;
    if (error) throw error;

    console.log(`Found ${offers?.length || 0} results`);

    const formattedResults = (offers || [])
      .map(o => {
        const diff = Math.abs(new Date(o.departure_date + "T12:00:00").getTime() - targetDep.getTime());
        const totalPass = (passageiros.adultos || 1) + (passageiros.criancas || 0);
        const totalPrice = (Number(o.price_per_person) + Number(o.boarding_tax || 0)) * totalPass;

        return {
          ...o,
          dateDiff: diff,
          total_price: totalPrice
        };
      })
      .sort((a, b) => a.dateDiff - b.dateDiff || a.total_price - b.total_price)
      .slice(0, 5)
      .map(o => ({
        companhia: o.airline || (o.offer_type === 'pacote' ? 'Pacote' : 'Aéreo'),
        voo_ida: o.outbound_departure_time ? `Voo às ${o.outbound_departure_time}` : (o.departure_date || "Consultar"),
        voo_volta: o.return_departure_time ? `Voo às ${o.return_departure_time}` : (o.return_date || "Consultar"),
        noites: o.nights || 0,
        preco_por_pessoa: Number(o.price_per_person),
        taxa_embarque: Number(o.boarding_tax || 0),
        preco: o.total_price,
        assentos_disponiveis: o.available_seats,
        prazo_emissao: o.issue_deadline,
        tipo: o.offer_type === "bloqueio_aereo" ? "aereo" : "pacote",
        operadora: o.source_type || "Direto"
      }));

    return new Response(JSON.stringify({ resultados: formattedResults }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("[cotar-viagem] Erro:", error.message);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
