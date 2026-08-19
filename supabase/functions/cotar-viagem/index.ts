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
    const { origem, destino, data_ida, passageiros } = body;
    const adults = Number(passageiros?.adultos) || 1;
    const children = Number(passageiros?.criancas) || 0;
    const totalPassageiros = adults + children;

    const normalize = (str: string) => (str || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const destClean = normalize(destino);
    const originClean = normalize(origem);

    const fetchOffers = async (filterOrigin: boolean, minDate: string, maxDate: string, orderByPrice: boolean) => {
      const { data, error } = await supabaseClient.rpc('search_travel_offers', {
        p_dest_term: destClean,
        p_origin_term: filterOrigin ? originClean : null,
        p_min_date: minDate,
        p_max_date: maxDate,
        p_total_passengers: totalPassageiros,
        p_order_by_price: orderByPrice
      });
      if (error) console.error("[cotar-viagem] RPC Error:", error);
      return data || [];
    };

    let targetDepStr = data_ida;
    if (data_ida && data_ida.includes('/')) {
      const [d, m, y] = data_ida.split('/');
      targetDepStr = `${y}-${m}-${d}`;
    }

    const nowUtc = new Date();
    const brDateStr = new Intl.DateTimeFormat('fr-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(nowUtc);

    const baseDate = (targetDepStr && targetDepStr >= brDateStr) ? targetDepStr : brDateStr;
    const targetMonth = baseDate.substring(0, 7);
    const monthStart = `${targetMonth}-01`;
    const monthEnd = `${targetMonth}-31`;

    // 1. Data Pedida (Mês alvo, respeitando origem)
    const dataA = await fetchOffers(true, monthStart, monthEnd, false);
    // 2. Próxima Data (Qualquer data futura, respeitando origem)
    const dataB = await fetchOffers(true, '1900-01-01', '2099-12-31', false);
    // 3. Melhor Preço (Qualquer data futura, respeitando origem)
    const dataC = await fetchOffers(true, '1900-01-01', '2099-12-31', true);

    let finalA = dataA;
    let finalB = dataB;
    let finalC = dataC;

    // Fallbacks massivos se não houver NADA com a origem específica
    if (finalB.length === 0) {
      console.log("[cotar-viagem] Fallback Geral (Sem Origem)");
      const [fA, fB, fC] = await Promise.all([
        fetchOffers(false, monthStart, monthEnd, false),
        fetchOffers(false, '1900-01-01', '2099-12-31', false),
        fetchOffers(false, '1900-01-01', '2099-12-31', true)
      ]);
      finalA = fA;
      finalB = fB;
      finalC = fC;
    }

    const findClosest = (list: any[], targetStr: string) => {
      if (!list || list.length === 0) return null;
      const targetTime = new Date(targetStr + "T12:00:00").getTime();
      return list.reduce((prev, curr) => {
        const prevTime = new Date(prev.departure_date + "T12:00:00").getTime();
        const currTime = new Date(curr.departure_date + "T12:00:00").getTime();
        return Math.abs(currTime - targetTime) < Math.abs(prevTime - targetTime) ? curr : prev;
      });
    };

    const offerA = findClosest(finalA, baseDate);
    const offerB = finalB.find((o: any) => !offerA || o.id !== offerA.id);
    const offerC = finalC.find((o: any) => 
      (!offerA || o.id !== offerA.id) && 
      (!offerB || o.id !== offerB.id)
    );

    const format = (o: any, role: string) => {
      const totalPrice = (Number(o.price_per_person) + Number(o.boarding_tax || 0)) * totalPassageiros;
      return {
        id: o.id,
        tipo: o.offer_type === "bloqueio_aereo" ? "aereo" : "pacote",
        origem: o.origin_city || o.origin_iata,
        destino: o.destination_name || o.destination_iata,
        data_ida: o.departure_date,
        data_volta: o.return_date,
        noites: o.nights || 0,
        companhia: o.airline || (o.offer_type === 'pacote' ? 'Pacote' : 'Aéreo'),
        preco_por_pessoa: Number(o.price_per_person),
        taxa_embarque: Number(o.boarding_tax || 0),
        preco: totalPrice,
        assentos_disponiveis: o.available_seats,
        prazo_emissao: o.issue_deadline,
        operadora: o.source_type || "Direto",
        papel: role,
        voo_ida: o.outbound_departure_time ? `Voo às ${o.outbound_departure_time}` : (o.departure_date || "Consultar"),
        voo_volta: o.return_departure_time ? `Voo às ${o.return_departure_time}` : (o.return_date || "Consultar"),
      };
    };

    const resultados: any[] = [];
    if (offerA) resultados.push(format(offerA, "data_pedida"));
    if (offerB) resultados.push(format(offerB, "proxima_data"));
    if (offerC) {
      const formattedC = format(offerC, "melhor_preco");
      const ref = offerA || offerB;
      if (ref && Number(offerC.price_per_person) < Number(ref.price_per_person)) {
        formattedC.economia_por_pessoa = Number(ref.price_per_person) - Number(offerC.price_per_person);
      }
      resultados.push(formattedC);
    }

    return new Response(JSON.stringify({ resultados }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("[cotar-viagem] Erro Crítico:", error.message);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
