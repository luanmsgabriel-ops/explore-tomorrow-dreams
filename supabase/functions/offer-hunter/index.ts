import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WHATSAPP_ACCESS_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN")!;
const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID")!;

const ADMIN_PHONE_NUMBER = "5515998389220";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ============================================================
// DESTINOS MONITORADOS
// Sazonalidade: meses de alta temporada para cada destino
// ============================================================
const MONITORED_DESTINATIONS = [
  // INTERNACIONAIS (5)
  {
    name: "Santiago do Chile",
    iata: "SCL",
    type: "internacional",
    peak_months: [6, 7, 8], // Inverno austral
    description: "Inverno em Santiago — neve na Cordilheira",
    inclusions: ["Passagem aérea ida e volta", "Hotel 4⭐ (7 noites)", "Café da manhã"],
    nights: 7,
  },
  {
    name: "Bariloche",
    iata: "BRC",
    type: "internacional",
    peak_months: [6, 7, 8], // Inverno para neve
    description: "Inverno em Bariloche — esqui e neve",
    inclusions: ["Passagem aérea ida e volta", "Hotel 3⭐ (6 noites)", "Café da manhã"],
    nights: 6,
  },
  {
    name: "Orlando",
    iata: "MCO",
    type: "internacional",
    peak_months: [1, 7, 12], // Férias escolares
    description: "Orlando — Disney, Universal e muito mais",
    inclusions: ["Passagem aérea ida e volta", "Hotel 3⭐ (8 noites)", "Café da manhã"],
    nights: 8,
  },
  {
    name: "Cancún",
    iata: "CUN",
    type: "internacional",
    peak_months: [12, 1, 2, 3], // Verão/Carnaval
    description: "Cancún — praias paradisíacas e resorts",
    inclusions: ["Passagem aérea ida e volta", "Resort All Inclusive (7 noites)"],
    nights: 7,
  },
  {
    name: "Buenos Aires",
    iata: "EZE",
    type: "internacional",
    peak_months: [9, 10, 11], // Primavera argentina
    description: "Buenos Aires — tango, cultura e gastronomia",
    inclusions: ["Passagem aérea ida e volta", "Hotel 4⭐ (5 noites)", "Café da manhã"],
    nights: 5,
  },

  // NACIONAIS (10)
  {
    name: "Fernando de Noronha",
    iata: "FEN",
    type: "nacional",
    peak_months: [8, 9, 10, 11], // Melhor clima
    description: "Noronha — paraíso ecológico",
    inclusions: ["Passagem aérea ida e volta", "Pousada 3⭐ (5 noites)", "Café da manhã", "TPA inclusa"],
    nights: 5,
  },
  {
    name: "Porto Seguro",
    iata: "BPS",
    type: "nacional",
    peak_months: [12, 1, 2, 3], // Verão
    description: "Porto Seguro — praias e festas",
    inclusions: ["Passagem aérea ida e volta", "Hotel 3⭐ (5 noites)", "Café da manhã"],
    nights: 5,
  },
  {
    name: "Fortaleza",
    iata: "FOR",
    type: "nacional",
    peak_months: [7, 8, 9, 10, 11, 12], // Sol garantido
    description: "Fortaleza — praias e buggy nas dunas",
    inclusions: ["Passagem aérea ida e volta", "Hotel 4⭐ (5 noites)", "Café da manhã"],
    nights: 5,
  },
  {
    name: "Salvador",
    iata: "SSA",
    type: "nacional",
    peak_months: [2, 3, 12, 1], // Carnaval + Verão
    description: "Salvador — cultura, história e praias",
    inclusions: ["Passagem aérea ida e volta", "Hotel 4⭐ (5 noites)", "Café da manhã"],
    nights: 5,
  },
  {
    name: "Florianópolis",
    iata: "FLN",
    type: "nacional",
    peak_months: [12, 1, 2, 3], // Verão
    description: "Florianópolis — ilha da magia",
    inclusions: ["Passagem aérea ida e volta", "Hotel 3⭐ (5 noites)", "Café da manhã"],
    nights: 5,
  },
  {
    name: "Gramado",
    iata: "POA",
    type: "nacional",
    peak_months: [6, 7, 8], // Inverno gaúcho
    description: "Gramado — inverno europeu no Brasil",
    inclusions: ["Passagem aérea ida e volta", "Hotel 4⭐ (4 noites)", "Café da manhã"],
    nights: 4,
  },
  {
    name: "Foz do Iguaçu",
    iata: "IGU",
    type: "nacional",
    peak_months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], // Ano todo
    description: "Foz do Iguaçu — Cataratas e Itaipu",
    inclusions: ["Passagem aérea ida e volta", "Hotel 3⭐ (4 noites)", "Café da manhã"],
    nights: 4,
  },
  {
    name: "Maceió",
    iata: "MCZ",
    type: "nacional",
    peak_months: [12, 1, 2, 3], // Verão
    description: "Maceió — piscinas naturais e praias",
    inclusions: ["Passagem aérea ida e volta", "Hotel 4⭐ (5 noites)", "Café da manhã"],
    nights: 5,
  },
  {
    name: "Natal",
    iata: "NAT",
    type: "nacional",
    peak_months: [12, 1, 2, 3], // Verão
    description: "Natal — dunas e praias do nordeste",
    inclusions: ["Passagem aérea ida e volta", "Hotel 3⭐ (5 noites)", "Café da manhã"],
    nights: 5,
  },
  {
    name: "Manaus",
    iata: "MAO",
    type: "nacional",
    peak_months: [7, 8, 9, 10], // Seca (melhor para turismo)
    description: "Manaus — Amazônia e encontro das águas",
    inclusions: ["Passagem aérea ida e volta", "Hotel 3⭐ (5 noites)", "Café da manhã"],
    nights: 5,
  },
];

// Aeroportos de origem (São Paulo)
const ORIGINS = ["GRU", "CGH", "VCP"];

// ============================================================
// FUNÇÕES AUXILIARES
// ============================================================

async function sendWhatsAppMessage(to: string, message: string): Promise<void> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: { body: message },
        }),
      }
    );
    if (!response.ok) {
      console.error("[OFFER-HUNTER] WhatsApp send failed:", response.status);
    }
  } catch (e) {
    console.error("[OFFER-HUNTER] WhatsApp error:", e);
  }
}

function getCurrentMonth(): number {
  return new Date().getMonth() + 1; // 1-12
}

function isDestinationInSeason(dest: typeof MONITORED_DESTINATIONS[0]): boolean {
  const currentMonth = getCurrentMonth();
  // Check current month and next 2 months
  const relevantMonths = [currentMonth, (currentMonth % 12) + 1, ((currentMonth + 1) % 12) + 1];
  return dest.peak_months.some(m => relevantMonths.includes(m));
}

function getNextPeakDates(dest: typeof MONITORED_DESTINATIONS[0]): { ida: string; volta: string } {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;

  // Find next peak month
  let nextPeakMonth = dest.peak_months.find(m => m >= currentMonth);
  if (!nextPeakMonth) nextPeakMonth = dest.peak_months[0]; // Wrap to next year

  const year = nextPeakMonth >= currentMonth ? now.getFullYear() : now.getFullYear() + 1;

  // Travel in the middle of the peak month
  const departureDay = 15;
  const ida = `${year}-${String(nextPeakMonth).padStart(2, "0")}-${String(departureDay).padStart(2, "0")}`;

  // Return date = departure + nights
  const returnDate = new Date(year, nextPeakMonth - 1, departureDay + dest.nights);
  const volta = `${returnDate.getFullYear()}-${String(returnDate.getMonth() + 1).padStart(2, "0")}-${String(returnDate.getDate()).padStart(2, "0")}`;

  return { ida, volta };
}

async function getMarketAvgPrice(destinationName: string, month: number): Promise<number | null> {
  // Query historical prices from our database
  const { data } = await supabase
    .from("promotional_offers")
    .select("total_price, created_at")
    .eq("is_active", true)
    .ilike("title", `%${destinationName}%`)
    .order("created_at", { ascending: false })
    .limit(10);

  if (!data || data.length === 0) return null;

  const prices = data.map(o => Number(o.total_price)).filter(p => p > 0);
  if (prices.length === 0) return null;

  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
  return avg;
}

async function searchPatriaAirPrice(
  origin: string,
  destination: string,
  departureDate: string,
  returnDate: string
): Promise<number | null> {
  try {
    const supabaseUrl = SUPABASE_URL;
    const response = await fetch(`${supabaseUrl}/functions/v1/patria-air-quotation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        origem: origin,
        destino: destination,
        data_ida: departureDate,
        data_volta: returnDate,
        adultos: 2,
        criancas: 0,
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (data.melhor_opcao?.preco_total) {
      return data.melhor_opcao.preco_total;
    }
    return null;
  } catch (e) {
    console.error("[OFFER-HUNTER] Error searching Pátria air price:", e);
    return null;
  }
}

async function searchCativaPrice(
  origin: string,
  destination: string,
  departureDate: string,
  returnDate: string
): Promise<number | null> {
  try {
    const supabaseUrl = SUPABASE_URL;
    const response = await fetch(`${supabaseUrl}/functions/v1/cotar-viagem`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        origem: origin,
        destino: destination,
        data_ida: departureDate,
        data_volta: returnDate,
        passageiros: { adultos: 2, criancas: 0 },
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (data.melhor_opcao?.preco_total) {
      return data.melhor_opcao.preco_total;
    }
    return null;
  } catch (e) {
    console.error("[OFFER-HUNTER] Error searching Cativa price:", e);
    return null;
  }
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

async function createOfferCandidate(
  dest: typeof MONITORED_DESTINATIONS[0],
  origin: string,
  departureDate: string,
  returnDate: string,
  price: number,
  marketAvg: number,
  discountPercent: number,
  source: string
): Promise<string | null> {
  try {
    // Find or create destination in our database
    const { data: existingDest } = await supabase
      .from("destinations")
      .select("id")
      .ilike("name", `%${dest.name}%`)
      .single();

    let destinationId = existingDest?.id;

    if (!destinationId) {
      // Create destination if it doesn't exist
      const { data: newDest } = await supabase
        .from("destinations")
        .insert({
          name: dest.name,
          slug: dest.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
          location: dest.type === "nacional" ? "Brasil" : "Internacional",
          category: dest.type === "nacional" ? "Nacional" : "Internacional",
          type: dest.type,
          description: dest.description,
          is_active: true,
          is_featured: false,
        })
        .select("id")
        .single();
      destinationId = newDest?.id;
    }

    if (!destinationId) {
      console.error("[OFFER-HUNTER] Could not find/create destination:", dest.name);
      return null;
    }

    // Create offer candidate (pending approval)
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 7); // Valid for 7 days

    const installmentValue = price / 10;
    const title = `${dest.name} — ${dest.nights} noites saindo de ${origin === "GRU" ? "Guarulhos" : origin === "CGH" ? "Congonhas" : "Campinas"}`;

    const { data: offer, error } = await supabase
      .from("promotional_offers")
      .insert({
        destination_id: destinationId,
        title,
        total_price: price,
        cash_price: price * 0.95, // 5% discount for cash
        installments: 10,
        installment_value: installmentValue,
        inclusions: dest.inclusions,
        valid_from: new Date().toISOString(),
        valid_until: validUntil.toISOString(),
        departure_date: departureDate,
        return_date: returnDate,
        is_active: false, // Pending approval
        // Extra fields (will be added via migration)
        // source, market_avg_price, discount_percent, approval_status
      })
      .select("id")
      .single();

    if (error) {
      console.error("[OFFER-HUNTER] Error creating offer:", error);
      return null;
    }

    console.log(`[OFFER-HUNTER] Created offer candidate: ${offer.id} for ${dest.name}`);
    return offer.id;
  } catch (e) {
    console.error("[OFFER-HUNTER] Error in createOfferCandidate:", e);
    return null;
  }
}

async function notifyAdminForApproval(
  offerId: string,
  dest: typeof MONITORED_DESTINATIONS[0],
  origin: string,
  departureDate: string,
  returnDate: string,
  price: number,
  marketAvg: number,
  discountPercent: number,
  source: string
): Promise<void> {
  const originName = origin === "GRU" ? "Guarulhos (GRU)" : origin === "CGH" ? "Congonhas (CGH)" : "Campinas/Viracopos (VCP)";
  const sourceLabel = source === "patria" ? "Pátria Travellink" : "Cativa/Infotravel";

  const message =
    `🔥 *OFERTA ENCONTRADA — APROVAÇÃO NECESSÁRIA*\n\n` +
    `✈️ *São Paulo (${originName}) → ${dest.name}*\n` +
    `📅 Ida: ${formatDate(departureDate)} | Volta: ${formatDate(returnDate)}\n` +
    `🌙 ${dest.nights} noites | 👥 2 adultos\n\n` +
    `💰 *Preço encontrado: ${formatCurrency(price)}*\n` +
    `📊 Preço médio histórico: ${formatCurrency(marketAvg)}\n` +
    `🏷️ Desconto: *${discountPercent.toFixed(1)}% abaixo da média*\n` +
    `🔗 Fonte: ${sourceLabel}\n\n` +
    `📦 *Inclui:*\n${dest.inclusions.map(i => `• ${i}`).join("\n")}\n\n` +
    `*Publicar esta oferta no site?*\n` +
    `Responda *APROVAR ${offerId.substring(0, 8).toUpperCase()}* para publicar\n` +
    `Responda *REJEITAR ${offerId.substring(0, 8).toUpperCase()}* para descartar`;

  await sendWhatsAppMessage(ADMIN_PHONE_NUMBER, message);
  console.log(`[OFFER-HUNTER] Admin notified for offer ${offerId}`);
}

// ============================================================
// MAIN HANDLER
// ============================================================

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const results = {
    destinations_checked: 0,
    offers_found: 0,
    offers_created: 0,
    errors: [] as string[],
    details: [] as Record<string, unknown>[],
  };

  console.log("[OFFER-HUNTER] Starting offer hunt...");

  try {
    // Filter destinations that are in season (or will be soon)
    const inSeasonDests = MONITORED_DESTINATIONS.filter(isDestinationInSeason);
    console.log(`[OFFER-HUNTER] ${inSeasonDests.length} destinations in season`);

    for (const dest of inSeasonDests) {
      results.destinations_checked++;

      try {
        const { ida, volta } = getNextPeakDates(dest);
        console.log(`[OFFER-HUNTER] Checking ${dest.name}: ${ida} → ${volta}`);

        // Get market average price from our historical data
        const marketAvg = await getMarketAvgPrice(dest.name, getCurrentMonth());

        // Search prices from multiple sources
        let bestPrice: number | null = null;
        let bestSource = "";

        // Try Pátria first (primary)
        for (const origin of ORIGINS) {
          const patriaPrice = await searchPatriaAirPrice(origin, dest.iata, ida, volta);
          if (patriaPrice && (!bestPrice || patriaPrice < bestPrice)) {
            bestPrice = patriaPrice;
            bestSource = `patria_${origin}`;
          }
        }

        // Try Cativa as backup
        if (!bestPrice) {
          for (const origin of ORIGINS) {
            const cativaPrice = await searchCativaPrice(origin, dest.iata, ida, volta);
            if (cativaPrice && (!bestPrice || cativaPrice < bestPrice)) {
              bestPrice = cativaPrice;
              bestSource = `cativa_${origin}`;
            }
          }
        }

        if (!bestPrice) {
          console.log(`[OFFER-HUNTER] No price found for ${dest.name}`);
          results.details.push({ destination: dest.name, status: "no_price_found" });
          continue;
        }

        // If no historical average, use current price as reference and skip
        if (!marketAvg) {
          console.log(`[OFFER-HUNTER] No historical avg for ${dest.name}. Storing price for future reference.`);
          results.details.push({
            destination: dest.name,
            status: "no_historical_avg",
            current_price: bestPrice,
          });
          continue;
        }

        // Calculate discount
        const discountPercent = ((marketAvg - bestPrice) / marketAvg) * 100;
        console.log(`[OFFER-HUNTER] ${dest.name}: ${formatCurrency(bestPrice)} vs avg ${formatCurrency(marketAvg)} = ${discountPercent.toFixed(1)}% discount`);

        // Check if it's a good deal (5-10% below average)
        if (discountPercent >= 5) {
          results.offers_found++;

          // Extract origin from source
          const originIata = bestSource.split("_")[1] || "GRU";

          // Create offer candidate in database
          const offerId = await createOfferCandidate(
            dest,
            originIata,
            ida,
            volta,
            bestPrice,
            marketAvg,
            discountPercent,
            bestSource.startsWith("patria") ? "patria" : "cativa"
          );

          if (offerId) {
            results.offers_created++;

            // Notify admin for approval
            await notifyAdminForApproval(
              offerId,
              dest,
              originIata,
              ida,
              volta,
              bestPrice,
              marketAvg,
              discountPercent,
              bestSource.startsWith("patria") ? "patria" : "cativa"
            );

            results.details.push({
              destination: dest.name,
              status: "offer_created",
              offer_id: offerId,
              price: bestPrice,
              market_avg: marketAvg,
              discount_percent: discountPercent.toFixed(1),
              source: bestSource,
            });
          }
        } else {
          results.details.push({
            destination: dest.name,
            status: "price_not_attractive",
            price: bestPrice,
            market_avg: marketAvg,
            discount_percent: discountPercent.toFixed(1),
          });
        }

        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 500));

      } catch (destError) {
        const errMsg = `Error checking ${dest.name}: ${(destError as Error).message}`;
        console.error(`[OFFER-HUNTER] ${errMsg}`);
        results.errors.push(errMsg);
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[OFFER-HUNTER] Done in ${duration}s. Checked: ${results.destinations_checked}, Found: ${results.offers_found}, Created: ${results.offers_created}`);

    // Send summary to admin if offers were found
    if (results.offers_created > 0) {
      const summaryMsg =
        `📊 *RESUMO DA CAÇADA DE OFERTAS*\n\n` +
        `⏱️ Duração: ${duration}s\n` +
        `🔍 Destinos verificados: ${results.destinations_checked}\n` +
        `🎯 Ofertas encontradas: ${results.offers_found}\n` +
        `✅ Aguardando aprovação: ${results.offers_created}\n\n` +
        `Verifique as mensagens acima e responda APROVAR ou REJEITAR para cada oferta.`;
      await sendWhatsAppMessage(ADMIN_PHONE_NUMBER, summaryMsg);
    }

    // Log to database
    await supabase.from("admin_access_logs").insert({
      phone_number: "SYSTEM",
      command_text: "offer_hunter_run",
      query_type: "offer_hunter",
      response_summary: `Checked: ${results.destinations_checked}, Found: ${results.offers_found}, Created: ${results.offers_created}`,
    });

    return new Response(
      JSON.stringify({ success: true, duration_seconds: duration, ...results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[OFFER-HUNTER] Fatal error:", error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message, ...results }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
