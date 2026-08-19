import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export interface QuotationResponse {
  newCollectedData: Record<string, any>;
  additionalMessage: string;
  triggeredSearch: boolean;
}

/**
 * Módulo isolado de cotação para o WhatsApp Webhook.
 * 
 * ORDEM DE OPERAÇÕES:
 * 1. Extração de tags ([DADOS] e [COTAR_VIAGEM]).
 * 2. Detecção de nova intenção e reset se necessário.
 * 3. Gravação de campos individuais.
 * 4. Validação de dados obrigatórios.
 * 5. Verificação de duplicidade (mesmo pedido nas últimas 24h).
 * 6. Registro em travel_quote_requests.
 * 7. Disparo da busca via cotar-viagem.
 * 8. Formatação do resultado.
 */
export async function handleQuotationFlow(
  aiResponse: string,
  currentCollectedData: Record<string, any>,
  phoneNumber: string,
  conversationId: string,
  isAssistantMessage: boolean = false
): Promise<QuotationResponse> {
  const result: QuotationResponse = {
    newCollectedData: { ...currentCollectedData },
    additionalMessage: "",
    triggeredSearch: false,
  };

  // TEO_DEBUG_LOG: DENTRO_QUOTATION
  await supabase.from("teo_debug_log").insert({
    phone_number: phoneNumber,
    raw_ai_response: aiResponse,
    collected_data_antes: currentCollectedData,
    tags_encontradas: "DENTRO_QUOTATION"
  }).catch(e => console.error("[QUOTATION-MODULE] Error saving DENTRO_QUOTATION log:", e));

  try {

  // O gatilho de processamento é sempre uma mensagem recebida do cliente.
  // A extração SEMPRE lê a resposta que o modelo acabou de gerar no turno atual.
  // A trava anti-loop impede apenas que mensagens ANTIGAS ou do HISTÓRICO disparem novas buscas.
  if (isAssistantMessage) {
    console.log("[QUOTATION-MODULE] Assistant message in history, skipping extraction.");
    return result;
  }

  // 2. a) Extrai dados da resposta do modelo
  // Tag [DADOS:chave=valor]
  const tagMatches = aiResponse.matchAll(/\[DADOS:([^\]]+)\]/g);
  let tagFound = false;
  const extractedFromTags: Record<string, any> = {};

  for (const tagMatch of tagMatches) {
    tagFound = true;
    const content = tagMatch[1];
    const pairs = content.split(/,\s*/);
    for (const pair of pairs) {
      const parts = pair.split("=");
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join("=").trim();
        extractedFromTags[key] = value;
      }
    }
  }

  // Tag [COTAR_VIAGEM:{json}]
  const quoteTagMatch = aiResponse.match(/\[COTAR_VIAGEM:\s*(\{.*\})\s*\]/s);
  let quoteTagData: Record<string, any> | null = null;
  if (quoteTagMatch) {
    try {
      quoteTagData = JSON.parse(quoteTagMatch[1].replace(/\n/g, " ").trim());
    } catch (e) {
      console.error("[QUOTATION-MODULE] Failed to parse COTAR_VIAGEM tag:", e);
    }
  }

  // Registra quais tags foram encontradas
  const foundTags: string[] = [];
  if (tagFound) foundTags.push("DADOS");
  if (quoteTagMatch) foundTags.push("COTAR_VIAGEM");
  if (aiResponse.includes("[STATUS:")) foundTags.push("STATUS");
  logEntry.tags_encontradas = foundTags.length > 0 ? foundTags.join(",") : "nenhuma";

  // 2. b) Se o destino extraído for diferente do anterior, limpa os campos do pedido anterior
  const currentDest = (currentCollectedData.destino || "").toLowerCase();
  const newDest = (extractedFromTags.destino || (quoteTagData && quoteTagData.destino) || "").toLowerCase();

  if (newDest && currentDest && newDest !== currentDest) {
    console.log(`[QUOTATION-MODULE] Resetting trip data for new destination: ${newDest}`);
    // Limpa campos específicos do pedido de viagem
    const tripKeys = ["origem", "data_ida", "data_volta", "adultos", "criancas", "idades_criancas", "_quotation_triggered", "_last_quote_id"];
    tripKeys.forEach(key => delete result.newCollectedData[key]);
  }

  // 2. c) Grava os campos separados
  Object.assign(result.newCollectedData, extractedFromTags);

  // Status da conversa
  const statusMatch = aiResponse.match(/\[STATUS:(\w+)\]/);
  const conversationStatus = statusMatch ? statusMatch[1] : null;

  // 2. d) Valida dados obrigatórios
  // Prioridade 1: JSON da tag [COTAR_VIAGEM]
  // Prioridade 2: collected_data atualizado pelas tags [DADOS]
  let effectiveData: any = null;
  if (quoteTagData && quoteTagData.destino && quoteTagData.origem && quoteTagData.data_ida && quoteTagData.data_volta) {
    effectiveData = {
      origem: quoteTagData.origem,
      destino: quoteTagData.destino,
      data_ida: quoteTagData.data_ida,
      data_volta: quoteTagData.data_volta,
      adultos: Number(quoteTagData.adultos || 1),
      criancas: Number(quoteTagData.criancas || 0),
      idades_criancas: quoteTagData.idades_criancas || [],
    };
  } else if (conversationStatus === "awaiting_quotation" || aiResponse.includes("[STATUS:awaiting_quotation]")) {
    if (result.newCollectedData.destino && result.newCollectedData.origem && result.newCollectedData.data_ida && result.newCollectedData.data_volta) {
      effectiveData = {
        origem: result.newCollectedData.origem,
        destino: result.newCollectedData.destino,
        data_ida: result.newCollectedData.data_ida,
        data_volta: result.newCollectedData.data_volta,
        adultos: Number(result.newCollectedData.adultos || result.newCollectedData.num_viajantes || 2),
        criancas: Number(result.newCollectedData.criancas || 0),
        idades_criancas: result.newCollectedData.idades_criancas || [],
      };
    }
  }

  if (!effectiveData) {
    console.log("[QUOTATION-MODULE] Missing mandatory data for search. Skipping.");
    return result;
  }

  // Validação de formato de data AAAA-MM-DD
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(effectiveData.data_ida) || !dateRegex.test(effectiveData.data_volta)) {
    console.log("[QUOTATION-MODULE] Invalid date format. Skipping search.");
    return result;
  }

  // 2. e) Verifica duplicidade (últimas 24h, mesmos parâmetros)
  const { data: existingReq } = await supabase
    .from("travel_quote_requests")
    .select("id, status, processing_details")
    .eq("phone_number", phoneNumber)
    .eq("origin", effectiveData.origem)
    .eq("destination", effectiveData.destino)
    .eq("departure_date", effectiveData.data_ida)
    .eq("return_date", effectiveData.data_volta)
    .eq("adultos", effectiveData.adultos)
    .eq("children", effectiveData.criancas)
    .gt("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingReq) {
    console.log(`[QUOTATION-MODULE] Duplicate request found: ${existingReq.id}`);
    if (existingReq.status === "completed" && existingReq.processing_details) {
      result.additionalMessage = formatQuotationResults(existingReq.processing_details);
    } else {
      result.additionalMessage = "Seu pedido já foi encaminhado aos nossos consultores! Eles já estão verificando as melhores opções para você. ✈️";
    }
    return result;
  }

  // 2. f) Grava o pedido em travel_quote_requests
  const insertPayload = {
    phone_number: phoneNumber,
    origin: effectiveData.origem,
    destination: effectiveData.destino,
    departure_date: effectiveData.data_ida,
    return_date: effectiveData.data_volta,
    adults: effectiveData.adultos,
    children: effectiveData.criancas,
    children_ages: effectiveData.idades_criancas,
    customer_name: result.newCollectedData.nome || null,
    status: "pending",
    raw_request: effectiveData
  };

  const { data: newReq, error: insertError } = await supabase
    .from("travel_quote_requests")
    .insert(insertPayload)
    .select("id")
    .single();

  if (insertError) {
    console.error("[QUOTATION-MODULE] Error inserting quote request:", insertError);
    return result;
  }

  // Marca que a cotação foi disparada e guarda o ID
  result.newCollectedData._quotation_triggered = true;
  result.newCollectedData._last_quote_id = newReq.id;
  result.triggeredSearch = true;

  // 2. g) Chama a edge function cotar-viagem e AGUARDA
  console.log(`[QUOTATION-MODULE] Calling cotar-viagem for ID ${newReq.id}`);
  try {
    const searchPayload = {
      origem: effectiveData.origem,
      destino: effectiveData.destino,
      data_ida: effectiveData.data_ida,
      data_volta: effectiveData.data_volta,
      passageiros: {
        adultos: effectiveData.adultos,
        criancas: effectiveData.criancas,
        idades_criancas: effectiveData.idades_criancas,
      }
    };

    const response = await fetch(`${SUPABASE_URL}/functions/v1/cotar-viagem`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify(searchPayload),
    });

    if (response.ok) {
      const searchResult = await response.json();
      
      // Atualiza o registro no banco com o resultado
      await supabase.from("travel_quote_requests").update({
        status: searchResult.resultados?.length > 0 ? "completed" : "failed",
        processed_at: new Date().toISOString(),
        processing_details: searchResult,
      }).eq("id", newReq.id);

      // 2. h) Monta o bloco de ofertas
      if (searchResult.resultados?.length > 0) {
        result.additionalMessage = formatQuotationResults(searchResult);
      }
    } else {
      console.error("[QUOTATION-MODULE] cotar-viagem API error:", response.status);
      await supabase.from("travel_quote_requests").update({
        status: "failed",
        error_message: `API error: ${response.status}`,
      }).eq("id", newReq.id);
    }
  } catch (err) {
    console.error("[QUOTATION-MODULE] Fetch error:", err);
  }

  return result;
}

function formatQuotationResults(data: any): string {
  if (!data) return "";
  const results = data.resultados || data.results || (Array.isArray(data) ? data : null);
  if (!results || !Array.isArray(results) || results.length === 0) return "";

  let formatted = "🌟 *Encontrei ofertas incríveis em datas próximas!* 🌟\n";
  formatted += "_Estes são bloqueios aéreos exclusivos com valores promocionais:_\n\n";

  results.forEach((r: any) => {
    let papel = "";
    if (r.papel === "data_pedida") papel = "📅 *Data solicitada*";
    else if (r.papel === "proxima_data") papel = "🔜 *Próxima data disponível*";
    else papel = "💰 *Melhor preço*";
    
    formatted += `${papel}\n`;
    formatted += `✈️ *${r.origem}* ➔ *${r.destino}*\n`;
    formatted += `📅 Ida: ${new Date(r.data_ida + "T12:00:00").toLocaleDateString("pt-BR")}\n`;
    formatted += `📅 Volta: ${new Date(r.data_volta + "T12:00:00").toLocaleDateString("pt-BR")}\n`;
    formatted += `🏢 Companhia: ${r.companhia}\n`;
    
    const pp = Number(r.preco_por_pessoa).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
    const taxa = Number(r.taxa_embarque).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
    const total = Number(r.preco).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
    
    formatted += `👤 Valor por pessoa: *R$ ${pp}*\n`;
    formatted += `⚓ Taxa de embarque: R$ ${taxa}\n`;
    formatted += `💎 *Total do grupo: R$ ${total}*\n`;
    
    const seats = Number(r.assentos_disponiveis || 0);
    if (seats <= 3) {
      formatted += `⚠️ *APENAS ${seats} ASSENTOS RESTANTES!*\n`;
    } else {
      formatted += `💺 Assentos disponíveis: ${seats}\n`;
    }
    
    if (r.prazo_emissao) {
      const prazo = new Date(r.prazo_emissao.split('T')[0] + "T12:00:00").toLocaleDateString("pt-BR");
      formatted += `⏳ Prazo de emissão: *até ${prazo}*\n`;
    }
    formatted += "\n━━━━━━━━━━━━━━━━━━\n\n";
  });

  formatted += "Qual dessas opções faz mais sentido para você? 😊";
  return formatted.trim();
}
