import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PATRIA_API_BASE = "https://portalfrontur.tur.br/TravellinkWebApi/api";
const PATRIA_DEVELOPER_TOKEN = Deno.env.get("PATRIA_DEVELOPER_TOKEN")!;
const PATRIA_COMPANY_IDENTIFIER = Deno.env.get("PATRIA_COMPANY_IDENTIFIER")!;
const PATRIA_COMPANY_PASSWORD = Deno.env.get("PATRIA_COMPANY_PASSWORD")!;
const PATRIA_PUBLIC_KEY_RSA = Deno.env.get("PATRIA_PUBLIC_KEY_RSA")!;

// In-memory token cache
let cachedToken: string | null = null;
let tokenExpiry = 0;

// IATA code mapping for Brazilian and international cities
const CITY_IATA: Record<string, string> = {
  // São Paulo (saídas permitidas)
  "sao paulo": "GRU", "são paulo": "GRU", "guarulhos": "GRU", "sp": "GRU",
  "congonhas": "CGH", "campinas": "VCP", "viracopos": "VCP",
  // Rio de Janeiro
  "rio de janeiro": "GIG", "rio": "GIG", "galeao": "GIG", "galeão": "GIG",
  "santos dumont": "SDU",
  // Nordeste
  "salvador": "SSA", "recife": "REC", "fortaleza": "FOR", "natal": "NAT",
  "maceio": "MCZ", "maceió": "MCZ", "joao pessoa": "JPA", "joão pessoa": "JPA",
  "aracaju": "AJU", "sao luis": "SLZ", "são luís": "SLZ",
  // Norte
  "manaus": "MAO", "belem": "BEL", "belém": "BEL",
  // Sul
  "porto alegre": "POA", "curitiba": "CWB", "florianopolis": "FLN", "florianópolis": "FLN",
  // Centro-Oeste
  "brasilia": "BSB", "brasília": "BSB", "goiania": "GYN", "goiânia": "GYN",
  "campo grande": "CGR",
  // Sudeste
  "belo horizonte": "CNF", "confins": "CNF", "vitoria": "VIX", "vitória": "VIX",
  // Turísticos nacionais
  "fernando de noronha": "FEN", "noronha": "FEN",
  "porto seguro": "BPS", "foz do iguacu": "IGU", "foz do iguaçu": "IGU",
  "gramado": "POA", "canela": "POA",
  // Internacional - América do Sul
  "santiago": "SCL", "santiago do chile": "SCL",
  "bariloche": "BRC",
  "buenos aires": "EZE",
  "lima": "LIM",
  "bogota": "BOG", "bogotá": "BOG",
  "montevideo": "MVD", "montevidéu": "MVD",
  "cusco": "CUZ", "machu picchu": "CUZ",
  // Internacional - América Central/Caribe
  "cancun": "CUN", "cancún": "CUN",
  "punta cana": "PUJ",
  "san andres": "ADZ", "san andrés": "ADZ",
  "aruba": "AUA",
  "cartagena": "CTG",
  // Internacional - América do Norte
  "orlando": "MCO",
  "miami": "MIA",
  "nova york": "JFK", "new york": "JFK", "nova iorque": "JFK",
  // Internacional - Europa
  "lisboa": "LIS",
  "porto": "OPO",
  "madrid": "MAD",
  "barcelona": "BCN",
  "paris": "CDG",
  "roma": "FCO",
  "milao": "MXP", "milão": "MXP",
  "londres": "LHR",
  "amsterdam": "AMS",
  // Internacional - Outros
  "dubai": "DXB",
  "toquio": "NRT", "tokyo": "NRT", "tóquio": "NRT",
  "bali": "DPS",
  "maldivas": "MLE",
  "santorini": "JTR",
};

function resolveIata(cityOrCode: string): string {
  if (!cityOrCode) return "";
  const clean = cityOrCode.trim();
  if (/^[A-Z]{3}$/.test(clean)) return clean;
  const normalized = clean.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return CITY_IATA[clean.toLowerCase()] || CITY_IATA[normalized] || clean.toUpperCase().substring(0, 3);
}

async function encryptPassword(password: string, publicKeyPem: string): Promise<string> {
  try {
    const pemContents = publicKeyPem
      .replace("-----BEGIN PUBLIC KEY-----", "")
      .replace("-----END PUBLIC KEY-----", "")
      .replace(/\s/g, "");
    const binaryDer = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));
    const publicKey = await crypto.subtle.importKey(
      "spki", binaryDer,
      { name: "RSA-OAEP", hash: "SHA-256" },
      false, ["encrypt"]
    );
    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: "RSA-OAEP" }, publicKey, new TextEncoder().encode(password)
    );
    return btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer)));
  } catch {
    return btoa(password);
  }
}

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry - 300000) return cachedToken!;

  const encryptedPassword = PATRIA_PUBLIC_KEY_RSA
    ? await encryptPassword(PATRIA_COMPANY_PASSWORD, PATRIA_PUBLIC_KEY_RSA)
    : PATRIA_COMPANY_PASSWORD;

  const response = await fetch(`${PATRIA_API_BASE}/Authentication/Authenticate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      DeveloperAccessCode: PATRIA_DEVELOPER_TOKEN,
      CompanyIdentifier: PATRIA_COMPANY_IDENTIFIER,
      CompanyPassword: encryptedPassword,
    }),
  });

  if (!response.ok) throw new Error(`Pátria auth failed: ${response.status}`);
  const data = await response.json();
  const token = data.AccessToken || data.accessToken || data.token;
  if (!token) throw new Error("No token in Pátria auth response");
  cachedToken = token;
  tokenExpiry = Date.now() + (data.ExpiresIn || 1800) * 1000;
  return token;
}

interface AirQuotationRequest {
  origem: string;       // City name or IATA code
  destino: string;      // City name or IATA code
  data_ida: string;     // YYYY-MM-DD
  data_volta: string;   // YYYY-MM-DD
  adultos?: number;
  criancas?: number;
  idades_criancas?: number[];
}

interface FlightResult {
  airline: string;
  flight_number: string;
  departure_time: string;
  arrival_time: string;
  stops: number;
  duration: string;
  price_per_person: number;
  total_price: number;
  currency: string;
  cabin_class: string;
  baggage_included: boolean;
  source: string;
}

interface AirQuotationResponse {
  success: boolean;
  origem_iata: string;
  destino_iata: string;
  data_ida: string;
  data_volta: string;
  adultos: number;
  criancas: number;
  voos_ida: FlightResult[];
  voos_volta: FlightResult[];
  melhor_opcao?: {
    voo_ida: FlightResult;
    voo_volta: FlightResult;
    preco_total: number;
    preco_por_pessoa: number;
  };
  total_opcoes: number;
  error?: string;
}

function parseDate(d: string): string {
  const parts = d.split("/");
  if (parts.length === 3 && parts[0].length <= 2) {
    const year = parseInt(parts[2]) < 100 ? 2000 + parseInt(parts[2]) : parseInt(parts[2]);
    return `${year}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
  }
  return d;
}

function extractFlights(apiData: unknown, paxCount: number): FlightResult[] {
  const results: FlightResult[] = [];
  try {
    const data = apiData as Record<string, unknown>;
    // Try different response structures from Pátria API
    const flights = (data?.Flights || data?.flights || data?.AirAvailRS?.Flights ||
      data?.availabilityRS?.flights || (Array.isArray(data) ? data : null)) as unknown[];

    if (!flights || !Array.isArray(flights)) {
      console.log("[PATRIA-AIR] No flights array. Keys:", Object.keys(data || {}));
      return results;
    }

    for (const flight of flights.slice(0, 10)) {
      try {
        const f = flight as Record<string, unknown>;
        const airline = (f.Airline || f.airline || f.AirlineCode || f.carrier || "") as string;
        const flightNum = (f.FlightNumber || f.flightNumber || f.Number || "") as string;
        const depTime = (f.DepartureTime || f.departureTime || f.departure || "") as string;
        const arrTime = (f.ArrivalTime || f.arrivalTime || f.arrival || "") as string;
        const stops = (f.Stops || f.stops || f.NumberOfStops || 0) as number;
        const duration = (f.Duration || f.duration || f.FlightTime || "") as string;
        const price = (f.Price || f.price || f.Amount || f.TotalPrice || f.totalPrice || 0) as number;
        const currency = (f.Currency || f.currency || "BRL") as string;
        const cabin = (f.CabinClass || f.cabinClass || f.Cabin || "Economy") as string;
        const baggage = !!(f.BaggageIncluded || f.baggageIncluded || f.Baggage);

        results.push({
          airline: String(airline),
          flight_number: String(flightNum),
          departure_time: String(depTime),
          arrival_time: String(arrTime),
          stops: Number(stops),
          duration: String(duration),
          price_per_person: price / paxCount,
          total_price: price,
          currency: String(currency),
          cabin_class: String(cabin),
          baggage_included: baggage,
          source: "patria_travellink",
        });
      } catch (e) {
        console.error("[PATRIA-AIR] Error parsing flight:", e);
      }
    }
  } catch (e) {
    console.error("[PATRIA-AIR] Error extracting flights:", e);
  }
  return results;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: AirQuotationRequest = await req.json();
    const { origem, destino, data_ida, data_volta, adultos = 1, criancas = 0, idades_criancas = [] } = body;

    if (!origem || !destino || !data_ida || !data_volta) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios: origem, destino, data_ida, data_volta" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const origemIata = resolveIata(origem);
    const destinoIata = resolveIata(destino);
    const dataIdaFormatted = parseDate(data_ida);
    const dataVoltaFormatted = parseDate(data_volta);
    const paxTotal = adultos + criancas;

    console.log(`[PATRIA-AIR] Searching: ${origemIata} → ${destinoIata} | ${dataIdaFormatted} - ${dataVoltaFormatted} | ${adultos}A ${criancas}C`);

    const token = await getToken();

    // Build passengers array for Pátria API
    const passengers = [];
    for (let i = 0; i < adultos; i++) {
      passengers.push({ Type: "ADT", Age: 30 });
    }
    for (let i = 0; i < criancas; i++) {
      passengers.push({ Type: "CHD", Age: idades_criancas[i] || 8 });
    }

    // Search outbound flight
    const searchPayload = {
      Origin: origemIata,
      Destination: destinoIata,
      DepartureDate: dataIdaFormatted,
      ReturnDate: dataVoltaFormatted,
      Passengers: passengers,
      CabinClass: "Economy",
      DirectFlightsOnly: false,
      MaxConnections: 1,
    };

    const airResponse = await fetch(`${PATRIA_API_BASE}/Air/Availability`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(searchPayload),
    });

    if (!airResponse.ok) {
      const errText = await airResponse.text();
      console.error("[PATRIA-AIR] API error:", airResponse.status, errText);
      throw new Error(`Pátria Air API error: ${airResponse.status}`);
    }

    const airData = await airResponse.json();
    const voosIda = extractFlights(airData?.outbound || airData?.Outbound || airData, paxTotal);
    const voosVolta = extractFlights(airData?.inbound || airData?.Inbound || airData?.return || airData?.Return || [], paxTotal);

    // Find best option (cheapest with max 1 stop)
    const melhorIda = voosIda.filter(v => v.stops <= 1).sort((a, b) => a.total_price - b.total_price)[0];
    const melhorVolta = voosVolta.filter(v => v.stops <= 1).sort((a, b) => a.total_price - b.total_price)[0];

    const result: AirQuotationResponse = {
      success: true,
      origem_iata: origemIata,
      destino_iata: destinoIata,
      data_ida: dataIdaFormatted,
      data_volta: dataVoltaFormatted,
      adultos,
      criancas,
      voos_ida: voosIda,
      voos_volta: voosVolta,
      total_opcoes: voosIda.length,
    };

    if (melhorIda && melhorVolta) {
      const precoTotal = melhorIda.total_price + melhorVolta.total_price;
      result.melhor_opcao = {
        voo_ida: melhorIda,
        voo_volta: melhorVolta,
        preco_total: precoTotal,
        preco_por_pessoa: precoTotal / paxTotal,
      };
    }

    console.log(`[PATRIA-AIR] Found ${voosIda.length} outbound flights`);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[PATRIA-AIR] Error:", error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message, total_opcoes: 0 }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
