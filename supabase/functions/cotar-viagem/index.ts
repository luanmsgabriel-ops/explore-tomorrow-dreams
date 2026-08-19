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

    // Data de hoje no fuso de Brasília (para o issue_deadline e departure_date)
    const nowUtc = new Date();
    const brDateStr = new Intl.DateTimeFormat('fr-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(nowUtc);

    // 1. REFATORE PARA UMA ÚNICA CONSULTA BASE
    // Buscamos todas as ofertas futuras elegíveis (sem filtro de origem ainda, para permitir fallback de origem)
    const { data: allData, error } = await supabaseClient.rpc('search_travel_offers', {
      p_dest_term: destClean,
      p_origin_term: null, // Buscamos tudo para filtrar no código e gerenciar fallback
      p_min_date: brDateStr,
      p_max_date: '2099-12-31',
      p_total_passengers: totalPassageiros,
      p_order_by_price: false
    });

    if (error) throw error;

    // Filtros obrigatórios aplicados em memória no conjunto retornado
    // Obs: A RPC já filtra por active=true, price > 0 e issue_deadline >= hoje.
    // Reforçamos aqui conforme a regra do usuário.
    let eligibleOffers = (allData || []).filter((o: any) => {
      const isBloqueio = o.offer_type === 'bloqueio_aereo';
      const hasSeats = Number(o.available_seats || 0) >= totalPassageiros;
      const isFuture = o.departure_date >= brDateStr;
      const priceOk = Number(o.price_per_person) > 0;
      
      return isBloqueio && hasSeats && isFuture && priceOk;
    });

    // Filtro de Origem com Fallback
    // Tentamos filtrar pela origem solicitada primeiro
    const filterByOrigin = (list: any[], term: string) => {
      if (!term) return list;
      const termClean = normalize(term);
      // Mapeamento simples de expansão de origens (sincronizado com a lógica da RPC)
      const expansions: Record<string, string[]> = {
        'sao paulo': ['gru', 'cgh', 'vcp', 'campinas', 'sp'],
        'sp': ['gru', 'cgh', 'vcp', 'campinas', 'sao paulo'],
        'goiania': ['gyn'],
        'porto alegre': ['poa'],
        'curitiba': ['cwb'],
        'belo horizonte': ['cnf', 'bhz'],
        'rio': ['gig', 'sdu'],
        'brasilia': ['bsb']
      };
      
      const searchTerms = [termClean];
      for (const [key, val] of Object.entries(expansions)) {
        if (termClean.includes(key)) searchTerms.push(...val);
      }

      return list.filter(o => {
        const oOrig = normalize(o.origin_city || o.origin_iata);
        const oIata = normalize(o.origin_iata);
        return searchTerms.some(t => oOrig.includes(t) || oIata.includes(t));
      });
    };

    let finalSet = filterByOrigin(eligibleOffers, originClean);
    let usedFallback = false;

    if (finalSet.length === 0) {
      finalSet = eligibleOffers; // Fallback: qualquer origem para o destino
      usedFallback = true;
    }

    // Preparação de datas para seleção
    let targetDepStr = data_ida;
    if (data_ida && data_ida.includes('/')) {
      const [d, m, y] = data_ida.split('/');
      targetDepStr = `${y}-${m}-${d}`;
    }
    const baseDate = (targetDepStr && targetDepStr >= brDateStr) ? targetDepStr : brDateStr;
    const targetMonth = baseDate.substring(0, 7);

    // 2. REGRAS DE SELEÇÃO DENTRO DO CONJUNTO

    // DATA PEDIDA: Mês da data pedida, menor distância, desempate preço total
    const monthOffers = finalSet.filter(o => o.departure_date.startsWith(targetMonth) && o.departure_date >= baseDate);
    let offerA = null;
    if (monthOffers.length > 0) {
      const targetTime = new Date(baseDate + "T12:00:00").getTime();
      offerA = monthOffers.reduce((prev, curr) => {
        const prevTime = new Date(prev.departure_date + "T12:00:00").getTime();
        const currTime = new Date(curr.departure_date + "T12:00:00").getTime();
        const distPrev = Math.abs(prevTime - targetTime);
        const distCurr = Math.abs(currTime - targetTime);

        if (distCurr < distPrev) return curr;
        if (distCurr > distPrev) return prev;
        
        // Empate na distância: o mais barato (tarifa + taxa)
        const totalPrev = Number(prev.price_per_person) + Number(prev.boarding_tax || 0);
        const totalCurr = Number(curr.price_per_person) + Number(curr.boarding_tax || 0);
        return totalCurr < totalPrev ? curr : prev;
      });
    }

    // PROXIMA DATA: Somente se A for vazio. Primeiro estritamente posterior à data pedida.
    let offerB = null;
    if (!offerA) {
      const futureOffers = finalSet.filter(o => o.departure_date > baseDate)
        .sort((a, b) => a.departure_date.localeCompare(b.departure_date));
      if (futureOffers.length > 0) {
        offerB = futureOffers[0];
      }
    }

    // MELHOR PREÇO: Menor custo total (tarifa + taxa). Não repete A ou B.
    // Regra 2: Deve aparecer também quando o item principal for proxima_data (offerB)
    const referenceOffer = offerA || offerB;
    let offerC = null;
    if (referenceOffer) {
      const refTotal = Number(referenceOffer.price_per_person) + Number(referenceOffer.boarding_tax || 0);
      
      const sortedByPrice = [...finalSet].sort((a, b) => {
        const totalA = Number(a.price_per_person) + Number(a.boarding_tax || 0);
        const totalB = Number(b.price_per_person) + Number(b.boarding_tax || 0);
        return totalA - totalB;
      });

      offerC = sortedByPrice.find(o => {
        if (referenceOffer && o.id === referenceOffer.id) return false;
        const currentTotal = Number(o.price_per_person) + Number(o.boarding_tax || 0);
        return currentTotal < refTotal;
      });
    }

    // Formatação
    const format = (o: any, role: string, referenceTotal?: number) => {
      const personPrice = Number(o.price_per_person);
      const tax = Number(o.boarding_tax || 0);
      const personTotal = personPrice + tax;
      const totalPrice = personTotal * totalPassageiros;

      // Regra 4: Origem explícita (Nome + IATA)
      const originName = o.origin_city || "Desconhecida";
      const originIata = o.origin_iata ? `(${o.origin_iata.toUpperCase()})` : "";
      
      const res: any = {
        id: o.id,
        tipo: "aereo",
        origem: `${originName} ${originIata}`.trim(),
        destino: o.destination_name || o.destination_iata,
        data_ida: o.departure_date,
        data_volta: o.return_date,
        noites: o.nights || 0,
        companhia: o.airline || 'Aéreo',
        preco_por_pessoa: personPrice,
        taxa_embarque: tax,
        preco: totalPrice,
        assentos_disponiveis: o.available_seats,
        prazo_emissao: o.issue_deadline,
        operadora: o.source_type || "Direto",
        papel: role,
        voo_ida: o.outbound_departure_time ? `Voo às ${o.outbound_departure_time}` : (o.departure_date || "Consultar"),
        voo_volta: o.return_departure_time ? `Voo às ${o.return_departure_time}` : (o.return_date || "Consultar"),
      };

      if (referenceTotal && personTotal < referenceTotal) {
        const economiaIndividual = referenceTotal - personTotal;
        res.economia = economiaIndividual;
        res.economia_total = economiaIndividual * totalPassageiros;
      }

      return res;
    };

    const resultados: any[] = [];
    if (offerA) resultados.push(format(offerA, "data_pedida"));
    if (offerB) resultados.push(format(offerB, "proxima_data"));
    if (offerC) {
      const refTotal = Number(referenceOffer.price_per_person) + Number(referenceOffer.boarding_tax || 0);
      resultados.push(format(offerC, "melhor_preco", refTotal));
    }

    return new Response(JSON.stringify({ resultados, meta: { used_fallback: usedFallback, total_passengers: totalPassageiros } }), {
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
