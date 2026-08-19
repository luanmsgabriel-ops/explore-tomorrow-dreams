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

    if (!origem || !destino || !data_ida || !data_volta || !passageiros) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios: origem, destino, data_ida, data_volta, passageiros" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const totalPassageiros = (passageiros.adultos || 0) + (passageiros.criancas || 0);

    // Brasilia Date calculation (UTC-3)
    const nowUtc = new Date();
    const brDateStr = new Intl.DateTimeFormat('fr-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(nowUtc);

    // 1. Resolve IATA codes and names
    const resolveLocation = async (input: string, type: 'origin' | 'destination') => {
      const cleanInput = input.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
      
      // Try exact IATA code first
      const { data: byCode } = await supabaseClient
        .from("travel_iata_map")
        .select("code")
        .eq("code", cleanInput)
        .single();
      
      if (byCode) return [byCode.code];

      // Try fuzzy name match using the correct column based on type
      const col = type === 'origin' ? 'origin_name' : 'destination_name';
      const { data: byName } = await supabaseClient
        .from("travel_iata_map")
        .select("code")
        .ilike(col, `%${cleanInput}%`);
      
      if (byName && byName.length > 0) return byName.map(n => n.code);

      // Package destination fallback: "PALMAS (PMW)" extraction
      const iataMatch = cleanInput.match(/\(([A-Z]{3})\)/);
      if (iataMatch) return [iataMatch[1]];

      return []; 
    };

    const originCodes = await resolveLocation(origem, 'origin');
    const destCodes = await resolveLocation(destino, 'destination');

    // 2. Build Query
    const destFuzzy = destino.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const originFuzzy = origem.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    let query = supabaseClient
      .from("travel_offers")
      .select("*")
      .eq("active", true)
      .gt("price_per_person", 0)
      .or(`issue_deadline.gte.${brDateStr},issue_deadline.is.null`)
      .or(`available_seats.gte.${totalPassageiros},available_seats.is.null`);

    // Destination filters
    if (destCodes.length > 0) {
      query = query.or(`destination_iata.in.(${destCodes.join(",")}),destination_name.ilike.%${destFuzzy}%`);
    } else {
      query = query.ilike("destination_name", `%${destFuzzy}%`);
    }
    
    // Origin filters - PostgREST .or() can't be called twice for different groups easily 
    // without nesting or raw filters if they are independent.
    // However, Supabase-js appends filters. If we want (A or B) AND (C or D), 
    // we need to be careful with .or(). 
    // Since we already used .or() for deadline and seats, let's use a simpler approach:
    if (originCodes.length > 0) {
      // Use .in for IATA and a separate .or check if possible, or just .in since IATA is precise
      query = query.in("origin_iata", originCodes);
    } else {
      query = query.ilike("origin_city", `%${originFuzzy}%`);
    }

    // 3. Date handling
    const targetDep = new Date(data_ida + "T12:00:00");
    const isOnlyMonth = data_ida.length <= 7;

    if (isOnlyMonth) {
      const [year, month] = data_ida.split("-");
      const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
      query = query.gte("departure_date", `${data_ida}-01`)
                   .lte("departure_date", `${data_ida}-${lastDay}`);
    } else {
      const dMin = new Date(targetDep);
      dMin.setDate(dMin.getDate() - 7);
      const dMax = new Date(targetDep);
      dMax.setDate(dMax.getDate() + 7);
      
      query = query.gte("departure_date", dMin.toISOString().split("T")[0])
                   .lte("departure_date", dMax.toISOString().split("T")[0]);
    }

    console.log(`Executing query for ${origem}->${destino} (${data_ida})`);
    const { data: offers, error } = await query;
    if (error) throw error;

    console.log(`Found ${offers?.length || 0} results`);

    // 4. Sort and format
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

    return new Response(
      JSON.stringify({ resultados: formattedResults }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error: any) {
    console.error("[cotar-viagem] Erro:", error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message || "Erro ao buscar cotação" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
