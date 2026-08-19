import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const stats = {
    totalBlobLines: 0,
    discardedByDeadline: 0,
    bloqueioAereoCount: 0,
    pacoteCount: 0,
    iataNotFound: 0,
    nonZeroCurrencyFlag: 0,
    errors: [] as string[]
  };

  try {
    const body = await req.json().catch(() => ({}));
    const dryRun = body.dry_run === true;
    const executionTimestamp = new Date().toISOString();

    const targetUrl = "https://viajandocomdesconto.com/";
    const res = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(30000)
    });
    const html = await res.text();

    // 1. EXTRAÇÃO DO MAPA, USD e BLOB
    // O site pode ter PAYLOAD ou __PVOO_PAYLOAD dependendo da página, mas o usuário disse __PVOO_PAYLOAD no prompt anterior
    // e o dump anterior mostrou PAYLOAD.
    // Vamos ser resilientes e procurar ambos.
    const payloadMatch = html.match(/(?:const|var|let)\s+(?:PAYLOAD|__PVOO_PAYLOAD)\s*=\s*({[\s\S]*?});/i);
    if (!payloadMatch) {
        // Tentar encontrar sem o ponto e vírgula no final ou em outros formatos
        const altMatch = html.match(/(?:PAYLOAD|__PVOO_PAYLOAD)\s*=\s*({[\s\S]*?})\s*,?\n/i);
        if (!altMatch) throw new Error("PAYLOAD object not found in HTML");
        payloadMatch = altMatch;
    }
    
    const payloadContent = payloadMatch[1];
    
    // Extração segura de campos do objeto literal sem eval
    const mapaRaw = payloadContent.match(/mapa\s*:\s*({[\s\S]*?}),\s*usd/i)?.[1];
    const usdValueMatch = payloadContent.match(/usd\s*:\s*([\d.]+)/i);
    const usdValue = usdValueMatch ? usdValueMatch[1] : null;
    const blobRaw = payloadContent.match(/blob\s*:\s*[`"']([\s\S]*?)[`"']/i)?.[1];

    if (!mapaRaw || !blobRaw) {
        // Fallback para blob se for uma string simples
        const blobFallback = payloadContent.match(/blob\s*:\s*[`"']([\s\S]*?)[`"']/i);
        if (!blobFallback) throw new Error(`Mapa or Blob not found. Mapa exists: ${!!mapaRaw}, Blob exists: ${!!blobRaw}`);
    }

    // Parser manual para o mapa
    const mapa: Record<string, string[]> = {};
    const mapaEntries = mapaRaw.match(/"[A-Z0-9]{3}"\s*:\s*\[\s*"[^"]*"\s*,\s*"[^"]*"\s*\]/g) || [];
    mapaEntries.forEach(entry => {
      const parts = entry.match(/"([^"]+)"/g)?.map(p => p.replace(/"/g, '')) || [];
      if (parts.length === 3) {
        mapa[parts[0]] = [parts[1], parts[2]];
      }
    });

    // 2. PROCESSAMENTO DO BLOB (Bloqueios Aéreos)
    const lines = blobRaw.split('\n').filter(l => l.trim().length > 0);
    stats.totalBlobLines = lines.length;
    
    const now = new Date();
    const flightOffers = [];

    for (const line of lines) {
      const cols = line.split('|').map(c => c.trim());
      if (cols.length < 9) continue;

      // Datas: AAMMDD -> ISO
      const parseDate = (d: string) => {
        if (!d || d.length !== 6) return null;
        const year = 2000 + parseInt(d.substring(0, 2));
        const month = d.substring(2, 4);
        const day = d.substring(4, 6);
        return `${year}-${month}-${day}`;
      };

      const departureDate = parseDate(cols[2]);
      const returnDate = parseDate(cols[3]);
      const deadlineStr = parseDate(cols[8]);

      if (!deadlineStr) continue;
      // Descarte se deadline for anterior à execução (ignorando o comportamento bugado do site)
      const deadline = new Date(deadlineStr + 'T23:59:59');
      if (deadline < now) {
        stats.discardedByDeadline++;
        continue;
      }

      const originIata = cols[0];
      const destIata = cols[1];

      if (!mapa[originIata]) stats.iataNotFound++;
      if (!mapa[destIata]) stats.iataNotFound++;

      const originCity = mapa[originIata]?.[0] || originIata;
      const destName = mapa[destIata]?.[1] || destIata;

      const currencyFlag = parseInt(cols[7] || "0");
      if (currencyFlag !== 0) stats.nonZeroCurrencyFlag++;
      const currency = currencyFlag === 0 ? 'BRL' : 'USD';

      const parseTime = (t: string) => {
        if (!t || t.length !== 4) return null;
        return `${t.substring(0, 2)}:${t.substring(2, 4)}`;
      };

      const price = parseFloat(cols[6]);
      const airline = cols[15] || null;

      // Hash determinístico para source_id
      const dataToHash = `${originIata}|${destIata}|${departureDate}|${returnDate}|${airline}|${price}`;
      const sourceId = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(dataToHash))))
        .map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);

      flightOffers.push({
        source: 'viajandocomdesconto',
        source_id: sourceId,
        offer_type: 'bloqueio_aereo',
        origin_city: originCity,
        origin_iata: originIata,
        destination_name: destName,
        destination_iata: destIata,
        departure_date: departureDate,
        return_date: returnDate,
        nights: parseInt(cols[4]),
        available_seats: parseInt(cols[5]),
        price_per_person: price,
        currency,
        boarding_tax: parseFloat(cols[13]) || 0,
        issue_deadline: deadlineStr,
        airline,
        outbound_departure_time: parseTime(cols[9]),
        outbound_arrival_time: parseTime(cols[10]),
        return_departure_time: parseTime(cols[11]),
        return_arrival_time: parseTime(cols[12]),
        raw_data: { is_national: cols[14] === '1', original_line: line },
        last_seen_at: executionTimestamp,
        active: true
      });
      stats.bloqueioAereoCount++;
    }

    // 3. PROCESSAMENTO DO PV_SNAPSHOT (Pacotes)
    const snapshotMatch = html.match(/PV_SNAPSHOT = (\[[\s\S]*?\]);/);
    const packageOffers = [];
    if (snapshotMatch) {
      const objBlocks = snapshotMatch[1].match(/{[\s\S]*?}/g) || [];
      for (const block of objBlocks) {
        try {
          const getValue = (key: string) => {
            const m = block.match(new RegExp(`['"]?${key}['"]?\\s*:\\s*['"]([^'"]*)['"]`));
            return m ? m[1] : null;
          };

          const nome = getValue('nome');
          const destino = getValue('destino');
          const origemIata = getValue('origem_iata');
          const origemCidade = getValue('origem_cidade');
          const uf = getValue('uf');
          const dataStr = getValue('data'); 
          const precoRaw = getValue('por'); 
          const taxas = getValue('taxas');
          const minLabel = getValue('min_label');
          const fonte = getValue('fonte');

          if (!nome || !precoRaw) continue;

          const price = parseFloat(precoRaw.replace(/[^\d,]/g, '').replace(',', '.'));
          const boardingTax = taxas ? parseFloat(taxas.replace(/[^\d,]/g, '').replace(',', '.')) : 0;

          let departureDate = null;
          let returnDate = null;
          if (dataStr && dataStr.includes(' a ')) {
            const parts = dataStr.split(' a ');
            const parseBR = (s: string) => {
              const dParts = s.split('/');
              if (dParts.length !== 3) return null;
              return `${dParts[2]}-${dParts[1]}-${dParts[0]}`;
            };
            departureDate = parseBR(parts[0]);
            returnDate = parseBR(parts[1]);
          }

          const sourceId = `pkg_${nome}_${origemIata}_${dataStr}`.replace(/\s+/g, '_');

          packageOffers.push({
            source: 'viajandocomdesconto',
            source_id: sourceId,
            offer_type: 'pacote',
            origin_city: origemCidade,
            origin_iata: origemIata,
            destination_name: destino,
            destination_iata: null,
            departure_date: departureDate,
            return_date: returnDate,
            price_per_person: price,
            currency: 'BRL',
            boarding_tax: boardingTax,
            raw_data: { uf, min_label: minLabel, fonte, original_name: nome },
            last_seen_at: executionTimestamp,
            active: true
          });
          stats.pacoteCount++;
        } catch (e) {
          stats.errors.push(`Erro processando pacote: ${e.message}`);
        }
      }
    }

    if (dryRun) {
      return new Response(JSON.stringify({
        status: "dry_run_complete",
        stats,
        usd_value: usdValue,
        sample_flights: flightOffers.slice(0, 3),
        sample_packages: packageOffers.slice(0, 3)
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 4. PERSISTÊNCIA (EXECUÇÃO REAL)
    const allOffers = [...flightOffers, ...packageOffers];
    if (allOffers.length > 0) {
      const { error: upsertError } = await supabase
        .from('travel_offers')
        .upsert(allOffers, { onConflict: 'source,source_id,offer_type' });

      if (upsertError) throw upsertError;

      const { error: deactivateError } = await supabase
        .from('travel_offers')
        .update({ active: false })
        .lt('last_seen_at', executionTimestamp)
        .eq('source', 'viajandocomdesconto');
      
      if (deactivateError) throw deactivateError;
    }

    await supabase.from('travel_sync_logs').insert({
      status: 'success',
      offers_found: stats.totalBlobLines + packageOffers.length,
      offers_created: allOffers.length,
      offers_deactivated: 0,
      finished_at: new Date().toISOString()
    });

    return new Response(JSON.stringify({ status: "success", stats }), { 
      status: 200, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });

  } catch (err: any) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message, stats }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});