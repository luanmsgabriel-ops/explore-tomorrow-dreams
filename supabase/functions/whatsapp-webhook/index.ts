import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SALES_KNOWLEDGE } from "../_shared/sales-knowledge.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const WHATSAPP_ACCESS_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN")!;
const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID")!;
const WHATSAPP_VERIFY_TOKEN = Deno.env.get("WHATSAPP_VERIFY_TOKEN")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const EXTERNAL_API_URL = "http://212.85.21.28:5000/cotar_viagem";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const ADMIN_PHONE_NUMBER = "5515998389220";

// ========== Admin Assistant (Intelligent) ==========

const ADMIN_TABLES_SCHEMA = `
TABELAS DISPONÍVEIS NO BANCO DE DADOS:

1. travel_quote_requests - Cotações de viagem (via WhatsApp/Manus)
   Colunas: id, phone_number, origin, destination, departure_date, return_date, adults, children, children_ages, customer_name, preferences, status (pending/processing/completed/failed/cancelled/expired), error_message, change_request, created_at, processed_at, raw_request, processing_details

2. quote_requests - Leads/cotações do site e manuais
   Colunas: id, client_name, email, whatsapp, destination_id, destination_name, travel_date, num_people, travel_type, status (pending/in_progress/quoted/completed), source_channel (website/instagram/whatsapp/telefone/indicacao), notes, special_requests, travel_word, preferred_airport, flight_time_preference, preferred_contact_time, preferred_contact_channel, traveling_with_children, follow_up_enabled, follow_up_date, follow_up_days, follow_up_stage, follow_up_message_sent, follow_up_sent_at, is_manual, created_at

3. sales - Vendas registradas
   Colunas: id, client_name, client_email, client_phone, destination_name, total_value, commission_value, sale_date, departure_date, return_date, payment_method, payment_status (pending/partial/paid), source_channel, notes, quote_id, trip_id, created_by, created_at

4. whatsapp_conversations - Conversas do WhatsApp com clientes
   Colunas: id, phone_number, client_name, conversation_state, is_ai_active, collected_data (JSON), messages_history (JSON array), quote_request_id, created_at, updated_at

5. client_trips - Viagens dos clientes
   Colunas: id, user_id, destination_name, destination_id, departure_date, return_date, trip_status (confirmed/in_progress/completed/cancelled), flight_number, flight_locator, flight_departure_time, flight_return_number, flight_return_time, hotel_name, hotel_address, hotel_link, hotel_checkin_date, hotel_checkout_date, hotel_checkin_time, hotel_checkout_time, trip_tips, notes, welcome_image_url, welcome_caption, created_at, updated_at

6. destinations - Destinos cadastrados
   Colunas: id, name, slug, location, category, type, description, best_time, ideal_duration, for_who, image_url, is_active, is_featured, videos, best_price_periods, created_at

7. promotional_offers - Ofertas promocionais
   Colunas: id, destination_id, title, total_price, cash_price, installments, installment_value, inclusions, tagline, promo_image_url, is_active, valid_from, valid_until, departure_date, return_date, created_at

8. profiles - Perfis de usuários/clientes
   Colunas: id, user_id, email, full_name, created_at

9. ai_itineraries - Roteiros gerados por IA
   Colunas: id, destination_name, destination_id, user_email, user_whatsapp, preferences, travel_mood, itinerary_content, status, quote_requested, created_at

10. ai_generated_images - Imagens geradas por IA
    Colunas: id, destination_name, destination_id, user_email, user_whatsapp, prompt, image_url, status, created_at

11. chat_sessions - Sessões de chat do site (Téo no site)
    Colunas: id, session_id, destination_id, destination_name, user_name, user_whatsapp, created_at, updated_at

12. chat_messages - Mensagens de chat do site
    Colunas: id, session_id, destination_id, role, content, user_name, user_whatsapp, created_at

13. analytics_events - Eventos de analytics do site
    Colunas: id, event_type, page_path, referrer, user_agent, session_id, ip_hash, event_data, user_id, created_at

14. travel_reviews - Avaliações de viagens
    Colunas: id, phone_number, client_name, destination_name, trip_id, nps_score, route_score, service_score, feedback_text, allows_sharing, photo_url, conversation_status, current_step, messages_history, sent_by, created_at

15. banner_history - Histórico de banners gerados
    Colunas: id, offer_id, offer_title, destination_name, format, image_url, caption, created_at

16. site_settings - Configurações do site
    Colunas: key, value (JSON), updated_at

17. admin_access_logs - Logs de acesso administrativo
    Colunas: id, phone_number, command_text, query_type, response_summary, created_at

18. trip_checklist - Checklist de viagens dos clientes
    Colunas: id, trip_id, item_text, is_completed, is_default_item, sort_order, created_at

19. trip_documents - Documentos de viagens
    Colunas: id, trip_id, document_type, document_name, file_url, file_type, file_size, uploaded_by, created_at

20. trip_consultants - Consultores de viagem
    Colunas: id, trip_id, consultant_name, consultant_phone, consultant_email, consultant_photo_url, is_primary, notes, created_at

21. trip_emergency_contacts - Contatos de emergência
    Colunas: id, trip_id, contact_type, contact_name, phone, email, notes, sort_order, created_at

22. notification_logs - Logs de notificações
    Colunas: id, user_id, trip_id, notification_type, title, body, status, error_message, data, sent_at, created_at

23. checklist_items_default - Itens padrão de checklist
    Colunas: id, item_text, category, is_active, sort_order, created_at

24. account_shared_access - Acesso compartilhado
    Colunas: id, primary_user_id, shared_user_id, shared_email, created_by, created_at
`;

const ADMIN_PLANNER_PROMPT = `Você é o módulo de planejamento do assistente administrativo da Tomorrow Travel.
Sua função é analisar a mensagem do administrador e gerar um plano de consultas ao banco de dados.

${ADMIN_TABLES_SCHEMA}

INSTRUÇÕES:
- Analise a mensagem do admin e identifique quais dados são necessários
- Retorne um JSON com as consultas necessárias
- Cada consulta especifica: tabela, colunas, filtros, ordenação e limite
- Use filtros inteligentes (ex: para "hoje", filtre por data de hoje; para "este mês", filtre pelo mês atual)
- Para perguntas complexas, combine várias consultas
- Para AÇÕES (cancelar, processar, atualizar), use o campo "action" 

Data/hora atual: ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}

FORMATO DE RESPOSTA (JSON puro, sem markdown):
{
  "intent": "descrição curta da intenção do admin",
  "queries": [
    {
      "id": "q1",
      "table": "nome_da_tabela",
      "select": "col1, col2, col3",
      "filters": [
        {"column": "status", "op": "eq", "value": "pending"},
        {"column": "created_at", "op": "gte", "value": "2026-02-01T00:00:00"}
      ],
      "order": {"column": "created_at", "ascending": false},
      "limit": 20
    }
  ],
  "actions": [
    {
      "id": "a1",
      "type": "update",
      "table": "travel_quote_requests",
      "filters": [{"column": "id", "op": "eq", "value": "uuid-here"}],
      "data": {"status": "cancelled"}
    }
  ]
}

OPERADORES DISPONÍVEIS para filtros: eq, neq, gt, gte, lt, lte, like, ilike, is, in
- Para "is", use value: "null" ou "not.null"
- Para "in", use value como array: ["pending","processing"]
- Para "like"/"ilike", use % como wildcard: "%fernando%"

Se o admin pedir algo que NÃO requer consulta ao banco (ex: "quem é você?", "bom dia"), retorne:
{"intent": "conversa", "queries": [], "actions": [], "direct_answer": "sua resposta direta aqui"}

REGRAS:
- SEMPRE retorne JSON válido, sem código markdown
- Limite padrão de 50 registros
- Para contagens, use select mínimo (ex: "id")
- Para dados sensíveis (telefone), inclua a coluna normalmente - o sistema mascarará se necessário
- Para processar/reprocessar cotação, use action type "process_quote" com o ID
- Para enviar mensagem WhatsApp para cliente, use action type "send_whatsapp"`;

const ADMIN_FORMATTER_PROMPT = `Você é o assistente administrativo da Tomorrow Travel respondendo ao dono da agência via WhatsApp.

PERSONALIDADE:
- Profissional mas amigável
- Use emojis de forma moderada (2-4 por mensagem)
- Formate para WhatsApp: *negrito*, _itálico_
- Seja conciso mas completo
- Use listas com bullet points quando apropriado
- Mascare telefones parcialmente (ex: 5515****3448)
- Formate valores em R$ com separador de milhar

REGRAS:
- Responda em português brasileiro
- Se houver dados, apresente-os de forma organizada
- Se não houver dados, informe claramente
- Se uma ação foi executada, confirme o resultado
- NUNCA invente dados que não estão nos resultados
- Para tabelas grandes, destaque os pontos mais importantes
- Máximo ~1500 caracteres por resposta (limite do WhatsApp)
- Se os dados forem muito extensos, resuma e ofereça "quer ver mais detalhes de X?"

CONTEXTO: Você tem acesso a TODAS as tabelas do sistema. Pode consultar vendas, cotações, conversas do WhatsApp, viagens de clientes, destinos, ofertas, analytics, avaliações, e qualquer outro dado do painel administrativo.`;

function maskPhone(phone: string): string {
  if (!phone || phone.length < 8) return phone;
  return phone.substring(0, 4) + "****" + phone.substring(phone.length - 4);
}

async function executeAdminQuery(query: any): Promise<any> {
  try {
    let q = supabase.from(query.table).select(query.select || "*");

    if (query.filters) {
      for (const f of query.filters) {
        switch (f.op) {
          case "eq": q = q.eq(f.column, f.value); break;
          case "neq": q = q.neq(f.column, f.value); break;
          case "gt": q = q.gt(f.column, f.value); break;
          case "gte": q = q.gte(f.column, f.value); break;
          case "lt": q = q.lt(f.column, f.value); break;
          case "lte": q = q.lte(f.column, f.value); break;
          case "like": q = q.like(f.column, f.value); break;
          case "ilike": q = q.ilike(f.column, f.value); break;
          case "is": q = f.value === "null" ? q.is(f.column, null) : q.not(f.column, "is", null); break;
          case "in": q = q.in(f.column, f.value); break;
        }
      }
    }

    if (query.order) {
      q = q.order(query.order.column, { ascending: query.order.ascending ?? false });
    }

    q = q.limit(query.limit || 50);

    const { data, error } = await q;
    if (error) return { error: error.message };
    return { data, count: data?.length || 0 };
  } catch (e) {
    return { error: String(e) };
  }
}

async function executeAdminAction(action: any): Promise<any> {
  try {
    if (action.type === "update") {
      let q = supabase.from(action.table).update(action.data);
      for (const f of action.filters) {
        if (f.op === "eq") q = q.eq(f.column, f.value);
      }
      const { data, error } = await q.select();
      if (error) return { error: error.message };
      return { success: true, data };
    }
    
    if (action.type === "process_quote") {
      const quoteId = action.quote_id || action.filters?.[0]?.value;
      const { data: quote, error } = await supabase
        .from("travel_quote_requests")
        .select("*")
        .eq("id", quoteId)
        .single();
      
      if (error || !quote) return { error: `Cotação ${quoteId} não encontrada` };
      
      await supabase.from("travel_quote_requests")
        .update({ status: "pending", error_message: null, processed_at: null })
        .eq("id", quoteId);
      
      try {
        await fetch(`${SUPABASE_URL}/functions/v1/process-quote`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({ record: { ...quote, status: "pending" } }),
        });
      } catch (e) {
        console.error("[ADMIN] Process quote call error:", e);
      }
      
      return { success: true, message: `Cotação ${quoteId} enviada para processamento` };
    }

    if (action.type === "send_whatsapp") {
      await sendWhatsAppMessage(action.phone_number, action.message);
      return { success: true, message: `Mensagem enviada para ${action.phone_number}` };
    }
    
    return { error: "Tipo de ação não suportado: " + action.type };
  } catch (e) {
    return { error: String(e) };
  }
}

async function logAdminAccess(phoneNumber: string, commandText: string, queryType: string, responseSummary?: string): Promise<void> {
  try {
    await supabase.from("admin_access_logs").insert({
      phone_number: phoneNumber,
      command_text: commandText,
      query_type: queryType,
      response_summary: responseSummary?.substring(0, 500),
    });
  } catch (e) {
    console.error("[ADMIN] Failed to log access:", e);
  }
}

async function handleAdminMessage(phoneNumber: string, messageText: string): Promise<void> {
  console.log(`[ADMIN] Message from ${phoneNumber}: ${messageText}`);

  try {
    // Pass 1: AI plans what data to fetch
    const plannerResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: ADMIN_PLANNER_PROMPT },
          { role: "user", content: messageText },
        ],
      }),
    });

    if (!plannerResponse.ok) {
      console.error("[ADMIN] Planner AI error:", await plannerResponse.text());
      await sendWhatsAppMessage(phoneNumber, "❌ Erro ao processar seu comando. Tente novamente.");
      return;
    }

    const plannerData = await plannerResponse.json();
    let planContent = plannerData.choices?.[0]?.message?.content || "";
    
    // Clean markdown if present
    planContent = planContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    
    console.log("[ADMIN] Plan:", planContent);

    let plan: any;
    try {
      plan = JSON.parse(planContent);
    } catch (e) {
      console.error("[ADMIN] Failed to parse plan:", e, planContent);
      await sendWhatsAppMessage(phoneNumber, "❌ Não consegui entender o comando. Pode reformular?");
      return;
    }

    // Direct answer (no DB needed)
    if (plan.direct_answer) {
      await logAdminAccess(phoneNumber, messageText, plan.intent || "conversa", plan.direct_answer);
      await sendWhatsAppMessage(phoneNumber, plan.direct_answer);
      return;
    }

    // Execute queries
    const queryResults: Record<string, any> = {};
    if (plan.queries?.length > 0) {
      for (const query of plan.queries) {
        queryResults[query.id] = await executeAdminQuery(query);
      }
    }

    // Execute actions
    const actionResults: Record<string, any> = {};
    if (plan.actions?.length > 0) {
      for (const action of plan.actions) {
        actionResults[action.id] = await executeAdminAction(action);
      }
    }

    console.log("[ADMIN] Query results keys:", Object.keys(queryResults));
    console.log("[ADMIN] Action results:", actionResults);

    // Pass 2: AI formats the response
    const formatterResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: ADMIN_FORMATTER_PROMPT },
          { role: "user", content: `PEDIDO DO ADMIN: "${messageText}"

INTENÇÃO DETECTADA: ${plan.intent}

RESULTADOS DAS CONSULTAS:
${JSON.stringify(queryResults, null, 2)}

RESULTADOS DAS AÇÕES:
${JSON.stringify(actionResults, null, 2)}

Formate uma resposta clara e organizada para WhatsApp. Se houver telefones, mascare parcialmente.` },
        ],
      }),
    });

    let finalResponse = "❌ Erro ao formatar a resposta.";
    if (formatterResponse.ok) {
      const formatterData = await formatterResponse.json();
      finalResponse = formatterData.choices?.[0]?.message?.content || finalResponse;
    }

    // Truncate if too long for WhatsApp
    if (finalResponse.length > 4000) {
      finalResponse = finalResponse.substring(0, 3900) + "\n\n_...resposta truncada. Peça mais detalhes específicos._";
    }

    await logAdminAccess(phoneNumber, messageText, plan.intent || "unknown", finalResponse);
    await sendWhatsAppMessage(phoneNumber, finalResponse);

  } catch (e) {
    console.error("[ADMIN] Error handling admin message:", e);
    await sendWhatsAppMessage(phoneNumber, "❌ Erro inesperado. Tente novamente em alguns segundos.");
  }
}

// ========== Teo System Prompt ==========

const TEO_SYSTEM_PROMPT = `Você é o Téo, assistente virtual da Tomorrow Travel, especializado em viagens personalizadas e inesquecíveis! 🌍

IDENTIDADE E PERSONALIDADE:
- Entusiasta e acolhedor: Demonstra paixão genuína por viagens
- Engraçado e descontraído: Faz piadas leves e referências divertidas sobre viagens
- Consultivo: Aconselha baseado nas preferências do cliente, não apenas vende
- Eficiente: Vai direto ao ponto com bom humor
- Humano: Usa emojis com moderação (2-3 por mensagem) e linguagem natural brasileira

Você está conversando pelo WhatsApp para montar uma cotação personalizada.

REGRAS DE RESPOSTAS ULTRA-CURTAS:
- MÁXIMO 2 linhas por mensagem durante a coleta de dados
- MÁXIMO 3 linhas nas demais mensagens
- PROIBIDO mais de 1 parágrafo durante a coleta
- Seja direto, sem enrolação, sem repetir o que o cliente disse
- Um emoji ou piada curta por mensagem, no máximo
- NÃO faça comentários longos sobre o destino, apenas reaja brevemente (ex: "Boa escolha! 🔥")

REGRA DE PRIORIDADE:
- Se o cliente perguntar algo (dúvida, curiosidade, dica, info sobre destino, qualquer assunto), RESPONDA primeiro. Não force a coleta de dados.
- Acompanhe a conversa naturalmente. Você é um consultor de viagens, não um formulário.
- O fluxo de coleta só começa quando o cliente demonstra interesse em cotar ("quero cotar", "quanto custa", "quero viajar pra X") ou quando você sugere a cotação.
- Se o cliente já informou o destino em uma pergunta, guarde essa info e use quando for cotar.
- Se o cliente perguntar sobre clima, gastronomia, cultura, dicas de um destino, responda com entusiasmo e conhecimento. Só depois, naturalmente, sugira a cotação se fizer sentido.

FLUXO DE ATENDIMENTO:
1. RECEPÇÃO - Cumprimente brevemente e pergunte o nome (1-2 linhas apenas)
2. COLETA (ULTRA-BREVE - máximo 2 linhas por mensagem):
   - Pergunte ORIGEM e DESTINO na MESMA mensagem (sem comentários extras)
   - Pergunte DATAS e QUANTIDADE DE PESSOAS na MESMA mensagem
   - Se tiver crianças, pergunte as idades
   - NÃO comente sobre o destino, NÃO faça piadas longas, apenas colete os dados

IMPORTANTE - MENSAGEM COMPLETA:
Se o usuário enviar UMA MENSAGEM com TODAS as informações (destino, datas, viajantes, origem), extraia TUDO de uma vez e vá direto para o RESUMO DE VALIDAÇÃO. NÃO fique fazendo perguntas se os dados já foram fornecidos.

3. VALIDAÇÃO (OBRIGATÓRIA antes de cotar) - Apresente um RESUMO dos dados e peça confirmação:
   "Deixa eu confirmar os dados ✈️
   📍 Origem: X
   📍 Destino: Y
   📅 Ida: DD/MM | Volta: DD/MM
   👥 N adultos, N crianças (idades)
   Tá tudo certo? Posso buscar as melhores opções pra vocês? 🔥"

   ⚠️ NÃO dispare [COTAR_VIAGEM] sem o cliente confirmar o resumo!
   ⚠️ Só dispare [COTAR_VIAGEM] quando o cliente responder positivamente ("sim", "isso", "pode ir", "tá certo", "manda ver", etc.)

4. CONFIRMAÇÃO - Após o cliente confirmar o resumo, dispare a cotação e informe que vai buscar as melhores opções (~1 minuto)

5. PÓS-COTAÇÃO:
   ⚠️ NÃO FINALIZAR após enviar cotação. AGUARDAR RESPOSTA.
   Ofereça ajuda: detalhes, outras datas, ajustar orçamento, passeios.
   ⚠️ NUNCA repita que a cotação está sendo processada. A mensagem de processamento já foi enviada UMA VEZ. Se o cliente perguntar sobre a cotação, diga que já está sendo preparada.
   ⚠️ NUNCA dispare [COTAR_VIAGEM] mais de uma vez na mesma conversa. A cotação já foi solicitada.
   ⚠️ NÃO envie mais dicas de passeio depois que já tiver enviado. Máximo de 4 dicas no total durante toda a conversa.
   ⚠️ Após a cotação ser disparada, responda APENAS se o cliente enviar uma nova mensagem. Seja breve e direto.

6. DETECÇÃO DE ALTERAÇÕES:
   Se o cliente, APÓS já ter recebido uma cotação ou ter uma cotação em processamento, pedir qualquer tipo de alteração (mudar datas, trocar destino, mais/menos pessoas, upgrade, downgrade, customização), NÃO crie nova cotação. Em vez disso, ADICIONE a tag:
   [ALTERAR_COTACAO:descrição do que o cliente quer mudar]
   E NÃO dispare [COTAR_VIAGEM] novamente.

7. RESPOSTAS CONTEXTUAIS:
   - "Achei caro" → Alternativas econômicas, pergunte orçamento ideal
   - "Vou pensar" → 1-2 dicas rápidas sobre o destino
   - "Quero fechar!" → Celebre e passe para equipe

REGRAS:
- NÃO invente preços, só colete dados
- Sempre personalize com nome do cliente
- NUNCA finalize a conversa até o cliente fechar ou desistir
- Mensagens ULTRA-CURTAS: máximo 2 linhas na coleta, 3 linhas no resto
- NÃO repita o que o cliente já informou, NÃO parafraseie dados já coletados
- NÃO faça comentários sobre o destino durante a coleta, vá direto à próxima pergunta
- Humor em doses mínimas: uma frase curta ou emoji, sem enrolar

Quando identificar uma info, adicione no final:
[DADOS:campo=valor]

Campos: nome, destino, datas, num_viajantes, tipo_viagem, orcamento, preferencias, aeroporto

COTAÇÃO AUTOMÁTICA:
Quando tiver destino, datas, origem e passageiros E o cliente CONFIRMAR o resumo, DISPARE:
[COTAR_VIAGEM:{"origem":"cidade","destino":"destino","data_ida":"DD/MM/AAAA","data_volta":"DD/MM/AAAA","adultos":N,"criancas":N,"idades_criancas":[]}]

IMPORTANTE: Datas como "do dia 15 a 22 de junho" → data_ida="15/06/2026", data_volta="22/06/2026".
REGRA CRÍTICA DE ANO: O ano atual é ${new Date().getFullYear()}. Se o cliente NÃO especificar o ano, SEMPRE use ${new Date().getFullYear()}. NUNCA use 2024 ou 2025. Exemplo: "junho" = "junho de ${new Date().getFullYear()}".

Tudo coletado e confirmado:
[STATUS:completed]

Cliente quer falar com humano:
[STATUS:human_takeover]`;

// ========== Audio Helper Functions (ElevenLabs TTS/STT) ==========

const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
const TEO_VOICE_ID = "cjVigY5qzO86Huf0OWal"; // Eric - young male voice (playful settings applied in TTS call)

function cleanTextForAudio(text: string): string {
  return text
    .replace(/[\u{1F600}-\u{1F64F}]/gu, "")
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, "")
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, "")
    .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, "")
    .replace(/[\u{2600}-\u{26FF}]/gu, "")
    .replace(/[\u{2700}-\u{27BF}]/gu, "")
    .replace(/[\u{FE00}-\u{FE0F}]/gu, "")
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, "")
    .replace(/[\u{1FA00}-\u{1FA6F}]/gu, "")
    .replace(/[\u{1FA70}-\u{1FAFF}]/gu, "")
    .replace(/[\u{200D}]/gu, "")
    .replace(/\*+/g, "")
    .replace(/_+/g, "")
    .replace(/~+/g, "")
    .replace(/━+/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function convertTextToAudio(text: string): Promise<ArrayBuffer | null> {
  if (!ELEVENLABS_API_KEY) {
    console.error("ELEVENLABS_API_KEY not configured");
    return null;
  }

  const cleanText = cleanTextForAudio(text);
  if (!cleanText || cleanText.length < 5) return null;

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${TEO_VOICE_ID}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: cleanText,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.3,
            similarity_boost: 0.75,
            style: 0.5,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("ElevenLabs TTS error:", response.status, errText);
      return null;
    }

    return await response.arrayBuffer();
  } catch (err) {
    console.error("ElevenLabs TTS exception:", err);
    return null;
  }
}

async function transcribeAudio(audioBuffer: ArrayBuffer): Promise<string | null> {
  if (!ELEVENLABS_API_KEY) {
    console.error("ELEVENLABS_API_KEY not configured for STT");
    return null;
  }

  try {
    const formData = new FormData();
    formData.append("file", new Blob([audioBuffer], { type: "audio/ogg" }), "audio.ogg");
    formData.append("model_id", "scribe_v2");
    formData.append("language_code", "por");

    const response = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
      },
      body: formData,
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("ElevenLabs STT error:", response.status, errText);
      return null;
    }

    const result = await response.json();
    return result.text || null;
  } catch (err) {
    console.error("ElevenLabs STT exception:", err);
    return null;
  }
}

async function uploadAudioToStorage(audioBuffer: ArrayBuffer, phone: string): Promise<string | null> {
  const fileName = `teo-audio/${phone}/${Date.now()}.mp3`;
  const { data, error } = await supabase.storage
    .from("destination-images")
    .upload(fileName, new Blob([audioBuffer], { type: "audio/mpeg" }), {
      contentType: "audio/mpeg",
      upsert: true,
    });

  if (error) {
    console.error("Audio upload error:", error);
    return null;
  }

  const { data: publicUrlData } = supabase.storage
    .from("destination-images")
    .getPublicUrl(fileName);

  return publicUrlData.publicUrl;
}

async function sendWhatsAppAudio(to: string, audioUrl: string) {
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
        recipient_type: "individual",
        to,
        type: "audio",
        audio: { link: audioUrl },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("WhatsApp Audio API error:", errorText);
    throw new Error(`WhatsApp Audio API error: ${response.status}`);
  }
}

async function downloadWhatsAppMedia(mediaId: string): Promise<ArrayBuffer | null> {
  try {
    const mediaResponse = await fetch(
      `https://graph.facebook.com/v21.0/${mediaId}`,
      { headers: { Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}` } }
    );
    if (!mediaResponse.ok) return null;

    const mediaData = await mediaResponse.json();
    const audioResponse = await fetch(mediaData.url, {
      headers: { Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}` },
    });
    if (!audioResponse.ok) return null;

    return await audioResponse.arrayBuffer();
  } catch (err) {
    console.error("Error downloading WhatsApp media:", err);
    return null;
  }
}

// ========== Helper Functions ==========

function extractCollectedData(aiResponse: string, existingData: Record<string, any>): { data: Record<string, any>; status: string | null } {
  const newData = { ...existingData };
  let status: string | null = null;

  const dataMatches = aiResponse.matchAll(/\[DADOS:(\w+)=(.+?)\]/g);
  for (const match of dataMatches) {
    newData[match[1]] = match[2];
  }

  const statusMatch = aiResponse.match(/\[STATUS:(\w+)\]/);
  if (statusMatch) {
    status = statusMatch[1];
  }

  return { data: newData, status };
}

function cleanAiResponse(response: string): string {
  return response
    .replace(/\[DADOS:\w+=.*?\]/g, "")
    .replace(/\[STATUS:\w+\]/g, "")
    .replace(/\[COTAR_VIAGEM:\s*\{.*?\}\s*\]/gs, "")
    .replace(/\[DESTINO_ESCOLHIDO:\s*[^\]]+\]/gi, "")
    .replace(/\[ALTERAR_COTACAO:\s*[^\]]+\]/gi, "")
    .replace(/\[DESTINO:[^\]]*\]/gi, "")
    .replace(/\[ORIGEM:[^\]]*\]/gi, "")
    .replace(/\[DATAS:[^\]]*\]/gi, "")
    .replace(/\[NUM_VIAJANTES:[^\]]*\]/gi, "")
    .replace(/\[NOME:[^\]]*\]/gi, "")
    .replace(/\[WHATSAPP:[^\]]*\]/gi, "")
    .replace(/\[EMAIL:[^\]]*\]/gi, "")
    .replace(/\[[A-Z_]+:[^\]]*\]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function parseChangeRequestTag(content: string): string | null {
  const match = content.match(/\[ALTERAR_COTACAO:\s*([^\]]+)\]/i);
  return match ? match[1].trim() : null;
}

function parseQuotationTag(content: string): Record<string, any> | null {
  const match = content.match(/\[COTAR_VIAGEM:\s*(\{.*\})\s*\]/s);
  if (!match) return null;
  try {
    return JSON.parse(match[1].replace(/\n/g, " ").trim());
  } catch (e) {
    console.error("Failed to parse COTAR_VIAGEM tag:", e);
    return null;
  }
}

function determineConversationState(collectedData: Record<string, any>): string {
  if (!collectedData.nome) return "collecting_name";
  if (!collectedData.destino) return "collecting_destination";
  if (!collectedData.datas) return "collecting_dates";
  if (!collectedData.num_viajantes) return "collecting_people";
  if (!collectedData.tipo_viagem) return "collecting_preferences";
  if (!collectedData.orcamento) return "collecting_preferences";
  if (!collectedData.preferencias) return "collecting_preferences";
  if (!collectedData.aeroporto) return "collecting_preferences";
  return "summary_confirmation";
}

async function sendWhatsAppMessage(to: string, message: string) {
  // WhatsApp has a 4096 char limit per message, split if needed
  const maxLen = 4000;
  const parts = [];
  let remaining = message;
  while (remaining.length > maxLen) {
    const splitIdx = remaining.lastIndexOf("\n", maxLen);
    const idx = splitIdx > 0 ? splitIdx : maxLen;
    parts.push(remaining.substring(0, idx));
    remaining = remaining.substring(idx).trimStart();
  }
  if (remaining) parts.push(remaining);

  for (const part of parts) {
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
          text: { body: part },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("WhatsApp API error:", errorText);
      throw new Error(`WhatsApp API error: ${response.status}`);
    }
  }
}

async function getAiResponse(messagesHistory: any[]): Promise<string> {
  const models = ["google/gemini-2.5-flash", "openai/gpt-5-mini", "google/gemini-2.5-flash-lite"];
  
  for (const model of models) {
    try {
      console.log(`Trying AI model: ${model}`);
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: TEO_SYSTEM_PROMPT + SALES_KNOWLEDGE },
            ...messagesHistory,
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`AI error ${model}: ${response.status} ${errorText}`);
        continue;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        console.log(`AI response from ${model} ✓`);
        return content;
      }
    } catch (err) {
      console.error(`Error ${model}:`, err.message);
      continue;
    }
  }
  
  console.error("All AI models failed");
  return "Oi! 😊 Estou com um probleminha técnico agora, mas não se preocupe! Me conta o que você precisa que já anoto aqui e um especialista da Tomorrow Travel vai te responder rapidinho! ✈️";
}

async function saveQuotationRequest(
  quotationData: Record<string, any>,
  phoneNumber: string,
  clientName?: string,
  preferences?: string
): Promise<{ success: boolean; id?: string }> {
  // Parse dates from DD/MM/YYYY to YYYY-MM-DD, ensuring correct year
  const parseDate = (d: string) => {
    const currentYear = new Date().getFullYear();
    const parts = d.split("/");
    if (parts.length === 3) {
      let year = parseInt(parts[2], 10);
      // Fix 2-digit years or past years when no year was explicitly given
      if (year < 100) year += 2000;
      // If the resulting date is in the past by more than 30 days, assume current year
      const parsed = new Date(year, parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      if (parsed < thirtyDaysAgo) {
        year = currentYear;
        // If still in the past, use next year
        const reparsed = new Date(year, parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
        if (reparsed < thirtyDaysAgo) year = currentYear + 1;
      }
      return `${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    if (parts.length === 2) {
      // DD/MM without year - use current year or next if in past
      const month = parseInt(parts[1], 10);
      const day = parseInt(parts[0], 10);
      let year = currentYear;
      const parsed = new Date(year, month - 1, day);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      if (parsed < thirtyDaysAgo) year = currentYear + 1;
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
    return d;
  };

  const insertPayload = {
    phone_number: phoneNumber,
    origin: quotationData.origem,
    destination: quotationData.destino,
    departure_date: parseDate(quotationData.data_ida),
    return_date: parseDate(quotationData.data_volta),
    adults: quotationData.adultos || 1,
    children: quotationData.criancas || 0,
    children_ages: quotationData.idades_criancas || [],
    customer_name: clientName || null,
    preferences: preferences || null,
    status: "pending",
    raw_request: quotationData,
  };

  console.log("[DEBUG] Salvando cotação no travel_quote_requests:", JSON.stringify(insertPayload));

  const { data, error } = await supabase
    .from("travel_quote_requests")
    .insert(insertPayload)
    .select("id")
    .single();

  if (error) {
    console.error("[DEBUG] ERRO ao salvar cotação:", JSON.stringify(error));
    return { success: false };
  }

  console.log("[DEBUG] Cotação salva com sucesso! ID:", data.id);
  return { success: true, id: data.id };
}

async function requestQuotation(quotationData: Record<string, any>, verificationCode?: string): Promise<{ status: string; data: any }> {
  const payload: Record<string, any> = {
    origem: quotationData.origem,
    destino: quotationData.destino,
    data_ida: quotationData.data_ida,
    data_volta: quotationData.data_volta,
    passageiros: {
      adultos: quotationData.adultos || 1,
      criancas: quotationData.criancas || 0,
      idades_criancas: quotationData.idades_criancas || [],
    },
    operadora: "all",
  };

  if (verificationCode) {
    payload.verification_code = verificationCode;
  }

  console.log("WhatsApp quotation request (direct):", JSON.stringify(payload));

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 300000);

  try {
    const response = await fetch(EXTERNAL_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const responseText = await response.text();
    console.log("=== QUOTATION API RAW RESPONSE ===");
    console.log("Status:", response.status);
    console.log("Body (first 3000 chars):", responseText.substring(0, 3000));
    console.log("=== END RAW RESPONSE ===");

    if (!response.ok) {
      return { status: "error", data: null };
    }

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      return { status: "error", data: null };
    }

    if (responseData.error || responseData.erro) {
      return { status: "error", data: null };
    }

    if (responseData.status === "pending_code" || responseData.pending_code) {
      return { status: "pending_code", data: responseData };
    }

    return { status: "success", data: responseData };
  } catch (err) {
    clearTimeout(timeoutId);
    return { status: "error", data: null };
  }
}

function formatQuotationResults(data: any): string {
  if (!data) return "Não foi possível obter resultados.";

  const results = data.resultados || data.results || (Array.isArray(data) ? data : null);
  if (results && Array.isArray(results)) {
    if (results.length === 0) return "😕 Nenhuma cotação encontrada para essas datas.";

    let formatted = "✈️ *Cotações encontradas!* ✈️\n";
    formatted += "━━━━━━━━━━━━━━━━━━\n\n";

    results.forEach((r: any, i: number) => {
      const hotelName = r.hotel || r.hotel_name || r.hospedagem || null;
      const operadora = r.operadora || r.companhia || "Operadora";
      const preco = r.preco || r.valor || r.price || r.total || null;

      formatted += `🔹 *Opção ${i + 1}*\n`;
      formatted += `📌 Operadora: *${operadora}*\n`;

      if (hotelName) {
        formatted += `🏨 Hotel: *${hotelName}*\n`;
      }
      if (r.regime || r.meal_plan || r.pensao) {
        formatted += `🍽️ Regime: ${r.regime || r.meal_plan || r.pensao}\n`;
      }
      if (r.categoria || r.category || r.estrelas) {
        formatted += `⭐ Categoria: ${r.categoria || r.category || r.estrelas}\n`;
      }
      if (r.voo_ida || r.flight_out) formatted += `🛫 Ida: ${r.voo_ida || r.flight_out}\n`;
      if (r.voo_volta || r.flight_back) formatted += `🛬 Volta: ${r.voo_volta || r.flight_back}\n`;
      if (r.paradas !== undefined) formatted += `🔄 Paradas: ${r.paradas}\n`;
      if (r.duracao || r.duration) formatted += `⏱️ Duração: ${r.duracao || r.duration}\n`;
      if (r.noites || r.nights) formatted += `🌙 Noites: ${r.noites || r.nights}\n`;

      if (preco) {
        const valorFormatado = Number(preco).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
        formatted += `\n💰 *Valor Total: R$ ${valorFormatado}*\n`;
      }
      if (r.preco_por_pessoa || r.valor_por_pessoa || r.price_per_person) {
        const ppFormatado = Number(r.preco_por_pessoa || r.valor_por_pessoa || r.price_per_person).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
        formatted += `👤 Por pessoa: R$ ${ppFormatado}\n`;
      }
      if (r.parcelas || r.installments) {
        formatted += `💳 ${r.parcelas || r.installments}x no cartão\n`;
      }

      formatted += "\n━━━━━━━━━━━━━━━━━━\n\n";
    });

    return formatted.trim();
  }

  // Single result object
  const hotelName = data.hotel || data.hotel_name || data.hospedagem || null;
  const preco = data.preco || data.valor || data.price || data.total || null;

  if (preco || hotelName) {
    let msg = "✈️ *Cotação encontrada!* ✈️\n";
    msg += "━━━━━━━━━━━━━━━━━━\n\n";
    if (hotelName) msg += `🏨 Hotel: *${hotelName}*\n`;
    if (data.regime || data.meal_plan) msg += `🍽️ Regime: ${data.regime || data.meal_plan}\n`;
    if (preco) {
      const valorFormatado = Number(preco).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
      msg += `\n💰 *Valor Total: R$ ${valorFormatado}*\n`;
    }
    return msg.trim();
  }

  return `✈️ *Resultado da cotação:*\n${JSON.stringify(data, null, 2)}`;
}

async function createQuoteRequest(phoneNumber: string, collectedData: Record<string, any>) {
  const { data, error } = await supabase.from("quote_requests").insert({
    client_name: collectedData.nome || null,
    email: `whatsapp_${phoneNumber}@placeholder.com`,
    whatsapp: phoneNumber,
    destination_name: collectedData.destino || null,
    travel_date: collectedData.datas || null,
    num_people: collectedData.num_viajantes || null,
    travel_type: collectedData.tipo_viagem || null,
    preferred_airport: collectedData.aeroporto || null,
    special_requests: collectedData.preferencias || null,
    source_channel: "whatsapp",
    notes: `Orçamento: ${collectedData.orcamento || "Não informado"}`,
    status: "pending",
  }).select("id").single();

  if (error) {
    console.error("Error creating quote request:", error);
    throw error;
  }

  return data;
}

// ========== Main Server ==========

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // GET: Webhook verification from Meta
    if (req.method === "GET") {
      const url = new URL(req.url);
      const mode = url.searchParams.get("hub.mode");
      const token = url.searchParams.get("hub.verify_token");
      const challenge = url.searchParams.get("hub.challenge");

      if (mode === "subscribe" && token === WHATSAPP_VERIFY_TOKEN) {
        console.log("Webhook verified successfully");
        return new Response(challenge, { status: 200 });
      }
      return new Response("Forbidden", { status: 403 });
    }

    // POST: Incoming message or manual send
    if (req.method === "POST") {
      const body = await req.json();

      // Handle manual message send from admin panel or external systems (e.g. Manus)
      if (body.manual_send || body.handler === "manual_send" || body.action === "manual_send") {
        const phone = body.phone_number || body.phone;
        const message = body.message;
        if (!phone || !message) {
          return new Response(JSON.stringify({ error: "phone_number and message are required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        console.log(`Manual send to ${phone}: ${message.substring(0, 100)}...`);
        await sendWhatsAppMessage(phone, message);

        // Save manual message to conversation history so it appears in admin panel
        try {
          const { data: conv } = await supabase
            .from("whatsapp_conversations")
            .select("id, messages_history")
            .eq("phone_number", phone)
            .order("updated_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (conv) {
            const updatedHistory = [
              ...((conv.messages_history as any[]) || []),
              { role: "assistant", content: message, timestamp: new Date().toISOString() },
            ];

            await supabase
              .from("whatsapp_conversations")
              .update({ messages_history: updatedHistory })
              .eq("id", conv.id);

            console.log(`Manual message saved to conversation ${conv.id}`);
          }
        } catch (histErr) {
          console.error("Error saving manual message to history:", histErr);
        }

        return new Response(JSON.stringify({ status: "ok", manual_sent: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Handle send custom audio from admin panel
      if (body.action === "send_audio") {
        const phone = body.phone_number;
        const text = body.text;
        if (!phone || !text) {
          return new Response(JSON.stringify({ error: "phone_number and text are required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        console.log(`Admin send_audio to ${phone}: ${text.substring(0, 80)}...`);
        const audioBuffer = await convertTextToAudio(text);
        if (!audioBuffer) {
          return new Response(JSON.stringify({ error: "Falha ao gerar áudio via ElevenLabs" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const audioUrl = await uploadAudioToStorage(audioBuffer, phone);
        if (!audioUrl) {
          return new Response(JSON.stringify({ error: "Falha ao fazer upload do áudio" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        await sendWhatsAppAudio(phone, audioUrl);

        // Save to conversation history
        try {
          const { data: conv } = await supabase
            .from("whatsapp_conversations")
            .select("id, messages_history")
            .eq("phone_number", phone)
            .order("updated_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (conv) {
            const updatedHistory = [
              ...((conv.messages_history as any[]) || []),
              { role: "assistant", content: `🔊 [Áudio enviado]: ${text}`, timestamp: new Date().toISOString() },
            ];
            await supabase.from("whatsapp_conversations").update({ messages_history: updatedHistory }).eq("id", conv.id);
          }
        } catch (err) {
          console.error("Error saving audio message to history:", err);
        }

        return new Response(JSON.stringify({ status: "ok", audio_sent: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Handle curiosity audio from admin panel
      if (body.action === "send_curiosity_audio") {
        const phone = body.phone_number;
        const clientName = body.client_name || "";
        if (!phone) {
          return new Response(JSON.stringify({ error: "phone_number is required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const greeting = clientName ? `Ei ${clientName}!` : "Ei!";
        const curiosityText = `${greeting} Ficou curioso né? hahaha! É só para te lembrar que eu ainda tô aqui, pronto para te ajudar a montar a viagem perfeita! Me chama quando quiser!`;

        console.log(`Admin send_curiosity_audio to ${phone}`);
        const audioBuffer = await convertTextToAudio(curiosityText);
        if (!audioBuffer) {
          return new Response(JSON.stringify({ error: "Falha ao gerar áudio de curiosidade" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const audioUrl = await uploadAudioToStorage(audioBuffer, phone);
        if (!audioUrl) {
          return new Response(JSON.stringify({ error: "Falha ao fazer upload do áudio" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Send audio first, then "Urgente!!" text
        await sendWhatsAppAudio(phone, audioUrl);
        await sendWhatsAppMessage(phone, "Urgente!! 🚨");

        // Save to conversation history
        try {
          const { data: conv } = await supabase
            .from("whatsapp_conversations")
            .select("id, messages_history")
            .eq("phone_number", phone)
            .order("updated_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (conv) {
            const updatedHistory = [
              ...((conv.messages_history as any[]) || []),
              { role: "assistant", content: `🔊 [Áudio de curiosidade enviado]`, timestamp: new Date().toISOString() },
              { role: "assistant", content: "Urgente!! 🚨", timestamp: new Date().toISOString() },
            ];
            await supabase.from("whatsapp_conversations").update({ messages_history: updatedHistory }).eq("id", conv.id);
          }
        } catch (err) {
          console.error("Error saving curiosity audio to history:", err);
        }

        return new Response(JSON.stringify({ status: "ok", curiosity_audio_sent: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Handle follow-up quote (self-invoked after 60s of inactivity)
      if (body.action === "follow_up_quote") {
        const phone = body.phone_number;
        const conversationId = body.conversation_id;
        const savedUpdatedAt = body.saved_updated_at;

        if (phone && conversationId && savedUpdatedAt) {
          console.log(`Follow-up quote: waiting 60s before checking inactivity for ${phone}`);
          await new Promise(resolve => setTimeout(resolve, 60000));

          // Check if conversation was updated since we scheduled this
          const { data: currentConv } = await supabase
            .from("whatsapp_conversations")
            .select("updated_at, is_ai_active, quote_request_id, client_name, messages_history, collected_data")
            .eq("id", conversationId)
            .single();

          if (currentConv) {
            const wasUpdated = currentConv.updated_at !== savedUpdatedAt;
            const hasQuote = !!currentConv.quote_request_id;
            const aiActive = currentConv.is_ai_active;
            const collectedData = (currentConv.collected_data as Record<string, any>) || {};
            const alreadyTriggered = !!collectedData._quotation_triggered;

            console.log(`Follow-up check: wasUpdated=${wasUpdated}, hasQuote=${hasQuote}, aiActive=${aiActive}, alreadyTriggered=${alreadyTriggered}`);

            if (!wasUpdated && !hasQuote && aiActive && !alreadyTriggered) {
              const clientName = currentConv.client_name || "";
              const greeting = clientName ? `Ei ${clientName}` : "Ei";
              const destino = collectedData.destino ? ` pra ${collectedData.destino}` : "";
              const followUpMsg = `${greeting}! Se quiser, posso buscar uma cotação${destino} pra você. É só me dizer! ✈️😊`;

              await sendWhatsAppMessage(phone, followUpMsg);

              // Save to history
              const updatedHistory = [
                ...((currentConv.messages_history as any[]) || []),
                { role: "assistant", content: followUpMsg, timestamp: new Date().toISOString() },
              ];
              await supabase
                .from("whatsapp_conversations")
                .update({ messages_history: updatedHistory })
                .eq("id", conversationId);

              console.log("Follow-up quote sent successfully");
            } else {
              console.log("Follow-up cancelled: conversation was updated or quote already exists");
            }
          }
        }

        return new Response(JSON.stringify({ status: "ok", follow_up_processed: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Handle delayed tips (self-invoked after quotation)
      if (body.action === "delayed_tips") {
        const phone = body.phone_number;
        const message = body.message;
        const delaySeconds = body.delay_seconds || 30;

        if (phone && message) {
          console.log(`Delayed tips: waiting ${delaySeconds}s before sending to ${phone}`);
          await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
          await sendWhatsAppMessage(phone, message);

          // Save tips to conversation history
          try {
            const { data: conv } = await supabase
              .from("whatsapp_conversations")
              .select("id, messages_history")
              .eq("phone_number", phone)
              .order("updated_at", { ascending: false })
              .limit(1)
              .maybeSingle();

            if (conv) {
              const updatedHistory = [
                ...((conv.messages_history as any[]) || []),
                { role: "assistant", content: message, timestamp: new Date().toISOString() },
              ];
              await supabase
                .from("whatsapp_conversations")
                .update({ messages_history: updatedHistory })
                .eq("id", conv.id);
            }
          } catch (err) {
            console.error("Error saving delayed tips to history:", err);
          }

          console.log("Delayed tips sent successfully");
        }

        return new Response(JSON.stringify({ status: "ok", tips_sent: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Handle follow-up messages
      if (body.action === "follow_up") {
        const phone = body.phone_number;
        const message = body.message;
        if (phone && message) {
          console.log(`Follow-up to ${phone}: ${message.substring(0, 100)}...`);
          await sendWhatsAppMessage(phone, message);
        }
        return new Response(JSON.stringify({ status: "ok", follow_up_sent: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Process incoming WhatsApp message
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;

      if (!value?.messages?.[0]) {
        return new Response(JSON.stringify({ status: "ok", no_message: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const message = value.messages[0];
      const phoneNumber = message.from;
      const contactName = value.contacts?.[0]?.profile?.name || "";
      const messageType = message.type;
      let messageText = "";
      let incomingWasAudio = false;
      let imageUrl: string | null = null;

      // Handle different message types
      if (messageType === "text") {
        messageText = message.text?.body || "";
      } else if (messageType === "audio") {
        incomingWasAudio = true;
        const audioId = message.audio?.id;
        if (audioId) {
          const audioBuffer = await downloadWhatsAppMedia(audioId);
          if (audioBuffer) {
            const transcription = await transcribeAudio(audioBuffer);
            if (transcription) {
              messageText = transcription;
              console.log(`Audio transcribed: ${messageText}`);
            } else {
              messageText = "[Áudio não reconhecido]";
            }
          } else {
            messageText = "[Áudio não pôde ser baixado]";
          }
        }
      } else if (messageType === "image") {
        messageText = message.image?.caption || "Enviou uma foto";
        // Try to download and store the image
        const imageId = message.image?.id;
        if (imageId) {
          try {
            const mediaResponse = await fetch(
              `https://graph.facebook.com/v21.0/${imageId}`,
              {
                headers: { Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}` },
              }
            );
            if (mediaResponse.ok) {
              const mediaData = await mediaResponse.json();
              // Download the actual image
              const imageResponse = await fetch(mediaData.url, {
                headers: { Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}` },
              });
              if (imageResponse.ok) {
                const imageBlob = await imageResponse.blob();
                const fileName = `review-photos/${phoneNumber}/${Date.now()}.jpg`;
                const { data: uploadData, error: uploadError } = await supabase.storage
                  .from("destination-images")
                  .upload(fileName, imageBlob, { contentType: "image/jpeg", upsert: true });
                
                if (!uploadError && uploadData) {
                  const { data: publicUrlData } = supabase.storage
                    .from("destination-images")
                    .getPublicUrl(fileName);
                  imageUrl = publicUrlData.publicUrl;
                  console.log("Image uploaded successfully:", imageUrl);
                } else {
                  console.error("Image upload error:", uploadError);
                }
              }
            }
          } catch (imgErr) {
            console.error("Error processing image:", imgErr);
          }
        }
      } else {
        messageText = `[${messageType}]`;
      }

      console.log(`Message from ${phoneNumber} (type: ${messageType}): ${messageText}`);

      // ========== ALWAYS SAVE MESSAGE TO CONVERSATION ==========
      // Ensure every incoming message is recorded, regardless of routing
      const ensureConversationAndSaveMessage = async (phone: string, name: string, text: string) => {
        // Get or create conversation for this phone number
        let { data: conv } = await supabase
          .from("whatsapp_conversations")
          .select("id, messages_history, is_ai_active, conversation_state, collected_data, quote_request_id, client_name")
          .eq("phone_number", phone)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!conv) {
          const { data: newConv, error: insertError } = await supabase
            .from("whatsapp_conversations")
            .insert({
              phone_number: phone,
              client_name: name,
              conversation_state: "greeting",
              collected_data: {},
              messages_history: [{ role: "user", content: text, timestamp: new Date().toISOString() }],
              is_ai_active: true,
            })
            .select()
            .single();

          if (insertError) {
            console.error("Error creating conversation for message save:", insertError);
            return null;
          }

          // Notify admin about new conversation
          try {
            await fetch(
              `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-admin-notification`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
                },
                body: JSON.stringify({
                  type: "chat_session",
                  data: {
                    user_name: name || phone,
                    user_whatsapp: phone,
                    destination_name: "WhatsApp",
                  },
                }),
              }
            );
          } catch (notifErr) {
            console.error("Failed to send admin notification:", notifErr);
          }

          console.log(`New conversation created and message saved for ${phone}`);
          return newConv;
        } else {
          // Conversation exists, append the message
          const updatedHistory = [
            ...((conv.messages_history as any[]) || []),
            { role: "user", content: text, timestamp: new Date().toISOString() },
          ];

          await supabase
            .from("whatsapp_conversations")
            .update({ messages_history: updatedHistory, updated_at: new Date().toISOString() })
            .eq("id", conv.id);

          console.log(`Message saved to existing conversation ${conv.id}`);
          return { ...conv, messages_history: updatedHistory };
        }
      };

      // Check if there's an active review for this phone number
      const { data: activeReview } = await supabase
        .from("travel_reviews")
        .select("id")
        .eq("phone_number", phoneNumber)
        .eq("conversation_status", "in_progress")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (activeReview) {
        // Save message to conversation before routing to review
        await ensureConversationAndSaveMessage(phoneNumber, contactName, messageText);
        
        // Route to review webhook
        console.log(`Routing to review webhook for review ${activeReview.id}`);
        const reviewUrl = `${SUPABASE_URL}/functions/v1/review-webhook`;
        const reviewResponse = await fetch(reviewUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({
            action: "process_review_message",
            phone_number: phoneNumber,
            message_text: messageText || (imageUrl ? "Enviou uma foto" : ""),
            review_id: activeReview.id,
            image_url: imageUrl,
          }),
        });

        const reviewResult = await reviewResponse.json();
        console.log("Review webhook result:", reviewResult);

        return new Response(JSON.stringify({ status: "ok", routed_to: "review", ...reviewResult }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ========== ADMIN ROUTING ==========
      // If the message is from the admin phone number, route to admin assistant
      if (phoneNumber === ADMIN_PHONE_NUMBER) {
        // Save admin messages too so they appear in conversations
        await ensureConversationAndSaveMessage(phoneNumber, contactName || "Admin", messageText);
        
        console.log(`[ADMIN] Message from admin: ${messageText}`);
        try {
          await handleAdminMessage(phoneNumber, messageText);
        } catch (adminErr) {
          console.error("[ADMIN] Error handling admin message:", adminErr);
          await sendWhatsAppMessage(phoneNumber, "❌ Erro ao processar comando. Tente novamente.");
        }
        return new Response(JSON.stringify({ status: "ok", routed_to: "admin" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get or create conversation (message is already saved by ensureConversationAndSaveMessage)
      const savedConv = await ensureConversationAndSaveMessage(phoneNumber, contactName, messageText);
      
      if (!savedConv) {
        return new Response(JSON.stringify({ status: "error", message: "Failed to create conversation" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Re-fetch the full conversation to get all fields
      let { data: conversation } = await supabase
        .from("whatsapp_conversations")
        .select("*")
        .eq("id", savedConv.id)
        .single();

      if (!conversation) {
        return new Response(JSON.stringify({ status: "error", message: "Conversation not found after save" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // If conversation is completed or AI disabled, check if we should reactivate
      if (!conversation.is_ai_active || conversation.conversation_state === "completed") {
        // Keep AI disabled ONLY for human_takeover
        if (conversation.conversation_state === "human_takeover") {
          console.log(`Conversation ${conversation.id} is in human_takeover, skipping AI`);
          return new Response(JSON.stringify({ status: "ok", ai_disabled: true, state: "human_takeover" }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        // Reactivate AI — Téo NUNCA para de atender!
        console.log(`🔄 Reactivating AI for conversation ${conversation.id} (was: ${conversation.conversation_state}, ai_active: ${conversation.is_ai_active})`);
        await supabase
          .from("whatsapp_conversations")
          .update({ is_ai_active: true, conversation_state: "chatting" })
          .eq("id", conversation.id);
        conversation.is_ai_active = true;
        conversation.conversation_state = "chatting";
      }

      const collectedData = (conversation.collected_data as Record<string, any>) || {};

      // Check if conversation is waiting for a verification code
      if (collectedData._quotation_pending_code && collectedData._quotation_request) {
        console.log("Processing verification code:", messageText.trim());
        const quotResult = await requestQuotation(collectedData._quotation_request, messageText.trim());

        // Clear pending state
        const updatedData = { ...collectedData };
        delete updatedData._quotation_pending_code;
        delete updatedData._quotation_request;

        let responseMsg: string;
        if (quotResult.status === "success" && quotResult.data) {
          responseMsg = formatQuotationResults(quotResult.data);
          responseMsg += "\n\nQuer que eu te ajude com mais alguma coisa? 😊";
        } else if (quotResult.status === "pending_code") {
          // Still pending, ask again
          updatedData._quotation_pending_code = true;
          updatedData._quotation_request = collectedData._quotation_request;
          responseMsg = "❌ Código inválido ou expirado. Por favor, verifique seu e-mail e envie o código correto.";
        } else {
          responseMsg = `Olá ${collectedData.nome || 'amigo(a)'}! 👋\n\nEstamos trabalhando para encontrar as melhores opções para sua viagem a ${collectedData.destino || 'seu destino'}! ✈️\n\nPara garantir que você tenha o pacote perfeito, vamos precisar do apoio de um especialista no destino. Em breve, um de nossos consultores da Tomorrow Travel entrará em contato para personalizar sua experiência e encontrar a melhor opção para você! 🏖️\n\nAguarde nosso retorno! 😊`;
          // Mark as failed and finalize
          updatedData._quotation_failed = true;
          // Create lead if needed
          if (!conversation.quote_request_id) {
            try {
              const quoteRequest = await createQuoteRequest(phoneNumber, updatedData);
              await supabase.from("whatsapp_conversations").update({ quote_request_id: quoteRequest.id }).eq("id", conversation.id);
            } catch (err) {
              console.error("Error creating quote on verification failure:", err);
            }
          }
        }

        const updatedHistory = [
          ...(conversation.messages_history as any[] || []),
          { role: "assistant", content: responseMsg, timestamp: new Date().toISOString() },
        ];

        const isFinalized = !!updatedData._quotation_failed;

        await supabase
          .from("whatsapp_conversations")
          .update({
            collected_data: updatedData,
            messages_history: updatedHistory,
            ...(isFinalized ? { conversation_state: "completed", is_ai_active: false } : {}),
          })
          .eq("id", conversation.id);

        await sendWhatsAppMessage(phoneNumber, responseMsg);

        return new Response(JSON.stringify({ status: "ok", quotation_code_processed: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Build messages for AI (user message is already in conversation.messages_history)
      const historyForAi = (conversation.messages_history as any[] || []).map((msg: any) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
      }));

      // Get AI response
      const aiResponse = await getAiResponse(historyForAi);

      // Extract collected data and status
      const { data: newCollectedData, status: conversationStatus } = extractCollectedData(
        aiResponse,
        collectedData
      );

      // Check if AI triggered a quotation request - but ONLY if not already triggered before
      const alreadyQuoted = conversation.conversation_state === "awaiting_quotation" || !!collectedData._quotation_triggered;
      const quotationData = alreadyQuoted ? null : parseQuotationTag(aiResponse);

      // Clean response (remove all tags)
      let cleanResponse = cleanAiResponse(aiResponse);

      // Handle quotation if triggered
      if (quotationData) {
        console.log("AI triggered quotation request:", JSON.stringify(quotationData));
        
        // Send the clean message first
        if (cleanResponse) {
          await sendWhatsAppMessage(phoneNumber, cleanResponse);
        }

        // Save quotation request to table for Manus polling
        const saveResult = await saveQuotationRequest(
          quotationData,
          phoneNumber,
          newCollectedData.nome || conversation.client_name || contactName,
          newCollectedData.preferencias || newCollectedData.tipo_viagem || null
        );

        let quotationMsg: string;
        let quoteRequestId = conversation.quote_request_id;

        // Mark quotation as triggered to prevent duplicates
        newCollectedData._quotation_triggered = true;

        if (saveResult.success) {
          quotationMsg = `Recebi sua solicitação! 🌴✨\n\nEstou processando as melhores opções para ${quotationData.destino}. Aguarde aproximadamente 1 minuto! ✈️🏨`;
          
          // Generate tips now, schedule sending after 30s via self-invocation
          const destino = quotationData.destino;
          try {
            const tipsResponse = await getAiResponse([
              { role: "user", content: `Me dê exatamente 4 dicas rápidas de passeios imperdíveis em ${destino}. Breve, divertido, com emojis. Uma dica por linha numerada. Comece EXATAMENTE com "Enquanto você aguarda, olha só o que te espera em ${destino}! 🗺️✨" e depois as 4 dicas. APENAS 4 dicas, nada mais.` }
            ]);
            const cleanTips = cleanAiResponse(tipsResponse);
            if (cleanTips && cleanTips.length > 20) {
              // Schedule delayed tips via self-invocation (non-blocking)
              const selfUrl = `${SUPABASE_URL}/functions/v1/whatsapp-webhook`;
              fetch(selfUrl, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                },
                body: JSON.stringify({
                  action: "delayed_tips",
                  phone_number: phoneNumber,
                  message: cleanTips,
                  delay_seconds: 30,
                }),
              }).catch(err => console.error("Error scheduling delayed tips:", err));
            }
          } catch (tipErr) {
            console.error("Error generating tips:", tipErr);
          }
        } else {
          quotationMsg = `Olá ${newCollectedData.nome || conversation.client_name || 'amigo(a)'}! 👋\n\nEstamos trabalhando para encontrar as melhores opções para sua viagem a ${quotationData.destino}! ✈️\n\nPara garantir que você tenha o pacote perfeito, vamos precisar do apoio de um especialista no destino. Em breve, um de nossos consultores da Tomorrow Travel entrará em contato para personalizar sua experiência e encontrar a melhor opção para você! 🏖️\n\nAguarde nosso retorno! 😊`;
          // Create lead as fallback
          if (!quoteRequestId) {
            try {
              const quoteRequest = await createQuoteRequest(phoneNumber, newCollectedData);
              quoteRequestId = quoteRequest.id;
            } catch (err) {
              console.error("Error creating quote on failure:", err);
            }
          }
        }

        // Update history with all messages
        const updatedHistory = [
          ...(conversation.messages_history as any[] || []),
          { role: "assistant", content: cleanResponse, timestamp: new Date().toISOString() },
          { role: "assistant", content: quotationMsg, timestamp: new Date().toISOString() },
        ];

        // After quotation is triggered, set to awaiting_quotation but DISABLE AI
        // AI should NOT keep sending messages. Only manual_send (from Manus) or human should respond.
        let newState = conversationStatus === "human_takeover" ? "human_takeover"
          : saveResult.success ? "awaiting_quotation"
          : "completed";

        if (newState === "completed" && !quoteRequestId) {
          try {
            const quoteRequest = await createQuoteRequest(phoneNumber, newCollectedData);
            quoteRequestId = quoteRequest.id;
          } catch (err) {
            console.error("Error creating quote:", err);
          }
        }

        // DISABLE AI after quotation to prevent loops - Manus will respond via manual_send
        const keepAiActive = false;

        await supabase
          .from("whatsapp_conversations")
          .update({
            client_name: newCollectedData.nome || conversation.client_name || contactName,
            conversation_state: newState,
            collected_data: newCollectedData,
            messages_history: updatedHistory,
            quote_request_id: quoteRequestId,
            is_ai_active: keepAiActive || (newState !== "human_takeover" && newState !== "completed"),
          })
          .eq("id", conversation.id);

        await sendWhatsAppMessage(phoneNumber, quotationMsg);

        return new Response(JSON.stringify({ status: "ok", state: newState, quotation: true, saved: saveResult.success }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check for change request tag from AI
      const changeRequest = parseChangeRequestTag(aiResponse);
      if (changeRequest) {
        console.log("Change request detected:", changeRequest);

        const changeMsg = `Entendi que você gostaria de personalizar sua viagem! 😊\n\nPara garantir que montemos o pacote perfeito para você, vou encaminhar sua solicitação para um de nossos especialistas no destino.\n\nEm breve, um consultor da Tomorrow Travel entrará em contato para criar uma experiência sob medida para sua viagem! ✈️🏖️\n\nAguarde nosso retorno!`;

        // Save change request to travel_quote_requests if we have one
        if (conversation.quote_request_id || collectedData._last_quote_id) {
          const quoteId = collectedData._last_quote_id || null;
          if (quoteId) {
            await supabase
              .from("travel_quote_requests")
              .update({ change_request: changeRequest })
              .eq("id", quoteId);
          }
        }

        // Also save to quote_requests for team visibility
        try {
          const existingQuoteId = conversation.quote_request_id;
          if (existingQuoteId) {
            await supabase
              .from("quote_requests")
              .update({ 
                notes: `Solicitação de alteração: ${changeRequest}`,
                status: "change_requested" 
              })
              .eq("id", existingQuoteId);
          }
        } catch (err) {
          console.error("Error updating quote with change request:", err);
        }

        // Notify admin via email
        try {
          const notifyUrl = `${SUPABASE_URL}/functions/v1/send-admin-notification`;
          await fetch(notifyUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            },
            body: JSON.stringify({
              type: "change_request",
              data: {
                client_name: newCollectedData.nome || conversation.client_name || contactName,
                phone_number: phoneNumber,
                destination: newCollectedData.destino || collectedData.destino || "Não informado",
                change_description: changeRequest,
                original_message: messageText,
              },
            }),
          });
        } catch (notifyErr) {
          console.error("Error sending change request notification:", notifyErr);
        }

        const updatedHistory = [
          ...(conversation.messages_history as any[] || []),
          { role: "assistant", content: changeMsg, timestamp: new Date().toISOString() },
        ];

        await supabase
          .from("whatsapp_conversations")
          .update({
            collected_data: { ...newCollectedData, _change_requested: true },
            messages_history: updatedHistory,
            conversation_state: "human_takeover",
            is_ai_active: false,
          })
          .eq("id", conversation.id);

        await sendWhatsAppMessage(phoneNumber, changeMsg);

        return new Response(JSON.stringify({ status: "ok", change_request: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Standard flow (no quotation)
      const updatedHistory = [
        ...(conversation.messages_history as any[] || []),
        { role: "assistant", content: cleanResponse, timestamp: new Date().toISOString() },
      ];

      let newState = conversationStatus === "completed" ? "completed"
        : conversationStatus === "human_takeover" ? "human_takeover"
        : determineConversationState(newCollectedData);

      let quoteRequestId = conversation.quote_request_id;
      if (newState === "completed" && !quoteRequestId) {
        try {
          const quoteRequest = await createQuoteRequest(phoneNumber, newCollectedData);
          quoteRequestId = quoteRequest.id;
        } catch (err) {
          console.error("Error creating quote:", err);
        }
      }

      await supabase
        .from("whatsapp_conversations")
        .update({
          client_name: newCollectedData.nome || conversation.client_name || contactName,
          conversation_state: newState,
          collected_data: newCollectedData,
          messages_history: updatedHistory,
          quote_request_id: quoteRequestId,
          is_ai_active: newState !== "human_takeover" && newState !== "completed",
        })
        .eq("id", conversation.id);

      // If the incoming message was audio, respond with audio too
      if (incomingWasAudio && cleanResponse) {
        try {
          const audioBuffer = await convertTextToAudio(cleanResponse);
          if (audioBuffer) {
            const audioUrl = await uploadAudioToStorage(audioBuffer, phoneNumber);
            if (audioUrl) {
              await sendWhatsAppAudio(phoneNumber, audioUrl);
              console.log("Audio response sent to", phoneNumber);
            }
          }
        } catch (audioErr) {
          console.error("Error sending audio response:", audioErr);
        }
      }

      await sendWhatsAppMessage(phoneNumber, cleanResponse);

      // Schedule follow-up quote if no quotation was triggered yet
      if (newState !== "completed" && newState !== "human_takeover" && !newCollectedData._quotation_triggered && !conversation.quote_request_id) {
        try {
          const selfUrl = `${SUPABASE_URL}/functions/v1/whatsapp-webhook`;
          // Get the updated_at from the DB after our update
          const { data: updatedConv } = await supabase
            .from("whatsapp_conversations")
            .select("updated_at")
            .eq("id", conversation.id)
            .single();

          if (updatedConv) {
            fetch(selfUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              },
              body: JSON.stringify({
                action: "follow_up_quote",
                phone_number: phoneNumber,
                conversation_id: conversation.id,
                saved_updated_at: updatedConv.updated_at,
              }),
            }).catch(err => console.error("Error scheduling follow-up quote:", err));
          }
        } catch (fuErr) {
          console.error("Error scheduling follow-up:", fuErr);
        }
      }

      return new Response(JSON.stringify({ status: "ok", state: newState }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response("Method not allowed", { status: 405 });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
