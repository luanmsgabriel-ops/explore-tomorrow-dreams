import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { sanitizeForPostgresJson } from "./sanitize.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = new Date().toISOString();
  
  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const targetUrl = "https://viajandocomdesconto.com/";
    const res = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(30000)
    });
    const html = await res.text();
    const executionTimestamp = new Date().toISOString();

    // Brasilia Date calculation (UTC-3)
    const nowUtc = new Date();
    const brDateStr = new Intl.DateTimeFormat('fr-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(nowUtc); // YYYY-MM-DD

    if (html.length < 1000) {
      throw new Error(`HTML muito curto (${html.length} bytes). Status: ${res.status}`);
    }

    const parseJSONAt = (searchFrom: number) => {
      const objectStart = html.indexOf("{", searchFrom);
      const arrayStart = html.indexOf("[", searchFrom);
      const realStart = objectStart !== -1 && (arrayStart === -1 || objectStart < arrayStart)
        ? objectStart
        : arrayStart;
      if (realStart === -1) return null;

      const opening = html[realStart];
      const closing = opening === "{" ? "}" : "]";
      let depth = 0;
      let inString = false;
      let escaped = false;

      for (let i = realStart; i < html.length; i++) {
        const char = html[i];
        if (inString) {
          if (escaped) escaped = false;
          else if (char === "\\") escaped = true;
          else if (char === '"') inString = false;
          continue;
        }

        if (char === '"') {
          inString = true;
        } else if (char === opening) {
          depth++;
        } else if (char === closing) {
          depth--;
          if (depth === 0) {
            try {
              return JSON.parse(html.substring(realStart, i + 1));
            } catch {
              return null;
            }
          }
        }
      }
      return null;
    };

    const findJSON = (marker: string) => {
      const markerIndex = html.indexOf(marker);
      return markerIndex === -1 ? null : parseJSONAt(markerIndex + marker.length);
    };

    const findScriptJSON = (id: string) => {
      const markerIndex = html.indexOf(`id="${id}"`);
      if (markerIndex === -1) return null;
      const tagEnd = html.indexOf(">", markerIndex);
      return tagEnd === -1 ? null : parseJSONAt(tagEnd + 1);
    };

    const payload = findJSON("__PVOO_PAYLOAD =");
    const fullPackages = findJSON("const PACOTES =");
    const snapshot = findJSON("PV_SNAPSHOT =");
    const pageData = findScriptJSON("dados");
    const groupDetails = findJSON("const GDET =");
    const hasFullPackageCatalog = Array.isArray(fullPackages) && fullPackages.length > 0;

    if (!payload || (!hasFullPackageCatalog && !Array.isArray(snapshot))) {
      return new Response(JSON.stringify({
        message: "Nenhum dado encontrado no HTML. Abortando.",
        status: "aborted",
        html_length: html.length,
        has_payload: !!payload,
        has_full_packages: hasFullPackageCatalog,
        has_snapshot: Array.isArray(snapshot)
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { blob, mapa } = payload;
    if (!blob || !mapa) {
      throw new Error("Estrutura do PAYLOAD inválida (blob ou mapa ausente).");
    }

    // Sync travel_iata_map table
    const iataEntries = Object.entries(mapa).map(([code, names]) => ({
      code,
      origin_name: (names as string[])[0],
      destination_name: (names as string[])[1],
      updated_at: executionTimestamp
    }));

    if (iataEntries.length > 0) {
      console.log(`Syncing ${iataEntries.length} IATA entries...`);
      const { error: iataError } = await supabaseClient
        .from("travel_iata_map")
        .upsert(iataEntries, { onConflict: "code" });
      if (iataError) {
        console.error("Error syncing travel_iata_map:", iataError);
      } else {
        console.log("travel_iata_map synced successfully");
      }
    }



    const lines = blob.split("\n").filter((l: string) => l.trim().length > 0);
    const parsedOffers = [];
    let mapErrors = 0;

    const convertDate = (aammdd: string) => {
      if (!aammdd || aammdd.length !== 6) return null;
      return `20${aammdd.substring(0, 2)}-${aammdd.substring(2, 4)}-${aammdd.substring(4, 6)}`;
    };

    const convertTime = (hhmm: string) => {
      if (!hhmm || hhmm.length !== 4) return null;
      return `${hhmm.substring(0, 2)}:${hhmm.substring(2, 4)}`;
    };

    const parseBrDate = (value: any) => {
      const match = String(value || "").match(/(\d{2})\/(\d{2})\/(\d{4})/);
      return match ? `${match[3]}-${match[2]}-${match[1]}` : null;
    };

    const parseDateRange = (value: any) => {
      const dates = String(value || "").match(/\d{2}\/\d{2}\/\d{4}/g) || [];
      return {
        departureDate: dates[0] ? parseBrDate(dates[0]) : null,
        returnDate: dates[1] ? parseBrDate(dates[1]) : null
      };
    };

    const parseBrCurrency = (value: any) => {
      const match = String(value || "").match(/(?:R\$\s*)?([\d.]+(?:,\d{1,2})?)/);
      if (!match) return 0;
      return parseFloat(match[1].replace(/\./g, "").replace(",", ".")) || 0;
    };

    const parseFirstBrlAmount = (value: any) => {
      const match = String(value || "").match(/R\$\s*([\d.]+(?:,\d{1,2})?)/);
      return match ? parseBrCurrency(match[1]) : 0;
    };

    const addDays = (isoDate: string | null, days: number) => {
      if (!isoDate || !Number.isFinite(days)) return null;
      const date = new Date(`${isoDate}T00:00:00Z`);
      date.setUTCDate(date.getUTCDate() + days);
      return date.toISOString().slice(0, 10);
    };

    const getNights = (departureDate: string | null, returnDate: string | null) => {
      if (!departureDate || !returnDate) return 0;
      return Math.max(0, Math.round(
        (new Date(`${returnDate}T00:00:00Z`).getTime() -
          new Date(`${departureDate}T00:00:00Z`).getTime()) / 86400000
      ));
    };

    // Helper for source_id generation (Crypto is available in Deno)
    const generateId = async (input: string) => {
      const msgUint8 = new TextEncoder().encode(input);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 64);
    };

    for (const line of lines) {
      const cols = line.split("|");
      if (cols.length < 16) continue;

      const deadline = convertDate(cols[8]);
      // EXCLUSION RULE: discard if deadline is before today (Brasilia)
      if (deadline && deadline < brDateStr) continue;

      const originIata = cols[0];
      const destinationIata = cols[1];
      const originName = mapa[originIata] ? mapa[originIata][0] : originIata;
      const destinationName = mapa[destinationIata] ? mapa[destinationIata][1] : destinationIata;

      if (!mapa[originIata] || !mapa[destinationIata]) mapErrors++;

      const departureDate = convertDate(cols[2]);
      const returnDate = convertDate(cols[3]);
      const price = parseFloat(cols[6]);
      const airline = cols[15];

      // Deterministic hash: origem + destino + data partida + data retorno + companhia + tarifa
      const idSource = `${originIata}|${destinationIata}|${departureDate}|${returnDate}|${airline}|${price}`;
      
      parsedOffers.push({
        source: "viajandocomdesconto",
        source_id: await generateId(idSource),
        offer_type: "bloqueio_aereo",
        origin_iata: originIata,
        origin_city: originName,
        destination_iata: destinationIata,
        destination_name: destinationName,
        departure_date: departureDate,
        return_date: returnDate,
        price_per_person: price,
        currency: cols[7] === "0" ? "BRL" : "USD",
        airline: airline,
        boarding_tax: parseFloat(cols[13]) || 0,
        nights: parseInt(cols[4]) || 0,
        available_seats: parseInt(cols[5]) || 0,
        issue_deadline: deadline,
        outbound_departure_time: convertTime(cols[9]),
        outbound_arrival_time: convertTime(cols[10]),
        return_departure_time: convertTime(cols[11]),
        return_arrival_time: convertTime(cols[12]),
        last_seen_at: executionTimestamp,
        active: true,
        source_type: 'bloqueio'
      });
    }

    let packageVariantsFound = 0;
    let packagesIgnoredDueToPastDate = 0;
    let guidedGroupsFound = 0;

    if (hasFullPackageCatalog) {
      for (const packageItem of fullPackages) {
        const origins = Array.isArray(packageItem.origens) ? packageItem.origens : [];
        const { origens: _origens, ...packageBaseData } = packageItem;

        for (const origin of origins) {
          const { departureDate, returnDate } = parseDateRange(origin.data);
          packageVariantsFound++;

          if (departureDate && departureDate < brDateStr) {
            packagesIgnoredDueToPastDate++;
            continue;
          }

          const hotels = Array.isArray(origin.hoteis) ? origin.hoteis : [];
          const hotelPrices = hotels
            .map((hotel: any) => parseBrCurrency(hotel.preco))
            .filter((price: number) => price > 0);
          const lowestHotelPrice = hotelPrices.length > 0 ? Math.min(...hotelPrices) : 0;
          const installmentPrice = parseBrCurrency(origin.min_parcela);
          const airPrice = parseBrCurrency(origin.por);
          const packagePrice = lowestHotelPrice || (installmentPrice > 0 ? installmentPrice * 10 : 0) || airPrice;
          const originIata = origin.iata || "";
          const destination = packageItem.destino || packageItem.nome || "";
          const packageKey = packageItem.slug || packageItem.nome || destination;
          const idSource = `pkg|${packageKey}|${originIata}|${destination}|${departureDate}|${returnDate}`;

          parsedOffers.push({
            source: "viajandocomdesconto",
            source_id: await generateId(idSource),
            offer_type: "pacote",
            destination_name: destination,
            origin_iata: originIata,
            origin_city: origin.cidade || "",
            departure_date: departureDate,
            return_date: returnDate,
            nights: getNights(departureDate, returnDate),
            price_per_person: packagePrice,
            currency: "BRL",
            boarding_tax: parseBrCurrency(origin.taxas),
            source_url: origin.link || null,
            last_seen_at: executionTimestamp,
            active: true,
            alternative_dates: origin.outras || null,
            source_type: String(packageItem.categoria || "pacote").toLowerCase(),
            raw_data: {
              ...packageBaseData,
              ...origin,
              origin,
              air_price_per_person: airPrice,
              package_price_per_person: packagePrice,
              source_entry: "PACOTES"
            }
          });
        }
      }
    } else if (Array.isArray(snapshot)) {
      for (const item of snapshot) {
        const { departureDate, returnDate } = parseDateRange(item.data);
        packageVariantsFound++;

        if (departureDate && departureDate < brDateStr) {
          packagesIgnoredDueToPastDate++;
          continue;
        }

        const price = parseBrCurrency(item.por);
        const name = item.nome || "";
        const originIata = item.origem_iata || "";
        const destination = item.destino || "";
        const idSource = `pkg|${name}|${originIata}|${destination}|${departureDate}|${returnDate}`;

        parsedOffers.push({
          source: "viajandocomdesconto",
          source_id: await generateId(idSource),
          offer_type: "pacote",
          destination_name: destination,
          origin_iata: originIata,
          origin_city: item.origem_cidade,
          departure_date: departureDate,
          return_date: returnDate,
          nights: getNights(departureDate, returnDate),
          price_per_person: price,
          currency: "BRL",
          boarding_tax: parseBrCurrency(item.taxas),
          source_url: item.link || null,
          last_seen_at: executionTimestamp,
          active: true,
          alternative_dates: item.outras || null,
          source_type: item.fonte || null,
          raw_data: {
            ...item,
            air_price_per_person: price,
            source_entry: "PV_SNAPSHOT"
          }
        });
      }
    }

    const groupSummaries = [
      ...(Array.isArray(pageData?.grupos?.nac) ? pageData.grupos.nac : []),
      ...(Array.isArray(pageData?.grupos?.intl) ? pageData.grupos.intl : [])
    ];

    if (hasFullPackageCatalog && groupSummaries.length > 0) {
      for (const summary of groupSummaries) {
        const link = summary.link || "";
        let slug = "";
        try {
          slug = new URL(link, targetUrl).pathname.split("/").filter(Boolean).pop() || "";
        } catch {
          slug = "";
        }

        const details = groupDetails?.[slug] || {};
        const candidateDates = [...new Set([
          details.saida,
          ...(Array.isArray(summary.datas) ? summary.datas : [])
        ]
          .map((value: any) => parseBrDate(value))
          .filter((value: string | null): value is string => !!value))]
          .sort();
        const departureDate = candidateDates.find((date: string) => date >= brDateStr) || candidateDates[0] || null;

        if (departureDate && departureDate < brDateStr) {
          packagesIgnoredDueToPastDate++;
          continue;
        }

        const durationText = String(details.duracao || "");
        const days = parseInt(durationText.match(/(\d+)\s*dias?/i)?.[1] || "0");
        const nights = parseInt(durationText.match(/(\d+)\s*noites?/i)?.[1] || "0") || Math.max(0, days - 1);
        const returnDate = addDays(departureDate, days > 0 ? days - 1 : nights);
        const originText = String(details.origem || "");
        const originMatch = originText.match(/^(.*?)\s*\(([A-Z]{3})\)\s*$/);
        const normalizedOrigin = originText
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .trim();
        const mappedOriginIata = Object.entries(mapa).find(([, names]) =>
          String((names as string[])[0] || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim() === normalizedOrigin
        )?.[0] || null;
        const prices = Array.isArray(details.precos) ? details.precos : [];
        const highlightedPrice = prices.find((price: any) => price.dest) ||
          prices.find((price: any) => /R\$/.test(String(price.s || "")));
        const taxPrice = prices.find((price: any) => /taxa/i.test(
          `${price.n || ""} ${price.s || ""} ${price.v || ""}`
        ));
        const pricePerPerson = parseFirstBrlAmount(highlightedPrice?.s) ||
          parseFirstBrlAmount(highlightedPrice?.v);
        const destination = summary.sub || summary.titulo || details.nome || summary.nome || "Grupo com guia";
        const idSource = `group|${slug || summary.nome || destination}`;

        parsedOffers.push({
          source: "viajandocomdesconto",
          source_id: await generateId(idSource),
          offer_type: "pacote",
          destination_name: destination,
          origin_iata: originMatch?.[2] || mappedOriginIata,
          origin_city: originMatch?.[1]?.trim() || originText || null,
          departure_date: departureDate,
          return_date: returnDate,
          nights,
          price_per_person: pricePerPerson,
          currency: "BRL",
          boarding_tax: parseFirstBrlAmount(taxPrice?.s) || parseFirstBrlAmount(taxPrice?.v),
          source_url: details.pdf || link || null,
          last_seen_at: executionTimestamp,
          active: true,
          alternative_dates: candidateDates,
          source_type: "grupo_guiado",
          raw_data: {
            ...details,
            summary,
            details,
            source_entry: "DADOS.grupos/GDET"
          }
        });
        guidedGroupsFound++;
      }
    }

    if (parsedOffers.length === 0) {
      throw new Error("Nenhuma oferta processada (lista vazia). Abortando para segurança.");
    }

    // Deduplicate in memory
    const uniqueOffers = new Map();
    for (const offer of parsedOffers) {
      uniqueOffers.set(`${offer.source_id}-${offer.offer_type}`, offer);
    }
    const finalOffers = Array.from(uniqueOffers.values());

    let created = 0;
    let updated = 0;

    const CHUNK_SIZE = 200;
    for (let i = 0; i < finalOffers.length; i += CHUNK_SIZE) {
      const chunk = finalOffers.slice(i, i + CHUNK_SIZE).map((offer) => sanitizeForPostgresJson(offer));
      
      // We need to know which are new and which are updates for the log
      const { data: existing } = await supabaseClient
        .from("travel_offers")
        .select("source_id, offer_type")
        .in("source_id", chunk.map(c => c.source_id))
        .eq("source", "viajandocomdesconto");

      const existingKeys = new Set((existing || []).map(e => `${e.source_id}-${e.offer_type}`));
      
      chunk.forEach(c => {
        if (existingKeys.has(`${c.source_id}-${c.offer_type}`)) updated++;
        else created++;
      });

      const { error } = await supabaseClient
        .from("travel_offers")
        .upsert(chunk, { onConflict: "source,source_id,offer_type" });
      if (error) throw error;
    }

    let deactivatedCount = 0;
    const staleOfferTypes = hasFullPackageCatalog
      ? ["bloqueio_aereo", "pacote"]
      : ["bloqueio_aereo"];

    const { data: deactivatedData } = await supabaseClient
      .from("travel_offers")
      .update({ active: false })
      .lt("last_seen_at", executionTimestamp)
      .eq("source", "viajandocomdesconto")
      .in("offer_type", staleOfferTypes)
      .select("id");

    deactivatedCount += deactivatedData?.length || 0;

    if (!hasFullPackageCatalog) {
      const { data: deactivatedSnapshotData } = await supabaseClient
        .from("travel_offers")
        .update({ active: false })
        .lt("last_seen_at", executionTimestamp)
        .eq("source", "viajandocomdesconto")
        .eq("offer_type", "pacote")
        .in("source_type", ["backup", "congelado"])
        .select("id");

      deactivatedCount += deactivatedSnapshotData?.length || 0;
    }

    await supabaseClient.from("travel_sync_logs").insert({
      status: "success",
      offers_found: finalOffers.length,
      offers_created: created,
      offers_updated: updated,
      offers_deactivated: deactivatedCount,
      started_at: startTime,
      finished_at: new Date().toISOString()
    });

    return new Response(JSON.stringify({
      status: "success",
      total_offers: finalOffers.length,
      created,
      updated,
      deactivated: deactivatedCount,
      map_errors: mapErrors,
      raw_execution_info: {
        package_source: hasFullPackageCatalog ? "PACOTES" : "PV_SNAPSHOT",
        package_definitions: hasFullPackageCatalog ? fullPackages.length : 0,
        package_variants: packageVariantsFound,
        guided_groups: guidedGroupsFound,
        total_snapshot: Array.isArray(snapshot) ? snapshot.length : 0,
        ignored_due_to_past_date: packagesIgnoredDueToPastDate
      }
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err: any) {
    console.error("Sync error:", err);
    await createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    ).from("travel_sync_logs").insert({
      status: "error",
      error_message: err.message,
      started_at: startTime,
      finished_at: new Date().toISOString()
    });

    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});