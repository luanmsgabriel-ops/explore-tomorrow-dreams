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

    // 1. DATA E PASSAGEIROS
    const nowUtc = new Date();
    const brDateStr = new Intl.DateTimeFormat('fr-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(nowUtc);

    let targetDepStr = data_ida;
    if (data_ida && data_ida.includes('/')) {
      const [d, m, y] = data_ida.split('/');
      targetDepStr = `${y}-${m}-${d}`;
    }
    // A regra diz: Nenhuma oferta com departure_date anterior à data de ida pedida.
    // Se não informada, usamos hoje.
    const baseDate = (targetDepStr && targetDepStr >= brDateStr) ? targetDepStr : brDateStr;

    // 2. BUSCA DE IATA EXPANSIONS (Para Origem e Destino)
    const getIatas = async (term: string) => {
      if (!term) return [];
      const cleanTerm = term.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const { data } = await supabaseClient
        .from('travel_iata_map')
        .select('code')
        .or(`origin_name.ilike.%${cleanTerm}%,destination_name.ilike.%${cleanTerm}%,code.ilike.%${cleanTerm}%`);
      const list = (data || []).map(i => i.code.toUpperCase());
      if (cleanTerm.length === 3) list.push(cleanTerm.toUpperCase());
      return [...new Set(list)];
    };

    const [originIatas, destIatas] = await Promise.all([
      getIatas(origem),
      getIatas(destino)
    ]);

    // 3. CONSULTA AO CONJUNTO ELEGÍVEL
    // SELECT * FROM travel_offers WHERE ... departure_date >= :data_ida_pedida
    const { data: eligibleOffers, error } = await supabaseClient
      .from('travel_offers')
      .select('*')
      .eq('active', true)
      .eq('offer_type', 'bloqueio_aereo')
      .gt('price_per_person', 0)
      .gte('issue_deadline', brDateStr)
      .gte('available_seats', totalPassageiros)
      .in('origin_iata', originIatas)
      .in('destination_iata', destIatas)
      .gte('departure_date', baseDate);

    if (error) throw error;

    // Log para depuração interna
    console.log(`[cotar-viagem] Conjunto elegível: ${eligibleOffers?.length || 0} ofertas encontradas.`);
    if (eligibleOffers && eligibleOffers.length > 0) {
      console.log(`[cotar-viagem] Primeira oferta elegível: ${eligibleOffers[0].departure_date} em ${eligibleOffers[0].origin_iata}`);
    }

    const allEligible = eligibleOffers || [];
    
    // 4. SELEÇÃO DOS TRÊS PAPÉIS (EM MEMÓRIA)
    const getCost = (o: any) => Number(o.price_per_person) + Number(o.boarding_tax || 0);

    // data_pedida:
    // - Filtrar mês e ano iguais à data pedida
    // - Ordenar por: diferença absoluta em dias, crescente
    // - Desempate: menor custo total por pessoa
    let offerA = null;
    const targetMonth = baseDate.substring(0, 7);
    const monthOffers = allEligible.filter(o => o.departure_date.startsWith(targetMonth));
    
    if (monthOffers.length > 0) {
      const targetTime = new Date(baseDate + "T12:00:00").getTime();
      offerA = [...monthOffers].sort((a, b) => {
        const distA = Math.abs(new Date(a.departure_date + "T12:00:00").getTime() - targetTime);
        const distB = Math.abs(new Date(b.departure_date + "T12:00:00").getTime() - targetTime);
        if (distA !== distB) return distA - distB;
        return getCost(a) - getCost(b);
      })[0];
    }

    // proxima_data:
    // - Só existe se data_pedida for vazia
    // - Ordenar por departure_date crescente
    let offerB = null;
    if (!offerA) {
      const futureOffers = [...allEligible].sort((a, b) => a.departure_date.localeCompare(b.departure_date));
      if (futureOffers.length > 0) {
        offerB = futureOffers[0];
      }
    }

    // melhor_preco:
    // - Ordenar todo o conjunto por custo total por pessoa crescente
    // - Só incluir se id diferente do principal E custo estritamente menor
    let offerC = null;
    const mainOffer = offerA || offerB;
    if (mainOffer) {
      const sortedByPrice = [...allEligible].sort((a, b) => getCost(a) - getCost(b));
      const cheapest = sortedByPrice[0];
      if (cheapest && cheapest.id !== mainOffer.id && getCost(cheapest) < getCost(mainOffer)) {
        offerC = cheapest;
      }
    }

    // 5. FORMATAÇÃO FINAL
    const format = (o: any, role: string, refTotal?: number) => {
      const personPrice = Number(o.price_per_person);
      const tax = Number(o.boarding_tax || 0);
      const cost = personPrice + tax;
      const totalGroup = cost * totalPassageiros;
      
      const res: any = {
        id: o.id,
        tipo: "aereo",
        origem: `${o.origin_city || "Desconhecida"} (${o.origin_iata?.toUpperCase()})`,
        destino: o.destination_name || o.destination_iata,
        data_ida: o.departure_date,
        data_volta: o.return_date,
        noites: o.nights || 0,
        companhia: o.airline || 'Aéreo',
        preco_por_pessoa: personPrice,
        taxa_embarque: tax,
        preco: totalGroup,
        assentos_disponiveis: o.available_seats,
        prazo_emissao: o.issue_deadline,
        operadora: o.source_type || "Direto",
        papel: role,
        voo_ida: o.outbound_departure_time ? `Voo às ${o.outbound_departure_time}` : o.departure_date,
        voo_volta: o.return_departure_time ? `Voo às ${o.return_departure_time}` : o.return_date,
      };

      if (refTotal && cost < refTotal) {
        res.economia = refTotal - cost;
        res.economia_total = res.economia * totalPassageiros;
      }
      return res;
    };

    const resultados: any[] = [];
    if (offerA) resultados.push(format(offerA, "data_pedida"));
    if (offerB) resultados.push(format(offerB, "proxima_data"));
    if (offerC) {
      const mainTotal = getCost(mainOffer);
      resultados.push(format(offerC, "melhor_preco", mainTotal));
    }

    return new Response(JSON.stringify({ resultados, meta: { total_passengers: totalPassageiros } }), {
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
