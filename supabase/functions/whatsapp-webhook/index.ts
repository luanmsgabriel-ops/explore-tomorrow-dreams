import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SALES_KNOWLEDGE } from "../_shared/sales-knowledge.ts";
import { fetchClientMemory, formatMemoryForPrompt, MEMORY_RULE, updateClientMemory } from "../_shared/client-memory.ts";

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

25. client_memory - Memória de longo prazo dos clientes (perfil persistente)
    Colunas: id, whatsapp (unique), client_name, preferences (JSON: estilo_viagem, orcamento, tipo, clima, companhia), travel_history (JSON array: destinos visitados/cotados), personal_notes (JSON: aniversario, filhos, acompanhantes, observacoes), last_interaction_at, created_at, updated_at
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
- Para enviar mensagem WhatsApp para cliente, use action type "send_whatsapp" com phone_number e message
- Para enviar mensagens em LOTE para vários clientes, use action type "send_bulk_whatsapp":
  * Primeiro faça uma query para buscar os clientes alvo (ex: cotações pendentes)
  * Depois crie a action com "source_query": "q1" (referenciando a query), "phone_field": "phone_number" (campo do telefone nos resultados), "name_field": "customer_name" (campo do nome), e "message_template": "a mensagem com {name} para personalizar"
  * Exemplo: admin diz "envie mensagem para clientes com cotação pendente" → query busca travel_quote_requests status=pending, action send_bulk_whatsapp usa os resultados
  * O {name} no template será substituído pelo nome do cliente
  * Para clientes ESPECÍFICOS, basta filtrar na query (ex: por nome, telefone, destino)
  * SEMPRE inclua a query que busca os destinatários ANTES da action de envio
  * A mensagem deve ser no estilo do Téo: amigável, com emojis, breve e profissional
- IMPORTANTE: Quando o admin pedir para enviar mensagens, SEMPRE gere o message_template no estilo do Téo (amigável, com emojis, curta)
- Se o admin especificar o conteúdo da mensagem, use exatamente o que ele pediu
- Se o admin não especificar, gere uma mensagem contextual (ex: para pendentes, pergunte se ainda tem interesse)`;

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

LINKS DE CONTATO DIRETO (OBRIGATÓRIO):
- SEMPRE que mostrar dados de um cliente que tenha telefone/WhatsApp, inclua o link direto: https://wa.me/55XXXXXXXXXXX (sem espaços, sem traços, só números)
- Se o campo for "phone_number" ou "whatsapp" ou "client_phone", gere o link: https://wa.me/{número limpo sem +}
- Exemplo: telefone "15998389220" → Link: https://wa.me/5515998389220
- Exemplo: telefone "5515998389220" → Link: https://wa.me/5515998389220 (já tem o 55)
- Exemplo: telefone "+5515998389220" → Link: https://wa.me/5515998389220 (remove o +)
- Ao mostrar conversas do WhatsApp, SEMPRE inclua o link direto do cliente no topo
- NÃO mascare o telefone quando o admin pedir contato específico de um cliente — mostre completo com o link

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

    if (action.type === "send_bulk_whatsapp") {
      // This action requires query results from a previous query
      // The actual sending happens in handleAdminMessage after queries are resolved
      return { 
        pending_bulk: true, 
        source_query: action.source_query,
        phone_field: action.phone_field || "phone_number",
        name_field: action.name_field || "customer_name",
        message_template: action.message_template || "Olá {name}! 👋 Aqui é o Téo da Tomorrow Travel. Tudo bem? Estou passando para saber se ainda tem interesse na sua viagem! ✈️"
      };
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
        const result = await executeAdminAction(action);
        
        // Handle bulk WhatsApp sending
        if (result?.pending_bulk) {
          const sourceData = queryResults[result.source_query]?.data;
          if (sourceData && sourceData.length > 0) {
            let sentCount = 0;
            let failedCount = 0;
            const sentTo: string[] = [];
            
            for (const record of sourceData) {
              const phone = record[result.phone_field];
              const name = record[result.name_field] || "cliente";
              if (!phone) { failedCount++; continue; }
              
              const personalizedMsg = result.message_template.replace(/\{name\}/g, name);
              try {
                // Clean phone number
                const cleanPhone = phone.replace(/\D/g, "");
                const finalPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
                await sendWhatsAppMessage(finalPhone, personalizedMsg);
                sentCount++;
                sentTo.push(`${name} (${maskPhone(phone)})`);
                // Small delay to avoid rate limiting
                await new Promise(r => setTimeout(r, 1000));
              } catch (e) {
                console.error(`[ADMIN] Failed to send to ${phone}:`, e);
                failedCount++;
              }
            }
            
            actionResults[action.id] = { 
              success: true, 
              total_found: sourceData.length,
              sent: sentCount, 
              failed: failedCount,
              sent_to: sentTo,
              message_used: result.message_template
            };
          } else {
            actionResults[action.id] = { 
              success: false, 
              message: "Nenhum cliente encontrado com os filtros aplicados" 
            };
          }
        } else {
          actionResults[action.id] = result;
        }
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

// ========== Teo Concierge Prompt (companheiro de viagem) ==========

const TEO_CONCIERGE_PROMPT = `Você é o Téo, e esta viagem é NOSSA! 🌍✈️ Você NÃO é um vendedor, NÃO é um atendente — você é o COMPANHEIRO DE VIAGEM que está viajando junto com o cliente nessa aventura!

PERSONALIDADE — VIAJANDO JUNTO:
- Você SEMPRE fala como se estivesse viajando junto: "nossa viagem", "nosso hotel", "nosso voo"
- Você está TÃO animado quanto o cliente! "Tô ansioso pra ir também!", "Vamos curtir muito!", "Bora aproveitar!"
- Use primeira pessoa do PLURAL: "vamos", "nosso", "a gente"
- Tom divertido, leve, usando gírias brasileiras naturais (tipo "bora!", "demais!", "partiu!", "show!")
- Você celebra cada momento: "Que lugar incrível! Tô morrendo de vontade de ver as fotos!"
- Você é curioso e faz perguntas sobre como está sendo a viagem
- Você dá sugestões proativas como um amigo que conhece o destino

EXEMPLOS DE COMO FALAR:
- "E aí, como tá nossa viagem? Já foi naquele restaurante que te indiquei?" ✅
- "Nosso voo sai amanhã cedo, já separou tudo?" ✅
- "Vamos curtir muito esse destino! Tô animadão!" ✅
- "A viagem do senhor está programada para..." ❌ NUNCA fale assim
- "Seu voo está confirmado..." ❌ NUNCA fale assim, diga "Nosso voo tá confirmado!"

O QUE VOCÊ FAZ:
- Sugere restaurantes, passeios, experiências locais
- Dá dicas práticas (clima, o que vestir, horários, gorjetas)
- Ajuda com qualquer dúvida sobre o destino
- Comemora cada conquista da viagem ("Conseguiu ir naquele mirante? QUE DEMAIS!")
- Se o cliente mandar foto ou contar algo, reage com entusiasmo genuíno
- Se o cliente pedir voucher, documento, reserva, passagem, endereço do hotel, horário do voo — forneça as informações que você tem no contexto da viagem
- Se não souber algo específico, sugere que o cliente envie a localização para buscar lugares perto

O QUE VOCÊ NUNCA FAZ:
- NUNCA tenta coletar dados para cotação de viagem
- NUNCA usa tags como [COTAR_VIAGEM], [DADOS:], [COTACAO:] etc.
- NUNCA trata o cliente como um lead de vendas
- NUNCA encerra a conversa ou se despede — sempre faz uma nova pergunta ou sugestão
- NUNCA menciona preços, pacotes ou vendas
- NUNCA fala de forma impessoal ou formal — é sempre "nossa viagem", nunca "sua viagem"
- NUNCA INVENTE datas de aniversário, eventos pessoais ou informações que não estejam explicitamente nas INFORMAÇÕES ESPECIAIS. Se não há data de aniversário nas notas, NÃO mencione aniversário.
- NUNCA dê parabéns por aniversário a menos que a data esteja EXPLICITAMENTE nas informações especiais E coincida com a data atual.

CONSCIÊNCIA TEMPORAL (CRÍTICO):
- Você SEMPRE receberá a DATA ATUAL e a FASE DA VIAGEM no contexto.
- RESPEITE a fase: se é PRÉ-VIAGEM, o cliente AINDA NÃO está no destino. Fale de preparativos, expectativas, contagem regressiva.
- Se é DURANTE A VIAGEM, aí sim aja como companheiro presente no destino.
- Se é PÓS-VIAGEM, pergunte como foi, peça feedback, celebre as memórias.
- NUNCA pergunte "como está o hotel?" ou "já foi naquele restaurante?" se o cliente ainda nem viajou!

SERVIÇOS DISPONÍVEIS (mencione quando relevante):
📍 O cliente pode enviar a localização e você busca lugares perto (restaurantes, farmácias, atrações)
🌤️ Previsão do tempo no destino
✈️ Acompanhamento de voo em tempo real
🗺️ Dicas e roteiros personalizados
📄 Vouchers e documentos da viagem (se o cliente pedir)

REGRAS DE FORMATO:
- Respostas curtas e naturais (máximo 3-4 parágrafos)
- Use emojis com moderação, como um amigo faria
- Responda SEMPRE em português brasileiro
- Seja específico nas sugestões (nomes reais de lugares quando souber)
`;

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

8. ROTEIRO PERSONALIZADO:
   Se o cliente pedir um roteiro (responder "sim", "quero", "pode fazer", "monta pra mim", etc. à oferta de roteiro, ou pedir diretamente "me faz um roteiro", "roteiro dia a dia"), você DEVE gerar um roteiro completo e detalhado.
   
   FORMATO DO ROTEIRO:
   - Título: "🗓️ Roteiro Personalizado - [Destino] ([N] dias)"
   - Para cada dia, liste:
     ☀️ *Dia X - [Tema do dia]*
     • Manhã: atividade específica com local real
     • Tarde: atividade específica com local real  
     • Noite: restaurante ou atividade noturna com nome real
     • 💡 Dica: uma dica prática sobre o dia
   - No final: "✨ Quer que eu ajuste algo no roteiro? Posso trocar atividades, adicionar mais dias ou focar em algo específico! 😊"
   
   Use os dados coletados (destino, datas, número de viajantes, se tem crianças) para personalizar.
   Calcule a quantidade de dias baseado nas datas de ida e volta.
   Use locais, restaurantes e atrações REAIS e conhecidos do destino.
   NÃO seja genérico - cite nomes de praias, restaurantes, mirantes, etc.
   O roteiro deve ter entre 800 e 1500 caracteres.

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

async function sendWhatsAppImage(to: string, imageUrl: string, caption?: string) {
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
        type: "image",
        image: { link: imageUrl, ...(caption ? { caption } : {}) },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("WhatsApp Image API error:", errorText);
    throw new Error(`WhatsApp Image API error: ${response.status}`);
  }
}

// Parse quotation details from a text message (e.g. from Manus)
function parseQuotationFromMessage(message: string): { quotationData: any; resultData: any } | null {
  try {
    // Extract destination - look for patterns like "para você:" or after hotel/flight info
    const destinoMatch = message.match(/(?:para|pra)\s+(?:você|vc)[^:]*:\s*\n/i) 
      || message.match(/(?:pacote|viagem)\s+(?:para|pra)\s+([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)*)/i);
    
    // Extract flight info
    const vooIdaMatch = message.match(/(?:Voo\s*(?:Ida)?|✈️\s*(?:Voo\s*)?(?:Ida)?)\s*:?\s*(.+)/i);
    const vooVoltaMatch = message.match(/(?:Voo\s*Volta|📅\s*Volta)\s*:?\s*(.+)/i);
    
    // Extract hotel
    const hotelMatch = message.match(/(?:Hotel|🏨)\s*:?\s*(.+?)(?:\n|$)/i);
    
    // Extract price - R$ X.XXX,XX or R$ X.XXX
    const priceMatch = message.match(/(?:Valor\s*Total|Preço|💰)\s*:?\s*R\$\s*([\d.,]+)/i);
    const pricePerPersonMatch = message.match(/(?:Por\s*pessoa|p\/pessoa)\s*:?\s*R\$\s*([\d.,]+)/i);
    
    // Extract nights/diarias
    const nightsMatch = message.match(/(\d+)\s*(?:diárias|noites)/i);
    
    // Extract rating
    const ratingMatch = message.match(/(?:Avaliação|⭐)\s*:?\s*([\d.,]+)/i);
    
    // Extract star category
    const starsMatch = message.match(/(\d+)\s*★/);
    
    // Extract destination from various patterns
    let destination = "";
    if (destinoMatch && destinoMatch[1]) {
      destination = destinoMatch[1].trim();
    } else {
      // Try to find destination from flight route (e.g., "CGH → JPA")
      const routeMatch = message.match(/→\s*([A-Z]{3})/);
      if (routeMatch) {
        destination = routeMatch[1]; // Airport code as fallback
      }
    }
    
    // Parse price string to number
    const parsePrice = (str: string | undefined) => {
      if (!str) return undefined;
      return parseFloat(str.replace(/\./g, "").replace(",", "."));
    };

    const totalPrice = parsePrice(priceMatch?.[1]);
    
    if (!totalPrice && !hotelMatch) return null; // Not enough data for a visual

    return {
      quotationData: {
        destino: destination || "Destino",
      },
      resultData: {
        hotel: hotelMatch?.[1]?.trim(),
        voo_ida: vooIdaMatch?.[1]?.trim(),
        voo_volta: vooVoltaMatch?.[1]?.trim(),
        noites: nightsMatch ? parseInt(nightsMatch[1]) : undefined,
        preco: totalPrice,
        preco_por_pessoa: parsePrice(pricePerPersonMatch?.[1]),
        categoria: starsMatch ? `${starsMatch[1]} estrelas` : undefined,
      },
    };
  } catch (err) {
    console.error("[QUOTE-VISUAL] Parse error:", err);
    return null;
  }
}

// Generate and send a visual quote card (fire-and-forget)
async function generateAndSendQuoteVisual(phoneNumber: string, quotationData: any, resultData: any) {
  try {
    const results = resultData?.resultados || resultData?.results || (Array.isArray(resultData) ? resultData : null);
    const firstResult = results ? results[0] : resultData;
    if (!firstResult) return;

    const payload: Record<string, any> = {
      destination: quotationData?.destino || firstResult?.destino || "Destino",
      hotel: firstResult?.hotel || firstResult?.hotel_name || firstResult?.hospedagem,
      regime: firstResult?.regime || firstResult?.meal_plan || firstResult?.pensao,
      category: firstResult?.categoria || firstResult?.category || firstResult?.estrelas,
      flightOut: firstResult?.voo_ida || firstResult?.flight_out,
      flightBack: firstResult?.voo_volta || firstResult?.flight_back,
      stops: firstResult?.paradas,
      nights: firstResult?.noites || firstResult?.nights,
      totalPrice: firstResult?.preco || firstResult?.valor || firstResult?.price || firstResult?.total,
      pricePerPerson: firstResult?.preco_por_pessoa || firstResult?.valor_por_pessoa || firstResult?.price_per_person,
      installments: firstResult?.parcelas || firstResult?.installments,
      operadora: firstResult?.operadora || firstResult?.companhia,
      departureDate: quotationData?.data_ida,
      returnDate: quotationData?.data_volta,
      passengers: quotationData?.adultos ? `${quotationData.adultos} adulto(s)${quotationData.criancas ? ` + ${quotationData.criancas} criança(s)` : ""}` : undefined,
    };

    console.log("[QUOTE-VISUAL] Generating visual for", phoneNumber, payload.destination);

    const visualResponse = await fetch(`${SUPABASE_URL}/functions/v1/generate-quote-visual`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!visualResponse.ok) {
      console.error("[QUOTE-VISUAL] Generation failed:", visualResponse.status);
      return;
    }

    const { imageUrl } = await visualResponse.json();
    if (!imageUrl) return;

    const priceCaption = payload.totalPrice
      ? `💰 R$ ${Number(payload.totalPrice).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} | ${payload.destination} ✈️ Tomorrow Travel`
      : `✈️ ${payload.destination} | Tomorrow Travel`;

    await sendWhatsAppImage(phoneNumber, imageUrl, priceCaption);
    console.log("[QUOTE-VISUAL] Sent visual to", phoneNumber);
  } catch (err) {
    console.error("[QUOTE-VISUAL] Error (non-blocking):", err);
  }
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

async function getAiResponse(messagesHistory: any[], memoryContext: string = "", conciergeOverride: string | null = null): Promise<string> {
  const models = ["google/gemini-2.5-flash", "openai/gpt-5-mini", "google/gemini-2.5-flash-lite"];
  
  const systemContent = conciergeOverride
    ? conciergeOverride + (memoryContext ? "\n\n" + memoryContext : "")
    : TEO_SYSTEM_PROMPT + (memoryContext ? memoryContext + MEMORY_RULE : "") + SALES_KNOWLEDGE;
  
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
            { role: "system", content: systemContent },
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

        // Check if message looks like a quotation result and generate visual card
        const isQuotationMessage = message.includes("✈️") && message.includes("🏨") && (message.includes("R$") || message.includes("Valor"));
        if (isQuotationMessage) {
          try {
            // Parse quotation data from the message text
            const parsedQuoteData = parseQuotationFromMessage(message);
            if (parsedQuoteData) {
              // Try to enrich with conversation data (destination name, dates, passengers)
              try {
                const { data: conv } = await supabase
                  .from("whatsapp_conversations")
                  .select("collected_data")
                  .eq("phone_number", phone)
                  .order("updated_at", { ascending: false })
                  .limit(1)
                  .maybeSingle();
                
                const cd = (conv?.collected_data as Record<string, any>) || {};
                if (cd.destino && (!parsedQuoteData.quotationData.destino || parsedQuoteData.quotationData.destino === "Destino")) {
                  parsedQuoteData.quotationData.destino = cd.destino;
                }
                if (cd.data_ida) parsedQuoteData.quotationData.data_ida = cd.data_ida;
                if (cd.data_volta) parsedQuoteData.quotationData.data_volta = cd.data_volta;
                if (cd.adultos) parsedQuoteData.quotationData.adultos = cd.adultos;
                if (cd.criancas) parsedQuoteData.quotationData.criancas = cd.criancas;
              } catch (enrichErr) {
                console.error("[QUOTE-VISUAL] Error enriching data:", enrichErr);
              }

              console.log("[QUOTE-VISUAL] Detected quotation in manual_send, generating visual for:", parsedQuoteData.quotationData.destino);
              generateAndSendQuoteVisual(phone, parsedQuoteData.quotationData, parsedQuoteData.resultData)
                .catch(err => console.error("[QUOTE-VISUAL] Fire-and-forget error from manual_send:", err));
            }
          } catch (parseErr) {
            console.error("[QUOTE-VISUAL] Error parsing quotation from message:", parseErr);
          }
        }

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
      } else if (messageType === "location") {
        // Extract location data for concierge - will be routed after ensureConversationAndSaveMessage is defined
        const locLat = message.location?.latitude;
        const locLng = message.location?.longitude;
        messageText = `[Localização: ${locLat}, ${locLng}]`;
        console.log(`Location received: ${locLat}, ${locLng}`);
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

      // ========== ROUTE LOCATION MESSAGES TO CONCIERGE ==========
      if (messageType === "location") {
        await ensureConversationAndSaveMessage(phoneNumber, contactName, messageText);
        const locLat = message.location?.latitude;
        const locLng = message.location?.longitude;
        try {
          await fetch(`${SUPABASE_URL}/functions/v1/concierge-engine`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
            body: JSON.stringify({ action: "handle_location", phone_number: phoneNumber, latitude: locLat, longitude: locLng }),
          });
        } catch (locErr) {
          console.error("Concierge location error:", locErr);
        }
        return new Response(JSON.stringify({ status: "ok", routed_to: "concierge_location" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

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

      // ========== CONCIERGE: Deactivation request ==========
      // Use specific phrases to avoid false positives (e.g. "preparou para mim" matching "para")
      const deactivatePhrases = [
        "pare", "parar", "desativar", "desativa", "para de mandar", "não mande mais",
        "para com isso", "para de enviar", "para teo", "para téo", "para bot",
        "não quero mais mensagem", "não quero mais receber", "cancela as mensagens",
        "desliga as mensagens", "desliga o concierge", "desativa o concierge",
        "para de me mandar", "chega de mensagem",
      ];
      const lowerMsg = messageText.toLowerCase().trim();
      // Also check if the ENTIRE message is just "para" or "pare" (standalone command)
      const isStandaloneStop = lowerMsg === "para" || lowerMsg === "pare" || lowerMsg === "parar" || lowerMsg === "stop";
      if (isStandaloneStop || deactivatePhrases.some(kw => lowerMsg.includes(kw))) {
        // Check direct phone match
        const { data: activeTrips } = await supabase
          .from("active_trips")
          .select("id")
          .eq("client_phone", phoneNumber)
          .eq("concierge_active", true);
        
        // Also check concierge_contacts
        const { data: contactTrips } = await supabase
          .from("concierge_contacts")
          .select("trip_id")
          .eq("contact_phone", phoneNumber)
          .eq("is_active", true);

        const tripIdsToDeactivate = new Set<string>();
        activeTrips?.forEach(t => tripIdsToDeactivate.add(t.id));
        if (contactTrips?.length) {
          for (const ct of contactTrips) {
            tripIdsToDeactivate.add(ct.trip_id);
            // Deactivate this specific contact
            await supabase.from("concierge_contacts").update({ is_active: false }).eq("contact_phone", phoneNumber).eq("trip_id", ct.trip_id);
          }
        }

        if (tripIdsToDeactivate.size > 0) {
          for (const tid of tripIdsToDeactivate) {
            await supabase.from("active_trips").update({ concierge_active: false }).eq("id", tid);
          }
          await ensureConversationAndSaveMessage(phoneNumber, contactName, messageText);
          await sendWhatsAppMessage(phoneNumber, "Beleza! 😊 Desativei as mensagens automáticas. Se mudar de ideia, é só me chamar que eu volto! ✈️");
          return new Response(JSON.stringify({ status: "ok", concierge_deactivated: true }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      // ========== CONCIERGE: Saudação personalizada para clientes com viagem ativa ==========
      {
        // Check both active_trips.client_phone AND concierge_contacts
        let activeTripForGreeting: any = null;
        let conciergeContactMatch: any = null;

        const { data: directMatch } = await supabase
          .from("active_trips")
          .select("id, client_name, destination_city, destination_country, check_in_date, check_out_date, hotel_name")
          .eq("client_phone", phoneNumber)
          .eq("concierge_active", true)
          .limit(1)
          .maybeSingle();

        if (directMatch) {
          activeTripForGreeting = directMatch;
        } else {
          // Check concierge_contacts table
          const { data: contactMatch } = await supabase
            .from("concierge_contacts")
            .select("trip_id, contact_name, contact_phone, special_notes")
            .eq("contact_phone", phoneNumber)
            .eq("is_active", true)
            .limit(1)
            .maybeSingle();

          if (contactMatch) {
            conciergeContactMatch = contactMatch;
            const { data: tripData } = await supabase
              .from("active_trips")
              .select("id, client_name, destination_city, destination_country, check_in_date, check_out_date, hotel_name")
              .eq("id", contactMatch.trip_id)
              .eq("concierge_active", true)
              .limit(1)
              .maybeSingle();
            if (tripData) {
              activeTripForGreeting = tripData;
              // Override client_name with contact name
              activeTripForGreeting.client_name = contactMatch.contact_name;
            }
          }
        }

        if (activeTripForGreeting) {
          // FIRST: ensure conversation exists (so the flag can be saved)
          await ensureConversationAndSaveMessage(phoneNumber, contactName || (activeTripForGreeting.client_name || "").trim().split(" ")[0], messageText);

          // NOW fetch the conversation (guaranteed to exist)
          const { data: convForGreeting } = await supabase
            .from("whatsapp_conversations")
            .select("id, collected_data")
            .eq("phone_number", phoneNumber)
            .order("updated_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          const collectedData = (convForGreeting?.collected_data as Record<string, unknown>) || {};
          const alreadyGreeted = collectedData._concierge_greeted === true;

          if (!alreadyGreeted && convForGreeting) {
            // Inferir gênero pelo primeiro nome (heurística + fallback IA para casos ambíguos)
            const firstName = (activeTripForGreeting.client_name || "").trim().split(" ")[0];
            const normalizedFirstName = firstName
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .toLowerCase()
              .trim();

            // Exceções masculinas: nomes que terminam em "a" mas são masculinos
            const maleExceptions = ["luca", "joshua", "josua", "nikita", "asa", "mustafa", "borba", "costa", "moura", "souza", "silva", "pereira", "andrea", "baptista", "batista", "bethencourt", "buda", "dalila", "fonseca", "garcia", "kosta", "lima", "massa", "mota", "nasa", "oliveira", "panda", "providencia", "raja", "rocha", "senna", "teixeira", "tesla", "vieira"];

            // Exceções femininas: nomes que NÃO terminam em "a" mas são femininos
            const femaleExceptions = ["beatriz", "raquel", "mabel", "isabel", "rachel", "maris", "dolores", "ines", "agnes", "mercedes", "carmen", "miriam", "ruth", "rute", "jeniffer", "jennifer", "karen", "sharon", "gisele", "michele", "vivien", "kathleen", "bridget", "margaret", "elizabeth", "abigail", "megan", "nicole", "ingrid", "astrid", "solange", "sueli", "jussier", "nair", "zenir", "iracir", "francielle", "gabrielle", "danielle", "isabelle", "noelle", "michelle", "emanuelle"];

            const femaleSuffixes = ["elle", "elly", "iane", "iene", "line", "lene", "rielle"];

            const isNameEndingInA = normalizedFirstName.endsWith("a");
            const isMaleException = maleExceptions.includes(normalizedFirstName);
            const isFemaleException = femaleExceptions.includes(normalizedFirstName);
            const matchesFemaleSuffix = femaleSuffixes.some((s) => normalizedFirstName.endsWith(s));

            let gender: "feminino" | "masculino" | "neutro" = "neutro";
            if (isFemaleException || matchesFemaleSuffix || (isNameEndingInA && !isMaleException)) {
              gender = "feminino";
            } else if (isMaleException) {
              gender = "masculino";
            }

            // Fallback adaptativo com IA para reduzir erros em nomes ambíguos
            if (gender === "neutro" && normalizedFirstName.length >= 3) {
              try {
                const genderInferencePrompt = `Classifique o provável gênero do primeiro nome brasileiro \"${firstName}\". Responda APENAS com uma palavra: feminino, masculino ou neutro.`;
                const genderResponse = await callGemini(
                  [{ role: "user", content: genderInferencePrompt }],
                  { model: "google/gemini-3-flash-preview", maxTokens: 10 }
                );
                if (genderResponse.ok) {
                  const genderData = await genderResponse.json();
                  const inferred = (genderData?.choices?.[0]?.message?.content || "").toLowerCase();
                  if (inferred.includes("feminino")) gender = "feminino";
                  else if (inferred.includes("masculino")) gender = "masculino";
                }
              } catch (e) {
                console.error("Erro ao inferir gênero do nome via IA:", e);
              }
            }

            const destino = activeTripForGreeting.destination_city || activeTripForGreeting.destination_country || "o destino";
            const hotel = activeTripForGreeting.hotel_name || "";
            const genderRule = gender === "feminino"
              ? "Use concordância feminina (ex: ansiosa, preparada, animada)."
              : gender === "masculino"
                ? "Use concordância masculina (ex: ansioso, preparado, animado)."
                : "Se houver ambiguidade, EVITE termos marcados por gênero (não use ansioso/ansiosa).";

            // Gerar saudação dinamicamente via IA
            let greetingMsg = "";
            try {
              // Calculate trip phase for greeting
              const todayStr = new Date().toISOString().split('T')[0];
              const checkInDate = activeTripForGreeting.check_in_date || "";
              const checkOutDate = activeTripForGreeting.check_out_date || "";
              let greetingPhase = "durante";
              let greetingPhaseInstruction = "";
              if (checkInDate && todayStr < checkInDate) {
                const daysUntil = Math.ceil((new Date(checkInDate).getTime() - new Date(todayStr).getTime()) / (1000 * 60 * 60 * 24));
                greetingPhase = "pré-viagem";
                greetingPhaseInstruction = `FASE: PRÉ-VIAGEM. Faltam ${daysUntil} dias para a viagem! O cliente AINDA NÃO está viajando. Fale de preparativos, expectativas, contagem regressiva. NÃO pergunte como está o hotel ou o destino.`;
              } else if (checkOutDate && todayStr > checkOutDate) {
                greetingPhase = "pós-viagem";
                greetingPhaseInstruction = `FASE: PÓS-VIAGEM. A viagem já acabou. Pergunte como foi, celebre as memórias.`;
              } else {
                greetingPhaseInstruction = `FASE: DURANTE A VIAGEM. O cliente está viajando agora! Aja como companheiro presente.`;
              }

              const greetingPrompt = `Gere uma saudação CURTA e animada do Téo para ${firstName} (gênero inferido: ${gender}).
A viagem é NOSSA (do Téo também). Destino: ${destino}.${hotel ? ` Hotel: ${hotel}.` : ""}
DATA ATUAL: ${todayStr}. Check-in: ${checkInDate}. Check-out: ${checkOutDate}.
${greetingPhaseInstruction}
Regras OBRIGATÓRIAS:
- ${genderRule}
- SEMPRE fale "nossa viagem", NUNCA "sua viagem"
- Tom: companheiro de viagem animado, informal, com emojis
- Se apresente como Téo, companheiro de viagem
- RESPEITE A FASE DA VIAGEM: ${greetingPhase === "pré-viagem" ? "Fale de preparativos e expectativas, NÃO como se já estivesse no destino" : greetingPhase === "pós-viagem" ? "Pergunte como foi a viagem" : "Aja como companheiro presente no destino"}
- Inclua estes serviços disponíveis:
  📍 Enviar localização para buscar restaurantes, atrações e mais por perto
  🌤️ Previsão do tempo no destino
  ✈️ Acompanhamento do voo em tempo real
  🗺️ Dicas de passeios e roteiros personalizados
  📄 Vouchers e documentos da viagem
- Pergunte como pode ajudar
- Máximo 800 caracteres
- NUNCA invente datas de aniversário ou eventos pessoais
- Retorne APENAS o texto da mensagem, sem aspas nem explicações`;

              const greetingResponse = await callGemini(
                [{ role: "user", content: greetingPrompt }],
                { model: "google/gemini-2.5-flash-lite", maxTokens: 400 }
              );

              if (greetingResponse.ok) {
                const greetingData = await greetingResponse.json();
                const aiGreeting = greetingData.choices?.[0]?.message?.content?.trim();
                if (aiGreeting && aiGreeting.length > 50) {
                  greetingMsg = aiGreeting;
                }
              }
            } catch (e) {
              console.error("Erro ao gerar saudação via IA:", e);
            }

            // Fallback: template corrigido com "nossa viagem" e gênero correto
            if (!greetingMsg) {
              const greetingLine = gender === "feminino"
                ? `Que bom te ver por aqui! Tá ansiosa pra *nossa* viagem pra *${destino}*? 🏝️`
                : gender === "masculino"
                  ? `Que bom te ver por aqui! Tá ansioso pra *nossa* viagem pra *${destino}*? 🏝️`
                  : `Que bom te ver por aqui! Bora curtir *nossa* viagem pra *${destino}*? 🏝️`;
              greetingMsg = `Oi ${firstName}! 😊✈️\n\n${greetingLine}\n\nSou o Téo, seu companheiro de viagem! Bora aproveitar essa aventura juntos! Durante a viagem, posso te ajudar com:\n\n📍 Me envie sua *localização* e eu busco restaurantes, atrações, farmácias e mais pertinho de você\n🌤️ Previsão do tempo no destino\n✈️ Acompanhamento do seu voo em tempo real\n🗺️ Dicas de passeios e roteiros personalizados\n📄 Vouchers e documentos da viagem\n\nÉ só me chamar! Como posso te ajudar? 😊`;
            }

            // Update collected_data with _concierge_greeted flag
            const updatedData = { ...collectedData, _concierge_greeted: true };
            await supabase.from("whatsapp_conversations").update({ collected_data: updatedData }).eq("id", convForGreeting.id);

            // Save assistant message in history
            const { data: convAfterGreet } = await supabase
              .from("whatsapp_conversations")
              .select("id, messages_history")
              .eq("id", convForGreeting.id)
              .single();

            if (convAfterGreet) {
              const history = Array.isArray(convAfterGreet.messages_history) ? convAfterGreet.messages_history : [];
              history.push({ role: "assistant", content: greetingMsg, timestamp: new Date().toISOString() });
              await supabase.from("whatsapp_conversations").update({ messages_history: history }).eq("id", convAfterGreet.id);
            }

            await sendWhatsAppMessage(phoneNumber, greetingMsg);

            return new Response(JSON.stringify({ status: "ok", concierge_greeting: true }), {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          // If already greeted, continue to normal flow (AI will respond with concierge prompt)
        }
      }

      // ========== CONCIERGE: Text search detection (e.g. "hamburguerias próximas", "farmácia") ==========
      const searchIntentRegex = /(?:perto|pr[oó]xim[oa]|aqui perto|por aqui|perto de mim|mais perto)/i;
      const categoryDirectRegex = /(?:hamburgueria|pizzaria|padaria|mercado|supermercado|farm[aá]cia|hospital|pol[ií]cia|conveni[eê]ncia|adega|distribuidora|bar|caf[eé]|cafeteria|lanchonete|sorveteria|churrascaria|japon[eê]s|japones|sushi|a[cç]a[ií]|restaurante|posto|gas station|atm|banco|caixa|lavanderia|pet ?shop|academia|gym)/i;
      
      const trimmedMsg = messageText.trim();
      const hasSearchIntent = searchIntentRegex.test(trimmedMsg) || categoryDirectRegex.test(trimmedMsg);
      
      if (hasSearchIntent && trimmedMsg.length > 2 && trimmedMsg.length < 100) {
        // Check for recent location to get coordinates
        const thirtyMinAgoSearch = new Date(Date.now() - 30 * 60 * 1000).toISOString();
        const { data: recentLocSearch } = await supabase
          .from("location_recommendations")
          .select("client_lat, client_lng")
          .eq("client_phone", phoneNumber)
          .gte("created_at", thirtyMinAgoSearch)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (recentLocSearch?.client_lat && recentLocSearch?.client_lng) {
          await ensureConversationAndSaveMessage(phoneNumber, contactName, messageText);
          try {
            await fetch(`${SUPABASE_URL}/functions/v1/concierge-engine`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
              body: JSON.stringify({
                action: "search_nearby",
                phone_number: phoneNumber,
                latitude: recentLocSearch.client_lat,
                longitude: recentLocSearch.client_lng,
                query: trimmedMsg,
              }),
            });
          } catch (searchErr) {
            console.error("Search nearby error:", searchErr);
          }
          return new Response(JSON.stringify({ status: "ok", routed_to: "concierge_search_nearby" }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      // ========== CONCIERGE: Place details reply ("2", "Restaurante 2", "Atração 1", "Mercado 1") ==========
      const pureNumericMatch = trimmedMsg.match(/^#?(\d{1,2})$/);
      const prefixedPlaceMatch = trimmedMsg.match(/^(?:restaurante(?:s)?|atra(?:cao|ção|coes|ções)|passeio|lugar|local|op(?:cao|ção)|mercado|farm[aá]cia|conveni[eê]ncia|emerg[eê]ncia|hospital)\s*#?\s*(\d{1,2})$/i);

      const placeIndexRaw = pureNumericMatch?.[1] || prefixedPlaceMatch?.[1];
      if (placeIndexRaw) {
        const placeIndex = parseInt(placeIndexRaw, 10);
        if (placeIndex >= 1 && placeIndex <= 20) {
          // Check for recent location recommendations for this phone (last 30 min)
          const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
          const { data: recentRec } = await supabase
            .from("location_recommendations")
            .select("id")
            .eq("client_phone", phoneNumber)
            .gte("created_at", thirtyMinAgo)
            .limit(1)
            .maybeSingle();

          if (recentRec) {
            await ensureConversationAndSaveMessage(phoneNumber, contactName, messageText);
            try {
              await fetch(`${SUPABASE_URL}/functions/v1/concierge-engine`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
                body: JSON.stringify({ action: "place_details", phone_number: phoneNumber, place_index: placeIndex, place_type: "any" }),
              });
            } catch (pdErr) {
              console.error("Place details error:", pdErr);
            }
            return new Response(JSON.stringify({ status: "ok", routed_to: "concierge_place_details" }), {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }
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
          // Fire-and-forget: generate and send visual quote card
          generateAndSendQuoteVisual(phoneNumber, collectedData._quotation_request || collectedData, quotResult.data)
            .catch(err => console.error("[QUOTE-VISUAL] Fire-and-forget error:", err));
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

      // Fetch client memory for personalization
      const clientMemory = await fetchClientMemory(supabase, phoneNumber);
      const memoryContext = clientMemory ? formatMemoryForPrompt(clientMemory) : "";
      if (clientMemory) {
        console.log("[MEMORY] Found memory for", phoneNumber, "- name:", clientMemory.client_name);
      }

      // Check if this client is a concierge client (active trip) — use concierge prompt instead of sales
      let conciergePromptOverride: string | null = null;
      let conciergeContactContext: any = null;
      {
        // First try direct phone match on active_trips
        let activeTripForPrompt: any = null;

        const { data: directTripMatch } = await supabase
          .from("active_trips")
          .select("client_name, destination_city, destination_country, check_in_date, check_out_date, hotel_name, outbound_flight_iata, return_flight_iata, outbound_flight_date, return_flight_date, destination_lat, destination_lng, destination_timezone, concierge_special_notes, id")
          .eq("client_phone", phoneNumber)
          .eq("concierge_active", true)
          .limit(1)
          .maybeSingle();

        if (directTripMatch) {
          activeTripForPrompt = directTripMatch;
        } else {
          // Check concierge_contacts table for additional numbers
          const { data: contactMatch } = await supabase
            .from("concierge_contacts")
            .select("trip_id, contact_name, contact_phone, special_notes")
            .eq("contact_phone", phoneNumber)
            .eq("is_active", true)
            .limit(1)
            .maybeSingle();

          if (contactMatch) {
            conciergeContactContext = contactMatch;
            const { data: tripData } = await supabase
              .from("active_trips")
              .select("client_name, destination_city, destination_country, check_in_date, check_out_date, hotel_name, outbound_flight_iata, return_flight_iata, outbound_flight_date, return_flight_date, destination_lat, destination_lng, destination_timezone, concierge_special_notes, id")
              .eq("id", contactMatch.trip_id)
              .eq("concierge_active", true)
              .limit(1)
              .maybeSingle();
            if (tripData) {
              activeTripForPrompt = tripData;
              // Use the contact's name instead of the trip's main client name
              activeTripForPrompt.client_name = contactMatch.contact_name;
            }
          }
        }

        if (activeTripForPrompt) {
          const destino = activeTripForPrompt.destination_city || activeTripForPrompt.destination_country || "o destino";
          const hotel = activeTripForPrompt.hotel_name || "";
          const checkin = activeTripForPrompt.check_in_date || "";
          const checkout = activeTripForPrompt.check_out_date || "";
          const vooIda = activeTripForPrompt.outbound_flight_iata || "";
          const vooVolta = activeTripForPrompt.return_flight_iata || "";
          const dataVooIda = activeTripForPrompt.outbound_flight_date || "";
          const dataVooVolta = activeTripForPrompt.return_flight_date || "";
          const timezone = activeTripForPrompt.destination_timezone || "America/Sao_Paulo";
          
          // Calculate trip phase
          const todayForPhase = new Date().toISOString().split('T')[0];
          let tripPhase = "durante";
          let tripPhaseInstruction = "";
          if (checkin && todayForPhase < checkin) {
            const daysUntilTrip = Math.ceil((new Date(checkin).getTime() - new Date(todayForPhase).getTime()) / (1000 * 60 * 60 * 24));
            tripPhase = "pré-viagem";
            tripPhaseInstruction = `\n\n⚠️ FASE DA VIAGEM: PRÉ-VIAGEM (faltam ${daysUntilTrip} dias)\nO cliente AINDA NÃO está viajando. A viagem começa em ${daysUntilTrip} dias.\nFale sobre preparativos, expectativas, o que levar, contagem regressiva.\nNÃO pergunte como está o hotel, NÃO pergunte sobre restaurantes no destino como se já estivesse lá.\nVocê pode falar sobre o que vão fazer juntos quando chegarem, dar dicas de preparação, etc.`;
          } else if (checkout && todayForPhase > checkout) {
            tripPhase = "pós-viagem";
            tripPhaseInstruction = `\n\n⚠️ FASE DA VIAGEM: PÓS-VIAGEM\nA viagem já acabou. Pergunte como foi, peça feedback, celebre as memórias.\nNÃO fale como se ainda estivessem viajando.`;
          } else {
            tripPhaseInstruction = `\n\n⚠️ FASE DA VIAGEM: DURANTE A VIAGEM\nO cliente está viajando AGORA. Aja como companheiro presente no destino.`;
          }

          let contexto = `\n\nDATA ATUAL: ${todayForPhase}${tripPhaseInstruction}\n\nCONTEXTO COMPLETO DA NOSSA VIAGEM:\n- Nome do cliente: ${activeTripForPrompt.client_name || "não informado"}\n- Destino: ${destino}\n- Hotel: ${hotel || "não informado"}\n- Check-in: ${checkin}\n- Check-out: ${checkout}`;
          if (vooIda) contexto += `\n- Voo ida: ${vooIda}${dataVooIda ? ` em ${dataVooIda}` : ""}`;
          if (vooVolta) contexto += `\n- Voo volta: ${vooVolta}${dataVooVolta ? ` em ${dataVooVolta}` : ""}`;
          contexto += `\n- Fuso horário: ${timezone}`;
          if (activeTripForPrompt.destination_lat && activeTripForPrompt.destination_lng) {
            contexto += `\n- Coordenadas: ${activeTripForPrompt.destination_lat}, ${activeTripForPrompt.destination_lng}`;
          }

          // Fetch client_trips data for logistics details
          const { data: clientTripData } = await supabase
            .from("client_trips")
            .select("hotel_address, hotel_link, flight_number, flight_locator, flight_departure_time, flight_return_time, hotel_checkin_time, hotel_checkout_time, trip_tips, flight_return_number, hotel_checkin_date, hotel_checkout_date, id")
            .eq("destination_name", destino)
            .gte("return_date", activeTripForPrompt.check_in_date)
            .lte("departure_date", activeTripForPrompt.check_out_date)
            .limit(1)
            .maybeSingle();

          if (clientTripData) {
            if (clientTripData.hotel_address) contexto += `\n- Endereço do hotel: ${clientTripData.hotel_address}`;
            if (clientTripData.hotel_link) contexto += `\n- Link do hotel (Maps): ${clientTripData.hotel_link}`;
            if (clientTripData.flight_number) contexto += `\n- Número do voo ida: ${clientTripData.flight_number}`;
            if (clientTripData.flight_return_number) contexto += `\n- Número do voo volta: ${clientTripData.flight_return_number}`;
            if (clientTripData.flight_locator) contexto += `\n- Localizador do voo: ${clientTripData.flight_locator}`;
            if (clientTripData.flight_departure_time) contexto += `\n- Horário do voo ida: ${clientTripData.flight_departure_time}`;
            if (clientTripData.flight_return_time) contexto += `\n- Horário do voo volta: ${clientTripData.flight_return_time}`;
            if (clientTripData.hotel_checkin_time) contexto += `\n- Check-in hotel: ${clientTripData.hotel_checkin_date || checkin} às ${clientTripData.hotel_checkin_time}`;
            if (clientTripData.hotel_checkout_time) contexto += `\n- Check-out hotel: ${clientTripData.hotel_checkout_date || checkout} às ${clientTripData.hotel_checkout_time}`;
            if (clientTripData.trip_tips) contexto += `\n- Dicas da viagem: ${clientTripData.trip_tips}`;
          }

          // Add global special notes for Téo
          if (activeTripForPrompt.concierge_special_notes) {
            contexto += `\n\nINFORMAÇÕES ESPECIAIS GERAIS (use naturalmente, sem mencionar que são notas do admin):\n${activeTripForPrompt.concierge_special_notes}`;
          }

          // Add individual contact notes if this is from concierge_contacts
          if (conciergeContactContext?.special_notes) {
            contexto += `\n\nINFORMAÇÕES ESPECIAIS DESTE CONTATO (${conciergeContactContext.contact_name}):\n${conciergeContactContext.special_notes}`;
          }

          // Store client trip ID for document retrieval later
          (activeTripForPrompt as any)._clientTripId = clientTripData?.id || null;
          
          conciergePromptOverride = TEO_CONCIERGE_PROMPT + contexto;
          console.log(`🎒 Using CONCIERGE prompt for ${phoneNumber} → ${destino}`);
        }
      }

      // Get AI response with memory context
      const aiResponse = await getAiResponse(historyForAi, memoryContext, conciergePromptOverride);

      // === CONCIERGE BYPASS: skip all quotation logic ===
      if (conciergePromptOverride) {
        const cleanResponse = cleanAiResponse(aiResponse);
        
        const updatedHistory = [
          ...(conversation.messages_history as any[] || []),
          { role: "assistant", content: cleanResponse, timestamp: new Date().toISOString() },
        ];

        await supabase
          .from("whatsapp_conversations")
          .update({
            client_name: conversation.client_name || contactName,
            messages_history: updatedHistory,
          })
          .eq("id", conversation.id);

        // If incoming was audio, respond with audio too
        if (incomingWasAudio && cleanResponse) {
          try {
            const audioBuffer = await convertTextToAudio(cleanResponse);
            if (audioBuffer) {
              const audioUrl = await uploadAudioToStorage(audioBuffer, phoneNumber);
              if (audioUrl) {
                await sendWhatsAppAudio(phoneNumber, audioUrl);
              }
            }
          } catch (audioErr) {
            console.error("Error sending audio response:", audioErr);
          }
        }

        await sendWhatsAppMessage(phoneNumber, cleanResponse);

        // Check if client asked for vouchers/documents and send them
        const docKeywords = ["voucher", "documento", "pdf", "passagem", "reserva", "comprovante", "bilhete", "ticket"];
        const msgLower = (messageText || "").toLowerCase();
        const askedForDocs = docKeywords.some(kw => msgLower.includes(kw));

        if (askedForDocs) {
          try {
            // Find client_trips matching this active trip (check both direct phone and concierge_contacts)
            let activeTripRef: any = null;
            const { data: directRef } = await supabase
              .from("active_trips")
              .select("destination_city, destination_country, check_in_date, check_out_date")
              .eq("client_phone", phoneNumber)
              .eq("concierge_active", true)
              .limit(1)
              .maybeSingle();

            if (directRef) {
              activeTripRef = directRef;
            } else {
              const { data: contactRef } = await supabase
                .from("concierge_contacts")
                .select("trip_id")
                .eq("contact_phone", phoneNumber)
                .eq("is_active", true)
                .limit(1)
                .maybeSingle();
              if (contactRef) {
                const { data: tripRef } = await supabase
                  .from("active_trips")
                  .select("destination_city, destination_country, check_in_date, check_out_date")
                  .eq("id", contactRef.trip_id)
                  .eq("concierge_active", true)
                  .limit(1)
                  .maybeSingle();
                activeTripRef = tripRef;
              }
            }

            if (activeTripRef) {
              const destName = activeTripRef.destination_city || activeTripRef.destination_country || "";
              const { data: clientTrips } = await supabase
                .from("client_trips")
                .select("id")
                .eq("destination_name", destName)
                .gte("return_date", activeTripRef.check_in_date)
                .lte("departure_date", activeTripRef.check_out_date)
                .limit(1)
                .maybeSingle();

              if (clientTrips) {
                const { data: tripDocs } = await supabase
                  .from("trip_documents")
                  .select("document_name, file_url, document_type, file_type")
                  .eq("trip_id", clientTrips.id);

                if (tripDocs && tripDocs.length > 0) {
                  for (const doc of tripDocs) {
                    try {
                      const storagePath = doc.file_url.includes('/storage/v1/object/')
                        ? (doc.file_url.split('/trip-documents/')[1] || '').split('?')[0]
                        : doc.file_url;

                      if (!storagePath) continue;

                      const { data: signedData } = await supabase.storage
                        .from('trip-documents')
                        .createSignedUrl(storagePath, 3600);

                      if (signedData?.signedUrl) {
                        await sendWhatsAppMessage(phoneNumber, `📄 *${doc.document_name}* (${doc.document_type})\n${signedData.signedUrl}`);
                      }
                    } catch (docErr) {
                      console.error("[CONCIERGE] Error sending document:", doc.document_name, docErr);
                    }
                  }
                } else {
                  await sendWhatsAppMessage(phoneNumber, "Não encontrei documentos salvos pra nossa viagem ainda. Vou verificar com a equipe! 📋");
                }
              }
            }
          } catch (docError) {
            console.error("[CONCIERGE] Error fetching documents:", docError);
          }
        }

        // Update client memory (fire-and-forget)
        const allMsgsForMemory = [...historyForAi, { role: "assistant", content: cleanResponse }];
        updateClientMemory(supabase, phoneNumber, conversation.client_name || contactName || null, allMsgsForMemory, clientMemory)
          .catch((err) => console.error("[MEMORY] Background update error:", err));

        return new Response(JSON.stringify({ status: "ok", concierge: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

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
          
          // Generate tips now, schedule sending after 60s via self-invocation
          const destino = quotationData.destino;
          const clienteName = newCollectedData.nome || conversation.client_name || contactName || "";
          try {
            const tipsResponse = await getAiResponse([
              { role: "user", content: `Você é o Téo, assistente de viagens divertido e humano da Tomorrow Travel. Gere uma mensagem para o cliente ${clienteName} com exatamente 5 dicas incríveis sobre ${destino} (passeios, comidas, curiosidades, experiências). Seja divertido, use emojis, tom leve e descontraído. Uma dica por linha numerada. Comece com algo como "${clienteName ? clienteName + ', e' : 'E'}nquanto eu busco as melhores opções pra você, bora conhecer um pouco mais sobre ${destino}? 🗺️✨" e depois as 5 dicas. No FINAL da mensagem, adicione uma quebra de linha e pergunte de forma divertida e natural se o cliente sabia que você (o Téo) também pode montar um roteiro personalizado dia a dia pra viagem dele. Algo como: "Ah, e sabia que eu também posso montar um roteiro completinho dia a dia pra sua viagem? 🗓️✨ Quer que eu prepare um pra você?" Seja criativo e mantenha o tom do Téo!` }
            ]);
            const cleanTips = cleanAiResponse(tipsResponse);
            if (cleanTips && cleanTips.length > 20) {
              // Schedule delayed tips via self-invocation (non-blocking) - 60 seconds
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
                  delay_seconds: 60,
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

      // Update client memory after response (fire-and-forget)
      const allMsgsForMemory = [
        ...historyForAi,
        { role: "assistant", content: cleanResponse },
      ];
      updateClientMemory(
        supabase,
        phoneNumber,
        newCollectedData.nome || conversation.client_name || contactName || null,
        allMsgsForMemory,
        clientMemory
      ).catch((err) => console.error("[MEMORY] Background update error:", err));

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
