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
    const baseDate = (targetDepStr && targetDepStr >= brDateStr) ? targetDepStr : brDateStr;

    // 2. NORMALIZAÇÃO E EXPANSÃO DE AEROPORTOS
    const normalizeText = (value: any) => String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();

    const parseBrCurrency = (value: any) => {
      const match = String(value || "").match(/(?:R\$\s*)?([\d.]+(?:,\d{1,2})?)/);
      if (!match) return 0;
      return Number.parseFloat(match[1].replace(/\./g, "").replace(",", ".")) || 0;
    };

    const { data: iataMapRows, error: iataMapError } = await supabaseClient
      .from("travel_iata_map")
      .select("code, origin_name, destination_name");

    if (iataMapError) throw iataMapError;

    const getIatas = (term: string) => {
      if (!term) return [];
      const cleanTerm = normalizeText(term);
      const list = (iataMapRows || [])
        .filter((item: any) => {
          const code = normalizeText(item.code);
          const originName = normalizeText(item.origin_name);
          const destinationName = normalizeText(item.destination_name);
          const canMatchName = cleanTerm.length >= 3;
          return code === cleanTerm ||
            (canMatchName && originName && (
              originName.includes(cleanTerm) ||
              cleanTerm.includes(originName)
            )) ||
            (canMatchName && destinationName && (
              destinationName.includes(cleanTerm) ||
              cleanTerm.includes(destinationName)
            ));
        })
        .map((item: any) => item.code.toUpperCase());

      if (cleanTerm.includes("sao paulo") || cleanTerm === "sp") list.push("GRU", "CGH", "VCP");
      if (cleanTerm.includes("goiania") || cleanTerm === "gyn") list.push("GYN");
      if (cleanTerm.includes("porto alegre") || cleanTerm === "poa") list.push("POA");
      if (cleanTerm.includes("maceio") || cleanTerm === "mcz") list.push("MCZ");
      if (cleanTerm.includes("porto de galinhas") || cleanTerm.includes("recife")) list.push("REC");

      if (cleanTerm.length === 3) list.push(cleanTerm.toUpperCase());
      return [...new Set(list)];
    };

    const originIatas = getIatas(origem);
    const destIatas = getIatas(destino);

    const requestDateTime = new Date(baseDate + "T12:00:00").getTime();
    const shiftDate = (isoDate: string, days: number) => {
      const date = new Date(isoDate + "T00:00:00Z");
      date.setUTCDate(date.getUTCDate() + days);
      return date.toISOString().slice(0, 10);
    };
    const packageWindowStart = [shiftDate(baseDate, -60), brDateStr].sort().reverse()[0];
    const packageWindowEnd = shiftDate(baseDate, 60);
    const getDateDistance = (offer: any) => Math.abs(
      new Date(offer.departure_date + "T12:00:00").getTime() - requestDateTime
    ) / 86400000;

    // 3. BLOQUEIOS AÉREOS: ATÉ DUAS OPÇÕES
    let allEligibleAirOffers: any[] = [];

    if (originIatas.length > 0 && destIatas.length > 0) {
      const { data: airOffers, error: airError } = await supabaseClient
        .from("travel_offers")
        .select("*")
        .eq("active", true)
        .eq("offer_type", "bloqueio_aereo")
        .gt("price_per_person", 0)
        .gte("available_seats", totalPassageiros)
        .in("origin_iata", originIatas)
        .in("destination_iata", destIatas);

      if (airError) throw airError;

      allEligibleAirOffers = (airOffers || []).filter((offer: any) => {
        if (!offer.departure_date || offer.departure_date < brDateStr) return false;
        if (getDateDistance(offer) > 60) return false;
        if (!offer.issue_deadline) return true;
        return offer.issue_deadline.split("T")[0] >= brDateStr;
      });
    }

    const getAirCost = (offer: any) =>
      Number(offer.price_per_person) + Number(offer.boarding_tax || 0);

    const closestAirOffer = [...allEligibleAirOffers].sort((a, b) => {
      const distanceDifference = getDateDistance(a) - getDateDistance(b);
      return distanceDifference !== 0 ? distanceDifference : getAirCost(a) - getAirCost(b);
    })[0] || null;

    const cheapestAirCandidate = [...allEligibleAirOffers]
      .sort((a, b) => getAirCost(a) - getAirCost(b))[0] || null;
    const cheapestAirOffer = cheapestAirCandidate && cheapestAirCandidate.id !== closestAirOffer?.id
      ? cheapestAirCandidate
      : null;

    const formatAirOffer = (offer: any, role: string) => {
      const personPrice = Number(offer.price_per_person);
      const tax = Number(offer.boarding_tax || 0);
      const totalGroup = (personPrice + tax) * totalPassageiros;
      const diffDays = (
        new Date(offer.departure_date + "T12:00:00").getTime() - requestDateTime
      ) / 86400000;

      let label = role === "melhor_preco" ? "Menor preço" : "Data mais próxima";
      let disclaimer = "";
      if (Math.abs(diffDays) <= 3) {
        label = "Data solicitada";
      } else if (diffDays > 3) {
        disclaimer = "⚠️ Esta opção parte depois da data solicitada.";
      } else if (diffDays < -3) {
        disclaimer = "💡 Esta opção parte antes da data solicitada.";
      }

      return {
        id: offer.id,
        tipo: "aereo",
        origem: `${offer.origin_city || "Desconhecida"} (${offer.origin_iata?.toUpperCase()})`,
        destino: offer.destination_name || offer.destination_iata,
        data_ida: offer.departure_date,
        data_volta: offer.return_date,
        noites: offer.nights || 0,
        companhia: offer.airline || "Aéreo",
        preco_por_pessoa: personPrice,
        taxa_embarque: tax,
        preco: totalGroup,
        assentos_disponiveis: offer.available_seats,
        prazo_emissao: offer.issue_deadline,
        operadora: offer.source_type || "Direto",
        papel: role,
        rotulo: label,
        observacao: disclaimer,
        voo_ida: offer.outbound_departure_time ? `Voo às ${offer.outbound_departure_time}` : offer.departure_date,
        voo_volta: offer.return_departure_time ? `Voo às ${offer.return_departure_time}` : offer.return_date,
      };
    };

    const resultados: any[] = [];
    if (closestAirOffer) resultados.push(formatAirOffer(closestAirOffer, "data_mais_proxima"));
    if (cheapestAirOffer) resultados.push(formatAirOffer(cheapestAirOffer, "melhor_preco"));

    // 4. PACOTES COMPLETOS: ATÉ DUAS OPÇÕES
    let packageQuery = supabaseClient
      .from("travel_offers")
      .select("id, origin_city, origin_iata, destination_name, departure_date, return_date, nights, price_per_person, boarding_tax, source_url, source_type, raw_data")
      .eq("active", true)
      .eq("offer_type", "pacote")
      .in("source_type", ["nacional", "internacional", "evento"])
      .gt("price_per_person", 0)
      .gte("departure_date", packageWindowStart)
      .lte("departure_date", packageWindowEnd);

    if (originIatas.length > 0) {
      packageQuery = packageQuery.in("origin_iata", originIatas);
    }

    const { data: packageOffers, error: packageError } = await packageQuery;
    if (packageError) throw packageError;

    const destinationClusters = [
      ["recife", "porto de galinhas", "carneiros"],
      ["maceio", "barra de sao miguel", "maragogi", "sao miguel dos milagres"],
      ["natal", "pipa"],
      ["gramado", "canela", "serra gaucha"],
      ["salvador", "praia do forte", "morro de sao paulo"],
      ["fortaleza", "jericoacoara"],
      ["foz do iguacu", "cataratas"],
      ["rio de janeiro", "buzios", "arraial do cabo"],
      ["beto carrero", "penha", "navegantes", "balneario camboriu", "joinville", "florianopolis", "itajai"],
    ];

    const requestedDestination = normalizeText(destino);
    const requestedOrigin = normalizeText(origem);

    const getDestinationRank = (offer: any) => {
      const destinationName = normalizeText(offer.destination_name);
      const offerText = normalizeText(
        `${offer.destination_name || ""} ${offer.raw_data?.nome || ""} ${offer.raw_data?.destino || ""} ${offer.raw_data?.inclui || ""}`
      );

      if (
        (requestedDestination && offerText.includes(requestedDestination)) ||
        (destinationName && requestedDestination.includes(destinationName))
      ) {
        return 0;
      }

      const sameCluster = destinationClusters.some((cluster) =>
        cluster.some((term) => requestedDestination.includes(term)) &&
        cluster.some((term) => offerText.includes(term))
      );
      return sameCluster ? 1 : 99;
    };

    const packageCandidates = (packageOffers || []).filter((offer: any) => {
      if (!offer.departure_date || getDateDistance(offer) > 60) return false;
      if (!Array.isArray(offer.raw_data?.hoteis) || offer.raw_data.hoteis.length === 0) return false;

      const offerIata = String(offer.origin_iata || "").toUpperCase();
      const offerOrigin = normalizeText(offer.origin_city);
      const originMatches =
        (offerIata && originIatas.includes(offerIata)) ||
        (requestedOrigin && (
          offerOrigin.includes(requestedOrigin) ||
          requestedOrigin.includes(offerOrigin)
        ));

      return originMatches && getDestinationRank(offer) < 99;
    });

    const getPackageDetails = (offer: any) => {
      const rawData = offer.raw_data || {};
      const hotels = Array.isArray(rawData.hoteis) ? rawData.hoteis : [];
      const sortedHotels = [...hotels].sort(
        (a: any, b: any) => parseBrCurrency(a.preco) - parseBrCurrency(b.preco)
      );
      const selectedHotel = sortedHotels.find((hotel: any) => parseBrCurrency(hotel.preco) > 0) || null;
      const packagePrice = selectedHotel
        ? parseBrCurrency(selectedHotel.preco)
        : Number(offer.price_per_person);
      const packageTax = selectedHotel
        ? parseBrCurrency(selectedHotel.taxas)
        : Number(offer.boarding_tax || 0);
      const inclusions = (Array.isArray(rawData.inclui) ? rawData.inclui : [])
        .map((item: any) => String(item || "").replace(/[\uE000-\uF8FF]/g, "").trim())
        .filter(Boolean);

      return {
        selectedHotel,
        packagePrice,
        packageTax,
        inclusions,
        otherHotels: Math.max(0, hotels.length - (selectedHotel ? 1 : 0))
      };
    };

    const getPackageCost = (offer: any) => {
      const details = getPackageDetails(offer);
      return details.packagePrice + details.packageTax;
    };

    const closestPackageOffer = [...packageCandidates].sort((a, b) => {
      const rankDifference = getDestinationRank(a) - getDestinationRank(b);
      if (rankDifference !== 0) return rankDifference;
      const distanceDifference = getDateDistance(a) - getDateDistance(b);
      return distanceDifference !== 0 ? distanceDifference : getPackageCost(a) - getPackageCost(b);
    })[0] || null;

    const cheapestPackageCandidate = [...packageCandidates]
      .sort((a, b) => {
        const rankDifference = getDestinationRank(a) - getDestinationRank(b);
        return rankDifference !== 0 ? rankDifference : getPackageCost(a) - getPackageCost(b);
      })[0] || null;
    const cheapestPackageOffer = cheapestPackageCandidate &&
      cheapestPackageCandidate.id !== closestPackageOffer?.id
      ? cheapestPackageCandidate
      : null;

    const formatPackageOffer = (offer: any, role: string) => {
      const details = getPackageDetails(offer);
      const rawData = offer.raw_data || {};

      return {
        id: offer.id,
        tipo: "pacote",
        papel: role,
        rotulo: role === "melhor_preco" ? "Menor preço" : "Data mais próxima",
        nome: rawData.nome || offer.destination_name || "Pacote promocional",
        origem: offer.origin_city || offer.origin_iata || "Origem não informada",
        origem_iata: offer.origin_iata || null,
        destino: offer.destination_name,
        data_ida: offer.departure_date,
        data_volta: offer.return_date,
        noites: offer.nights || 0,
        hotel: details.selectedHotel?.nome || null,
        regime: details.selectedHotel?.regime || null,
        promocao: details.selectedHotel?.promo || null,
        preco_por_pessoa: details.packagePrice,
        parcela: details.selectedHotel?.parcela || null,
        taxa_por_pessoa: details.packageTax,
        inclusoes: details.inclusions,
        outras_hospedagens: details.otherHotels,
        link: offer.source_url || null,
      };
    };

    const pacotes: any[] = [];
    if (closestPackageOffer) pacotes.push(formatPackageOffer(closestPackageOffer, "data_mais_proxima"));
    if (cheapestPackageOffer) pacotes.push(formatPackageOffer(cheapestPackageOffer, "melhor_preco"));

    return new Response(JSON.stringify({
      resultados,
      pacotes,
      meta: {
        total_passengers: totalPassageiros,
        eligible_air_offers: allEligibleAirOffers.length,
        eligible_packages: packageCandidates.length,
        search_window_days: 60,
      }
    }), {
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
