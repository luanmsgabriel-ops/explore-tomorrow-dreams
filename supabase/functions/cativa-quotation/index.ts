import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const INFOTRAVEL_API = "https://reservas.cativaoperadora.com.br/infotravel/api/v1";
const INFOTRAVEL_USERNAME = Deno.env.get("INFOTRAVEL_USERNAME")!;
const INFOTRAVEL_PASSWORD = Deno.env.get("INFOTRAVEL_PASSWORD")!;
const INFOTRAVEL_CLIENT = Deno.env.get("INFOTRAVEL_CLIENT")!;
const INFOTRAVEL_AGENCY = Deno.env.get("INFOTRAVEL_AGENCY")!;

// Simple in-memory token cache (per isolate)
let cachedToken: string | null = null;
let tokenExpiry = 0;

// City name → IATA code mapping for Brazilian airports
const CITY_IATA: Record<string, string> = {
  // São Paulo
  "sao paulo": "GRU", "são paulo": "GRU", "sp": "GRU", "guarulhos": "GRU", "congonhas": "CGH",
  // Rio de Janeiro
  "rio de janeiro": "GIG", "rio": "GIG", "galeao": "GIG", "galeão": "GIG", "santos dumont": "SDU",
  // Nordeste
  "salvador": "SSA", "recife": "REC", "fortaleza": "FOR", "natal": "NAT",
  "maceio": "MCZ", "maceió": "MCZ", "joao pessoa": "JPA", "joão pessoa": "JPA",
  "aracaju": "AJU", "sao luis": "SLZ", "são luís": "SLZ", "teresina": "THE",
  // Norte
  "manaus": "MAO", "belem": "BEL", "belém": "BEL", "porto velho": "PVH",
  "macapa": "MCP", "macapá": "MCP", "boa vista": "BVB", "palmas": "PMW",
  "rio branco": "RBR", "santarem": "STM", "santarém": "STM",
  // Sul
  "porto alegre": "POA", "curitiba": "CWB", "florianopolis": "FLN", "florianópolis": "FLN",
  // Centro-Oeste
  "brasilia": "BSB", "brasília": "BSB", "goiania": "GYN", "goiânia": "GYN",
  "campo grande": "CGR", "cuiaba": "CGB", "cuiabá": "CGB",
  // Sudeste (outros)
  "belo horizonte": "CNF", "confins": "CNF", "vitoria": "VIX", "vitória": "VIX",
  "campinas": "VCP", "viracopos": "VCP", "uberlandia": "UDI", "uberlândia": "UDI",
  // Interior SP
  "ribeirao preto": "RAO", "ribeirão preto": "RAO", "sao jose do rio preto": "SJP",
  "bauru": "BAU", "marilia": "MII", "marília": "MII", "presidente prudente": "PPB",
  "sorocaba": "SOD",
  // Destinos turísticos
  "fernando de noronha": "FEN", "noronha": "FEN",
  "porto seguro": "BPS", "ilheus": "IOS", "ilhéus": "IOS",
  "foz do iguacu": "IGU", "foz do iguaçu": "IGU",
  "chapada dos veadeiros": "BSB", // Nearest airport
  "bonito": "CGR", // Nearest airport
  "lencois maranhenses": "SLZ", "lençóis maranhenses": "SLZ",
  "jericoacoara": "FOR", "jeri": "FOR",
  "gramado": "POA", "canela": "POA",
  // Internacional - destinos populares
  "cancun": "CUN", "cancún": "CUN",
  "punta cana": "PUJ",
  "santiago": "SCL",
  "buenos aires": "EZE",
  "lima": "LIM",
  "bogota": "BOG", "bogotá": "BOG",
  "cartagena": "CTG",
  "orlando": "MCO",
  "miami": "MIA",
  "nova york": "JFK", "new york": "JFK", "nova iorque": "JFK",
  "lisboa": "LIS",
  "porto": "OPO",
  "madrid": "MAD",
  "barcelona": "BCN",
  "paris": "CDG",
  "roma": "FCO",
  "milao": "MXP", "milão": "MXP",
  "londres": "LHR",
  "amsterdam": "AMS",
  "dubai": "DXB",
  "cairo": "CAI",
  "cape town": "CPT", "cidade do cabo": "CPT",
  "toquio": "NRT", "tokyo": "NRT", "tóquio": "NRT",
  "bali": "DPS",
  "maldivas": "MLE",
  "santorini": "JTR",
  "machu picchu": "CUZ",
  "cusco": "CUZ",
  "montevideo": "MVD", "montevidéu": "MVD",
  "san andres": "ADZ", "san andrés": "ADZ",
  "aruba": "AUA",
  "curacao": "CUR", "curaçao": "CUR",
};

function resolveIata(cityOrCode: string): string {
  if (!cityOrCode) return "";
  const clean = cityOrCode.trim();
  // Already an IATA code (3 uppercase letters)
  if (/^[A-Z]{3}$/.test(clean)) return clean;
  const key = clean.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  // Try exact match first, then normalized
  return CITY_IATA[clean.toLowerCase()] || CITY_IATA[key] || clean.toUpperCase().substring(0, 3);
}

function buildOccupancy(adults: number, children: number, childrenAges: number[]): string {
  // Format: numberOfAdults[-childAge1[,childAge2]]
  let occ = String(adults || 2);
  if (children > 0 && childrenAges.length > 0) {
    occ += "-" + childrenAges.join(",");
  } else if (children > 0) {
    // Default ages if not provided
    const defaultAges = Array(children).fill(8);
    occ += "-" + defaultAges.join(",");
  }
  return occ;
}

async function authenticate(): Promise<string> {
  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && Date.now() < tokenExpiry - 60000) {
    return cachedToken;
  }

  console.log("[CATIVA] Authenticating with Infotravel API...");
  console.log("[CATIVA] Auth URL:", `${INFOTRAVEL_API}/authenticate`);
  console.log("[CATIVA] Has username:", !!INFOTRAVEL_USERNAME, "length:", INFOTRAVEL_USERNAME?.length);
  console.log("[CATIVA] Has password:", !!INFOTRAVEL_PASSWORD, "length:", INFOTRAVEL_PASSWORD?.length);
  console.log("[CATIVA] Has client:", !!INFOTRAVEL_CLIENT, "client value:", INFOTRAVEL_CLIENT);
  console.log("[CATIVA] Has agency:", !!INFOTRAVEL_AGENCY, "agency value:", INFOTRAVEL_AGENCY);

  const authBody = {
    username: INFOTRAVEL_USERNAME,
    password: INFOTRAVEL_PASSWORD,
    client: INFOTRAVEL_CLIENT,
    agency: INFOTRAVEL_AGENCY,
  };
  console.log("[CATIVA] Auth body keys:", Object.keys(authBody));

  const response = await fetch(`${INFOTRAVEL_API}/authenticate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(authBody),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("[CATIVA] Auth failed:", response.status, errText);
    // Log username hint for debugging (first 3 chars only)
    console.error("[CATIVA] Username starts with:", INFOTRAVEL_USERNAME?.substring(0, 3));
    throw new Error(`Infotravel auth failed: ${response.status}`);
  }

  const data = await response.json();
  cachedToken = data.accessToken || data.access_token || data.token;
  tokenExpiry = Date.now() + (data.expire_seconds || data.expiresIn || 500) * 1000;
  console.log("[CATIVA] Authenticated successfully, token expires in", data.expire_seconds || data.expiresIn, "s");
  return cachedToken!;
}

interface QuotationRequest {
  origem: string;
  destino: string;
  data_ida: string; // DD/MM/YYYY or YYYY-MM-DD
  data_volta: string;
  adultos?: number;
  criancas?: number;
  idades_criancas?: number[];
}

function parseDate(d: string): string {
  // Convert DD/MM/YYYY to YYYY-MM-DD
  const parts = d.split("/");
  if (parts.length === 3 && parts[0].length <= 2) {
    let year = parseInt(parts[2], 10);
    if (year < 100) year += 2000;
    return `${year}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
  }
  return d; // Already YYYY-MM-DD
}

interface PackageResult {
  hotel: string;
  hotel_stars?: number;
  hotel_rating?: number;
  regime?: string;
  voo_ida?: string;
  voo_volta?: string;
  paradas_ida?: number;
  paradas_volta?: number;
  noites: number;
  preco: number;
  preco_por_pessoa?: number;
  moeda?: string;
  operadora?: string;
  categoria?: string;
  imagem_hotel?: string;
  quarto_tipo?: string;
}

function extractPackageResults(apiData: any, adults: number, children: number): PackageResult[] {
  const results: PackageResult[] = [];

  try {
    // The Infotravel API returns a complex structure
    // packageAvailRS > packageAvail > packages or similar
    const packages = apiData?.packageAvailRS?.packages
      || apiData?.packages
      || apiData?.packageAvailRS?.packageAvail?.packages
      || apiData?.results
      || (Array.isArray(apiData) ? apiData : null);

    if (!packages || !Array.isArray(packages)) {
      console.log("[CATIVA] No packages array found in response. Keys:", Object.keys(apiData || {}));
      // Try to navigate the response structure
      if (apiData?.packageAvailRS) {
        console.log("[CATIVA] packageAvailRS keys:", Object.keys(apiData.packageAvailRS));
      }
      return results;
    }

    const totalPax = (adults || 1) + (children || 0);

    for (const pkg of packages.slice(0, 10)) { // Limit to top 10
      try {
        // Extract hotel info
        const hotel = pkg.hotel || pkg.accommodation || pkg.hospedagem || {};
        const hotelName = hotel.name || hotel.nome || hotel.hotelName || pkg.hotelName || "Hotel";
        const hotelStars = hotel.stars || hotel.category || hotel.estrelas || hotel.starRating;
        const hotelRating = hotel.rating || hotel.avaliacao || hotel.reviewScore;

        // Extract flight info
        const flights = pkg.flights || pkg.voos || pkg.air || {};
        const outbound = flights.outbound || flights.ida || flights[0];
        const inbound = flights.inbound || flights.volta || flights[1];

        let vooIda = "";
        let vooVolta = "";
        let paradasIda = 0;
        let paradasVolta = 0;

        if (outbound) {
          const airline = outbound.airline || outbound.companhia || outbound.operatingAirline || "";
          const flightNum = outbound.flightNumber || outbound.numero || "";
          const depTime = outbound.departureTime || outbound.horaSaida || "";
          const arrTime = outbound.arrivalTime || outbound.horaChegada || "";
          const stops = outbound.stops || outbound.paradas || outbound.numberOfStops || 0;
          vooIda = `${airline} ${flightNum} ${depTime}${arrTime ? " → " + arrTime : ""}`.trim();
          paradasIda = stops;
        }

        if (inbound) {
          const airline = inbound.airline || inbound.companhia || inbound.operatingAirline || "";
          const flightNum = inbound.flightNumber || inbound.numero || "";
          const depTime = inbound.departureTime || inbound.horaSaida || "";
          const arrTime = inbound.arrivalTime || inbound.horaChegada || "";
          const stops = inbound.stops || inbound.paradas || inbound.numberOfStops || 0;
          vooVolta = `${airline} ${flightNum} ${depTime}${arrTime ? " → " + arrTime : ""}`.trim();
          paradasVolta = stops;
        }

        // Extract price
        const price = pkg.totalPrice || pkg.price || pkg.preco || pkg.valor
          || pkg.totalAmount || pkg.amount
          || hotel.totalPrice || hotel.price
          || pkg.pricing?.total || pkg.pricing?.totalPrice || 0;

        // Extract room/board info
        const room = pkg.room || pkg.quarto || hotel.room || {};
        const regime = room.boardType || room.regime || room.mealPlan
          || pkg.boardType || pkg.regime || pkg.mealPlan
          || hotel.boardType || "";
        const roomType = room.name || room.tipo || room.roomType || pkg.roomType || "";

        // Extract nights
        const nights = pkg.nights || pkg.noites || pkg.duration || hotel.nights || 0;

        // Extract currency
        const currency = pkg.currency || pkg.moeda || "BRL";

        // Extract operator/supplier
        const operator = pkg.supplier || pkg.operadora || pkg.provider || pkg.integration || "";

        // Hotel image
        const imgUrl = hotel.imageUrl || hotel.image || hotel.photo || hotel.mainImage || "";

        const priceNum = typeof price === "number" ? price : parseFloat(String(price)) || 0;

        results.push({
          hotel: hotelName,
          hotel_stars: hotelStars ? Number(hotelStars) : undefined,
          hotel_rating: hotelRating ? Number(hotelRating) : undefined,
          regime: regime || undefined,
          voo_ida: vooIda || undefined,
          voo_volta: vooVolta || undefined,
          paradas_ida: paradasIda,
          paradas_volta: paradasVolta,
          noites: nights,
          preco: priceNum,
          preco_por_pessoa: totalPax > 0 ? Math.round((priceNum / totalPax) * 100) / 100 : undefined,
          moeda: currency,
          operadora: operator || "Cativa",
          categoria: hotelStars ? `${hotelStars} estrelas` : undefined,
          imagem_hotel: imgUrl || undefined,
          quarto_tipo: roomType || undefined,
        });
      } catch (pkgErr) {
        console.error("[CATIVA] Error parsing package:", pkgErr);
      }
    }
  } catch (e) {
    console.error("[CATIVA] Error extracting results:", e);
  }

  // Sort by price ascending
  results.sort((a, b) => a.preco - b.preco);
  return results;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: QuotationRequest = await req.json();
    const { origem, destino, data_ida, data_volta, adultos = 2, criancas = 0, idades_criancas = [] } = body;

    if (!origem || !destino || !data_ida || !data_volta) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios: origem, destino, data_ida, data_volta" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Resolve IATA codes
    const originIata = resolveIata(origem);
    const destIata = resolveIata(destino);
    const startDate = parseDate(data_ida);
    const endDate = parseDate(data_volta);
    const occupancy = buildOccupancy(adultos, criancas, idades_criancas);

    console.log(`[CATIVA] Searching: ${originIata} → ${destIata}, ${startDate} to ${endDate}, occ=${occupancy}`);

    // Authenticate
    const token = await authenticate();

    // Try hotel_flight first (full package with flights + hotel)
    const packageTypes = ["hotel_flight", "dynamic", "hotel"];
    let apiData: any = null;
    let usedType = "";

    for (const pkgType of packageTypes) {
      try {
        const params = new URLSearchParams({
          start: startDate,
          end: endDate,
          occupancy: occupancy,
          originIata: originIata,
          destinationIata: destIata,
          nationality: "BR",
        });

        const url = `${INFOTRAVEL_API}/avail/package/${pkgType}?${params.toString()}`;
        console.log(`[CATIVA] Trying ${pkgType}: ${url}`);

        const response = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errText = await response.text();
          console.log(`[CATIVA] ${pkgType} returned ${response.status}: ${errText.substring(0, 300)}`);
          continue;
        }

        const data = await response.json();
        console.log(`[CATIVA] ${pkgType} response keys:`, Object.keys(data));

        // Check if there are actual results
        const hasResults = data?.packageAvailRS?.packages?.length > 0
          || data?.packages?.length > 0
          || data?.results?.length > 0
          || (Array.isArray(data) && data.length > 0);

        if (hasResults) {
          apiData = data;
          usedType = pkgType;
          console.log(`[CATIVA] Found results with ${pkgType}!`);
          break;
        } else {
          console.log(`[CATIVA] ${pkgType} returned no results`);
        }
      } catch (fetchErr) {
        console.error(`[CATIVA] Error fetching ${pkgType}:`, fetchErr);
      }
    }

    if (!apiData) {
      console.log("[CATIVA] No results found from any package type");
      return new Response(
        JSON.stringify({
          success: true,
          resultados: [],
          message: "Nenhuma cotação encontrada para essas datas e destino.",
          search_params: { originIata, destIata, startDate, endDate, occupancy },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Parse results
    const results = extractPackageResults(apiData, adultos, criancas);
    console.log(`[CATIVA] Extracted ${results.length} packages from ${usedType}`);

    return new Response(
      JSON.stringify({
        success: true,
        resultados: results,
        total_opcoes: results.length,
        tipo_busca: usedType,
        search_params: { originIata, destIata, startDate, endDate, occupancy },
        raw_response_keys: Object.keys(apiData),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("[CATIVA] Error:", error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
