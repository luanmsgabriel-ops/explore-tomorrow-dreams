import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

/**
 * Calls an internal Supabase Edge Function
 */
async function callFunction(name: string, body: Record<string, unknown>): Promise<unknown> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`${name} error: ${response.status} - ${err}`);
  }

  return response.json();
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

interface PackageQuotationRequest {
  origem: string;
  destino: string;
  data_ida: string;
  data_volta: string;
  adultos?: number;
  criancas?: number;
  idades_criancas?: number[];
  incluir_hotel?: boolean;
  incluir_seguro?: boolean;
  incluir_carro?: boolean;
  incluir_onibus?: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: PackageQuotationRequest = await req.json();
    const {
      origem,
      destino,
      data_ida,
      data_volta,
      adultos = 1,
      criancas = 0,
      idades_criancas = [],
      incluir_hotel = true,
      incluir_seguro = true,
      incluir_carro = false,
      incluir_onibus = false,
    } = body;

    if (!origem || !destino || !data_ida || !data_volta) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios: origem, destino, data_ida, data_volta" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const paxTotal = adultos + criancas;
    const noites = Math.round(
      (new Date(data_volta).getTime() - new Date(data_ida).getTime()) / (1000 * 60 * 60 * 24)
    );

    console.log(`[PATRIA-PACKAGE] Quoting: ${origem} → ${destino} | ${data_ida} - ${data_volta} | ${adultos}A ${criancas}C`);

    // Run all quotations in parallel
    const promises: Promise<unknown>[] = [];
    const promiseKeys: string[] = [];

    // Always include air
    promises.push(callFunction("patria-air-quotation", {
      origem, destino, data_ida, data_volta, adultos, criancas, idades_criancas,
    }).catch(e => ({ error: e.message })));
    promiseKeys.push("air");

    // Optional: Hotel
    if (incluir_hotel) {
      promises.push(callFunction("patria-hotel-quotation", {
        destino, data_checkin: data_ida, data_checkout: data_volta, adultos, criancas,
      }).catch(e => ({ error: e.message })));
      promiseKeys.push("hotel");
    }

    // Optional: Insurance
    if (incluir_seguro) {
      promises.push(callFunction("patria-insurance-quotation", {
        destino, data_ida, data_volta, adultos, criancas, idades_criancas,
      }).catch(e => ({ error: e.message })));
      promiseKeys.push("insurance");
    }

    // Optional: Car
    if (incluir_carro) {
      promises.push(callFunction("patria-car-quotation", {
        destino, data_retirada: data_ida, data_devolucao: data_volta,
      }).catch(e => ({ error: e.message })));
      promiseKeys.push("car");
    }

    // Optional: Bus
    if (incluir_onibus) {
      promises.push(callFunction("patria-bus-quotation", {
        origem, destino, data_ida, data_volta, adultos, criancas,
      }).catch(e => ({ error: e.message })));
      promiseKeys.push("bus");
    }

    const results = await Promise.all(promises);
    const quotations: Record<string, unknown> = {};
    promiseKeys.forEach((key, i) => { quotations[key] = results[i]; });

    // Build package summary
    const airData = quotations.air as Record<string, unknown>;
    const hotelData = quotations.hotel as Record<string, unknown>;
    const insuranceData = quotations.insurance as Record<string, unknown>;
    const carData = quotations.car as Record<string, unknown>;
    const busData = quotations.bus as Record<string, unknown>;

    const airPrice = (airData?.melhor_opcao as Record<string, unknown>)?.preco_total as number || 0;
    const hotelPrice = (hotelData?.melhor_opcao as Record<string, unknown>)?.preco_total as number || 0;
    const insurancePrice = (insuranceData?.melhor_opcao as Record<string, unknown>)?.preco_total as number || 0;
    const carPrice = (carData?.melhor_opcao as Record<string, unknown>)?.preco_total as number || 0;
    const busPrice = (busData?.melhor_opcao as Record<string, unknown>)?.preco_total as number || 0;

    const totalPrice = airPrice + hotelPrice + insurancePrice + carPrice + busPrice;
    const pricePerPerson = totalPrice / paxTotal;

    // Build WhatsApp-ready message
    const lines: string[] = [];
    lines.push(`✈️ *COTAÇÃO — ${destino.toUpperCase()}*`);
    lines.push(`📅 ${formatDate(data_ida)} → ${formatDate(data_volta)} (${noites} noites)`);
    lines.push(`👥 ${adultos} adulto${adultos > 1 ? "s" : ""}${criancas > 0 ? ` + ${criancas} criança${criancas > 1 ? "s" : ""}` : ""}`);
    lines.push("");

    if (airPrice > 0) {
      const airOpcao = (airData?.melhor_opcao as Record<string, unknown>);
      const airVooIda = (airOpcao?.voo_ida as Record<string, unknown>);
      lines.push(`✈️ *Passagem Aérea:* ${formatCurrency(airPrice)}`);
      if (airVooIda?.airline) {
        lines.push(`   ${airVooIda.airline} | ${airVooIda.stops === 0 ? "Direto" : `${airVooIda.stops} conexão`}`);
      }
    }

    if (hotelPrice > 0) {
      const hotelOpcao = (hotelData?.melhor_opcao as Record<string, unknown>);
      lines.push(`🏨 *Hotel (${noites} noites):* ${formatCurrency(hotelPrice)}`);
      if ((hotelOpcao as Record<string, unknown>)?.name) {
        lines.push(`   ${(hotelOpcao as Record<string, unknown>).name} ⭐${(hotelOpcao as Record<string, unknown>).stars || ""}`);
      }
    }

    if (insurancePrice > 0) {
      lines.push(`🛡️ *Seguro Viagem:* ${formatCurrency(insurancePrice)}`);
    }

    if (carPrice > 0) {
      lines.push(`🚗 *Aluguel de Carro:* ${formatCurrency(carPrice)}`);
    }

    if (busPrice > 0) {
      lines.push(`🚌 *Ônibus:* ${formatCurrency(busPrice)}`);
    }

    lines.push("");
    lines.push(`💰 *TOTAL DO PACOTE: ${formatCurrency(totalPrice)}*`);
    if (paxTotal > 1) {
      lines.push(`👤 Por pessoa: ${formatCurrency(pricePerPerson)}`);
    }
    lines.push(`💳 Em até 10x: ${formatCurrency(totalPrice / 10)}/mês`);
    lines.push("");
    lines.push(`_Valores sujeitos à disponibilidade. Consulte condições._`);

    console.log(`[PATRIA-PACKAGE] Total: ${formatCurrency(totalPrice)}`);

    return new Response(
      JSON.stringify({
        success: true,
        origem,
        destino,
        data_ida,
        data_volta,
        adultos,
        criancas,
        noites,
        quotations,
        summary: {
          air_price: airPrice,
          hotel_price: hotelPrice,
          insurance_price: insurancePrice,
          car_price: carPrice,
          bus_price: busPrice,
          total_price: totalPrice,
          price_per_person: pricePerPerson,
        },
        whatsapp_message: lines.join("\n"),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[PATRIA-PACKAGE] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
