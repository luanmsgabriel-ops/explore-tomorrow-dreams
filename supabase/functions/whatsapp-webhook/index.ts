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

26. travel_groups - Grupos de viagem (Modo Galera)
    Colunas: id, group_code (UNIQUE 6 chars), creator_phone, creator_name, group_name, status (collecting/ready/completed), travel_dates, budget_range, final_recommendation (JSONB), created_at, updated_at

27. travel_group_members - Membros dos grupos de viagem
    Colunas: id, group_id (FK travel_groups), phone_number, member_name, preferences (JSONB: estilo/clima/prioridades/orcamento/restricoes), is_ready, joined_at
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
        // Use Cativa/Infotravel API directly instead of Manus
        const result = await requestQuotation({
          origem: quote.origin,
          destino: quote.destination,
          data_ida: quote.raw_request?.data_ida || quote.departure_date,
          data_volta: quote.raw_request?.data_volta || quote.return_date,
          adultos: quote.adults || 1,
          criancas: quote.children || 0,
          idades_criancas: quote.children_ages || [],
        });
        
        if (result.status === "success" && result.data?.resultados?.length > 0) {
          await supabase.from("travel_quote_requests").update({
            status: "completed",
            processed_at: new Date().toISOString(),
            processing_details: result.data,
          }).eq("id", quoteId);
          
          // Send results via WhatsApp if phone available
          if (quote.phone_number) {
            const msg = formatQuotationResults(result.data);
            await sendWhatsAppMessage(quote.phone_number, msg);
          }
        } else {
          await supabase.from("travel_quote_requests").update({
            status: "failed",
            error_message: "Nenhum resultado encontrado na API",
            processed_at: new Date().toISOString(),
          }).eq("id", quoteId);
        }
      } catch (e) {
        console.error("[ADMIN] Cativa quotation error:", e);
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

4. CONFIRMAÇÃO - Após o cliente confirmar o resumo, dispare a cotação e informe que vai buscar as melhores opções (uns segundinhos!)

5. PÓS-COTAÇÃO:
   ⚠️ NÃO FINALIZAR após enviar cotação. AGUARDAR RESPOSTA.
   Ofereça ajuda: detalhes, outras datas, ajustar orçamento, passeios.
   ⚠️ NUNCA repita que a cotação está sendo processada. A mensagem de processamento já foi enviada UMA VEZ. Se o cliente perguntar sobre a cotação, diga que já está sendo preparada.
   ⚠️ NUNCA dispare [COTAR_VIAGEM] mais de uma vez na mesma conversa. A cotação já foi solicitada.
   ⚠️ NÃO envie mais dicas de passeio depois que já tiver enviado. Máximo de 4 dicas no total durante toda a conversa.
   ⚠️ Após a cotação ser disparada, responda APENAS se o cliente enviar uma nova mensagem. Seja breve e direto.

8. ROTEIRO PERSONALIZADO:
   Se o cliente pedir um roteiro (responder "sim", "quero", "pode fazer", "monta pra mim", etc. à oferta de roteiro, ou pedir diretamente "me faz um roteiro", "roteiro dia a dia"), você DEVE gerar um roteiro.
   
   FORMATO DO ROTEIRO (OBRIGATÓRIO):
   Inclua APENAS a tag estruturada abaixo. NÃO escreva o roteiro como texto corrido.
   O sistema vai gerar uma IMAGEM bonita automaticamente a partir da tag.
   
   [ROTEIRO_VISUAL]
   Destino: [Nome do Destino]
   Dias: [N]
   Dia 1 - [Tema do dia]
   09:00 | [Atividade] 🏨
   14:00 | [Atividade] 🐠
   19:00 | [Atividade] 🍽️
   Dia 2 - [Tema]
   09:00 | [Atividade] ☀️
   ...
   [/ROTEIRO_VISUAL]
   
   Após a tag, escreva APENAS uma frase curta como:
   "Preparando seu roteiro premium para [destino]... ✨🗺️ Aguarda só um instantinho!"
   
   ⚠️ NÃO escreva o roteiro dia-a-dia como texto. SOMENTE a tag.
   ⚠️ NÃO envie o mesmo roteiro mais de uma vez na mesma conversa.
   ⚠️ Se já enviou roteiro antes nesta conversa, NÃO gere outro, a menos que o cliente peça alteração explícita.
   
   REGRAS DO ROTEIRO:
   Use os dados coletados (destino, datas, número de viajantes, se tem crianças) para personalizar.
   Calcule a quantidade de dias baseado nas datas de ida e volta.
   Use locais, restaurantes e atrações REAIS e conhecidos do destino.
   NÃO seja genérico - cite nomes de praias, restaurantes, mirantes, etc.

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

⚠️ AVISO IMPORTANTE — SISTEMA DE COTAÇÃO EM MANUTENÇÃO:
O sistema de cotação automática está passando por atualizações neste momento.
NUNCA dispare [COTAR_VIAGEM]. Em vez disso, quando o cliente pedir cotação ou confirmar os dados para cotar:
1. Colete os dados normalmente (destino, datas, passageiros, origem)
2. Após a confirmação, envie uma mensagem como:
   "Nosso sistema de cotação automática está passando por uma atualização pra ficar ainda melhor! 🚀
   
   Mas fique tranquilo(a), {nome}! Já registrei todos os seus dados e um dos nossos agentes especializados vai retornar com a cotação personalizada pra você em breve! 😊✈️
   
   Agradecemos a compreensão! 🙏
   
   Enquanto isso, que tal explorar outros recursos do Téo? 👇
   
   🌍 *Modo Tradutor* — Tradução instantânea de textos, áudios e fotos em +20 idiomas. Perfeito pra se preparar pro destino! Mande *tradutor*
   
   👥 *Modo Galera* — Planeje viagem em grupo! Crie um grupo, convide amigos e descubra o destino ideal pra todos. Mande *criar grupo*
   
   🍽️ *Modo Chef* — Descubra a gastronomia do destino, restaurantes imperdíveis e receitas típicas! Mande *chef*
   
   🗺️ *Roteiro* — Gero um roteiro dia-a-dia personalizado pro seu destino com dicas de locais reais! Mande *roteiro [destino]*"
3. Depois disso, dispare [STATUS:completed] para registrar o lead

IMPORTANTE: Datas como "do dia 15 a 22 de junho" → data_ida="15/06/2026", data_volta="22/06/2026".
REGRA CRÍTICA DE ANO: O ano atual é ${new Date().getFullYear()}. Se o cliente NÃO especificar o ano, SEMPRE use ${new Date().getFullYear()}. NUNCA use 2024 ou 2025. Exemplo: "junho" = "junho de ${new Date().getFullYear()}".

Tudo coletado e confirmado:
[STATUS:completed]

Cliente quer falar com humano:
[STATUS:human_takeover]

COMANDOS ESPECIAIS (instruir o cliente a usar pelo WhatsApp):
- "criar grupo" → Inicia o Modo Galera para viagem em grupo
- "entrar grupo CODIGO" → Entrar em grupo existente
- "meu dna" → Teste DNA de viajante
- "roleta" → Destino aleatório
- "oráculo" → Previsão da viagem
- "playlist" → Playlist personalizada para viagem
- "sos" → Assistente de emergência
- "tradutor" → Tradução universal de texto, áudio e fotos
- "chef" → Gastronomia e restaurantes do destino

REGRAS CRÍTICAS:
- NUNCA invente links externos (Typeform, Google Forms, JotForm, bit.ly, tally, etc.)
- NUNCA sugira formulários externos - TODOS os fluxos são feitos pelo WhatsApp
- NUNCA gere URLs de qualquer tipo que não sejam wa.me (WhatsApp)
- Se o cliente mencionar QUALQUER coisa sobre grupo, viagem em grupo, modo galera, ou viajar com amigos/família, responda APENAS: "Para ativar o Modo Galera, mande *criar grupo* aqui no chat! 🎉"
- NUNCA ofereça cotação automaticamente sem o cliente pedir explicitamente
- NUNCA adicione ofertas promocionais no final das mensagens sem o cliente perguntar`;

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

async function transcribeAudio(audioBuffer: ArrayBuffer, languageCode: string = "por"): Promise<string | null> {
  if (!ELEVENLABS_API_KEY) {
    console.error("ELEVENLABS_API_KEY not configured for STT");
    return null;
  }

  try {
    const formData = new FormData();
    formData.append("file", new Blob([audioBuffer], { type: "audio/ogg" }), "audio.ogg");
    formData.append("model_id", "scribe_v2");
    formData.append("language_code", languageCode);

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

// Transcribe audio with auto language detection (no forced language_code)
async function transcribeAudioAutoDetect(audioBuffer: ArrayBuffer): Promise<{ text: string; detected_language?: string } | null> {
  if (!ELEVENLABS_API_KEY) {
    console.error("ELEVENLABS_API_KEY not configured for STT auto-detect");
    return null;
  }

  try {
    const formData = new FormData();
    formData.append("file", new Blob([audioBuffer], { type: "audio/ogg" }), "audio.ogg");
    formData.append("model_id", "scribe_v2");
    // No language_code — let Scribe auto-detect

    const response = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: { "xi-api-key": ELEVENLABS_API_KEY },
      body: formData,
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("ElevenLabs STT auto-detect error:", response.status, errText);
      return null;
    }

    const result = await response.json();
    return { text: result.text || "", detected_language: result.language_code || undefined };
  } catch (err) {
    console.error("ElevenLabs STT auto-detect exception:", err);
    return null;
  }
}

// Translate text using Gemini Flash — auto-detect source and translate (multi-language + cultural context)
async function translateText(text: string, targetLang?: string): Promise<{ source_lang: string; source_lang_name: string; target_lang: string; target_lang_name: string; translation: string; cultural_context?: string } | null> {
  try {
    const targetInstruction = targetLang
      ? `Translate to ${targetLang}.`
      : `- If it's Portuguese, translate to English.\n- If it's any other language, translate to Portuguese (Brazilian).`;

    const prompt = `You are a universal translator with deep cultural knowledge. Detect the language of the following text and translate it.
${targetInstruction}

IMPORTANT: Also provide a brief cultural context note if relevant (local customs, expressions, nuances that a traveler should know).

Return ONLY a valid JSON object with this exact structure (no markdown, no explanation):
{"source_lang":"ISO code (pt/en/es/fr/it/de/ja/ko/zh/ar/th/etc)","source_lang_name":"language name in Portuguese","target_lang":"ISO code","target_lang_name":"language name in Portuguese","translation":"translated text","cultural_context":"brief cultural note if relevant, or null"}

Text to translate:
"${text}"`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      console.error("[TRANSLATOR] Gemini error:", response.status);
      return null;
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "";
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    const parsed = JSON.parse(content);
    return {
      source_lang: parsed.source_lang || "unknown",
      source_lang_name: parsed.source_lang_name || "Desconhecido",
      target_lang: parsed.target_lang || "pt",
      target_lang_name: parsed.target_lang_name || "Português",
      translation: parsed.translation || "",
      cultural_context: parsed.cultural_context || undefined,
    };
  } catch (err) {
    console.error("[TRANSLATOR] Error:", err);
    return null;
  }
}

// Translate text from an image (signs, notices, menus, etc.) using Gemini Vision
async function translateImage(imageBase64: string, mimeType: string = "image/jpeg", targetLang?: string): Promise<{ source_lang_name: string; items: Array<{ original: string; translation: string }>; cultural_context?: string; image_description?: string } | null> {
  try {
    const targetInstruction = targetLang
      ? `Translate all text to ${targetLang}.`
      : `Translate all text to Portuguese (Brazilian).`;

    const prompt = `You are a universal translator for travelers. Analyze this image and:
1. Identify ALL visible text (signs, notices, labels, menus, tickets, etc.)
2. ${targetInstruction}
3. Provide cultural context relevant to a Brazilian traveler

Return ONLY a valid JSON object (no markdown):
{
  "source_lang_name": "language name in Portuguese",
  "image_description": "brief description of what the image shows (e.g. 'placa de rua', 'aviso no hotel', 'bilhete de metrô')",
  "items": [
    {"original": "original text 1", "translation": "translated text 1"},
    {"original": "original text 2", "translation": "translated text 2"}
  ],
  "cultural_context": "relevant cultural context for a traveler, or null"
}

RULES:
- Extract ALL readable text from the image
- Keep the order as they appear in the image
- If the image has no text, return items as empty array and set image_description explaining what you see
- Max 4000 chars total`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              { type: "image_url", image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
              { type: "text", text: prompt },
            ],
          },
        ],
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      console.error("[TRANSLATOR-IMG] Gemini error:", response.status);
      return null;
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "";
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    return JSON.parse(content);
  } catch (err) {
    console.error("[TRANSLATOR-IMG] Error:", err);
    return null;
  }
}

// Get flag emoji for language code
function getLangFlag(langCode: string): string {
  const flags: Record<string, string> = {
    pt: "🇧🇷", en: "🇺🇸", es: "🇪🇸", fr: "🇫🇷", it: "🇮🇹", de: "🇩🇪",
    ja: "🇯🇵", ko: "🇰🇷", zh: "🇨🇳", ar: "🇸🇦", th: "🇹🇭", ru: "🇷🇺",
    nl: "🇳🇱", sv: "🇸🇪", no: "🇳🇴", da: "🇩🇰", fi: "🇫🇮", pl: "🇵🇱",
    tr: "🇹🇷", el: "🇬🇷", he: "🇮🇱", hi: "🇮🇳", vi: "🇻🇳", id: "🇮🇩",
  };
  const code = (langCode || "").toLowerCase().substring(0, 2);
  return flags[code] || "🗣️";
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
// ========== School Progress Helpers ==========

interface SchoolProgress {
  id?: string;
  phone_number: string;
  client_name?: string;
  language: string;
  level: string;
  current_module: number;
  current_lesson: number;
  total_score: number;
  streak_days: number;
  longest_streak: number;
  last_study_date: string | null;
  lessons_completed: number;
  modules_completed: number;
  badges: string[];
}

async function loadSchoolProgress(phoneNumber: string): Promise<SchoolProgress | null> {
  const normalized = phoneNumber.replace(/\D/g, "");
  const phone = normalized.startsWith("55") ? normalized : `55${normalized}`;
  
  const { data } = await supabase
    .from("school_progress")
    .select("*")
    .eq("phone_number", phone)
    .maybeSingle();
  
  if (!data) return null;
  return {
    ...data,
    badges: Array.isArray(data.badges) ? data.badges : [],
  } as SchoolProgress;
}

async function saveSchoolProgress(phoneNumber: string, updates: Partial<SchoolProgress>): Promise<void> {
  const normalized = phoneNumber.replace(/\D/g, "");
  const phone = normalized.startsWith("55") ? normalized : `55${normalized}`;
  
  const { data: existing } = await supabase
    .from("school_progress")
    .select("id")
    .eq("phone_number", phone)
    .maybeSingle();
  
  if (existing) {
    await supabase.from("school_progress").update({
      ...updates,
      updated_at: new Date().toISOString(),
    }).eq("id", existing.id);
  } else {
    await supabase.from("school_progress").insert({
      phone_number: phone,
      ...updates,
    });
  }
}

function calculateStreak(lastStudyDate: string | null, currentStreak: number): { streak: number; isNewDay: boolean } {
  const today = new Date().toISOString().split("T")[0];
  if (!lastStudyDate) return { streak: 1, isNewDay: true };
  if (lastStudyDate === today) return { streak: currentStreak, isNewDay: false };
  
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  if (lastStudyDate === yesterday) return { streak: currentStreak + 1, isNewDay: true };
  
  return { streak: 1, isNewDay: true }; // streak broken
}

async function checkAndSendBadges(
  phoneNumber: string,
  progress: SchoolProgress,
  newStreak: number,
  newScore: number,
  newModule: number,
  newLevel: string,
  lessonsCompleted: number,
  modulesCompleted: number,
): Promise<string[]> {
  const earnedBadges = [...progress.badges];
  const newBadges: string[] = [];

  const checks: Array<{ key: string; condition: boolean }> = [
    { key: "first_lesson", condition: lessonsCompleted >= 1 },
    { key: "module_complete", condition: modulesCompleted >= 1 },
    { key: "streak_3", condition: newStreak >= 3 },
    { key: "streak_7", condition: newStreak >= 7 },
    { key: "streak_15", condition: newStreak >= 15 },
    { key: "streak_30", condition: newStreak >= 30 },
    { key: "intermediate", condition: newLevel === "intermediate" },
    { key: "advanced", condition: newLevel === "advanced" },
    { key: "score_100", condition: newScore >= 100 },
    { key: "graduation", condition: modulesCompleted >= 10 },
  ];

  for (const check of checks) {
    if (check.condition && !earnedBadges.includes(check.key)) {
      earnedBadges.push(check.key);
      newBadges.push(check.key);
    }
  }

  // Send badge images
  for (const badgeKey of newBadges) {
    try {
      const { data: badge } = await supabase
        .from("school_badges")
        .select("badge_name, badge_description, image_url")
        .eq("badge_key", badgeKey)
        .maybeSingle();

      if (badge) {
        const caption = `🏅 *BADGE CONQUISTADO!*\n━━━━━━━━━━━━━━━━\n${badge.badge_name}\n${badge.badge_description}\n\n📊 Streak: ${newStreak} dias | Score: ${newScore} pts\n— Téo School | Tomorrow Travel 🌍`;
        
        if (badge.image_url) {
          await sendWhatsAppImage(phoneNumber, badge.image_url, caption);
        } else {
          await sendWhatsAppMessage(phoneNumber, caption);
        }
      }
    } catch (e) {
      console.error(`[SCHOOL] Badge send error for ${badgeKey}:`, e);
    }
  }

  return earnedBadges;
}

function getAdvancementPrediction(currentModule: number, currentLesson: number): string {
  const lessonsToEndModule = 5 - currentLesson;
  const modulesLeft = 10 - currentModule;
  
  if (lessonsToEndModule > 0) {
    return `📈 Se estudar 1 lição por dia, em *${lessonsToEndModule} dia${lessonsToEndModule > 1 ? "s" : ""}* você completa o Módulo ${currentModule}! 🚀`;
  }
  if (modulesLeft > 0) {
    const totalLessonsLeft = modulesLeft * 5;
    return `📈 Faltam *${totalLessonsLeft} lições* (${modulesLeft} módulos) para a formatura! Se estudar todo dia, em *${totalLessonsLeft} dias* você se forma! 🎓`;
  }
  return "🎓 Você completou todos os módulos! Parabéns!";
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

// ========== Chef Mode: Menu Analyzer ==========

const CHEF_MODE_PROMPT = `Você é o Téo Chef 👨‍🍳, um especialista gastronômico da Tomorrow Travel.

O cliente te enviou a FOTO DE UM CARDÁPIO/MENU de restaurante em outro idioma. Sua missão:

1. **TRADUZIR** cada prato para PT-BR
2. **EXPLICAR** os ingredientes principais de cada item
3. **ALERTAR** sobre alergênicos com ícones:
   🥜 Nozes/Amendoim | 🥛 Lactose | 🌾 Glúten | 🦐 Frutos do mar | 🥚 Ovos | 🫘 Soja | 🐟 Peixe
4. **RECOMENDAR** o melhor custo-benefício com justificativa

FORMATO (para WhatsApp, use *negrito* e emojis):

📋 *CARDÁPIO TRADUZIDO*

*1. [Nome original]* → [Tradução PT-BR]
🥗 [Ingredientes principais]
⚠️ [Alergênicos, se houver]
💰 [Preço se visível] (~R$ XX,XX se em moeda estrangeira)

[... demais pratos ...]

━━━━━━━━━━━━━━━
⭐ *Recomendação do Chef Téo:*
[Melhor custo-benefício com justificativa curta]

💡 *Dica:* [Uma dica cultural sobre o restaurante/culinária local]

REGRAS:
- Seja CONCISO (máximo 3500 caracteres)
- Se não conseguir ler algum item, indique com "❓"
- Se a foto não for um cardápio, diga educadamente e peça para enviar a foto do cardápio
- Inclua preços quando visíveis na foto
- **CONVERSÃO DE MOEDA**: Se os preços estiverem em dólares (USD/$), euros (EUR/€) ou outra moeda estrangeira, mostre ao lado o valor aproximado em reais (R$) usando a cotação fornecida. Formato: "$15.00 (~R$ XX,XX)"
- Priorize pratos principais, depois entradas e sobremesas`;

async function analyzeMenuImage(imageBase64: string, mimeType: string = "image/jpeg"): Promise<string> {
  console.log("[CHEF MODE] Analyzing menu image...");
  
  // Fetch exchange rates for currency conversion
  let exchangeInfo = "";
  try {
    const rateRes = await fetch("https://open.er-api.com/v6/latest/USD");
    if (rateRes.ok) {
      const rateData = await rateRes.json();
      const brlRate = rateData.rates?.BRL;
      const eurToUsd = rateData.rates?.EUR ? (1 / rateData.rates.EUR) : null;
      if (brlRate) {
        exchangeInfo = `\n\nCOTAÇÕES DO DIA para conversão: 1 USD = R$ ${brlRate.toFixed(2)}`;
        if (eurToUsd) {
          const eurToBrl = brlRate / rateData.rates.EUR;
          exchangeInfo += ` | 1 EUR = R$ ${eurToBrl.toFixed(2)}`;
        }
      }
    }
  } catch (e) {
    console.error("[CHEF MODE] Exchange rate error:", e);
    exchangeInfo = "\n\nCOTAÇÃO APROXIMADA: 1 USD ≈ R$ 5,50 | 1 EUR ≈ R$ 6,00 (use como estimativa)";
  }

  const promptWithRates = CHEF_MODE_PROMPT + exchangeInfo;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: promptWithRates },
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
            { type: "text", text: "Analise este cardápio e traduza os pratos. Se os preços estiverem em moeda estrangeira, converta para reais." },
          ],
        },
      ],
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("[CHEF MODE] AI error:", response.status, errText);
    throw new Error("Falha na análise do cardápio");
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "Não consegui analisar o cardápio. Tenta mandar outra foto!";
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
  let cleaned = response
    .replace(/\[ROTEIRO_VISUAL\][\s\S]*?\[\/ROTEIRO_VISUAL\]/g, "")
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
    // Remove hallucinated external URLs (Typeform, Jotform, Google Forms, bit.ly, tally, survey, etc.)
    .replace(/\[[^\]]*\]\(https?:\/\/[^)]*(?:typeform|jotform|google.*form|forms\.gle|bit\.ly|tally|survey)[^)]*\)/gi, "")
    .replace(/https?:\/\/[^\s\])"]*(?:typeform|jotform|google.*form|forms\.gle|bit\.ly|tally|survey)[^\s\])"']*/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // If hallucinated URLs were removed and message mentions grupo/galera, append instruction
  if (cleaned !== response.replace(/\[[A-Z_]+:[^\]]*\]/g, "").trim() && /grupo|galera/i.test(cleaned)) {
    cleaned += "\n\nPara viagem em grupo, mande *criar grupo* aqui no chat! 🎉";
  }

  return cleaned;
}

// Parse [ROTEIRO_VISUAL] tag into structured data for image generation
function parseItineraryVisualTag(response: string): { destination: string; days: any[]; totalDays: number } | null {
  const match = response.match(/\[ROTEIRO_VISUAL\]([\s\S]*?)\[\/ROTEIRO_VISUAL\]/);
  if (!match) return null;

  const content = match[1].trim();
  const lines = content.split("\n").map(l => l.trim()).filter(Boolean);

  let destination = "";
  let totalDays = 0;
  const days: any[] = [];
  let currentDay: any = null;

  for (const line of lines) {
    if (line.startsWith("Destino:")) {
      destination = line.replace("Destino:", "").trim();
    } else if (line.startsWith("Dias:")) {
      totalDays = parseInt(line.replace("Dias:", "").trim()) || 0;
    } else if (/^Dia\s+\d+/i.test(line)) {
      const dayMatch = line.match(/^(Dia\s+\d+)\s*[-–]\s*(.*)/i);
      currentDay = {
        day: dayMatch?.[1] || line,
        theme: dayMatch?.[2] || "",
        activities: [],
      };
      days.push(currentDay);
    } else if (currentDay && line.includes("|")) {
      const parts = line.split("|").map(p => p.trim());
      const time = parts[0] || "";
      const rest = parts.slice(1).join("|").trim();
      // Extract trailing emoji
      const emojiMatch = rest.match(/([\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}✈️🏨🍽️☀️🌅🌄🎉🏖️🐠🌊🏔️🎭🛍️🍷🌿🏛️⛵🚶‍♂️🧘‍♀️🎶💆‍♀️🏊‍♂️🤿🚡🎿⛷️🏂🛶🚴‍♂️🧗‍♂️🪂🏄‍♂️]+)\s*$/u);
      currentDay.activities.push({
        time,
        name: rest.replace(/([\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}✈️🏨🍽️☀️🌅🌄🎉🏖️🐠🌊🏔️🎭🛍️🍷🌿🏛️⛵🚶‍♂️🧘‍♀️🎶💆‍♀️🏊‍♂️🤿🚡🎿⛷️🏂🛶🚴‍♂️🧗‍♂️🪂🏄‍♂️]+)\s*$/u, "").trim(),
        emoji: emojiMatch?.[1] || "•",
      });
    }
  }

  if (!destination || days.length === 0) return null;
  return { destination, days, totalDays: totalDays || days.length };
}

function isLikelyItineraryText(text: string): boolean {
  return /roteiro personalizado|dia\s*1|manhã:|tarde:|noite:/i.test(text);
}

function parseItineraryFromPlainText(text: string): { destination: string; days: any[]; totalDays: number } | null {
  if (!isLikelyItineraryText(text)) return null;

  const destinationMatch = text.match(/roteiro\s+personalizado\s*[-–]\s*([^\n(]+)(?:\((\d+)\s*dias?\))?/i);
  const destination = destinationMatch?.[1]?.trim();

  const dayBlocks = text.match(/(?:☀️\s*)?\*?Dia\s+\d+\s*[-–][\s\S]*?(?=(?:\n\s*(?:☀️\s*)?\*?Dia\s+\d+\s*[-–])|$)/gi) || [];
  const days: any[] = [];

  for (const block of dayBlocks) {
    const headerMatch = block.match(/Dia\s+(\d+)\s*[-–]\s*([^\n*]+)/i);
    if (!headerMatch) continue;

    const dayNumber = headerMatch[1];
    const theme = headerMatch[2].trim();
    const activities: any[] = [];

    const morning = block.match(/manhã:\s*([^\n]+)/i)?.[1]?.trim();
    const afternoon = block.match(/tarde:\s*([^\n]+)/i)?.[1]?.trim();
    const night = block.match(/noite:\s*([^\n]+)/i)?.[1]?.trim();

    if (morning) activities.push({ time: "09:00", name: morning, emoji: "☀️" });
    if (afternoon) activities.push({ time: "14:00", name: afternoon, emoji: "🌤️" });
    if (night) activities.push({ time: "19:00", name: night, emoji: "🌙" });

    if (activities.length === 0) {
      const genericItems = [...block.matchAll(/•\s*([^\n]+)/g)].map(m => m[1].trim()).slice(0, 3);
      genericItems.forEach((item, idx) => {
        const fallbackTime = ["09:00", "14:00", "19:00"][idx] || "12:00";
        activities.push({ time: fallbackTime, name: item, emoji: "•" });
      });
    }

    if (activities.length > 0) {
      days.push({ day: `Dia ${dayNumber}`, theme, activities });
    }
  }

  if (!destination || days.length === 0) return null;
  const totalDays = parseInt(destinationMatch?.[2] || "", 10) || days.length;
  return { destination, days, totalDays };
}

// Generate and send itinerary visual card
async function generateAndSendItineraryVisual(phoneNumber: string, itineraryData: { destination: string; days: any[]; totalDays: number }, clientName?: string): Promise<boolean> {
  try {
    console.log("[ITINERARY-VISUAL] Generating visual for:", itineraryData.destination);
    
    const visualUrl = `${SUPABASE_URL}/functions/v1/generate-itinerary-visual`;
    const visualResponse = await fetch(visualUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        destination: itineraryData.destination,
        days: itineraryData.days,
        clientName: clientName || undefined,
      }),
    });

    if (!visualResponse.ok) {
      console.error("[ITINERARY-VISUAL] Edge function error:", visualResponse.status);
      return false;
    }

    const visualData = await visualResponse.json();
    if (visualData.imageUrl) {
      const caption = `🗺️ Roteiro ${itineraryData.destination} - ${itineraryData.totalDays} dias ✨\nPreparado por Téo | Tomorrow Travel ✈️`;
      await sendWhatsAppImage(phoneNumber, visualData.imageUrl, caption);
      console.log("[ITINERARY-VISUAL] Visual card sent to", phoneNumber);
      return true;
    }

    console.error("[ITINERARY-VISUAL] No imageUrl returned");
    return false;
  } catch (err) {
    console.error("[ITINERARY-VISUAL] Error generating/sending visual:", err);
    return false;
  }
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

async function requestQuotation(quotationData: Record<string, any>): Promise<{ status: string; data: any }> {
  const payload = {
    origem: quotationData.origem,
    destino: quotationData.destino,
    data_ida: quotationData.data_ida,
    data_volta: quotationData.data_volta,
    adultos: quotationData.adultos || 1,
    criancas: quotationData.criancas || 0,
    idades_criancas: quotationData.idades_criancas || [],
  };

  console.log("[QUOTATION] Calling cativa-quotation API:", JSON.stringify(payload));

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout (API is fast now)

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/cativa-quotation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const responseText = await response.text();
    console.log("[QUOTATION] Cativa API response status:", response.status);
    console.log("[QUOTATION] Response (first 2000):", responseText.substring(0, 2000));

    if (!response.ok) {
      return { status: "error", data: null };
    }

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      return { status: "error", data: null };
    }

    if (responseData.error) {
      return { status: "error", data: null };
    }

    return { status: "success", data: responseData };
  } catch (err) {
    clearTimeout(timeoutId);
    console.error("[QUOTATION] Error:", err);
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

      // Handle async quotation processing (self-invoked, non-blocking)
      if (body.action === "process_quotation") {
        const phone = body.phone_number;
        const quotationData = body.quotation_data;
        const saveResultId = body.save_result_id;
        const conversationId = body.conversation_id;
        const clientName = body.client_name;
        const collectedDataForQuote = body.collected_data || {};

        if (phone && quotationData) {
          console.log(`[ASYNC-QUOTATION] Processing quotation for ${phone} → ${quotationData.destino}`);

          // Call Cativa/Infotravel API directly
          const quotationResult = await requestQuotation(quotationData);

          let quotationMsg: string;

          if (quotationResult.status === "success" && quotationResult.data?.resultados?.length > 0) {
            quotationMsg = formatQuotationResults(quotationResult.data);

            // Update travel_quote_requests with results
            if (saveResultId) {
              await supabase.from("travel_quote_requests").update({
                status: "completed",
                processed_at: new Date().toISOString(),
                processing_details: quotationResult.data,
              }).eq("id", saveResultId);
            }

            // Generate quote visual card (fire-and-forget)
            generateAndSendQuoteVisual(phone, quotationData, quotationResult.data)
              .catch(err => console.error("[QUOTE-VISUAL] Fire-and-forget error:", err));

          } else {
            // No results or API error — fallback to human specialist
            quotationMsg = `${clientName || 'Amigo(a)'}! 👋\n\nNão encontrei opções automáticas para ${quotationData.destino} nessas datas, mas isso não é problema! 🌴\n\nVou encaminhar seu pedido para um especialista do destino que vai encontrar o pacote perfeito pra você! ✈️\n\nUm consultor da Tomorrow Travel entra em contato em breve! 😊`;

            if (saveResultId) {
              await supabase.from("travel_quote_requests").update({
                status: "failed",
                error_message: "Nenhum resultado encontrado na API Infotravel",
                processed_at: new Date().toISOString(),
              }).eq("id", saveResultId);
            }

            // Create lead for human follow-up
            try {
              await createQuoteRequest(phone, collectedDataForQuote);
            } catch (err) {
              console.error("Error creating quote on failure:", err);
            }
          }

          // Send results to client
          await sendWhatsAppMessage(phone, quotationMsg);

          // Save to conversation history
          try {
            const { data: conv } = await supabase
              .from("whatsapp_conversations")
              .select("id, messages_history, collected_data")
              .eq("id", conversationId)
              .single();

            if (conv) {
              const hasResults = quotationResult.status === "success" && quotationResult.data?.resultados?.length > 0;
              const updatedHistory = [
                ...((conv.messages_history as any[]) || []),
                { role: "assistant", content: quotationMsg, timestamp: new Date().toISOString() },
              ];
              const updatedCd = { ...(conv.collected_data as Record<string, any> || {}), _last_quote_id: saveResultId };

              await supabase.from("whatsapp_conversations").update({
                messages_history: updatedHistory,
                collected_data: updatedCd,
                conversation_state: hasResults ? "quotation_sent" : "completed",
                is_ai_active: hasResults,
              }).eq("id", conv.id);
            }
          } catch (histErr) {
            console.error("[ASYNC-QUOTATION] Error updating conversation:", histErr);
          }

          // Generate travel tips (non-blocking, delayed)
          try {
            const tipsResponse = await getAiResponse([
              { role: "user", content: `Você é o Téo, assistente de viagens divertido e humano da Tomorrow Travel. Gere uma mensagem para o cliente ${clientName || ''} com exatamente 5 dicas incríveis sobre ${quotationData.destino} (passeios, comidas, curiosidades, experiências). Seja divertido, use emojis, tom leve e descontraído. Uma dica por linha numerada. Comece com algo como "${clientName ? clientName + ', e' : 'E'}nquanto isso, bora conhecer um pouco mais sobre ${quotationData.destino}? 🗺️✨" e depois as 5 dicas. No FINAL da mensagem, adicione uma quebra de linha e pergunte de forma divertida e natural se o cliente sabia que você (o Téo) também pode montar um roteiro personalizado dia a dia pra viagem dele. Algo como: "Ah, e sabia que eu também posso montar um roteiro completinho dia a dia pra sua viagem? 🗓️✨ Quer que eu prepare um pra você?" Seja criativo e mantenha o tom do Téo!` }
            ]);
            const cleanTips = cleanAiResponse(tipsResponse);
            if (cleanTips && cleanTips.length > 20) {
              await new Promise(r => setTimeout(r, 30000));
              await sendWhatsAppMessage(phone, cleanTips);

              // Save tips to history
              const { data: convAfterTips } = await supabase
                .from("whatsapp_conversations")
                .select("id, messages_history")
                .eq("id", conversationId)
                .single();
              if (convAfterTips) {
                const updH = [
                  ...((convAfterTips.messages_history as any[]) || []),
                  { role: "assistant", content: cleanTips, timestamp: new Date().toISOString() },
                ];
                await supabase.from("whatsapp_conversations").update({ messages_history: updH }).eq("id", convAfterTips.id);
              }
            }
          } catch (tipErr) {
            console.error("[ASYNC-QUOTATION] Tips error:", tipErr);
          }

          console.log(`[ASYNC-QUOTATION] Done for ${phone}`);
        }

        return new Response(JSON.stringify({ status: "ok", quotation_processed: true }), {
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
              // Follow-up desativado - não enviar mensagem automática de cotação
              console.log("Follow-up quote skipped (disabled)");
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
      let imageBase64Data: string | null = null;

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
                const arrBuf = await imageBlob.arrayBuffer();
                // Store base64 for chef mode
                try {
                  const uint8 = new Uint8Array(arrBuf);
                  let binary = "";
                  for (let i = 0; i < uint8.length; i++) {
                    binary += String.fromCharCode(uint8[i]);
                  }
                  imageBase64Data = btoa(binary);
                } catch (b64Err) {
                  console.error("Error converting image to base64:", b64Err);
                }
                const fileName = `review-photos/${phoneNumber}/${Date.now()}.jpg`;
                const uploadBlob = new Blob([arrBuf], { type: "image/jpeg" });
                const { data: uploadData, error: uploadError } = await supabase.storage
                  .from("destination-images")
                  .upload(fileName, uploadBlob, { contentType: "image/jpeg", upsert: true });
                
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
      // BUT skip admin routing for group-related commands so admin can also use Modo Galera
      const normalizedMsgForRouting = (messageText || "")
        .normalize("NFKC")
        .replace(/[\u200B-\u200D\uFEFF]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();

      const isJoinGroupIntent = /(entrar(?:\s+no)?\s+grupo|me\s+adicion(?:a|ar|e)(?:\s+no)?\s+grupo|quero\s+entrar(?:\s+no)?\s+grupo)\s+[a-z0-9]{6}\b/i.test(normalizedMsgForRouting);
      const isGroupCommand = isJoinGroupIntent
        || /(?:criar|quero|novo|ativar|iniciar|montar|fazer|organizar|bora|vamos|começar|comecar|abrir|preparar|planejar)/i.test(normalizedMsgForRouting) && /(?:grupo|galera|modo\s*galera|viagem\s+(?:em\s+)?grupo)/i.test(normalizedMsgForRouting)
        || /^(meu grupo|status grupo|group status)$/i.test(normalizedMsgForRouting)
        || /^(resultado grupo|group result|ver resultado)$/i.test(normalizedMsgForRouting)
        || /^(sair grupo|sair do grupo|leave group)$/i.test(normalizedMsgForRouting)
        || /^votar\s+[1-3]$/i.test(normalizedMsgForRouting)
        || /^minhas?\s+datas?\s+/i.test(normalizedMsgForRouting)
        || /^(datas grupo|negociar datas|datas do grupo|group dates)$/i.test(normalizedMsgForRouting);

      console.log(`[ROUTER] phone=${phoneNumber} normalized="${normalizedMsgForRouting}" isGroupCommand=${isGroupCommand}`);

      // Also check if admin is in a group flow (setup_name, setup_count, questioning, etc.)
      let isAdminInGroupFlow = false;
      if (phoneNumber === ADMIN_PHONE_NUMBER && !isGroupCommand) {
        const { data: adminConv } = await supabase
          .from("whatsapp_conversations")
          .select("collected_data")
          .eq("phone_number", phoneNumber)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        const adminGroupMode = (adminConv?.collected_data as Record<string, any>)?._group_mode;
        if (adminGroupMode && adminGroupMode !== null) {
          isAdminInGroupFlow = true;
        }
      }

      if (phoneNumber === ADMIN_PHONE_NUMBER && !isGroupCommand && !isAdminInGroupFlow) {
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

      // ========== TRANSLATOR MODE: Universal Translation (Text, Audio, Photos) ==========
      {
        const translatorActivateRegex = /^(tradutor|modo tradutor|translator|ativar tradutor|traduzir|tradutor universal)$/i;
        const translatorDeactivateRegex = /^(sair tradutor|desativar tradutor|sair do tradutor|parar tradutor|exit translator)$/i;
        // Set target language: "tradutor para japonês", "traduzir para francês"
        const translatorSetLangRegex = /^(?:tradutor|traduzir)\s+(?:para|to)\s+(.+)$/i;

        // Check for language-specific activation
        const langMatch = translatorSetLangRegex.exec(lowerMsg.trim());
        if (langMatch) {
          const targetLang = langMatch[1].trim();
          const savedConvT = await ensureConversationAndSaveMessage(phoneNumber, contactName, messageText);
          if (savedConvT) {
            const existingData = (savedConvT.collected_data as Record<string, any>) || {};
            await supabase.from("whatsapp_conversations").update({
              collected_data: { ...existingData, _translator_mode: true, _translator_target_lang: targetLang, _mode_activated_at: new Date().toISOString() },
            }).eq("id", savedConvT.id);

            const activationMsg = `🌐 *Modo Tradutor Universal Ativado!*\n🎯 Idioma alvo: *${targetLang}*\n\nAgora você pode mandar:\n📝 *Texto* — traduzo na hora\n🎙️ *Áudio* — transcrevo e traduzo\n📸 *Foto* — leio placas, avisos e traduzo\n\n💡 Incluo contexto cultural quando relevante!\n\nPra sair: *sair tradutor*\nPra mudar idioma: *tradutor para [idioma]*`;
            await sendWhatsAppMessage(phoneNumber, activationMsg);

            // Mode messages NOT saved to messages_history to keep main context clean
          }
          return new Response(JSON.stringify({ status: "ok", translator_activated: true, target_lang: targetLang }), {
            status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (translatorActivateRegex.test(lowerMsg.trim())) {
          const savedConvT = await ensureConversationAndSaveMessage(phoneNumber, contactName, messageText);
          if (savedConvT) {
            const existingData = (savedConvT.collected_data as Record<string, any>) || {};
            await supabase.from("whatsapp_conversations").update({
              collected_data: { ...existingData, _translator_mode: true, _translator_target_lang: null, _mode_activated_at: new Date().toISOString() },
            }).eq("id", savedConvT.id);

            const activationMsg = "🌐 *Modo Tradutor Universal Ativado!*\n\nAgora você pode mandar:\n📝 *Texto* — traduzo na hora\n🎙️ *Áudio* — transcrevo e traduzo\n📸 *Foto de placa/aviso* — leio o texto e traduzo\n\n🔄 Auto-detecta o idioma:\n🇧🇷 Português → 🇺🇸 Inglês\n🇺🇸🇪🇸🇫🇷🇮🇹🇩🇪🇯🇵 Qualquer idioma → 🇧🇷 Português\n\n💡 Dica: mande *tradutor para japonês* pra definir um idioma alvo específico!\n\nPra sair: *sair tradutor*";
            await sendWhatsAppMessage(phoneNumber, activationMsg);

            // Mode messages NOT saved to messages_history to keep main context clean
          }
          return new Response(JSON.stringify({ status: "ok", translator_activated: true }), {
            status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (translatorDeactivateRegex.test(lowerMsg.trim())) {
          const savedConvT = await ensureConversationAndSaveMessage(phoneNumber, contactName, messageText);
          if (savedConvT) {
            const existingData = (savedConvT.collected_data as Record<string, any>) || {};
            await supabase.from("whatsapp_conversations").update({
              collected_data: { ...existingData, _translator_mode: false, _translator_target_lang: null },
            }).eq("id", savedConvT.id);

            const deactivationMsg = "✅ Modo Tradutor desativado! Voltei ao modo normal. 😊\n\nSe precisar traduzir de novo, é só mandar *tradutor*!";
            await sendWhatsAppMessage(phoneNumber, deactivationMsg);

            // Mode messages NOT saved to messages_history to keep main context clean
          }
          return new Response(JSON.stringify({ status: "ok", translator_deactivated: true }), {
            status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Check if in translator mode for any type of message
        const { data: convForT } = await supabase
          .from("whatsapp_conversations")
          .select("id, collected_data, messages_history")
          .eq("phone_number", phoneNumber)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const tData = (convForT?.collected_data as Record<string, any>) || {};
        if (tData._translator_mode === true && convForT) {
          const targetLang = tData._translator_target_lang || undefined;

          // === PHOTO TRANSLATION (signs, notices, labels) ===
          if (messageType === "image" && imageBase64Data) {
            console.log("[TRANSLATOR] Photo received in translator mode, OCR + translate...");
            await ensureConversationAndSaveMessage(phoneNumber, contactName, "📸 [Foto para tradução]");

            const imgResult = await translateImage(imageBase64Data, "image/jpeg", targetLang);
            if (!imgResult || !imgResult.items || imgResult.items.length === 0) {
              const noTextMsg = imgResult?.image_description
                ? `📸 Vi a imagem: *${imgResult.image_description}*\n\nMas não encontrei texto para traduzir. Mande uma foto com texto visível (placa, aviso, menu, etc.) 🔍`
                : "📸 Não consegui identificar texto nessa foto. Tenta mandar uma foto mais nítida de uma placa, aviso ou texto! 🔍";
              await sendWhatsAppMessage(phoneNumber, noTextMsg);
              return new Response(JSON.stringify({ status: "ok", translator_no_text: true }), {
                status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
              });
            }

            let resultMsg = `📸 *TRADUÇÃO DE IMAGEM*\n`;
            if (imgResult.image_description) {
              resultMsg += `📍 _${imgResult.image_description}_\n`;
            }
            resultMsg += `🗣️ Idioma: *${imgResult.source_lang_name}*\n━━━━━━━━━━━━━━━\n\n`;

            for (const item of imgResult.items) {
              resultMsg += `📌 *${item.original}*\n➡️ ${item.translation}\n\n`;
            }

            if (imgResult.cultural_context) {
              resultMsg += `━━━━━━━━━━━━━━━\n💡 *Contexto cultural:*\n${imgResult.cultural_context}`;
            }

            // Split if too long
            if (resultMsg.length > 4000) {
              const mid = resultMsg.lastIndexOf("\n", 3900);
              await sendWhatsAppMessage(phoneNumber, resultMsg.substring(0, mid > 0 ? mid : 3900));
              await sendWhatsAppMessage(phoneNumber, resultMsg.substring(mid > 0 ? mid : 3900));
            } else {
              await sendWhatsAppMessage(phoneNumber, resultMsg);
            }

            // Mode messages NOT saved to messages_history to keep main context clean
            // Reset timer
            await supabase.from("whatsapp_conversations").update({ collected_data: { ...tData, _mode_activated_at: new Date().toISOString() } }).eq("id", convForT.id);

            return new Response(JSON.stringify({ status: "ok", translator_image: true }), {
              status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          // === AUDIO TRANSLATION ===
          if (incomingWasAudio && messageText && messageText !== "[Áudio não reconhecido]" && messageText !== "[Áudio não pôde ser baixado]") {
            console.log("[TRANSLATOR] Audio in translator mode, processing...");

            const audioId = message.audio?.id;
            let transcriptionResult: { text: string; detected_language?: string } | null = null;
            if (audioId) {
              const audioBuffer = await downloadWhatsAppMedia(audioId);
              if (audioBuffer) {
                transcriptionResult = await transcribeAudioAutoDetect(audioBuffer);
              }
            }

            const originalText = transcriptionResult?.text || messageText;
            await ensureConversationAndSaveMessage(phoneNumber, contactName, `🎙️ ${originalText}`);

            const translation = await translateText(originalText, targetLang);
            if (!translation || !translation.translation) {
              await sendWhatsAppMessage(phoneNumber, "😅 Não consegui traduzir esse áudio. Tenta mandar de novo com uma fala mais clara!");
              return new Response(JSON.stringify({ status: "ok", translator_failed: true }), {
                status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
              });
            }

            const sFlag = getLangFlag(translation.source_lang);
            const tFlag = getLangFlag(translation.target_lang);
            let textMsg = `🎙️ *Áudio traduzido*\n\n${sFlag} *${translation.source_lang_name}:*\n${originalText}\n\n${tFlag} *${translation.target_lang_name}:*\n${translation.translation}`;

            if (translation.cultural_context) {
              textMsg += `\n\n💡 _${translation.cultural_context}_`;
            }

            // Generate translated audio via TTS
            let translatedAudioUrl: string | null = null;
            try {
              const ab = await convertTextToAudio(translation.translation);
              if (ab) {
                translatedAudioUrl = await uploadAudioToStorage(ab, phoneNumber);
              }
            } catch (audioErr) {
              console.error("[TRANSLATOR] TTS error:", audioErr);
            }

            await sendWhatsAppMessage(phoneNumber, textMsg);
            if (translatedAudioUrl) {
              await sendWhatsAppAudio(phoneNumber, translatedAudioUrl);
            }

            // Mode messages NOT saved to messages_history to keep main context clean
            // Reset timer
            await supabase.from("whatsapp_conversations").update({ collected_data: { ...tData, _mode_activated_at: new Date().toISOString() } }).eq("id", convForT.id);

            console.log(`[TRANSLATOR] Done: ${translation.source_lang} → ${translation.target_lang}`);
            return new Response(JSON.stringify({ status: "ok", translator_translated: true }), {
              status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          // === TEXT TRANSLATION ===
          if (messageType === "text" && messageText && messageText.length > 1) {
            console.log("[TRANSLATOR] Text in translator mode, translating...");
            await ensureConversationAndSaveMessage(phoneNumber, contactName, messageText);

            const translation = await translateText(messageText, targetLang);
            if (!translation || !translation.translation) {
              await sendWhatsAppMessage(phoneNumber, "😅 Não consegui traduzir esse texto. Tenta de novo!");
              return new Response(JSON.stringify({ status: "ok", translator_failed: true }), {
                status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
              });
            }

            const sFlag = getLangFlag(translation.source_lang);
            const tFlag = getLangFlag(translation.target_lang);
            let textMsg = `${sFlag} ${messageText}\n\n${tFlag} ${translation.translation}`;

            if (translation.cultural_context) {
              textMsg += `\n\n💡 _${translation.cultural_context}_`;
            }

            await sendWhatsAppMessage(phoneNumber, textMsg);

            // Mode messages NOT saved to messages_history to keep main context clean
            // Reset timer
            await supabase.from("whatsapp_conversations").update({ collected_data: { ...tData, _mode_activated_at: new Date().toISOString() } }).eq("id", convForT.id);

            console.log(`[TRANSLATOR] Text done: ${translation.source_lang} → ${translation.target_lang}`);
            return new Response(JSON.stringify({ status: "ok", translator_text: true }), {
              status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }
      }

      // ========== CHEF MODE: Menu Translator & Analyzer ==========
      {
        const lowerMsgTrimmed = (messageText || "").toLowerCase().trim();
        const chefActivateRegex = /^(chef|modo chef|cardapio|cardápio|menu|analisar cardápio|analisar cardapio|chef mode)$/i;
        const chefDeactivateRegex = /^(sair chef|desativar chef|sair do chef|parar chef|exit chef|sair modo chef)$/i;

        if (chefActivateRegex.test(lowerMsgTrimmed)) {
          const savedConvC = await ensureConversationAndSaveMessage(phoneNumber, contactName, messageText);
          if (savedConvC) {
            const existingData = (savedConvC.collected_data as Record<string, any>) || {};
            await supabase.from("whatsapp_conversations").update({
              collected_data: { ...existingData, _chef_mode: true, _mode_activated_at: new Date().toISOString() },
            }).eq("id", savedConvC.id);

            const activationMsg = "👨‍🍳 *Modo Chef Ativado!*\n\nAgora é só mandar uma *foto do cardápio* que eu traduzo tudo pra você! 📸\n\n📋 Tradução dos pratos\n🥗 Ingredientes principais\n⚠️ Alertas de alergênicos\n⭐ Recomendação de melhor custo-benefício\n\nPra sair do modo chef, mande: *sair chef*";
            await sendWhatsAppMessage(phoneNumber, activationMsg);

            // Mode messages NOT saved to messages_history to keep main context clean
          }
          return new Response(JSON.stringify({ status: "ok", chef_mode_activated: true }), {
            status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (chefDeactivateRegex.test(lowerMsgTrimmed)) {
          const savedConvC = await ensureConversationAndSaveMessage(phoneNumber, contactName, messageText);
          if (savedConvC) {
            const existingData = (savedConvC.collected_data as Record<string, any>) || {};
            await supabase.from("whatsapp_conversations").update({
              collected_data: { ...existingData, _chef_mode: false, _chef_menu_analysis: null },
            }).eq("id", savedConvC.id);

            const deactivationMsg = "✅ Modo Chef desativado! Voltei ao modo normal. 😊\n\nSe precisar traduzir outro cardápio, é só mandar *chef*!";
            await sendWhatsAppMessage(phoneNumber, deactivationMsg);

            // Mode messages NOT saved to messages_history to keep main context clean
          }
          return new Response(JSON.stringify({ status: "ok", chef_mode_deactivated: true }), {
            status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // If incoming is image → classify first, only activate chef mode if it's a menu
        if (messageType === "image" && imageBase64Data) {
          const { data: convForChef } = await supabase
            .from("whatsapp_conversations")
            .select("id, collected_data, messages_history")
            .eq("phone_number", phoneNumber)
            .order("updated_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          const chefData = (convForChef?.collected_data as Record<string, any>) || {};
          const wasChefModeActive = chefData._chef_mode === true;
          
          // Determine if we should process as menu
          let isMenuImage = wasChefModeActive; // If already in chef mode, treat all images as menus
          
          if (!wasChefModeActive && convForChef) {
            // NOT in chef mode — use AI to classify the image first
            console.log("[CHEF MODE] Classifying image to check if it's a menu...");
            try {
              const classifyResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${LOVABLE_API_KEY}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  model: "google/gemini-2.5-flash-lite",
                  messages: [{
                    role: "user",
                    content: [
                      { type: "text", text: "Is this image a restaurant menu, food menu, or menu card? Reply ONLY with 'yes' or 'no'." },
                      { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64Data}` } }
                    ]
                  }],
                  max_tokens: 10,
                }),
              });
              
              if (classifyResponse.ok) {
                const classifyJson = await classifyResponse.json();
                const answer = (classifyJson.choices?.[0]?.message?.content || "").toLowerCase().trim();
                isMenuImage = answer.includes("yes");
                console.log(`[CHEF MODE] Classification result: ${answer} → isMenu=${isMenuImage}`);
              }
            } catch (classifyErr) {
              console.error("[CHEF MODE] Classification error:", classifyErr);
              isMenuImage = false; // On error, don't falsely activate
            }
          }
          
          if (isMenuImage && convForChef) {
            if (!wasChefModeActive) {
              console.log("[CHEF MODE] Auto-activating chef mode — confirmed menu image");
              await sendWhatsAppMessage(phoneNumber, "👨‍🍳 *Modo Chef ativado automaticamente!*\nAnalisando seu cardápio... 📋");
            } else {
              console.log("[CHEF MODE] New menu image received, updating analysis...");
            }

            await ensureConversationAndSaveMessage(phoneNumber, contactName, "📸 [Foto de cardápio]");

            try {
              const analysisResult = await analyzeMenuImage(imageBase64Data);
              
              if (analysisResult.length > 4000) {
                const mid = analysisResult.lastIndexOf("\n", 3900);
                const part1 = analysisResult.substring(0, mid > 0 ? mid : 3900);
                const part2 = analysisResult.substring(mid > 0 ? mid : 3900);
                await sendWhatsAppMessage(phoneNumber, part1);
                await sendWhatsAppMessage(phoneNumber, part2);
              } else {
                await sendWhatsAppMessage(phoneNumber, analysisResult);
              }

              const { data: convAfterChef } = await supabase
                .from("whatsapp_conversations")
                .select("id, messages_history, collected_data")
                .eq("id", convForChef.id)
                .single();

              if (convAfterChef) {
                // Mode messages NOT saved to messages_history to keep main context clean
                const existingChefData = (convAfterChef as any).collected_data || chefData || {};
                await supabase.from("whatsapp_conversations").update({ 
                  collected_data: { ...existingChefData, _chef_mode: true, _chef_menu_analysis: analysisResult, _mode_activated_at: new Date().toISOString() },
                }).eq("id", convAfterChef.id);
              }
            } catch (chefErr) {
              console.error("[CHEF MODE] Error:", chefErr);
              await sendWhatsAppMessage(phoneNumber, "😅 Não consegui analisar esse cardápio. Tenta mandar outra foto com melhor iluminação! 📸");
            }

            return new Response(JSON.stringify({ status: "ok", chef_menu_analyzed: true }), {
              status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          // If not a menu image, continue to normal AI flow below
        }

      // ========== MODO GALERA: Group Travel with Preference Cross-Referencing ==========
      {
        const lowerMsgGroup = (messageText || "").toLowerCase().trim();
        const hasGroupIntent = /(?:criar|quero|novo|ativar|iniciar|montar|fazer|organizar|bora|vamos|começar|comecar|abrir|preparar|planejar)/i;
        const hasGroupKeyword = /(?:grupo|galera|modo\s*galera|viagem\s+(?:em\s+)?grupo)/i;
        const createGroupRegex = { test: (s: string) => hasGroupIntent.test(s) && hasGroupKeyword.test(s) };
        const joinGroupRegex = /(?:entrar(?:\s+no)?\s+grupo|me\s+adicion(?:a|ar|e)(?:\s+no)?\s+grupo|quero\s+entrar(?:\s+no)?\s+grupo)\s+([A-Z0-9]{6})\b/i;
        const joinGroupRegexLower = /(?:entrar(?:\s+no)?\s+grupo|me\s+adicion(?:a|ar|e)(?:\s+no)?\s+grupo|quero\s+entrar(?:\s+no)?\s+grupo)\s+([a-zA-Z0-9]{6})\b/i;
        const myGroupRegex = /^(meu grupo|status grupo|group status)$/i;
        const resultGroupRegex = /^(resultado grupo|group result|ver resultado)$/i;
        const leaveGroupRegex = /^(sair grupo|sair do grupo|leave group)$/i;
        const myDatesRegex = /^minhas?\s+datas?\s+(.+)$/i;
        const groupDatesRegex = /^(datas grupo|negociar datas|datas do grupo|group dates)$/i;
        const voteRegex = /^votar\s+([1-3])$/i;

        // Generate 6-char alphanumeric code
        const generateGroupCode = (): string => {
          const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
          let code = "";
          for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
          return code;
        };

        // Group questionnaire questions (12 questions for refined destination matching)
        const GROUP_QUESTIONS = [
          "1️⃣ Qual seu *estilo de viagem*?\n\n1. Aventura 🏔️\n2. Relax 🧘\n3. Cultural 🏛️\n4. Gastronômico 🍽️\n5. Festas 🎉\n6. Misto 🔀\n\nResponda com o número:",
          "2️⃣ *Clima* preferido?\n\n1. Tropical/Quente ☀️\n2. Frio ❄️\n3. Temperado 🌤️\n4. Tanto faz 🤷\n\nResponda com o número:",
          "3️⃣ Qual sua *prioridade* na viagem?\n\n1. Praia 🏖️\n2. Montanha 🏔️\n3. Cidade 🏙️\n4. Gastronomia 🍽️\n5. Natureza 🌿\n6. Vida noturna 🌙\n7. História/Cultura 📜\n\nResponda com o número:",
          "4️⃣ Tipo de *acomodação* preferida?\n\n1. Hotel econômico 🏨\n2. Hotel confortável ⭐\n3. Resort all-inclusive 🏝️\n4. Pousada/Hostel 🛏️\n5. Airbnb/Casa 🏠\n6. Tanto faz 🤷\n\nResponda com o número:",
          "5️⃣ *Nacional ou internacional*?\n\n1. Prefiro Brasil 🇧🇷\n2. Prefiro Internacional 🌍\n3. Tanto faz, o que for melhor 🤷\n\nResponda com o número:",
          "6️⃣ Qual a *duração ideal* da viagem?\n\n1. Fim de semana (2-3 dias) ⚡\n2. Uma semana (5-7 dias) 📅\n3. Viagem longa (10-15 dias) 🗓️\n4. Mais de 15 dias 🌎\n\nResponda com o número:",
          "7️⃣ Como prefere se *locomover*?\n\n1. A pé / transporte público 🚶\n2. Carro alugado 🚗\n3. Transfer/tour organizado 🚐\n4. Tanto faz 🤷\n\nResponda com o número:",
          "8️⃣ O que *NÃO pode faltar*?\n\n1. Piscina 🏊\n2. Wi-Fi rápido 📶\n3. Boa comida local 🍲\n4. Passeios radicais 🪂\n5. Compras/shopping 🛍️\n6. Spa/bem-estar 💆\n\nResponda com o número:",
          "9️⃣ Alguma *restrição* importante?\n\n1. Sem escalas longas ✈️\n2. Visto fácil/sem visto 🛂\n3. Acessibilidade ♿\n4. Segurança é prioridade 🔒\n5. Nenhuma ❌\n\nResponda com o número:",
          "🔟 Quais suas *datas disponíveis*?\n\nExemplo: 15/06 a 30/06 ou julho todo\n\n📅 Escreva suas datas:",
          "1️⃣1️⃣ Qual seu *orçamento individual*?\n\n1. Até R$ 2.000 💰\n2. R$ 2.000 a R$ 5.000 💵\n3. R$ 5.000 a R$ 10.000 💎\n4. Acima de R$ 10.000 👑\n\nResponda com o número:",
          "1️⃣2️⃣ Tem algo *especial* que gostaria na viagem? 🌟\n\nExemplos: aniversário, lua de mel, formatura, reencontro de amigos, primeiro viagem juntos...\n\n✍️ Escreva ou mande *nenhum*:",
        ];

        const PREF_KEYS = ["estilo", "clima", "prioridade", "acomodacao", "destino_tipo", "duracao", "locomocao", "essencial", "restricoes", "datas_disponiveis", "orcamento", "ocasiao_especial"];
        const PREF_OPTIONS: Record<string, string[]> = {
          estilo: ["Aventura", "Relax", "Cultural", "Gastronômico", "Festas", "Misto"],
          clima: ["Tropical/Quente", "Frio", "Temperado", "Tanto faz"],
          prioridade: ["Praia", "Montanha", "Cidade", "Gastronomia", "Natureza", "Vida noturna", "História/Cultura"],
          acomodacao: ["Hotel econômico", "Hotel confortável", "Resort all-inclusive", "Pousada/Hostel", "Airbnb/Casa", "Tanto faz"],
          destino_tipo: ["Prefiro Brasil", "Prefiro Internacional", "Tanto faz"],
          duracao: ["Fim de semana (2-3 dias)", "Uma semana (5-7 dias)", "Viagem longa (10-15 dias)", "Mais de 15 dias"],
          locomocao: ["A pé / transporte público", "Carro alugado", "Transfer/tour organizado", "Tanto faz"],
          essencial: ["Piscina", "Wi-Fi rápido", "Boa comida local", "Passeios radicais", "Compras/shopping", "Spa/bem-estar"],
          restricoes: ["Sem escalas longas", "Visto fácil/sem visto", "Acessibilidade", "Segurança é prioridade", "Nenhuma"],
          orcamento: ["Até R$ 2.000", "R$ 2.000 a R$ 5.000", "R$ 5.000 a R$ 10.000", "Acima de R$ 10.000"],
        };

        // Cross-reference preferences via AI
        const crossReferencePreferences = async (group: any, members: any[]): Promise<string> => {
          const membersList = members.map(m => {
            const prefs = m.preferences || {};
            return `- *${m.member_name || m.phone_number}*: Estilo: ${prefs.estilo || "?"}, Clima: ${prefs.clima || "?"}, Prioridade: ${prefs.prioridade || "?"}, Acomodação: ${prefs.acomodacao || "?"}, Nacional/Internacional: ${prefs.destino_tipo || "?"}, Duração: ${prefs.duracao || "?"}, Locomoção: ${prefs.locomocao || "?"}, Essencial: ${prefs.essencial || "?"}, Restrições: ${prefs.restricoes || "nenhuma"}, Orçamento: ${prefs.orcamento || "?"}, Datas: ${prefs.datas_disponiveis || "?"}, Ocasião: ${prefs.ocasiao_especial || "nenhuma"}`;
          }).join("\n");

          const crossPrompt = `Você é um especialista em viagens de grupo da Tomorrow Travel. Analise as preferências detalhadas de ${members.length} viajantes e sugira os 3 melhores destinos.

MEMBROS DO GRUPO:
${membersList}

REGRAS:
- Sugira 3 destinos ranqueados por compatibilidade (0-100%)
- IMPORTANTE: Numere os destinos como "1️⃣", "2️⃣", "3️⃣" para facilitar a votação
- Para cada destino, explique por que combina com o grupo
- Considere TODOS os critérios: estilo, clima, prioridade, acomodação, nacional/internacional, duração ideal, locomoção, itens essenciais, restrições, orçamento e datas
- Se há uma ocasião especial (aniversário, lua de mel, etc.), destaque destinos que valorizem esse momento
- Identifique possíveis conflitos (ex: "João prefere frio mas Maria quer praia")
- Sugira compromissos (ex: "Gramado tem frio + gastronomia + natureza")
- Se a maioria prefere Brasil, foque em destinos nacionais; se internacional, sugira fora do país
- Use destinos reais e específicos (não "Nordeste", mas "Porto de Galinhas")
- Considere o orçamento médio do grupo e a duração preferida
- Formato WhatsApp com emojis e *negrito*
- Máximo 3500 caracteres
- NÃO adicione perguntas sobre cotação no final - a votação será adicionada automaticamente`;

          try {
            const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${LOVABLE_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "google/gemini-2.5-flash",
                messages: [
                  { role: "system", content: crossPrompt },
                  { role: "user", content: "Analise as preferências e sugira os melhores destinos para o grupo." },
                ],
                max_tokens: 4000,
              }),
            });

            if (!response.ok) {
              console.error("[GROUP] AI error:", response.status);
              return "😅 Não consegui analisar as preferências do grupo agora. Tente novamente em alguns minutos!";
            }

            const data = await response.json();
            return data.choices?.[0]?.message?.content || "Não consegui gerar recomendações. Tente novamente!";
          } catch (err) {
            console.error("[GROUP] Cross-reference error:", err);
            return "😅 Erro ao processar as preferências. Tente novamente!";
          }
        };

        // ===== CREATE GROUP (multi-step setup) =====
        if (createGroupRegex.test(lowerMsgGroup)) {
          const savedConv = await ensureConversationAndSaveMessage(phoneNumber, contactName, messageText);
          
          if (savedConv) {
            const existingData = (savedConv.collected_data as Record<string, any>) || {};

            // Check for existing active groups (as creator)
            const { data: existingCreatorGroups } = await supabase
              .from("travel_groups")
              .select("id, group_code, group_name, status, expected_members")
              .eq("creator_phone", phoneNumber)
              .eq("status", "collecting");

            // Check for existing active groups (as member)
            const { data: existingMemberships } = await supabase
              .from("travel_group_members")
              .select("group_id, phone_number")
              .eq("phone_number", phoneNumber);

            const memberGroupIds = (existingMemberships || []).map(m => m.group_id);
            const creatorGroupIds = (existingCreatorGroups || []).map(g => g.id);
            
            // Get member-only groups (where user is member but not creator)
            const memberOnlyIds = memberGroupIds.filter(id => !creatorGroupIds.includes(id));
            let memberOnlyGroups: any[] = [];
            if (memberOnlyIds.length > 0) {
              const { data: mGroups } = await supabase
                .from("travel_groups")
                .select("id, group_code, group_name, status, expected_members")
                .in("id", memberOnlyIds)
                .eq("status", "collecting");
              memberOnlyGroups = mGroups || [];
            }

            const activeGroups = [...(existingCreatorGroups || []), ...memberOnlyGroups];

            if (activeGroups.length > 0) {
              // User has active groups — ask if they want to use existing or create new
              let groupListMsg = "🎉 *Modo Galera!*\n\nVi que você já tem grupo(s) ativo(s):\n\n";
              activeGroups.forEach((g, i) => {
                const isCreator = creatorGroupIds.includes(g.id);
                groupListMsg += `${i + 1}️⃣ *${g.group_name || "Sem nome"}* (código: ${g.group_code})${isCreator ? " 👑" : ""}\n`;
              });
              groupListMsg += `\n${activeGroups.length + 1}️⃣ *Criar um novo grupo*\n`;
              groupListMsg += `\n📝 Responda com o *número* da opção desejada:`;

              await sendWhatsAppMessage(phoneNumber, groupListMsg);

              await supabase.from("whatsapp_conversations").update({
                collected_data: { 
                  ...existingData, 
                  _group_mode: "choose_existing_or_new",
                  _active_groups: activeGroups.map(g => ({ id: g.id, code: g.group_code, name: g.group_name })),
                  _mode_activated_at: new Date().toISOString(),
                },
              }).eq("id", savedConv.id);

              // Mode messages NOT saved to messages_history to keep main context clean
            } else {
              // No active groups — proceed to setup_name directly
              await supabase.from("whatsapp_conversations").update({
                collected_data: { ...existingData, _group_mode: "setup_name", _mode_activated_at: new Date().toISOString() },
              }).eq("id", savedConv.id);

              const askNameMsg = "🎉 *Modo Galera ativado!*\n\nVamos montar o grupo de viagem perfeito! 🌍\n\n📝 *Como quer chamar o grupo?*\n\n(Ex: Viagem da Galera, Férias 2026, Amigos SP...)";
              await sendWhatsAppMessage(phoneNumber, askNameMsg);

              // Mode messages NOT saved to messages_history to keep main context clean
            }
          }

          return new Response(JSON.stringify({ status: "ok", group_setup_started: true }), {
            status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // ===== JOIN GROUP =====
        const joinMatch = messageText?.match(joinGroupRegexLower);
        if (joinMatch) {
          const code = joinMatch[1].toUpperCase();
          const savedConv = await ensureConversationAndSaveMessage(phoneNumber, contactName, messageText);

          const { data: group } = await supabase
            .from("travel_groups")
            .select("id, group_code, status, creator_name")
            .eq("group_code", code)
            .maybeSingle();

          if (!group) {
            await sendWhatsAppMessage(phoneNumber, `❌ Grupo *${code}* não encontrado. Verifique o código e tente novamente!`);
            return new Response(JSON.stringify({ status: "ok", group_not_found: true }), {
              status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          if (group.status !== "collecting") {
            await sendWhatsAppMessage(phoneNumber, "⚠️ Este grupo já foi finalizado e não aceita novos membros.");
            return new Response(JSON.stringify({ status: "ok", group_closed: true }), {
              status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          // Check if already a member
          const { data: existingMember } = await supabase
            .from("travel_group_members")
            .select("id")
            .eq("group_id", group.id)
            .eq("phone_number", phoneNumber)
            .maybeSingle();

          if (existingMember) {
            await sendWhatsAppMessage(phoneNumber, "✅ Você já faz parte deste grupo! Se quiser refazer o questionário, mande *resultado grupo* para ver o status.");
            return new Response(JSON.stringify({ status: "ok", already_member: true }), {
              status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          await supabase.from("travel_group_members").insert({
            group_id: group.id,
            phone_number: phoneNumber,
            member_name: contactName || null,
          });

          const joinMsg = `✅ *Você entrou no grupo ${code}!*\n${group.creator_name ? `Criado por ${group.creator_name}` : ""}\n\nVou te fazer 12 perguntas rápidas sobre suas preferências de viagem! 🌍\nResponda com o número da opção escolhida.`;
          await sendWhatsAppMessage(phoneNumber, joinMsg);

          // Set group mode
          if (savedConv) {
            const existingData = (savedConv.collected_data as Record<string, any>) || {};
            await supabase.from("whatsapp_conversations").update({
              collected_data: { ...existingData, _group_mode: "questioning", _group_id: group.id, _group_step: 1, _mode_activated_at: new Date().toISOString() },
            }).eq("id", savedConv.id);

            // Mode messages NOT saved to messages_history to keep main context clean
          }

          // Send first question
          await sendWhatsAppMessage(phoneNumber, GROUP_QUESTIONS[0]);

          // Notify creator
          const { data: creatorGroup } = await supabase.from("travel_groups").select("creator_phone").eq("id", group.id).single();
          if (creatorGroup && creatorGroup.creator_phone !== phoneNumber) {
            const { data: allMembers } = await supabase.from("travel_group_members").select("id").eq("group_id", group.id);
            await sendWhatsAppMessage(creatorGroup.creator_phone, `👥 *${contactName || "Alguém"}* entrou no grupo *${code}*! (${allMembers?.length || 0} membros)`);
          }

          return new Response(JSON.stringify({ status: "ok", group_joined: code }), {
            status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // ===== MY GROUP STATUS =====
        if (myGroupRegex.test(lowerMsgGroup)) {
          await ensureConversationAndSaveMessage(phoneNumber, contactName, messageText);

          // Find groups where this phone is a member
          const { data: memberOf } = await supabase
            .from("travel_group_members")
            .select("group_id, is_ready")
            .eq("phone_number", phoneNumber);

          if (!memberOf?.length) {
            await sendWhatsAppMessage(phoneNumber, "❌ Você não faz parte de nenhum grupo de viagem.\n\nPara criar um, mande: *criar grupo*");
            return new Response(JSON.stringify({ status: "ok", no_group: true }), {
              status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          const groupId = memberOf[0].group_id;
          const { data: group } = await supabase.from("travel_groups").select("*").eq("id", groupId).single();
          const { data: allMembers } = await supabase.from("travel_group_members").select("*").eq("group_id", groupId);

          if (group && allMembers) {
            const readyCount = allMembers.filter(m => m.is_ready).length;
            const expectedCount = (group as any).expected_members || allMembers.length;
            const membersList = allMembers.map(m => {
              const status = m.is_ready ? "✅" : "⏳";
              return `${status} ${m.member_name || m.phone_number}`;
            }).join("\n");

            const groupName = group.group_name ? ` "${group.group_name}"` : "";
            const statusMsg = `👥 *Grupo${groupName} (${group.group_code})*\nStatus: ${group.status === "completed" ? "✅ Completo" : "📝 Coletando preferências"}\n\n*Membros (${allMembers.length}/${expectedCount}):*\n${membersList}\n\n${readyCount}/${expectedCount} prontos\n\n${readyCount >= expectedCount ? "Todos prontos! O resultado será gerado automaticamente! 🎉" : `⏳ Faltam ${expectedCount - readyCount} pessoa(s) para completar.`}`;
            await sendWhatsAppMessage(phoneNumber, statusMsg);
          }

          return new Response(JSON.stringify({ status: "ok", group_status: true }), {
            status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // ===== LEAVE GROUP =====
        if (leaveGroupRegex.test(lowerMsgGroup)) {
          await ensureConversationAndSaveMessage(phoneNumber, contactName, messageText);

          const { data: memberOf } = await supabase
            .from("travel_group_members")
            .select("id, group_id")
            .eq("phone_number", phoneNumber);

          if (memberOf?.length) {
            await supabase.from("travel_group_members").delete().eq("id", memberOf[0].id);
            await sendWhatsAppMessage(phoneNumber, "✅ Você saiu do grupo de viagem. Se mudar de ideia, peça o código novamente! 👋");
          } else {
            await sendWhatsAppMessage(phoneNumber, "❌ Você não faz parte de nenhum grupo.");
          }

          // Clean group mode from conversation
          const { data: convForLeave } = await supabase
            .from("whatsapp_conversations")
            .select("id, collected_data")
            .eq("phone_number", phoneNumber)
            .order("updated_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          if (convForLeave) {
            const existingData = (convForLeave.collected_data as Record<string, any>) || {};
            delete existingData._group_mode;
            delete existingData._group_id;
            delete existingData._group_step;
            await supabase.from("whatsapp_conversations").update({ collected_data: existingData }).eq("id", convForLeave.id);
          }

          return new Response(JSON.stringify({ status: "ok", group_left: true }), {
            status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // ===== RESULT GROUP =====
        if (resultGroupRegex.test(lowerMsgGroup)) {
          await ensureConversationAndSaveMessage(phoneNumber, contactName, messageText);

          const { data: memberOf } = await supabase
            .from("travel_group_members")
            .select("group_id")
            .eq("phone_number", phoneNumber);

          if (!memberOf?.length) {
            await sendWhatsAppMessage(phoneNumber, "❌ Você não faz parte de nenhum grupo de viagem.");
            return new Response(JSON.stringify({ status: "ok", no_group: true }), {
              status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          const groupId = memberOf[0].group_id;
          const { data: group } = await supabase.from("travel_groups").select("*").eq("id", groupId).single();
          const { data: allMembers } = await supabase.from("travel_group_members").select("*").eq("group_id", groupId);

          if (!group || !allMembers?.length) {
            await sendWhatsAppMessage(phoneNumber, "❌ Erro ao buscar dados do grupo.");
            return new Response(JSON.stringify({ status: "ok", group_error: true }), {
              status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          // Check if already has recommendation
          if (group.final_recommendation) {
            const cachedResult = typeof group.final_recommendation === "string" ? group.final_recommendation : JSON.stringify(group.final_recommendation);
            await sendWhatsAppMessage(phoneNumber, `🌍 *Recomendação do Grupo ${group.group_code}:*\n\n${(group.final_recommendation as any).text || cachedResult}`);
            return new Response(JSON.stringify({ status: "ok", group_cached_result: true }), {
              status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          const readyMembers = allMembers.filter(m => m.is_ready);
          if (readyMembers.length < 2) {
            await sendWhatsAppMessage(phoneNumber, `⏳ Ainda faltam membros responderem! ${readyMembers.length}/${allMembers.length} prontos.\n\nAguarde todos completarem o questionário.`);
            return new Response(JSON.stringify({ status: "ok", group_not_ready: true }), {
              status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          await sendWhatsAppMessage(phoneNumber, "🧠 *Analisando preferências do grupo...*\nIsso pode levar alguns segundos! ⏳");

          const result = await crossReferencePreferences(group, readyMembers);

          // Save result and set status to voting
          await supabase.from("travel_groups").update({
            final_recommendation: { text: result, generated_at: new Date().toISOString() },
            status: "voting",
            votes: {},
          }).eq("id", groupId);

          // Send to ALL members with voting instructions
          const header = `🌍 *Resultado do Grupo ${group.group_code}* 🎯\n\n`;
          const votingFooter = `\n\n🗳️ *HORA DE VOTAR!*\nEscolha seu destino favorito respondendo:\n👉 *votar 1* - para o 1º destino\n👉 *votar 2* - para o 2º destino\n👉 *votar 3* - para o 3º destino`;
          for (const member of allMembers) {
            try {
              await sendWhatsAppMessage(member.phone_number, header + result + votingFooter);
            } catch (err) {
              console.error(`[GROUP] Error sending result to ${member.phone_number}:`, err);
            }
          }

          return new Response(JSON.stringify({ status: "ok", group_result_sent: true }), {
            status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // ===== VOTE ON DESTINATION =====
        const voteMatch = messageText?.match(voteRegex);
        if (voteMatch) {
          const voteChoice = parseInt(voteMatch[1]);
          await ensureConversationAndSaveMessage(phoneNumber, contactName, messageText);

          // Find user's group that is in voting status
          const { data: memberOf } = await supabase
            .from("travel_group_members")
            .select("id, group_id, member_name")
            .eq("phone_number", phoneNumber);

          if (!memberOf?.length) {
            await sendWhatsAppMessage(phoneNumber, "❌ Você não faz parte de nenhum grupo.\n\nPara criar um, mande: *criar grupo*");
            return new Response(JSON.stringify({ status: "ok" }), {
              status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          // Find group in voting status
          const groupIds = memberOf.map(m => m.group_id);
          const { data: votingGroups } = await supabase
            .from("travel_groups")
            .select("*")
            .in("id", groupIds)
            .eq("status", "voting");

          if (!votingGroups?.length) {
            await sendWhatsAppMessage(phoneNumber, "⏳ Nenhum grupo em fase de votação no momento.");
            return new Response(JSON.stringify({ status: "ok" }), {
              status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          const group = votingGroups[0];
          const currentVotes = (group.votes as Record<string, number>) || {};
          const memberName = memberOf.find(m => m.group_id === group.id)?.member_name || phoneNumber;

          // Check if already voted
          if (currentVotes[phoneNumber]) {
            await sendWhatsAppMessage(phoneNumber, `✅ Você já votou no destino *${currentVotes[phoneNumber]}*!\n\nAguarde os outros membros votarem. 🗳️`);
            return new Response(JSON.stringify({ status: "ok" }), {
              status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          // Register vote
          currentVotes[phoneNumber] = voteChoice;
          await supabase.from("travel_groups").update({ votes: currentVotes }).eq("id", group.id);

          // Get all members to check if voting is complete
          const { data: allMembers } = await supabase
            .from("travel_group_members")
            .select("*")
            .eq("group_id", group.id);

          const totalMembers = allMembers?.length || 0;
          const totalVotes = Object.keys(currentVotes).length;

          await sendWhatsAppMessage(phoneNumber, `🗳️ Voto registrado: *Destino ${voteChoice}*! ✅\n\n📊 ${totalVotes}/${totalMembers} votos recebidos.`);

          // If all voted, tally and announce
          if (totalVotes >= totalMembers) {
            // Tally votes
            const tally: Record<number, { count: number; voters: string[] }> = {};
            for (const [voterPhone, choice] of Object.entries(currentVotes)) {
              const c = choice as number;
              if (!tally[c]) tally[c] = { count: 0, voters: [] };
              tally[c].count++;
              const voterName = allMembers?.find(m => m.phone_number === voterPhone)?.member_name || voterPhone;
              tally[c].voters.push(voterName);
            }

            // Find winner
            const sorted = Object.entries(tally).sort((a, b) => b[1].count - a[1].count);
            const winner = sorted[0];
            const isTie = sorted.length > 1 && sorted[0][1].count === sorted[1][1].count;

            let resultMsg = `🏆 *Resultado da Votação - Grupo ${group.group_code}* 🗳️\n\n`;
            for (const [dest, info] of sorted) {
              const bar = "🟩".repeat(info.count);
              resultMsg += `*Destino ${dest}:* ${bar} (${info.count} voto${info.count > 1 ? "s" : ""})\n`;
              resultMsg += `   👤 ${info.voters.join(", ")}\n\n`;
            }

            if (isTie) {
              resultMsg += `⚖️ *Empate!* Conversem entre vocês e decidam o destino favorito! 😄\n\n`;
            } else {
              resultMsg += `🎉 *Destino ${winner[0]} venceu com ${winner[1].count} voto${winner[1].count > 1 ? "s" : ""}!*\n\n`;
            }
            resultMsg += `Quer que eu cote esse destino para o grupo? 😊✈️\nÉ só mandar: *cotar*`;

            // Update group status
            await supabase.from("travel_groups").update({ status: "completed" }).eq("id", group.id);

            // Broadcast to all
            for (const m of (allMembers || [])) {
              try {
                await sendWhatsAppMessage(m.phone_number, resultMsg);
              } catch (err) {
                console.error(`[GROUP] Error sending vote result to ${m.phone_number}:`, err);
              }
            }
          }

          return new Response(JSON.stringify({ status: "ok", vote_registered: true }), {
            status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // ===== MY DATES (submit available date ranges) =====
        const myDatesMatch = messageText?.match(myDatesRegex);
        if (myDatesMatch) {
          const datesText = myDatesMatch[1].trim();
          await ensureConversationAndSaveMessage(phoneNumber, contactName, messageText);

          const { data: memberOf } = await supabase
            .from("travel_group_members")
            .select("id, group_id, preferences")
            .eq("phone_number", phoneNumber);

          if (!memberOf?.length) {
            await sendWhatsAppMessage(phoneNumber, "❌ Você não faz parte de nenhum grupo.\n\nPara criar um, mande: *criar grupo*");
            return new Response(JSON.stringify({ status: "ok", no_group: true }), {
              status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          const member = memberOf[0];
          const prefs = (member.preferences as Record<string, any>) || {};
          prefs.datas_disponiveis = datesText;
          await supabase.from("travel_group_members").update({ preferences: prefs }).eq("id", member.id);

          // Notify group
          const { data: group } = await supabase.from("travel_groups").select("group_code, creator_phone").eq("id", member.group_id).single();
          const confirmMsg = `📅 *Datas registradas!*\n\nSuas disponibilidades: *${datesText}*\n\nQuando todos informarem, mande *datas grupo* para encontrar a janela ideal! 📆`;
          await sendWhatsAppMessage(phoneNumber, confirmMsg);

          // Notify creator
          if (group && group.creator_phone !== phoneNumber) {
            await sendWhatsAppMessage(group.creator_phone, `📅 *${contactName || "Um membro"}* informou suas datas disponíveis no grupo *${group.group_code}*!`);
          }

          return new Response(JSON.stringify({ status: "ok", dates_submitted: true }), {
            status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // ===== GROUP DATES NEGOTIATOR =====
        if (groupDatesRegex.test(lowerMsgGroup)) {
          await ensureConversationAndSaveMessage(phoneNumber, contactName, messageText);

          const { data: memberOf } = await supabase
            .from("travel_group_members")
            .select("group_id")
            .eq("phone_number", phoneNumber);

          if (!memberOf?.length) {
            await sendWhatsAppMessage(phoneNumber, "❌ Você não faz parte de nenhum grupo.\n\nPara criar um, mande: *criar grupo*");
            return new Response(JSON.stringify({ status: "ok", no_group: true }), {
              status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          const groupId = memberOf[0].group_id;
          const { data: group } = await supabase.from("travel_groups").select("group_code").eq("id", groupId).single();
          const { data: allMembers } = await supabase.from("travel_group_members").select("member_name, phone_number, preferences").eq("group_id", groupId);

          if (!allMembers || allMembers.length < 2) {
            await sendWhatsAppMessage(phoneNumber, "⚠️ O grupo precisa de pelo menos 2 membros para negociar datas.");
            return new Response(JSON.stringify({ status: "ok", group_too_small: true }), {
              status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          // Check who has dates
          const withDates = allMembers.filter(m => (m.preferences as any)?.datas_disponiveis);
          const withoutDates = allMembers.filter(m => !(m.preferences as any)?.datas_disponiveis);

          if (withDates.length < 2) {
            const missingNames = withoutDates.map(m => m.member_name || m.phone_number).join(", ");
            await sendWhatsAppMessage(phoneNumber, `📅 *Faltam datas!*\n\nApenas ${withDates.length} membro(s) informaram datas.\n\n⏳ Faltam: ${missingNames}\n\nCada membro deve enviar:\n*minhas datas 15/06 a 30/06, 10/07 a 25/07*`);
            return new Response(JSON.stringify({ status: "ok", dates_missing: true }), {
              status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          await sendWhatsAppMessage(phoneNumber, "📅 *Negociando datas do grupo...*\nAnalisando disponibilidades! ⏳");

          const membersDatesList = allMembers.map(m => {
            const prefs = (m.preferences as any) || {};
            return `- *${m.member_name || m.phone_number}*: ${prefs.datas_disponiveis || "NÃO INFORMOU"}`;
          }).join("\n");

          const dateNegotiatorPrompt = `Você é o Téo, negociador de datas da Tomorrow Travel. Analise as disponibilidades de ${allMembers.length} membros de um grupo de viagem e encontre as melhores janelas comuns.

MEMBROS DO GRUPO "${group?.group_code || ""}":
${membersDatesList}

GERE:

1. 📊 *ANÁLISE DE DISPONIBILIDADES*
Visualize as datas de cada membro em uma linha do tempo simples.

2. ✅ *JANELAS COMUNS*
Liste TODAS as janelas onde TODOS (ou a maioria) estão disponíveis, ordenadas por:
- Maior sobreposição de membros
- Maior duração da janela

Formato: 📅 *DD/MM a DD/MM* (X dias) — ✅ X de Y membros disponíveis

3. 🏆 *MELHOR JANELA RECOMENDADA*
A janela com maior sobreposição e duração ideal (5-10 dias para viagem).

4. ⚠️ *CONFLITOS*
Se alguém não pode em nenhuma janela comum, sugira alternativas ou compromissos.

5. 💡 *SUGESTÃO*
Considere feriados nacionais (brasileiros) e alta temporada para sugerir a melhor data.

REGRAS:
- Formato WhatsApp com *negrito* e emojis
- Máximo 3000 caracteres
- Se um membro não informou datas, destaque que falta a informação
- Considere o ano atual: ${new Date().getFullYear()}
- No final: "Quer que eu cote a viagem para a melhor data? É só pedir! 😊✈️"`;

          try {
            const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${LOVABLE_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "google/gemini-2.5-flash",
                messages: [
                  { role: "system", content: dateNegotiatorPrompt },
                  { role: "user", content: "Analise as disponibilidades e encontre as melhores janelas comuns." },
                ],
                max_tokens: 4000,
              }),
            });

            if (!response.ok) {
              console.error("[GROUP-DATES] AI error:", response.status);
              await sendWhatsAppMessage(phoneNumber, "😅 Erro ao analisar datas. Tente novamente!");
            } else {
              const data = await response.json();
              const dateResult = data.choices?.[0]?.message?.content || "Erro ao processar datas.";

              // Save to group
              await supabase.from("travel_groups").update({
                travel_dates: dateResult.substring(0, 500),
              }).eq("id", groupId);

              // Send to all members
              const header = `📅 *Negociação de Datas — Grupo ${group?.group_code || ""}* 📆\n\n`;
              for (const m of allMembers) {
                try {
                  if ((dateResult.length + header.length) > 4000) {
                    const fullMsg = header + dateResult;
                    const mid = fullMsg.lastIndexOf("\n", 3900);
                    await sendWhatsAppMessage(m.phone_number, fullMsg.substring(0, mid > 0 ? mid : 3900));
                    await sendWhatsAppMessage(m.phone_number, fullMsg.substring(mid > 0 ? mid : 3900));
                  } else {
                    await sendWhatsAppMessage(m.phone_number, header + dateResult);
                  }
                } catch (err) {
                  console.error(`[GROUP-DATES] Error sending to ${m.phone_number}:`, err);
                }
              }
            }
          } catch (err) {
            console.error("[GROUP-DATES] Error:", err);
            await sendWhatsAppMessage(phoneNumber, "😅 Erro ao processar. Tente novamente!");
          }

          return new Response(JSON.stringify({ status: "ok", group_dates_negotiated: true }), {
            status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        {
          const { data: convForGroup } = await supabase
            .from("whatsapp_conversations")
            .select("id, collected_data, messages_history")
            .eq("phone_number", phoneNumber)
            .order("updated_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (convForGroup) {
            const gData = (convForGroup.collected_data as Record<string, any>) || {};
            const groupMode = gData._group_mode;

            // ===== CHOOSE EXISTING OR NEW GROUP =====
            if (groupMode === "choose_existing_or_new") {
              await ensureConversationAndSaveMessage(phoneNumber, contactName, messageText);
              const answer = (messageText || "").trim();
              const activeGroupsList = gData._active_groups || [];
              const choiceNum = parseInt(answer);

              if (!isNaN(choiceNum) && choiceNum >= 1 && choiceNum <= activeGroupsList.length) {
                // User chose an existing group — show its status
                const chosenGroup = activeGroupsList[choiceNum - 1];
                const { data: group } = await supabase
                  .from("travel_groups")
                  .select("id, group_code, group_name, status, expected_members, creator_phone, travel_dates, budget_range")
                  .eq("id", chosenGroup.id)
                  .maybeSingle();

                if (group) {
                  const { data: members } = await supabase
                    .from("travel_group_members")
                    .select("id, phone_number, member_name, is_ready, preferences")
                    .eq("group_id", group.id);

                  const totalMembers = members?.length || 0;
                  const readyMembers = members?.filter(m => m.is_ready)?.length || 0;
                  const membersList = (members || []).map(m => `  ${m.is_ready ? "✅" : "⏳"} ${m.member_name || m.phone_number}`).join("\n");

                  const statusMsg = `📊 *Grupo "${group.group_name || "Sem nome"}"*\n\n📋 Código: *${group.group_code}*\n👥 Membros: ${totalMembers}/${group.expected_members || "?"}\n✅ Prontos: ${readyMembers}/${totalMembers}\n\n*Participantes:*\n${membersList}\n\n📲 Link para convidar:\nhttps://wa.me/5515991833448?text=${encodeURIComponent(`entrar grupo ${group.group_code}`)}\n\n${readyMembers === totalMembers && totalMembers >= 2 ? "🎉 *Todos prontos!* Mande *resultado grupo* para ver as sugestões!" : `⏳ Aguardando ${totalMembers - readyMembers} membro(s) responder o questionário.`}`;
                  await sendWhatsAppMessage(phoneNumber, statusMsg);
                }

                // Clear ALL group flags
                const cleanGData = { ...gData };
                delete cleanGData._group_mode;
                delete cleanGData._group_id;
                delete cleanGData._group_name;
                delete cleanGData._group_expected;
                delete cleanGData._active_groups;
                await supabase.from("whatsapp_conversations").update({
                  collected_data: cleanGData,
                }).eq("id", convForGroup.id);

                return new Response(JSON.stringify({ status: "ok", group_existing_chosen: true }), {
                  status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
              } else if (choiceNum === activeGroupsList.length + 1 || /novo|criar|new/i.test(answer)) {
                // User wants to create a new group — go to setup_name
                await supabase.from("whatsapp_conversations").update({
                  collected_data: { ...gData, _group_mode: "setup_name", _active_groups: null },
                }).eq("id", convForGroup.id);

                const askNameMsg = "🎉 *Novo grupo!*\n\n📝 *Como quer chamar o grupo?*\n\n(Ex: Viagem da Galera, Férias 2026, Amigos SP...)";
                await sendWhatsAppMessage(phoneNumber, askNameMsg);

                return new Response(JSON.stringify({ status: "ok", group_create_new: true }), {
                  status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
              } else {
                // Invalid answer
                await sendWhatsAppMessage(phoneNumber, `⚠️ Responda com um número de *1* a *${activeGroupsList.length + 1}*.`);
                return new Response(JSON.stringify({ status: "ok", group_invalid_choice: true }), {
                  status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
              }
            }

            // ===== SETUP STEP 1: Receive group name =====
            if (groupMode === "setup_name") {
              await ensureConversationAndSaveMessage(phoneNumber, contactName, messageText);
              const groupName = (messageText || "").trim();
              
              await supabase.from("whatsapp_conversations").update({
                collected_data: { ...gData, _group_mode: "setup_count", _group_name: groupName },
              }).eq("id", convForGroup.id);

              const askCountMsg = `✅ Grupo *"${groupName}"*! Ótimo nome! 🎉\n\n👥 *Quantas pessoas vão participar?*\n(incluindo você)\n\nExemplo: 4`;
              await sendWhatsAppMessage(phoneNumber, askCountMsg);

              return new Response(JSON.stringify({ status: "ok", group_setup_name: true }), {
                status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
              });
            }

            // ===== SETUP STEP 2: Receive member count =====
            if (groupMode === "setup_count") {
              await ensureConversationAndSaveMessage(phoneNumber, contactName, messageText);
              const count = parseInt((messageText || "").trim());
              
              if (isNaN(count) || count < 2 || count > 30) {
                await sendWhatsAppMessage(phoneNumber, "⚠️ Informe um número válido entre 2 e 30.");
                return new Response(JSON.stringify({ status: "ok", group_setup_invalid_count: true }), {
                  status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
              }

              // Now create the group in the database
              let groupCode = generateGroupCode();
              let attempts = 0;
              while (attempts < 5) {
                const { data: existing } = await supabase.from("travel_groups").select("id").eq("group_code", groupCode).maybeSingle();
                if (!existing) break;
                groupCode = generateGroupCode();
                attempts++;
              }

              const groupName = gData._group_name || "Grupo de Viagem";
              const { data: newGroup, error: groupErr } = await supabase
                .from("travel_groups")
                .insert({
                  group_code: groupCode,
                  creator_phone: phoneNumber,
                  creator_name: contactName || null,
                  group_name: groupName,
                  expected_members: count,
                })
                .select("id")
                .single();

              if (groupErr || !newGroup) {
                console.error("[GROUP] Error creating group:", groupErr);
                await sendWhatsAppMessage(phoneNumber, "😅 Erro ao criar o grupo. Tente novamente!");
                return new Response(JSON.stringify({ status: "ok", group_error: true }), {
                  status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
              }

              // Add creator as first member
              await supabase.from("travel_group_members").insert({
                group_id: newGroup.id,
                phone_number: phoneNumber,
                member_name: contactName || null,
              });

              const inviteLink = `https://wa.me/5515991833448?text=${encodeURIComponent(`entrar grupo ${groupCode}`)}`;
              const createMsg = `🎉 *Grupo "${groupName}" criado!*\n\n👥 ${count} participantes esperados\n📋 Código: *${groupCode}*\n\n📲 Compartilhe este link com seus amigos:\n${inviteLink}\n\nOu peça para mandarem:\n👉 *entrar grupo ${groupCode}*\n\nQuando todos responderem o questionário, eu cruzo as preferências e sugiro o destino perfeito! 🌍✈️\n\n*Posso começar o seu questionário agora?* 😊\n(Responda *sim* para começar)`;
              await sendWhatsAppMessage(phoneNumber, createMsg);

              await supabase.from("whatsapp_conversations").update({
                collected_data: { ...gData, _group_mode: "setup_confirm", _group_id: newGroup.id, _group_name: groupName, _group_expected: count },
              }).eq("id", convForGroup.id);

              return new Response(JSON.stringify({ status: "ok", group_created: groupCode }), {
                status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
              });
            }

            // ===== SETUP STEP 3: Creator confirms to start questionnaire =====
            if (groupMode === "setup_confirm") {
              await ensureConversationAndSaveMessage(phoneNumber, contactName, messageText);
              const answer = (messageText || "").toLowerCase().trim();
              const isYes = ["sim", "s", "yes", "pode", "bora", "vamos", "quero", "ok", "claro", "com certeza", "manda", "1"].includes(answer);

              if (isYes) {
                await supabase.from("whatsapp_conversations").update({
                  collected_data: { ...gData, _group_mode: "questioning", _group_step: 1, _mode_activated_at: new Date().toISOString() },
                }).eq("id", convForGroup.id);

                await sendWhatsAppMessage(phoneNumber, "🚀 *Vamos lá!* Vou te fazer 12 perguntas rápidas para encontrar o destino perfeito pro grupo!\n\n");
                await sendWhatsAppMessage(phoneNumber, GROUP_QUESTIONS[0]);
              } else {
                await sendWhatsAppMessage(phoneNumber, "👍 Sem problema! Quando quiser começar, mande *sim*.\n\nSeus amigos podem entrar pelo link que enviei! 📲");
              }

              return new Response(JSON.stringify({ status: "ok", group_setup_confirm: true }), {
                status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
              });
            }

            // ===== QUESTIONING: Handle answers (7 steps) =====
            if (groupMode === "questioning" && gData._group_id && gData._group_step) {
              const step = parseInt(gData._group_step);
              const groupId = gData._group_id;

              if (step >= 1 && step <= 12) {
                const prefKey = PREF_KEYS[step - 1];
                const { data: member } = await supabase
                  .from("travel_group_members")
                  .select("id, preferences")
                  .eq("group_id", groupId)
                  .eq("phone_number", phoneNumber)
                  .maybeSingle();

                if (member) {
                  const prefs = (member.preferences as Record<string, any>) || {};
                  // Free-text steps: 10 (datas) and 12 (ocasião especial)
                  const isFreeText = step === 10 || step === 12;
                  let answerValue = (messageText || "").trim();
                  if (!isFreeText && PREF_OPTIONS[prefKey]) {
                    const num = parseInt(answerValue);
                    if (!isNaN(num) && num >= 1 && num <= PREF_OPTIONS[prefKey].length) {
                      answerValue = PREF_OPTIONS[prefKey][num - 1];
                    }
                  }
                  prefs[prefKey] = answerValue;
                  await supabase.from("travel_group_members").update({ preferences: prefs }).eq("id", member.id);
                }

                await ensureConversationAndSaveMessage(phoneNumber, contactName, messageText);

                if (step < 12) {
                  const nextStep = step + 1;
                  await supabase.from("whatsapp_conversations").update({
                    collected_data: { ...gData, _group_step: nextStep, _mode_activated_at: new Date().toISOString() },
                  }).eq("id", convForGroup.id);

                  await sendWhatsAppMessage(phoneNumber, GROUP_QUESTIONS[nextStep - 1]);
                } else {
                  // All 12 questions answered — mark as ready
                  await supabase.from("travel_group_members").update({ is_ready: true })
                    .eq("group_id", groupId)
                    .eq("phone_number", phoneNumber);

                  // Clear ALL group mode flags to prevent context pollution
                  const cleanData = { ...gData };
                  delete cleanData._group_mode;
                  delete cleanData._group_step;
                  delete cleanData._group_id;
                  delete cleanData._group_name;
                  delete cleanData._group_expected;
                  delete cleanData._active_groups;
                  await supabase.from("whatsapp_conversations").update({
                    collected_data: cleanData,
                  }).eq("id", convForGroup.id);

                  // Check if all expected members are ready
                  const { data: allMembers } = await supabase.from("travel_group_members").select("*").eq("group_id", groupId);
                  const { data: group } = await supabase.from("travel_groups").select("*").eq("id", groupId).single();
                  
                  if (allMembers && group) {
                    const readyCount = allMembers.filter(m => m.is_ready).length;
                    const expectedCount = (group as any).expected_members || allMembers.length;
                    
                    // Notify creator
                    if (group.creator_phone !== phoneNumber) {
                      await sendWhatsAppMessage(group.creator_phone, `✅ *${contactName || "Um membro"}* completou o questionário! (${readyCount}/${expectedCount} prontos)`);
                    }

                    // Auto-trigger if ready count matches expected_members
                    if (readyCount >= expectedCount && readyCount >= 2) {
                      await sendWhatsAppMessage(phoneNumber, "✅ *Pronto!* Suas preferências foram registradas! 🎉");

                      // Notify all that results are being generated
                      for (const m of allMembers) {
                        try {
                          await sendWhatsAppMessage(m.phone_number, "🎉 *Todos responderam!*\n🧠 Analisando preferências do grupo...");
                        } catch (err) {
                          console.error(`[GROUP] Error notifying ${m.phone_number}:`, err);
                        }
                      }

                      const readyMembers = allMembers.filter(m => m.is_ready);
                      const result = await crossReferencePreferences(group, readyMembers);

                      await supabase.from("travel_groups").update({
                        final_recommendation: { text: result, generated_at: new Date().toISOString() },
                        status: "voting",
                        votes: {},
                      }).eq("id", groupId);

                      const header = `🌍 *Resultado do Grupo ${group.group_code}* 🎯\n\n`;
                      const votingFooter = `\n\n🗳️ *HORA DE VOTAR!*\nEscolha seu destino favorito respondendo:\n👉 *votar 1* - para o 1º destino\n👉 *votar 2* - para o 2º destino\n👉 *votar 3* - para o 3º destino`;
                      for (const m of allMembers) {
                        try {
                          await sendWhatsAppMessage(m.phone_number, header + result + votingFooter);
                        } catch (err) {
                          console.error(`[GROUP] Error sending result to ${m.phone_number}:`, err);
                        }
                      }
                    } else {
                      await sendWhatsAppMessage(phoneNumber, `✅ *Pronto!* Suas preferências foram registradas! 🎉\n\n⏳ Faltam *${expectedCount - readyCount}* pessoa(s) para completar o grupo.\n\nPara ver o status: *meu grupo*`);
                    }
                  }
                }

                return new Response(JSON.stringify({ status: "ok", group_questionnaire: step }), {
                  status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
              }
            }
          }
        }

        // ===== GROUP COMPATIBILITY PANEL (DNA cruzado) =====
        const groupCompatRegex = /^(compatibilidade grupo|dna grupo|mapa do grupo|group compatibility|group dna)$/i;
        if (groupCompatRegex.test(lowerMsgGroup)) {
          const savedConv = await ensureConversationAndSaveMessage(phoneNumber, contactName, messageText);

          const { data: memberOf } = await supabase
            .from("travel_group_members")
            .select("group_id")
            .eq("phone_number", phoneNumber);

          if (!memberOf?.length) {
            await sendWhatsAppMessage(phoneNumber, "❌ Você não faz parte de nenhum grupo de viagem.\n\nPara criar um, mande: *criar grupo*");
            return new Response(JSON.stringify({ status: "ok", no_group: true }), {
              status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          const groupId = memberOf[0].group_id;
          const { data: group } = await supabase.from("travel_groups").select("*").eq("id", groupId).single();
          const { data: allMembers } = await supabase.from("travel_group_members").select("*").eq("group_id", groupId);

          if (!group || !allMembers || allMembers.length < 2) {
            await sendWhatsAppMessage(phoneNumber, "⚠️ O grupo precisa ter pelo menos 2 membros para gerar o mapa de compatibilidade.");
            return new Response(JSON.stringify({ status: "ok", group_too_small: true }), {
              status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          const membersWithDna: Array<{ name: string; phone: string; dna: any; prefs: any }> = [];
          for (const m of allMembers) {
            const { data: memory } = await supabase
              .from("client_memory")
              .select("preferences, client_name")
              .eq("whatsapp", m.phone_number)
              .maybeSingle();

            const dna = (memory?.preferences as any)?.dna_viajante || null;
            membersWithDna.push({
              name: m.member_name || memory?.client_name || m.phone_number,
              phone: m.phone_number,
              dna,
              prefs: m.preferences || {},
            });
          }

          await sendWhatsAppMessage(phoneNumber, "🧬 *Analisando DNAs do grupo...*\nIsso pode levar alguns segundos! ⏳");

          const membersInfo = membersWithDna.map(m => {
            const dnaStr = m.dna
              ? `DNA: 🏔️Explorador ${m.dna.explorador || 0}% | 🏛️Culturalista ${m.dna.culturalista || 0}% | 🍽️Gourmet ${m.dna.gourmet || 0}% | 🧘Zen ${m.dna.zen || 0}% | 🎉Socialite ${m.dna.socialite || 0}%`
              : `DNA: não fez o teste. Preferências: estilo=${m.prefs.estilo || "?"}, clima=${m.prefs.clima || "?"}`;
            return `- *${m.name}*: ${dnaStr}`;
          }).join("\n");

          const compatPrompt = `Você é um especialista em compatibilidade de viagens da Tomorrow Travel.

MEMBROS DO GRUPO "${group.group_code}" (${membersWithDna.length} pessoas):
${membersInfo}

GERE:

1. 📊 *MATRIZ DE COMPATIBILIDADE*
Para CADA PAR de membros, calcule um score de 0-100% e uma breve justificativa.
Formato: 👫 *Nome1 × Nome2*: XX% — "justificativa curta"

2. 🧬 *DNA COLETIVO DO GRUPO*
Calcule a média ponderada dos perfis e apresente o "DNA do grupo" com as 5 categorias.

3. ⚡ *PONTOS DE CONFLITO*
Identifique onde há divergência forte.

4. 🤝 *PONTOS DE CONVERGÊNCIA*
O que todo mundo tem em comum.

5. 🏆 *TOP 3 DESTINOS IDEAIS*
Destinos que maximizam a compatibilidade do grupo, com score.

REGRAS:
- Formato WhatsApp com *negrito* e emojis
- Máximo 3500 caracteres
- Se alguém não fez o DNA, use as preferências do questionário do Modo Galera
- Destinos REAIS e específicos
- No final: "Quer que eu cote algum desses destinos? 😊✈️"`;

          try {
            const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${LOVABLE_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "google/gemini-2.5-flash",
                messages: [
                  { role: "system", content: compatPrompt },
                  { role: "user", content: "Gere o painel completo de compatibilidade do grupo." },
                ],
                max_tokens: 4000,
              }),
            });

            if (!response.ok) {
              await sendWhatsAppMessage(phoneNumber, "😅 Erro ao gerar o painel. Tente novamente!");
            } else {
              const data = await response.json();
              const result = data.choices?.[0]?.message?.content || "Não consegui gerar o painel.";
              const header = `🧬 *Painel de Compatibilidade — Grupo ${group.group_code}* 🎯\n\n`;
              if ((header + result).length > 4000) {
                const mid = result.lastIndexOf("\n", 3500);
                await sendWhatsAppMessage(phoneNumber, header + result.substring(0, mid > 0 ? mid : 3500));
                await sendWhatsAppMessage(phoneNumber, result.substring(mid > 0 ? mid : 3500));
              } else {
                await sendWhatsAppMessage(phoneNumber, header + result);
              }
            }
          } catch (err) {
            console.error("[GROUP-COMPAT] Error:", err);
            await sendWhatsAppMessage(phoneNumber, "😅 Erro ao processar. Tente novamente!");
          }

          return new Response(JSON.stringify({ status: "ok", group_compat: true }), {
            status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // ===== ANONYMOUS MEDIATOR CHAT =====
        const mediatorActivateRegex = /^(mediador|modo mediador|mediator|ativar mediador|chat anonimo|chat anônimo)$/i;
        const mediatorDeactivateRegex = /^(sair mediador|desativar mediador|sair do mediador)$/i;
        const anonMsgRegex = /^mensagem\s+an[oô]nima\s+(.+)$/is;

        if (mediatorActivateRegex.test(lowerMsgGroup)) {
          const savedConv = await ensureConversationAndSaveMessage(phoneNumber, contactName, messageText);

          const { data: memberOf } = await supabase
            .from("travel_group_members")
            .select("group_id")
            .eq("phone_number", phoneNumber);

          if (!memberOf?.length) {
            await sendWhatsAppMessage(phoneNumber, "❌ Você precisa estar em um grupo para usar o mediador.\n\nCrie um com: *criar grupo*");
            return new Response(JSON.stringify({ status: "ok", no_group: true }), {
              status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          const groupId = memberOf[0].group_id;
          const { data: group } = await supabase.from("travel_groups").select("group_code").eq("id", groupId).single();

          if (savedConv) {
            const existingData = (savedConv.collected_data as Record<string, any>) || {};
            await supabase.from("whatsapp_conversations").update({
              collected_data: { ...existingData, _mediator_mode: true, _mediator_group_id: groupId },
            }).eq("id", savedConv.id);
          }

          const activateMsg = `🎭 *Modo Mediador Ativado — Grupo ${group?.group_code}*\n\nAgora você pode enviar mensagens anônimas para o grupo!\n\nComo usar:\n👉 *mensagem anonima* seguido do texto\n\nExemplo:\n_mensagem anonima Acho que o orçamento tá alto_\n\nO Téo repassa para todos sem revelar quem mandou. 🤫\n\nPara sair: *sair mediador*`;
          await sendWhatsAppMessage(phoneNumber, activateMsg);

          return new Response(JSON.stringify({ status: "ok", mediator_activated: true }), {
            status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (mediatorDeactivateRegex.test(lowerMsgGroup)) {
          const savedConv = await ensureConversationAndSaveMessage(phoneNumber, contactName, messageText);
          if (savedConv) {
            const existingData = (savedConv.collected_data as Record<string, any>) || {};
            delete existingData._mediator_mode;
            delete existingData._mediator_group_id;
            await supabase.from("whatsapp_conversations").update({
              collected_data: existingData,
            }).eq("id", savedConv.id);
          }

          await sendWhatsAppMessage(phoneNumber, "✅ Modo Mediador desativado! Voltei ao modo normal. 😊");
          return new Response(JSON.stringify({ status: "ok", mediator_deactivated: true }), {
            status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const anonMatch = (messageText || "").match(anonMsgRegex);
        if (anonMatch) {
          const anonContent = anonMatch[1].trim();
          await ensureConversationAndSaveMessage(phoneNumber, contactName, messageText);

          const { data: memberOf } = await supabase
            .from("travel_group_members")
            .select("group_id")
            .eq("phone_number", phoneNumber);

          if (!memberOf?.length) {
            await sendWhatsAppMessage(phoneNumber, "❌ Você precisa estar em um grupo para enviar mensagens anônimas.");
            return new Response(JSON.stringify({ status: "ok", no_group: true }), {
              status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          const groupId = memberOf[0].group_id;
          const { data: group } = await supabase.from("travel_groups").select("group_code").eq("id", groupId).single();
          const { data: allMembers } = await supabase.from("travel_group_members").select("phone_number, member_name").eq("group_id", groupId);

          if (!allMembers || allMembers.length < 2) {
            await sendWhatsAppMessage(phoneNumber, "⚠️ O grupo precisa ter pelo menos 2 membros.");
            return new Response(JSON.stringify({ status: "ok", group_too_small: true }), {
              status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          const anonMsg = `🎭 *Mensagem Anônima*\n*Grupo ${group?.group_code || "?"}*\n\n💬 _"${anonContent}"_\n\n_Para responder anonimamente: mensagem anonima [texto]_`;
          let sentCount = 0;
          for (const m of allMembers) {
            if (m.phone_number === phoneNumber) continue;
            try {
              await sendWhatsAppMessage(m.phone_number, anonMsg);
              sentCount++;
              await new Promise(r => setTimeout(r, 500));
            } catch (err) {
              console.error(`[MEDIATOR] Error sending to ${m.phone_number}:`, err);
            }
          }

          await sendWhatsAppMessage(phoneNumber, `✅ Sua mensagem anônima foi enviada para *${sentCount}* membro(s) do grupo! 🤫`);

          return new Response(JSON.stringify({ status: "ok", anon_msg_sent: true, recipients: sentCount }), {
            status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      // ========== TÉO DNA DE VIAJANTE: Deep Traveler Genetic Profile ==========
      {
        const lowerMsgDna = (messageText || "").toLowerCase().trim();
        const dnaActivateRegex = /^(meu dna|dna viajante|teste dna|dna de viajante|perfil viajante|traveler dna)$/i;

        const DNA_QUESTIONS = [
          "🧬 *Teste DNA de Viajante*\n\nVou te fazer 10 perguntas pra descobrir seu perfil genético de viajante! 🌍\n\n1️⃣ Numa viagem perfeita, você acorda e...\n\n🅰️ Escala uma montanha ao amanhecer\n🅱️ Toma café da manhã tranquilo com vista\n🅲️ Vai direto pro mercado local provar comidas\n🅳️ Dorme até tarde e curte o hotel",
          "2️⃣ O que te faz escolher um destino?\n\n🅰️ Aventuras e adrenalina\n🅱️ Cultura, história e arquitetura\n🅲️ Gastronomia e vinhos\n🅳️ Praias e natureza\n🅴️ Festas e vida noturna",
          "3️⃣ Seu orçamento de viagem é pra...\n\n🅰️ Experiências únicas (saltar de paraquedas, mergulhar)\n🅱️ Hotel/resort de qualidade\n🅲️ Restaurantes incríveis\n🅳️ Compras e souvenirs\n🅴️ Equilíbrio entre tudo",
          "4️⃣ Quando você volta de viagem, o que mais conta pros amigos?\n\n🅰️ As aventuras radicais\n🅱️ As histórias e curiosidades do lugar\n🅲️ Os pratos que comeu\n🅳️ Os momentos de paz e descanso\n🅴️ As festas e as pessoas que conheceu",
          "5️⃣ Numa trilha, você...\n\n🅰️ Corre na frente, quer chegar ao topo primeiro\n🅱️ Para pra ler cada placa informativa\n🅲️ Leva snacks e para pra fazer piquenique no caminho\n🅳️ Prefere uma trilha leve com paisagem bonita\n🅴️ Só faz trilha se tiver grupo animado",
          "6️⃣ Seu estilo de hospedagem ideal:\n\n🅰️ Camping, hostel, qualquer lugar com história\n🅱️ Hotel boutique ou pousada charmosa\n🅲️ Onde tiver a melhor comida por perto\n🅳️ Resort all-inclusive com spa\n🅴️ Airbnb no centro da balada",
          "7️⃣ Fim de tarde na viagem, você...\n\n🅰️ Faz rapel, caiaque ou algum esporte\n🅱️ Visita um museu ou ruína histórica\n🅲️ Faz um tour gastronômico ou aula de culinária\n🅳️ Assiste o pôr do sol com um drink\n🅴️ Se arruma pro happy hour",
          "8️⃣ Qual frase mais combina com você?\n\n🅰️ \"Adrenalina é meu combustível\"\n🅱️ \"Viajar é aprender\"\n🅲️ \"A comida conta a história de um povo\"\n🅳️ \"Preciso recarregar as energias\"\n🅴️ \"A melhor viagem é com boa companhia\"",
          "9️⃣ Se pudesse ganhar um presente de viagem:\n\n🅰️ Salto de bungee jump na Nova Zelândia\n🅱️ Tour privativo pelo Vaticano\n🅲️ Jantar num restaurante 3 estrelas Michelin\n🅳️ Uma semana num overwater bungalow em Maldivas\n🅴️ VIP num festival de música em Ibiza",
          "🔟 *Última!* Sua viagem dos sonhos tem:\n\n🅰️ Montanhas, trilhas e natureza selvagem\n🅱️ Cidades históricas e templos antigos\n🅲️ Mercados, street food e vinícolas\n🅳️ Praias paradisíacas e spa\n🅴️ Baladas, rooftops e energia urbana",
        ];

        const DNA_CATEGORIES = {
          A: "Explorador",
          B: "Culturalista",
          C: "Gourmet",
          D: "Zen",
          E: "Socialite",
        };

        // Generate DNA profile via AI
        const generateDnaProfile = async (answers: string[], clientName: string): Promise<string> => {
          const answersText = answers.map((a, i) => `Pergunta ${i + 1}: ${a}`).join("\n");

          const dnaPrompt = `Você é um cientista de viagens da Tomorrow Travel. Analise as respostas de um questionário de 10 perguntas e gere o "DNA de Viajante" — um perfil genético lúdico e personalizado.

RESPOSTAS DO CLIENTE (${clientName || "Viajante"}):
${answersText}

CATEGORIAS DO DNA (calcule a porcentagem de cada uma baseado nas respostas, total = 100%):
🏔️ Explorador (aventura, adrenalina, natureza selvagem)
🏛️ Culturalista (história, museus, arquitetura, aprendizado)
🍽️ Gourmet (gastronomia, vinhos, experiências culinárias)
🧘 Zen (relaxamento, praias, spas, paz interior)
🎉 Socialite (festas, vida noturna, experiências sociais)

GERE O PERFIL NO FORMATO ABAIXO (formato WhatsApp com emojis):

🧬 *DNA DE VIAJANTE*
*[NOME]*

━━━━━━━━━━━━━━━━━━

🏔️ Explorador: XX%
${"▓".repeat(5)}░░░░░
🏛️ Culturalista: XX%
${"▓".repeat(3)}░░░░░░░
🍽️ Gourmet: XX%
${"▓".repeat(4)}░░░░░░
🧘 Zen: XX%
${"▓".repeat(2)}░░░░░░░░
🎉 Socialite: XX%
${"▓".repeat(1)}░░░░░░░░░

━━━━━━━━━━━━━━━━━━

🏆 *Tipo Dominante:* [A categoria com maior %]
🎭 *Subtipo:* [Combinação criativa das 2 maiores, ex: "Explorador Gourmet", "Zen Culturalista"]

📝 *Perfil:*
[2-3 frases descritivas do perfil, escritas de forma pessoal e divertida]

🌍 *Destinos Perfeitos pro seu DNA:*
1. [Destino específico] — [por que combina]
2. [Destino específico] — [por que combina]
3. [Destino específico] — [por que combina]

💡 *Dica do Téo:* [Uma dica personalizada baseada no perfil]

REGRAS:
- Use barras de progresso com ▓ e ░ (total 10 blocos por barra)
- As porcentagens devem somar 100%
- Destinos devem ser específicos (não "Europa", mas "Toscana, Itália")
- O perfil deve ser divertido, pessoal e preciso
- Máximo 3000 caracteres
- Inclua no final: "Seu DNA evolui a cada viagem! 🧬✈️"`;

          try {
            const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${LOVABLE_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "google/gemini-2.5-flash",
                messages: [
                  { role: "system", content: dnaPrompt },
                  { role: "user", content: "Gere o DNA de Viajante baseado nas respostas." },
                ],
                max_tokens: 4000,
              }),
            });

            if (!response.ok) {
              console.error("[DNA] AI error:", response.status);
              return "😅 Não consegui gerar seu DNA agora. Tente novamente em alguns minutos!";
            }

            const data = await response.json();
            return data.choices?.[0]?.message?.content || "Erro ao gerar DNA.";
          } catch (err) {
            console.error("[DNA] Error:", err);
            return "😅 Erro ao processar seu DNA de viajante.";
          }
        };

        // ===== ACTIVATE DNA TEST =====
        if (dnaActivateRegex.test(lowerMsgDna)) {
          const savedConv = await ensureConversationAndSaveMessage(phoneNumber, contactName, messageText);

          if (savedConv) {
            const existingData = (savedConv.collected_data as Record<string, any>) || {};
            await supabase.from("whatsapp_conversations").update({
              collected_data: { ...existingData, _dna_mode: "questioning", _dna_step: 1, _dna_answers: [], _mode_activated_at: new Date().toISOString() },
            }).eq("id", savedConv.id);

            // Mode messages NOT saved to messages_history to keep main context clean
          }

          await sendWhatsAppMessage(phoneNumber, DNA_QUESTIONS[0]);

          return new Response(JSON.stringify({ status: "ok", dna_started: true }), {
            status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // ===== DNA QUESTIONNAIRE (in-progress) =====
        {
          const { data: convForDna } = await supabase
            .from("whatsapp_conversations")
            .select("id, collected_data, messages_history, client_name")
            .eq("phone_number", phoneNumber)
            .order("updated_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (convForDna) {
            const dnaData = (convForDna.collected_data as Record<string, any>) || {};
            if (dnaData._dna_mode === "questioning" && dnaData._dna_step) {
              const step = parseInt(dnaData._dna_step);
              const answers: string[] = Array.isArray(dnaData._dna_answers) ? dnaData._dna_answers : [];

              if (step >= 1 && step <= 10) {
                // Save answer
                answers.push(messageText?.trim() || "");
                await ensureConversationAndSaveMessage(phoneNumber, contactName, messageText);

                if (step < 10) {
                  // Next question
                  const nextStep = step + 1;
                  await supabase.from("whatsapp_conversations").update({
                    collected_data: { ...dnaData, _dna_step: nextStep, _dna_answers: answers, _mode_activated_at: new Date().toISOString() },
                  }).eq("id", convForDna.id);

                  await sendWhatsAppMessage(phoneNumber, DNA_QUESTIONS[nextStep - 1]);
                } else {
                  // All 10 answered — generate DNA profile
                  await sendWhatsAppMessage(phoneNumber, "🧬 *Analisando seu DNA de viajante...*\nIsso pode levar alguns segundos! ⏳");

                  // Clear DNA mode
                  const cleanData = { ...dnaData };
                  delete cleanData._dna_mode;
                  delete cleanData._dna_step;
                  delete cleanData._dna_answers;
                  await supabase.from("whatsapp_conversations").update({
                    collected_data: cleanData,
                  }).eq("id", convForDna.id);

                  const clientNameForDna = convForDna.client_name || contactName || "Viajante";
                  const dnaResult = await generateDnaProfile(answers, clientNameForDna);

                  // Save DNA to client_memory
                  try {
                    const memory = await fetchClientMemory(supabase, phoneNumber);
                    const mergedPrefs = { ...(memory?.preferences || {}) };

                    // Parse percentages from the result
                    const dnaProfile: Record<string, any> = { raw_result: dnaResult, generated_at: new Date().toISOString(), answers };
                    const explorerMatch = dnaResult.match(/Explorador:\s*(\d+)%/);
                    const culturalMatch = dnaResult.match(/Culturalista:\s*(\d+)%/);
                    const gourmetMatch = dnaResult.match(/Gourmet:\s*(\d+)%/);
                    const zenMatch = dnaResult.match(/Zen:\s*(\d+)%/);
                    const socialiteMatch = dnaResult.match(/Socialite:\s*(\d+)%/);
                    if (explorerMatch) dnaProfile.explorador = parseInt(explorerMatch[1]);
                    if (culturalMatch) dnaProfile.culturalista = parseInt(culturalMatch[1]);
                    if (gourmetMatch) dnaProfile.gourmet = parseInt(gourmetMatch[1]);
                    if (zenMatch) dnaProfile.zen = parseInt(zenMatch[1]);
                    if (socialiteMatch) dnaProfile.socialite = parseInt(socialiteMatch[1]);

                    // Track DNA evolution history
                    const dnaHistory = Array.isArray(mergedPrefs.dna_historico) ? mergedPrefs.dna_historico : [];
                    dnaHistory.push({
                      data: new Date().toISOString().split("T")[0],
                      explorador: dnaProfile.explorador || 0,
                      culturalista: dnaProfile.culturalista || 0,
                      gourmet: dnaProfile.gourmet || 0,
                      zen: dnaProfile.zen || 0,
                      socialite: dnaProfile.socialite || 0,
                    });
                    mergedPrefs.dna_viajante = dnaProfile;
                    mergedPrefs.dna_historico = dnaHistory.slice(-10);

                    const normalizedWhatsapp = phoneNumber.replace(/\D/g, "");
                    const whatsappForDb = normalizedWhatsapp.startsWith("55") ? normalizedWhatsapp : `55${normalizedWhatsapp}`;

                    if (memory) {
                      await supabase.from("client_memory").update({
                        preferences: mergedPrefs,
                        last_interaction_at: new Date().toISOString(),
                      }).eq("id", memory.id);
                    } else {
                      await supabase.from("client_memory").insert({
                        whatsapp: whatsappForDb,
                        client_name: clientNameForDna,
                        preferences: mergedPrefs,
                        last_interaction_at: new Date().toISOString(),
                      });
                    }
                    console.log("[DNA] Profile saved to client_memory");
                  } catch (memErr) {
                    console.error("[DNA] Error saving to memory:", memErr);
                  }

                  // Send result (split if needed)
                  if (dnaResult.length > 4000) {
                    const mid = dnaResult.lastIndexOf("\n", 3900);
                    await sendWhatsAppMessage(phoneNumber, dnaResult.substring(0, mid > 0 ? mid : 3900));
                    await sendWhatsAppMessage(phoneNumber, dnaResult.substring(mid > 0 ? mid : 3900));
                  } else {
                    await sendWhatsAppMessage(phoneNumber, dnaResult);
                  }

                  // Mode messages NOT saved to messages_history to keep main context clean
                }

                return new Response(JSON.stringify({ status: "ok", dna_questionnaire: step }), {
                  status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
              }
            }
          }
        }
      }

      // ========== TÉO COMPATIBILIDADE: Travel DNA Match ==========
      {
        const lowerMsgCompat = (messageText || "").toLowerCase().trim();
        const compatActivateRegex = /^(compatibilidade|match viagem|match de viagem|compatibilidade viagem)/i;
        const compatWithNumberRegex = /(?:compatibilidade|match viagem|match de viagem)\s+(?:com\s+)?(\+?\d[\d\s\-]+)/i;

        if (compatActivateRegex.test(lowerMsgCompat)) {
          const savedConv = await ensureConversationAndSaveMessage(phoneNumber, contactName, messageText);

          // Try to extract partner number from message
          const numberMatch = compatWithNumberRegex.exec(messageText || "");
          let partnerPhone = numberMatch ? numberMatch[1].replace(/[\s\-]/g, "").replace(/^\+/, "") : null;

          if (!partnerPhone) {
            // Check if we're waiting for a number from a previous message
            const existingData = (savedConv?.collected_data as Record<string, any>) || {};
            if (!existingData._compat_waiting_number) {
              // Ask for the number
              if (savedConv) {
                await supabase.from("whatsapp_conversations").update({
                  collected_data: { ...existingData, _compat_waiting_number: true },
                }).eq("id", savedConv.id);
              }
              await sendWhatsAppMessage(phoneNumber, "💞 *Téo Compatibilidade de Viagem*\n\nQual o número de WhatsApp da pessoa que quer comparar?\n\nEnvie no formato: *5511999999999*\n\n_(A pessoa precisa ter feito o teste DNA de viajante!)_");
              return new Response(JSON.stringify({ status: "ok", compat_waiting: true }), {
                status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
              });
            }
          }

          // Check if this is a number reply to a waiting compat request
          if (!partnerPhone) {
            const convData = (savedConv?.collected_data as Record<string, any>) || {};
            if (convData._compat_waiting_number) {
              // The current message IS the number
              partnerPhone = (messageText || "").replace(/[\s\-\+]/g, "").replace(/\D/g, "");
              // Clear waiting state
              const cleanData = { ...convData };
              delete cleanData._compat_waiting_number;
              if (savedConv) {
                await supabase.from("whatsapp_conversations").update({
                  collected_data: cleanData,
                }).eq("id", savedConv.id);
              }
            }
          }

          if (partnerPhone) {
            // Normalize partner phone
            const cleanPartner = partnerPhone.replace(/\D/g, "");
            const normalizedPartner = cleanPartner.startsWith("55") ? cleanPartner : `55${cleanPartner}`;
            const cleanSelf = phoneNumber.replace(/\D/g, "");

            if (normalizedPartner === cleanSelf || normalizedPartner === `55${cleanSelf}`) {
              await sendWhatsAppMessage(phoneNumber, "😄 Você quer fazer match consigo mesmo? Haha! Envie o número de *outra* pessoa pra comparar! 💞");
              return new Response(JSON.stringify({ status: "ok", compat_self: true }), {
                status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
              });
            }

            await sendWhatsAppMessage(phoneNumber, "💞 *Analisando compatibilidade de viagem...*\nComparando DNAs de viajante! 🧬⏳");

            // Fetch both memories
            const memoryA = await fetchClientMemory(supabase, phoneNumber);
            const memoryB = await fetchClientMemory(supabase, normalizedPartner);

            const dnaA = (memoryA?.preferences as Record<string, any>)?.dna_viajante;
            const dnaB = (memoryB?.preferences as Record<string, any>)?.dna_viajante;

            if (!dnaA) {
              await sendWhatsAppMessage(phoneNumber, "🧬 Você ainda não fez o teste DNA de viajante!\n\nEnvie *meu dna* pra fazer o teste primeiro, depois tente o match novamente! 😉");
              return new Response(JSON.stringify({ status: "ok", compat_no_dna_self: true }), {
                status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
              });
            }

            if (!dnaB) {
              await sendWhatsAppMessage(phoneNumber, `🧬 A pessoa com o número *${normalizedPartner.slice(-4)}* ainda não fez o teste DNA de viajante!\n\nPeça pra ela enviar *meu dna* pro Téo primeiro! 😉`);
              return new Response(JSON.stringify({ status: "ok", compat_no_dna_partner: true }), {
                status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
              });
            }

            // Build context
            const nameA = memoryA?.client_name || contactName || "Pessoa 1";
            const nameB = memoryB?.client_name || "Pessoa 2";
            const signoA = (memoryA?.preferences as Record<string, any>)?.signo || null;
            const signoB = (memoryB?.preferences as Record<string, any>)?.signo || null;

            const compatPrompt = `Você é o Téo, cientista de compatibilidade de viagem da Tomorrow Travel. Compare os DNAs de Viajante de duas pessoas e gere uma análise de compatibilidade.

PESSOA A — ${nameA}:
🏔️ Explorador: ${dnaA.explorador || 0}%
🏛️ Culturalista: ${dnaA.culturalista || 0}%
🍽️ Gourmet: ${dnaA.gourmet || 0}%
🧘 Zen: ${dnaA.zen || 0}%
🎉 Socialite: ${dnaA.socialite || 0}%
${signoA ? `♈ Signo: ${signoA}` : ""}

PESSOA B — ${nameB}:
🏔️ Explorador: ${dnaB.explorador || 0}%
🏛️ Culturalista: ${dnaB.culturalista || 0}%
🍽️ Gourmet: ${dnaB.gourmet || 0}%
🧘 Zen: ${dnaB.zen || 0}%
🎉 Socialite: ${dnaB.socialite || 0}%
${signoB ? `♈ Signo: ${signoB}` : ""}

GERE A ANÁLISE NO FORMATO EXATO ABAIXO (WhatsApp com emojis):

💞 *Téo Compatibilidade de Viagem*

👤 *${nameA}* × *${nameB}*

🔬 *Compatibilidade: XX%* [barra visual com █ e ░, 10 blocos total]

📊 *Onde vocês combinam:*
[Liste 2-3 categorias onde as porcentagens são próximas, com análise divertida]

⚡ *Onde divergem:*
[Liste 1-2 categorias onde há maior diferença, com tom positivo/construtivo]

${signoA && signoB ? `🔮 *Astrologia: ${signoA} × ${signoB}*\n[Uma frase sobre a compatibilidade dos signos na viagem]` : ""}

✈️ *Destinos ideais pra vocês dois:*
1. [Destino real específico] — [justificativa curta ligando os DNAs]
2. [Destino real específico] — [justificativa curta]
3. [Destino real específico] — [justificativa curta]

💡 *Dica de convivência:*
[Uma dica prática e divertida sobre como viajar bem juntos]

✨ Quer que eu monte um roteiro pra vocês? É só pedir! 🗺️

REGRAS:
- O score deve ser calculado de forma realista: quanto mais próximos os perfis, maior a compatibilidade
- Porcentagens idênticas = alta compatibilidade naquela categoria
- Diferenças > 20% = ponto de divergência (mas apresente de forma positiva: "se complementam!")
- Os 3 destinos devem ser REAIS e combinar com os pontos fortes de AMBOS
- A barra de compatibilidade deve usar █ para preenchido e ░ para vazio
- Máximo 2500 caracteres total`;

            try {
              const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${LOVABLE_API_KEY}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  model: "google/gemini-2.5-flash",
                  messages: [
                    { role: "system", content: compatPrompt },
                    { role: "user", content: "Gere a análise de compatibilidade de viagem." },
                  ],
                  max_tokens: 4000,
                }),
              });

              if (!response.ok) {
                console.error("[COMPAT] AI error:", response.status);
                await sendWhatsAppMessage(phoneNumber, "😅 Não consegui analisar a compatibilidade agora. Tente novamente em alguns minutos!");
                return new Response(JSON.stringify({ status: "ok", compat_error: true }), {
                  status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
              }

              const data = await response.json();
              const compatResult = data.choices?.[0]?.message?.content || "Erro ao gerar compatibilidade.";

              // Save match to client_memory
              try {
                const scoreMatch = compatResult.match(/Compatibilidade:\s*(\d+)%/);
                const score = scoreMatch ? parseInt(scoreMatch[1]) : null;
                const matchData = {
                  parceiro_phone: normalizedPartner,
                  parceiro_nome: nameB,
                  score,
                  data: new Date().toISOString().split("T")[0],
                };

                if (memoryA) {
                  const mergedPrefs = { ...(memoryA.preferences as Record<string, any> || {}) };
                  mergedPrefs.ultimo_match = matchData;
                  await supabase.from("client_memory").update({
                    preferences: mergedPrefs,
                    last_interaction_at: new Date().toISOString(),
                  }).eq("id", memoryA.id);
                }
                console.log("[COMPAT] Match saved to client_memory, score:", score);
              } catch (memErr) {
                console.error("[COMPAT] Error saving match:", memErr);
              }

              // Send result
              if (compatResult.length > 4000) {
                const mid = compatResult.lastIndexOf("\n", 3900);
                await sendWhatsAppMessage(phoneNumber, compatResult.substring(0, mid > 0 ? mid : 3900));
                await sendWhatsAppMessage(phoneNumber, compatResult.substring(mid > 0 ? mid : 3900));
              } else {
                await sendWhatsAppMessage(phoneNumber, compatResult);
              }

              // One-shot mode — not saved to messages_history to keep main context clean

            } catch (err) {
              console.error("[COMPAT] Error:", err);
              await sendWhatsAppMessage(phoneNumber, "😅 Erro ao processar a compatibilidade. Tente novamente!");
            }

            return new Response(JSON.stringify({ status: "ok", compat_done: true }), {
              status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }

        // ===== COMPAT: Handle waiting for number (user sends just a number) =====
        {
          const { data: convForCompat } = await supabase
            .from("whatsapp_conversations")
            .select("id, collected_data, messages_history, client_name")
            .eq("phone_number", phoneNumber)
            .order("updated_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (convForCompat) {
            const compatData = (convForCompat.collected_data as Record<string, any>) || {};
            if (compatData._compat_waiting_number) {
              // User sent the partner number
              const partnerNum = (messageText || "").replace(/[\s\-\+]/g, "").replace(/\D/g, "");
              if (partnerNum.length >= 10) {
                // Clear waiting state and re-trigger compat logic
                const cleanData = { ...compatData };
                delete cleanData._compat_waiting_number;
                await supabase.from("whatsapp_conversations").update({
                  collected_data: cleanData,
                }).eq("id", convForCompat.id);

                const normalizedPartner = partnerNum.startsWith("55") ? partnerNum : `55${partnerNum}`;
                const cleanSelf = phoneNumber.replace(/\D/g, "");

                if (normalizedPartner === cleanSelf || normalizedPartner === `55${cleanSelf}`) {
                  await sendWhatsAppMessage(phoneNumber, "😄 Esse é seu próprio número! Envie o número de *outra* pessoa! 💞");
                  // Re-set waiting
                  await supabase.from("whatsapp_conversations").update({
                    collected_data: { ...cleanData, _compat_waiting_number: true },
                  }).eq("id", convForCompat.id);
                  return new Response(JSON.stringify({ status: "ok", compat_self: true }), {
                    status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
                  });
                }

                await sendWhatsAppMessage(phoneNumber, "💞 *Analisando compatibilidade de viagem...*\nComparando DNAs de viajante! 🧬⏳");

                const memoryA = await fetchClientMemory(supabase, phoneNumber);
                const memoryB = await fetchClientMemory(supabase, normalizedPartner);

                const dnaA = (memoryA?.preferences as Record<string, any>)?.dna_viajante;
                const dnaB = (memoryB?.preferences as Record<string, any>)?.dna_viajante;

                if (!dnaA) {
                  await sendWhatsAppMessage(phoneNumber, "🧬 Você ainda não fez o teste DNA!\n\nEnvie *meu dna* primeiro! 😉");
                  return new Response(JSON.stringify({ status: "ok" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
                }
                if (!dnaB) {
                  await sendWhatsAppMessage(phoneNumber, `🧬 A pessoa com número *...${normalizedPartner.slice(-4)}* não fez o teste DNA!\n\nPeça pra enviar *meu dna* pro Téo! 😉`);
                  return new Response(JSON.stringify({ status: "ok" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
                }

                const nameA = memoryA?.client_name || convForCompat.client_name || "Pessoa 1";
                const nameB = memoryB?.client_name || "Pessoa 2";
                const signoA = (memoryA?.preferences as Record<string, any>)?.signo || null;
                const signoB = (memoryB?.preferences as Record<string, any>)?.signo || null;

                const compatPrompt2 = `Você é o Téo, cientista de compatibilidade de viagem. Compare DNAs:

PESSOA A — ${nameA}: Explorador ${dnaA.explorador||0}%, Culturalista ${dnaA.culturalista||0}%, Gourmet ${dnaA.gourmet||0}%, Zen ${dnaA.zen||0}%, Socialite ${dnaA.socialite||0}%${signoA ? `, Signo: ${signoA}` : ""}
PESSOA B — ${nameB}: Explorador ${dnaB.explorador||0}%, Culturalista ${dnaB.culturalista||0}%, Gourmet ${dnaB.gourmet||0}%, Zen ${dnaB.zen||0}%, Socialite ${dnaB.socialite||0}%${signoB ? `, Signo: ${signoB}` : ""}

Gere no formato:
💞 *Téo Compatibilidade de Viagem*
👤 *${nameA}* × *${nameB}*
🔬 *Compatibilidade: XX%* [barra █░ 10 blocos]
📊 *Onde combinam:* [2-3 itens]
⚡ *Onde divergem:* [1-2 itens, tom positivo]
${signoA && signoB ? `🔮 *${signoA} × ${signoB}:* [1 frase]` : ""}
✈️ *Destinos ideais:* [3 destinos reais com justificativa]
💡 *Dica de convivência:* [1 dica]
✨ Quer roteiro? É só pedir! 🗺️
Máximo 2500 chars.`;

                try {
                  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
                    method: "POST",
                    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
                    body: JSON.stringify({
                      model: "google/gemini-2.5-flash",
                      messages: [
                        { role: "system", content: compatPrompt2 },
                        { role: "user", content: "Gere a análise de compatibilidade." },
                      ],
                      max_tokens: 4000,
                    }),
                  });

                  if (!response.ok) {
                    await sendWhatsAppMessage(phoneNumber, "😅 Erro na análise. Tente novamente!");
                    return new Response(JSON.stringify({ status: "ok" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
                  }

                  const data2 = await response.json();
                  const result2 = data2.choices?.[0]?.message?.content || "Erro.";

                  // Save match
                  try {
                    const scoreMatch2 = result2.match(/Compatibilidade:\s*(\d+)%/);
                    if (memoryA) {
                      const mp = { ...(memoryA.preferences as Record<string, any> || {}) };
                      mp.ultimo_match = { parceiro_phone: normalizedPartner, parceiro_nome: nameB, score: scoreMatch2 ? parseInt(scoreMatch2[1]) : null, data: new Date().toISOString().split("T")[0] };
                      await supabase.from("client_memory").update({ preferences: mp, last_interaction_at: new Date().toISOString() }).eq("id", memoryA.id);
                    }
                  } catch {}

                  if (result2.length > 4000) {
                    const mid = result2.lastIndexOf("\n", 3900);
                    await sendWhatsAppMessage(phoneNumber, result2.substring(0, mid > 0 ? mid : 3900));
                    await sendWhatsAppMessage(phoneNumber, result2.substring(mid > 0 ? mid : 3900));
                  } else {
                    await sendWhatsAppMessage(phoneNumber, result2);
                  }
                } catch (err) {
                  console.error("[COMPAT] Error:", err);
                  await sendWhatsAppMessage(phoneNumber, "😅 Erro ao processar. Tente novamente!");
                }

                return new Response(JSON.stringify({ status: "ok", compat_done: true }), {
                  status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
              }
            }
          }
        }
      }

      // ========== TÉO SOS: Emergency Assistant ==========
      {
        const lowerMsgSos = (messageText || "").toLowerCase().trim();
        const sosRegex = /^(sos|emergencia|emergência|socorro|ajuda urgente|help|téo sos|teo sos)$/i;
        const sosWithCountryRegex = /^(?:sos|emergencia|emergência|socorro)\s+(?:em\s+|no\s+|na\s+|nos\s+|nas\s+)?(.+)$/i;

        if (sosRegex.test(lowerMsgSos) || sosWithCountryRegex.test(lowerMsgSos)) {
          const savedConv = await ensureConversationAndSaveMessage(phoneNumber, contactName, messageText);

          // Determine country/destination context
          let destinationContext = "";
          const countryMatch = sosWithCountryRegex.exec(messageText || "");
          if (countryMatch) {
            destinationContext = countryMatch[1].trim();
          }

          // If no country specified, try to get from active trip
          if (!destinationContext) {
            try {
              const { data: activeTrip } = await supabase
                .from("active_trips")
                .select("destination_city, destination_country")
                .eq("client_phone", phoneNumber)
                .eq("concierge_active", true)
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle();

              if (activeTrip) {
                destinationContext = `${activeTrip.destination_city || ""}, ${activeTrip.destination_country || ""}`.replace(/^,\s*|,\s*$/g, "");
              }
            } catch {}
          }

          // If still no context, try client_memory travel history
          if (!destinationContext) {
            try {
              const memory = await fetchClientMemory(supabase, phoneNumber);
              const history = memory?.travel_history || [];
              if (history.length > 0) {
                const lastDest = history[history.length - 1];
                if (lastDest?.destino) destinationContext = lastDest.destino;
              }
            } catch {}
          }

          const sosPrompt = `Você é o Téo em modo SOS EMERGÊNCIA da Tomorrow Travel. Responda com URGÊNCIA, CLAREZA e SEM BRINCADEIRAS.

${destinationContext ? `DESTINO/PAÍS: ${destinationContext}` : "O cliente NÃO informou o país. Pergunte onde ele está antes de fornecer informações específicas."}

${destinationContext ? `FORNEÇA OBRIGATORIAMENTE estas informações para ${destinationContext}:` : "Se souber o país, forneça:"}

🆘 *EMERGÊNCIA — ${destinationContext || "[País]"}*

📞 *Números de Emergência:*
- Polícia: [número real]
- Bombeiros: [número real]
- Ambulância: [número real]
- Número universal de emergência: [se houver, ex: 112 na Europa]

🏥 *Hospitais de Referência:*
- [Nome do hospital principal para turistas, com endereço resumido]
- [Segundo hospital se relevante]
- Dica: [como pedir ambulância no idioma local]

🏛️ *Embaixada/Consulado do Brasil:*
- Endereço: [endereço real]
- Telefone: [telefone real]
- Plantão consular: [se disponível]

🗣️ *Frases de Emergência no Idioma Local:*
- "Preciso de ajuda!" → [tradução + pronúncia aproximada]
- "Preciso de um médico" → [tradução + pronúncia]
- "Onde fica o hospital?" → [tradução + pronúncia]
- "Ligue para a polícia" → [tradução + pronúncia]
- "Sou brasileiro(a)" → [tradução + pronúncia]
- "Não falo [idioma]" → [tradução + pronúncia]

⚠️ *Dicas de Segurança:*
- [1-2 dicas específicas do país/destino sobre segurança]
- Mantenha cópias digitais dos documentos
- Ligue pro Téo a qualquer hora! 📱

REGRAS CRÍTICAS:
- Tom SÉRIO e DIRETO — zero piadas, zero emojis decorativos (apenas os funcionais como 📞🏥🏛️)
- Use APENAS dados REAIS e VERIFICADOS (números de emergência oficiais, embaixadas reais)
- Se não souber um dado específico, NÃO INVENTE — diga "confirme no site da embaixada"
- Frases com pronúncia entre parênteses: ex: "Tasukete!" (ta-su-ke-tê)
- Máximo 2500 caracteres
- Se o cliente não informou o país, pergunte PRIMEIRO: "🆘 Onde você está agora? Me diz o país/cidade pra eu te ajudar com os contatos certos!"`;

          try {
            const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${LOVABLE_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "google/gemini-2.5-flash",
                messages: [
                  { role: "system", content: sosPrompt },
                  { role: "user", content: destinationContext ? `SOS em ${destinationContext}` : "SOS — preciso de ajuda de emergência" },
                ],
                max_tokens: 4000,
              }),
            });

            if (!response.ok) {
              console.error("[SOS] AI error:", response.status);
              // Fallback: send generic emergency info
              await sendWhatsAppMessage(phoneNumber, "🆘 *EMERGÊNCIA*\n\n📞 Em qualquer país da Europa: *112*\n📞 EUA/Canadá: *911*\n📞 Brasil: *190* (polícia) | *192* (SAMU) | *193* (bombeiros)\n\n🏛️ Embaixadas do Brasil: consulte gov.br/mre\n\nMe diga em qual país você está para informações mais específicas!");
            } else {
              const data = await response.json();
              const sosResult = data.choices?.[0]?.message?.content || "🆘 Erro ao buscar informações. Ligue 112 (Europa) ou 911 (EUA).";

              if (sosResult.length > 4000) {
                const mid = sosResult.lastIndexOf("\n", 3900);
                await sendWhatsAppMessage(phoneNumber, sosResult.substring(0, mid > 0 ? mid : 3900));
                await sendWhatsAppMessage(phoneNumber, sosResult.substring(mid > 0 ? mid : 3900));
              } else {
                await sendWhatsAppMessage(phoneNumber, sosResult);
              }
            }

            // One-shot mode — not saved to messages_history to keep main context clean

          } catch (err) {
            console.error("[SOS] Error:", err);
            await sendWhatsAppMessage(phoneNumber, "🆘 Erro ao processar. Números universais:\n📞 Europa: 112\n📞 EUA: 911\n📞 Brasil: 190/192/193");
          }

          return new Response(JSON.stringify({ status: "ok", sos: true }), {
            status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      // ========== PLAYLIST DA VIAGEM: AI-Curated Travel Playlist ==========
      {
        const playlistRegex = /^(playlist|playlist da viagem|minha playlist|playlist viagem|travel playlist|musica viagem|música viagem)$/i;
        const playlistWithDestRegex = /^playlist\s+(?:de|para|pra|da|do)\s+(.+)$/i;

        const lowerMsgPlaylist = (messageText || "").toLowerCase().trim();
        const playlistMatch = playlistRegex.test(lowerMsgPlaylist);
        const playlistDestMatch = playlistWithDestRegex.exec(messageText || "");

        if (playlistMatch || playlistDestMatch) {
          const savedConv = await ensureConversationAndSaveMessage(phoneNumber, contactName, messageText);
          
          await sendWhatsAppMessage(phoneNumber, "🎵 *Montando sua playlist personalizada...*\nIsso pode levar alguns segundos! 🎧");

          // Gather context: destination, DNA profile, emotional state
          let destinationHint = playlistDestMatch ? playlistDestMatch[1].trim() : "";
          let dnaContext = "";
          let emotionalContext = "";
          let travelContext = "";

          // Fetch client memory for DNA + emotional state
          try {
            const memory = await fetchClientMemory(phoneNumber);
            if (memory) {
              const prefs = (memory.preferences as Record<string, any>) || {};
              
              // DNA profile
              if (prefs.dna_viajante) {
                const dna = prefs.dna_viajante;
                dnaContext = `DNA do viajante: ${JSON.stringify(dna.percentages || {})}`;
              }
              
              // Emotional state
              if (prefs.tom_emocional) {
                emotionalContext = `Estado emocional: ${prefs.tom_emocional}, energia: ${prefs.nivel_energia || "médio"}`;
              }

              // Active trip or last destination
              if (!destinationHint) {
                const { data: activeTrip } = await supabase
                  .from("active_trips")
                  .select("destination_city, destination_country")
                  .eq("client_phone", phoneNumber)
                  .eq("concierge_active", true)
                  .limit(1)
                  .maybeSingle();
                
                if (activeTrip?.destination_city) {
                  destinationHint = `${activeTrip.destination_city}, ${activeTrip.destination_country || ""}`;
                  travelContext = "O cliente está VIAJANDO agora para este destino!";
                }
              }

              // Travel history
              const history = (memory.travel_history as any[]) || [];
              if (!destinationHint && history.length > 0) {
                const lastTrip = history[history.length - 1];
                if (lastTrip?.destino) {
                  destinationHint = lastTrip.destino;
                }
              }
            }
          } catch (memErr) {
            console.error("[PLAYLIST] Memory fetch error:", memErr);
          }

          const playlistPrompt = `Você é o Téo DJ 🎧, curador musical da Tomorrow Travel.

Crie uma PLAYLIST DE VIAGEM personalizada com 10-15 músicas para o cliente.

${destinationHint ? `DESTINO: ${destinationHint}` : "DESTINO: Não especificado (crie uma playlist universal de viagem)"}
${dnaContext ? `PERFIL: ${dnaContext}` : ""}
${emotionalContext ? `EMOCIONAL: ${emotionalContext}` : ""}
${travelContext ? `CONTEXTO: ${travelContext}` : ""}

REGRAS DE CURADORIA:
- Misture músicas internacionais populares + músicas locais do destino
- Se o perfil é Explorador → rock, indie, world music
- Se o perfil é Zen → lo-fi, ambient, jazz, bossa nova
- Se o perfil é Socialite → pop, eletrônica, hits dançantes
- Se o perfil é Gourmet → jazz, MPB, soul, indie acústico
- Se o perfil é Culturalista → world music, clássica, folk local
- Se estressado → músicas relaxantes e feel-good
- Se animado → músicas energéticas e empolgantes
- Inclua pelo menos 2-3 músicas do país/região do destino
- Cada música DEVE ter artista real e existir no Spotify

FORMATO (WhatsApp com emojis):

🎵 *PLAYLIST DA VIAGEM*
${destinationHint ? `📍 ${destinationHint}` : "🌍 Viagem dos Sonhos"}

🎧 *Pra ouvir antes de embarcar:*
1. 🎶 *[Artista] - [Música]* 
   _[gênero/vibe em 2-3 palavras]_
   🔗 https://open.spotify.com/search/[artista%20musica]

[... 10-15 músicas total, divididas em seções temáticas ...]

💡 *Dica do Téo:* [Uma dica sobre música/cultura local do destino]

SEÇÕES SUGERIDAS (adapte ao destino):
- 🛫 *Pra ouvir antes de embarcar* (2-3 músicas empolgantes)
- 🏖️ *Pra curtir no destino* (4-5 músicas temáticas)
- 🌅 *Golden hour / Pôr do sol* (2-3 músicas chill)
- 🎉 *Pra noite* (2-3 músicas animadas) OU 🧘 *Pra relaxar* (se perfil Zen)

IMPORTANTE:
- Use links de busca do Spotify: https://open.spotify.com/search/[artista%20-%20musica] (com %20 para espaços)
- Máximo 3500 caracteres
- Artistas e músicas REAIS que existem no Spotify`;

          try {
            const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${LOVABLE_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "google/gemini-2.5-flash",
                messages: [
                  { role: "system", content: playlistPrompt },
                  { role: "user", content: "Gere a playlist personalizada para este viajante." },
                ],
                max_tokens: 4000,
              }),
            });

            if (!response.ok) {
              console.error("[PLAYLIST] AI error:", response.status);
              await sendWhatsAppMessage(phoneNumber, "😅 Não consegui montar a playlist agora. Tenta de novo em alguns segundos!");
              return new Response(JSON.stringify({ status: "ok", playlist_error: true }), {
                status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
              });
            }

            const data = await response.json();
            const playlistResult = data.choices?.[0]?.message?.content || "Erro ao gerar playlist.";

            // Split if too long
            if (playlistResult.length > 4000) {
              const mid = playlistResult.lastIndexOf("\n", 3900);
              await sendWhatsAppMessage(phoneNumber, playlistResult.substring(0, mid > 0 ? mid : 3900));
              await sendWhatsAppMessage(phoneNumber, playlistResult.substring(mid > 0 ? mid : 3900));
            } else {
              await sendWhatsAppMessage(phoneNumber, playlistResult);
            }

            // Save playlist to client memory
            try {
              const memory = await fetchClientMemory(phoneNumber);
              if (memory) {
                const prefs = (memory.preferences as Record<string, any>) || {};
                const playlistHistory = Array.isArray(prefs.playlist_history) ? prefs.playlist_history : [];
                playlistHistory.push({
                  date: new Date().toISOString(),
                  destination: destinationHint || "universal",
                  preview: playlistResult.substring(0, 200),
                });
                // Keep last 5 playlists
                if (playlistHistory.length > 5) playlistHistory.shift();
                
                await supabase.from("client_memory").update({
                  preferences: { ...prefs, playlist_history: playlistHistory },
                  updated_at: new Date().toISOString(),
                }).eq("id", memory.id);
              }
            } catch (memErr) {
              console.error("[PLAYLIST] Memory save error:", memErr);
            }

            // One-shot mode — not saved to messages_history to keep main context clean

            console.log(`[PLAYLIST] Generated for ${phoneNumber}, destination: ${destinationHint || "universal"}`);
          } catch (err) {
            console.error("[PLAYLIST] Error:", err);
            await sendWhatsAppMessage(phoneNumber, "😅 Erro ao gerar playlist. Tenta de novo!");
          }

          return new Response(JSON.stringify({ status: "ok", playlist: true }), {
            status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      // ========== TÉO ROLETA: Random Destination Filtered by Profile ==========
      {
        const roletaRegex = /^(roleta|destino aleat[oó]rio|girar roleta|sorteio destino|surprise me|destino surpresa|roleta viagem)$/i;
        const lowerMsgRoleta = (messageText || "").toLowerCase().trim();

        if (roletaRegex.test(lowerMsgRoleta)) {
          const savedConv = await ensureConversationAndSaveMessage(phoneNumber, contactName, messageText);

          // Check if user wants to spin again (max 3x tracked in collected_data)
          let spinsUsed = 0;
          if (savedConv) {
            const cd = (savedConv.collected_data as Record<string, any>) || {};
            spinsUsed = cd._roleta_spins || 0;
          }

          if (spinsUsed >= 3) {
            await sendWhatsAppMessage(phoneNumber, "🎰 Você já girou 3 vezes! 😄\n\nEscolha um dos destinos que saíram ou me conte o que procura pra eu recomendar com mais calma! 🌍");
            return new Response(JSON.stringify({ status: "ok", roleta_max: true }), {
              status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          // Send spinning animation
          await sendWhatsAppMessage(phoneNumber, "🎰 *ROLETA DO DESTINO*\n\nGirando... 🌍🌏🌎✨");

          // Gather DNA + preferences for filtering
          let dnaContext = "";
          let budgetContext = "";
          let travelHistoryContext = "";

          try {
            const memory = await fetchClientMemory(phoneNumber);
            if (memory) {
              const prefs = (memory.preferences as Record<string, any>) || {};
              if (prefs.dna_viajante) {
                dnaContext = `DNA de Viajante: ${JSON.stringify(prefs.dna_viajante.percentages || {})}`;
              }
              if (prefs.orcamento) budgetContext = `Orçamento preferido: ${prefs.orcamento}`;
              if (prefs.tom_emocional) budgetContext += ` | Estado emocional: ${prefs.tom_emocional}`;

              const history = (memory.travel_history as any[]) || [];
              if (history.length > 0) {
                const visited = history.map((h: any) => h.destino).filter(Boolean);
                travelHistoryContext = `Destinos já visitados (EVITAR repetir): ${visited.join(", ")}`;
              }
            }
          } catch {}

          // Fetch active destinations from DB
          let destinationsPool: string[] = [];
          try {
            const { data: dests } = await supabase
              .from("destinations")
              .select("name, location, category, type, description, best_time, for_who")
              .eq("is_active", true);

            if (dests && dests.length > 0) {
              destinationsPool = dests.map((d: any) => `${d.name} (${d.location}) — ${d.category} — ${d.type} — ${d.for_who}`);
            }
          } catch {}

          const roletaPrompt = `Você é o Téo, consultor de viagens divertido da Tomorrow Travel. O cliente pediu pra GIRAR A ROLETA DO DESTINO!

DESTINOS DISPONÍVEIS NO NOSSO CATÁLOGO:
${destinationsPool.length > 0 ? destinationsPool.join("\n") : "Use destinos populares nacionais e internacionais."}

${dnaContext ? `PERFIL DO CLIENTE:\n${dnaContext}` : ""}
${budgetContext ? budgetContext : ""}
${travelHistoryContext ? travelHistoryContext : ""}

REGRAS:
1. Escolha EXATAMENTE 1 destino que combine com o perfil do cliente (ou aleatório se sem perfil)
2. Se o cliente já visitou destinos, NÃO repita nenhum
3. Priorize destinos do catálogo, mas pode sugerir outros se fizer sentido

FORMATO OBRIGATÓRIO (máx 1500 chars):

🎰 *ROLETA DO DESTINO*

🌍🌏🌎 Girando...
.
..
...
✨ PAROU!

🎯 *[NOME DO DESTINO]* [emoji do país]
📍 [localização]

💡 *Por que esse destino combina com você:*
[2-3 frases explicando por que esse destino é perfeito pro perfil do cliente — se tem DNA, use as categorias dominantes]

⭐ *Melhor época:* [época]
⏰ *Duração ideal:* [dias]
👥 *Pra quem:* [público]

🔄 Quer girar de novo? Mande *roleta*!
✈️ Curtiu? Mande *cotar [destino]* pra receber uma proposta!

${spinsUsed > 0 ? `\nEsta é a ${spinsUsed + 1}ª girada. Escolha um destino DIFERENTE dos anteriores.` : ""}`;

          try {
            const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${LOVABLE_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "google/gemini-2.5-flash",
                messages: [
                  { role: "system", content: roletaPrompt },
                  { role: "user", content: "Gire a roleta!" },
                ],
                max_tokens: 2000,
              }),
            });

            if (!response.ok) {
              console.error("[ROLETA] AI error:", response.status);
              await sendWhatsAppMessage(phoneNumber, "😅 A roleta travou! Tenta de novo em alguns segundos! 🎰");
              return new Response(JSON.stringify({ status: "ok", roleta_error: true }), {
                status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
              });
            }

            const data = await response.json();
            const roletaResult = data.choices?.[0]?.message?.content || "🎰 Erro na roleta!";

            await sendWhatsAppMessage(phoneNumber, roletaResult);

            // Update spin count only — mode messages NOT saved to messages_history
            if (savedConv) {
              const { data: convAfterRoleta } = await supabase
                .from("whatsapp_conversations")
                .select("id, collected_data")
                .eq("id", savedConv.id)
                .single();
              if (convAfterRoleta) {
                const cd = (convAfterRoleta.collected_data as Record<string, any>) || {};
                await supabase.from("whatsapp_conversations").update({
                  collected_data: { ...cd, _roleta_spins: (cd._roleta_spins || 0) + 1 },
                }).eq("id", convAfterRoleta.id);
              }
            }

            // Save to client memory
            try {
              const memory = await fetchClientMemory(phoneNumber);
              if (memory) {
                const prefs = (memory.preferences as Record<string, any>) || {};
                const roletaHistory = Array.isArray(prefs.roleta_history) ? prefs.roleta_history : [];
                roletaHistory.push({
                  date: new Date().toISOString(),
                  result: roletaResult.substring(0, 200),
                });
                if (roletaHistory.length > 10) roletaHistory.shift();

                await supabase.from("client_memory").update({
                  preferences: { ...prefs, roleta_history: roletaHistory },
                  updated_at: new Date().toISOString(),
                }).eq("id", memory.id);
              }
            } catch (memErr) {
              console.error("[ROLETA] Memory save error:", memErr);
            }

            console.log(`[ROLETA] Spin ${spinsUsed + 1} for ${phoneNumber}`);
          } catch (err) {
            console.error("[ROLETA] Error:", err);
            await sendWhatsAppMessage(phoneNumber, "😅 Erro na roleta. Tenta de novo!");
          }

          return new Response(JSON.stringify({ status: "ok", roleta: true }), {
            status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      // ========== TÉO ORÁCULO: Personalized Trip Prediction ==========
      {
        const oraculoRegex = /^(or[aá]culo|previs[aã]o da viagem|previsao da viagem|prever viagem|t[eé]o or[aá]culo|oraculo viagem|minha previs[aã]o|minha previsao)$/i;
        const lowerMsgOraculo = (messageText || "").toLowerCase().trim();

        if (oraculoRegex.test(lowerMsgOraculo)) {
          const savedConv = await ensureConversationAndSaveMessage(phoneNumber, contactName, messageText);

          await sendWhatsAppMessage(phoneNumber, "🔮 *O Oráculo do Téo está consultando as estrelas...*\n✨ Analisando seu perfil, signos e energia... 🌙");

          // Gather all context: DNA, zodiac, emotional, active trip, travel history
          let dnaContext = "";
          let zodiacContext = "";
          let emotionalContext = "";
          let tripContext = "";
          let historyContext = "";
          let nameContext = "";

          try {
            const memory = await fetchClientMemory(phoneNumber);
            if (memory) {
              nameContext = memory.client_name || "";
              const prefs = (memory.preferences as Record<string, any>) || {};

              // DNA
              if (prefs.dna_viajante) {
                dnaContext = `DNA de Viajante: ${JSON.stringify(prefs.dna_viajante.percentages || {})}`;
              }

              // Zodiac (from vidente feature)
              if (prefs.signo_viajante) {
                zodiacContext = `Signo: ${prefs.signo_viajante.signo || ""}, Elemento: ${prefs.signo_viajante.elemento || ""}, Planeta: ${prefs.signo_viajante.planeta || ""}`;
              }

              // Emotional state
              if (prefs.tom_emocional) {
                emotionalContext = `Tom emocional: ${prefs.tom_emocional}, Energia: ${prefs.nivel_energia || "médio"}, Momento de vida: ${prefs.momento_vida || "não informado"}`;
              }

              // Travel history
              const history = (memory.travel_history as any[]) || [];
              if (history.length > 0) {
                historyContext = `Viagens anteriores: ${history.map((h: any) => h.destino).filter(Boolean).join(", ")}`;
              }
            }
          } catch {}

          // Check for active trip
          try {
            const { data: activeTrip } = await supabase
              .from("active_trips")
              .select("destination_city, destination_country, check_in_date, check_out_date")
              .eq("client_phone", phoneNumber)
              .eq("concierge_active", true)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();

            if (activeTrip) {
              const checkIn = new Date(activeTrip.check_in_date);
              const checkOut = new Date(activeTrip.check_out_date);
              const totalDays = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
              tripContext = `Viagem ativa: ${activeTrip.destination_city || ""}, ${activeTrip.destination_country || ""} — ${totalDays} dias (${activeTrip.check_in_date} a ${activeTrip.check_out_date})`;
            }
          } catch {}

          // If no active trip, check upcoming client_trips
          if (!tripContext) {
            try {
              const { data: upcomingTrip } = await supabase
                .from("client_trips")
                .select("destination_name, departure_date, return_date")
                .gte("departure_date", new Date().toISOString().split("T")[0])
                .order("departure_date", { ascending: true })
                .limit(1)
                .maybeSingle();

              if (upcomingTrip) {
                tripContext = `Próxima viagem: ${upcomingTrip.destination_name} (${upcomingTrip.departure_date} a ${upcomingTrip.return_date})`;
              }
            } catch {}
          }

          const today = new Date();
          const season = today.getMonth() >= 2 && today.getMonth() <= 4 ? "Outono" :
                         today.getMonth() >= 5 && today.getMonth() <= 7 ? "Inverno" :
                         today.getMonth() >= 8 && today.getMonth() <= 10 ? "Primavera" : "Verão";
          const moonPhases = ["🌑 Lua Nova", "🌒 Crescente", "🌓 Quarto Crescente", "🌔 Gibosa Crescente", "🌕 Lua Cheia", "🌖 Gibosa Minguante", "🌗 Quarto Minguante", "🌘 Minguante"];
          const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
          const moonPhase = moonPhases[Math.floor((dayOfYear % 29.5) / 3.7)];

          const oraculoPrompt = `Você é o Téo no modo ORÁCULO MÍSTICO da Tomorrow Travel. Crie uma previsão personalizada ÚNICA e ENVOLVENTE sobre o que vai acontecer na viagem do cliente.

DADOS DO CLIENTE:
${nameContext ? `Nome: ${nameContext}` : ""}
${dnaContext || "DNA: não disponível — improvise baseado no tom da conversa"}
${zodiacContext || "Signo: não informado — use linguagem mística genérica"}
${emotionalContext || ""}
${tripContext || "Sem viagem marcada — faça previsão para a PRÓXIMA viagem que o cliente fizer"}
${historyContext || ""}

CONTEXTO CÓSMICO:
- Data: ${today.toLocaleDateString("pt-BR")}
- Estação: ${season} (hemisfério sul)
- Fase lunar: ${moonPhase}

REGRAS:
1. Tom MÍSTICO porém DIVERTIDO — nunca genérico, sempre personalizado
2. Use os dados reais do cliente (DNA, signo, destino) para criar previsões específicas
3. Previsões devem ser POSITIVAS e EMOCIONANTES
4. Se tem viagem marcada, faça previsões DIA A DIA (pelo menos 3 dias)
5. Se NÃO tem viagem, preveja QUANDO e PRA ONDE a próxima viagem será
6. Máximo 2500 caracteres

FORMATO OBRIGATÓRIO:

🔮 *ORÁCULO DO TÉO*
_${moonPhase} • ${season}_

${nameContext ? `✨ *${nameContext}*, as estrelas têm uma mensagem para você...\n` : "✨ *As estrelas têm uma mensagem para você...*\n"}
${tripContext ? `
📍 *Previsões para [destino]:*

🌅 *Dia [X]:* [previsão específica e detalhada com emoji]
[algo inesperado e mágico que vai acontecer]

🌊 *Dia [Y]:* [outra previsão]
[experiência marcante]

🌙 *Dia [Z]:* [previsão final]
[algo que muda a perspectiva]

` : `
🌟 *O oráculo vê sua próxima viagem:*
[previsão de quando e pra onde, baseada no perfil]

`}
💫 *Conselho cósmico:* [uma frase poética e memorável]

${zodiacContext ? `♈ *Influência do seu signo:* [como o signo afeta essa viagem]` : ""}

_O oráculo se despede... até a próxima consulta! 🌙✨_`;

          try {
            const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${LOVABLE_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "google/gemini-2.5-flash",
                messages: [
                  { role: "system", content: oraculoPrompt },
                  { role: "user", content: "Consulte o oráculo para mim!" },
                ],
                max_tokens: 3000,
              }),
            });

            if (!response.ok) {
              console.error("[ORACULO] AI error:", response.status);
              await sendWhatsAppMessage(phoneNumber, "🔮 As estrelas estão turbulentas... Tente consultar o oráculo novamente em alguns instantes! ✨");
              return new Response(JSON.stringify({ status: "ok", oraculo_error: true }), {
                status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
              });
            }

            const data = await response.json();
            const oraculoResult = data.choices?.[0]?.message?.content || "🔮 O oráculo está em silêncio...";

            if (oraculoResult.length > 4000) {
              const mid = oraculoResult.lastIndexOf("\n", 3900);
              await sendWhatsAppMessage(phoneNumber, oraculoResult.substring(0, mid > 0 ? mid : 3900));
              await sendWhatsAppMessage(phoneNumber, oraculoResult.substring(mid > 0 ? mid : 3900));
            } else {
              await sendWhatsAppMessage(phoneNumber, oraculoResult);
            }

            // One-shot mode — not saved to messages_history to keep main context clean

            // Save to client memory
            try {
              const memory = await fetchClientMemory(phoneNumber);
              if (memory) {
                const prefs = (memory.preferences as Record<string, any>) || {};
                const oraculoHistory = Array.isArray(prefs.oraculo_history) ? prefs.oraculo_history : [];
                oraculoHistory.push({
                  date: new Date().toISOString(),
                  moon: moonPhase,
                  season,
                  preview: oraculoResult.substring(0, 200),
                });
                if (oraculoHistory.length > 5) oraculoHistory.shift();

                await supabase.from("client_memory").update({
                  preferences: { ...prefs, oraculo_history: oraculoHistory },
                  updated_at: new Date().toISOString(),
                }).eq("id", memory.id);
              }
            } catch (memErr) {
              console.error("[ORACULO] Memory save error:", memErr);
            }

            console.log(`[ORACULO] Prediction generated for ${phoneNumber}`);
          } catch (err) {
            console.error("[ORACULO] Error:", err);
            await sendWhatsAppMessage(phoneNumber, "🔮 Erro ao consultar as estrelas. Tente novamente!");
          }

          return new Response(JSON.stringify({ status: "ok", oraculo: true }), {
            status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      // ========== TÉO SCHOOL: Language Learning for Tourism (EN/ES) ==========
      {
        const lowerMsgSchool = (messageText || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
        const schoolActivateRegex = /^(escola|school|teo school|téo school|aprender ingles|aprender espanhol|aprender inglês|learn english|learn spanish|aula de ingles|aula de espanhol|ingles para viagem|espanhol para viagem)$/i;

        // Check if school mode is active first
        const { data: convForSchool } = await supabase
          .from("whatsapp_conversations")
          .select("id, collected_data")
          .eq("phone_number", phoneNumber)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const schoolData = (convForSchool?.collected_data as Record<string, any>) || {};
        const isSchoolActive = schoolData._school_mode === true;

        // ===== SCHOOL MODE HANDLER (when active) =====
        if (isSchoolActive && convForSchool) {
          await ensureConversationAndSaveMessage(phoneNumber, contactName, messageText);

          const schoolLang = schoolData._school_lang || "en";
          const schoolLevel = schoolData._school_level || null;
          const schoolModule = schoolData._school_module || 1;
          const schoolLesson = schoolData._school_lesson || 1;
          const schoolStep = schoolData._school_step || "choosing_lang";
          const schoolScore = schoolData._school_score || 0;
          const schoolHistory = Array.isArray(schoolData._school_history) ? schoolData._school_history : [];

          // Exit commands
          const exitRegex = /^(sair escola|sair school|parar aula|exit school|voltar|sair modo)$/i;
          if (exitRegex.test(lowerMsgSchool)) {
            const cleanData = { ...schoolData };
            delete cleanData._school_mode;
            delete cleanData._school_step;
            delete cleanData._mode_activated_at;
            // Keep progress: _school_lang, _school_level, _school_module, _school_lesson, _school_score
            await supabase.from("whatsapp_conversations").update({ collected_data: cleanData }).eq("id", convForSchool.id);

            // Sync to dedicated school_progress table
            try {
              await saveSchoolProgress(phoneNumber, {
                client_name: contactName || schoolData._school_client_name || null,
                language: schoolLang,
                level: schoolLevel || "beginner",
                current_module: schoolModule,
                current_lesson: schoolLesson,
                total_score: schoolScore,
              });
            } catch (e) { console.error("[SCHOOL] Progress sync error on exit:", e); }

            const prediction = getAdvancementPrediction(schoolModule, schoolLesson);
            await sendWhatsAppMessage(phoneNumber, `📚 *Téo School desativado!*\n\nSeu progresso foi salvo! Quando quiser retomar, mande *escola* 😊\n\n📊 Pontuação: *${schoolScore} pts*\n\n${prediction}`);
            return new Response(JSON.stringify({ status: "ok", school_exit: true }), {
              status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          // ===== STEP: Choosing language =====
          if (schoolStep === "choosing_lang") {
            const isEnglish = /^(1|ingles|inglês|english|en)$/i.test(lowerMsgSchool);
            const isSpanish = /^(2|espanhol|spanish|es)$/i.test(lowerMsgSchool);

            if (isEnglish || isSpanish) {
              const lang = isEnglish ? "en" : "es";
              const langName = isEnglish ? "Inglês" : "Espanhol";
              const langFlag = isEnglish ? "🇺🇸" : "🇪🇸";

              // Check if user has previous progress
              const previousLevel = schoolData._school_level;
              const previousModule = schoolData._school_module || 1;

              if (previousLevel && schoolData._school_lang === lang) {
                // Resume from previous progress
                await supabase.from("whatsapp_conversations").update({
                  collected_data: { ...schoolData, _school_step: "learning", _mode_activated_at: new Date().toISOString() },
                }).eq("id", convForSchool.id);

                const MODULE_NAMES = ["", "Aeroporto ✈️", "Hotel 🏨", "Restaurante 🍽️", "Transporte 🚕", "Compras 🛍️", "Emergências 🏥", "Passeios 🎫", "Socialização 🤝", "Problemas ⚠️", "Conversação Avançada 🗣️"];
                await sendWhatsAppMessage(phoneNumber, `${langFlag} *Retomando ${langName}!*\n\n📊 Nível: *${previousLevel === "beginner" ? "Iniciante 🌱" : previousLevel === "intermediate" ? "Intermediário 🌿" : "Avançado 🌳"}*\n📖 Módulo ${previousModule}: *${MODULE_NAMES[previousModule] || ""}*\n⭐ Pontuação: *${schoolScore} pts*\n\nMande *próximo* para a próxima lição!\nOu *menu* para ver os módulos disponíveis.`);
              } else {
                // Start diagnostic
                await supabase.from("whatsapp_conversations").update({
                  collected_data: { ...schoolData, _school_lang: lang, _school_step: "diagnostic_1", _mode_activated_at: new Date().toISOString() },
                }).eq("id", convForSchool.id);

                const q1 = isEnglish
                  ? "📝 *Diagnóstico Rápido*\n\nComo você diria \"Onde fica o banheiro?\" em inglês?\n\na) Where is the bathroom?\nb) How is the bathroom?\nc) What is the restroom?"
                  : "📝 *Diagnóstico Rápido*\n\nComo você diria \"Onde fica o banheiro?\" em espanhol?\n\na) ¿Dónde está el baño?\nb) ¿Cómo es el baño?\nc) ¿Qué es el baño?";

                await sendWhatsAppMessage(phoneNumber, `${langFlag} *${langName} selecionado!*\n\nVou fazer 3 perguntinhas rápidas pra entender seu nível... 🎯\n\n${q1}`);
              }
            } else {
              await sendWhatsAppMessage(phoneNumber, "🤔 Escolha o idioma:\n\n1️⃣ Inglês 🇺🇸\n2️⃣ Espanhol 🇪🇸");
            }

            return new Response(JSON.stringify({ status: "ok", school_lang_choice: true }), {
              status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          // ===== DIAGNOSTIC STEPS =====
          if (schoolStep.startsWith("diagnostic_")) {
            const diagStep = parseInt(schoolStep.split("_")[1]);
            const lang = schoolLang;
            const answer = lowerMsgSchool.replace(/[^a-z0-9]/g, "");
            let correct = false;
            let diagScore = schoolData._diag_score || 0;

            // Evaluate answer
            if (diagStep === 1) {
              correct = answer === "a";
              if (correct) diagScore++;
              
              const q2 = lang === "en"
                ? "📝 *Pergunta 2/3*\n\nComplete: \"I would like to _____ a room for two nights.\"\n\na) book\nb) take\nc) make"
                : "📝 *Pergunta 2/3*\n\nComplete: \"Me gustaría _____ una habitación por dos noches.\"\n\na) reservar\nb) tomar\nc) hacer";

              await supabase.from("whatsapp_conversations").update({
                collected_data: { ...schoolData, _school_step: "diagnostic_2", _diag_score: diagScore, _mode_activated_at: new Date().toISOString() },
              }).eq("id", convForSchool.id);

              await sendWhatsAppMessage(phoneNumber, `${correct ? "✅ Correto!" : "❌ A resposta certa era *a*!"}\n\n${q2}`);
            } else if (diagStep === 2) {
              correct = answer === "a";
              if (correct) diagScore++;

              const q3 = lang === "en"
                ? "📝 *Pergunta 3/3*\n\nO que significa \"boarding pass\"?\n\na) Passaporte\nb) Cartão de embarque\nc) Bilhete de trem"
                : "📝 *Pergunta 3/3*\n\nO que significa \"tarjeta de embarque\"?\n\na) Cartão de crédito\nb) Cartão de embarque\nc) Cartão de visita";

              await supabase.from("whatsapp_conversations").update({
                collected_data: { ...schoolData, _school_step: "diagnostic_3", _diag_score: diagScore, _mode_activated_at: new Date().toISOString() },
              }).eq("id", convForSchool.id);

              await sendWhatsAppMessage(phoneNumber, `${correct ? "✅ Correto!" : "❌ A resposta certa era *a*!"}\n\n${q3}`);
            } else if (diagStep === 3) {
              correct = answer === "b";
              if (correct) diagScore++;

              // Determine level
              const level = diagScore >= 3 ? "advanced" : diagScore >= 2 ? "intermediate" : "beginner";
              const levelName = level === "beginner" ? "Iniciante 🌱" : level === "intermediate" ? "Intermediário 🌿" : "Avançado 🌳";
              const startModule = level === "advanced" ? 7 : level === "intermediate" ? 4 : 1;

              const MODULE_NAMES = ["", "Aeroporto ✈️", "Hotel 🏨", "Restaurante 🍽️", "Transporte 🚕", "Compras 🛍️", "Emergências 🏥", "Passeios 🎫", "Socialização 🤝", "Problemas ⚠️", "Conversação Avançada 🗣️"];

              await supabase.from("whatsapp_conversations").update({
                collected_data: {
                  ...schoolData,
                  _school_step: "learning",
                  _school_level: level,
                  _school_module: startModule,
                  _school_lesson: 1,
                  _school_score: 0,
                  _diag_score: undefined,
                  _mode_activated_at: new Date().toISOString(),
                },
              }).eq("id", convForSchool.id);

              await sendWhatsAppMessage(phoneNumber, `${correct ? "✅ Correto!" : "❌ A resposta certa era *b*!"}\n\n🎯 *Resultado: ${levelName}*\n_Acertou ${diagScore}/3 perguntas_\n\n📖 Começando no *Módulo ${startModule}: ${MODULE_NAMES[startModule]}*\n\nMande *próximo* para começar a primeira lição! 🚀\nOu *menu* para ver todos os módulos.`);
            }

            return new Response(JSON.stringify({ status: "ok", school_diagnostic: diagStep }), {
              status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          // ===== LEARNING MODE =====
          if (schoolStep === "learning" || schoolStep === "waiting_pronunciation") {
            const lang = schoolLang;
            const langCode = lang === "en" ? "eng" : "spa";
            const langFlag = lang === "en" ? "🇺🇸" : "🇪🇸";
            const langName = lang === "en" ? "Inglês" : "Espanhol";

            const MODULE_NAMES = ["", "Aeroporto ✈️", "Hotel 🏨", "Restaurante 🍽️", "Transporte 🚕", "Compras 🛍️", "Emergências 🏥", "Passeios 🎫", "Socialização 🤝", "Problemas ⚠️", "Conversação Avançada 🗣️"];

            // Menu command
            if (/^(menu|modulos|módulos)$/i.test(lowerMsgSchool)) {
              let menuMsg = `📚 *Téo School — ${langName} ${langFlag}*\n\n`;
              for (let m = 1; m <= 10; m++) {
                const isCurrent = m === schoolModule;
                const isCompleted = m < schoolModule;
                menuMsg += `${isCompleted ? "✅" : isCurrent ? "👉" : "🔒"} *Módulo ${m}:* ${MODULE_NAMES[m]}\n`;
              }
              menuMsg += `\n📊 Pontuação: *${schoolScore} pts*\nMande *próximo* para continuar a lição atual.`;
              await sendWhatsAppMessage(phoneNumber, menuMsg);
              await supabase.from("whatsapp_conversations").update({
                collected_data: { ...schoolData, _mode_activated_at: new Date().toISOString() },
              }).eq("id", convForSchool.id);

              return new Response(JSON.stringify({ status: "ok", school_menu: true }), {
                status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
              });
            }

            // Handle pronunciation exercise (audio message while waiting)
            if (schoolStep === "waiting_pronunciation" && messageType === "audio" && schoolData._school_target_phrase) {
              const audioId = messageData?.audio?.id;
              if (audioId) {
                const audioBuffer = await downloadWhatsAppMedia(audioId);
                if (audioBuffer) {
                  await sendWhatsAppMessage(phoneNumber, "🎧 *Analisando sua pronúncia...*");
                  
                  const transcription = await transcribeAudio(audioBuffer, langCode);
                  
                  if (transcription) {
                    const targetPhrase = schoolData._school_target_phrase;

                    // Use Gemini to evaluate pronunciation
                    const evalPrompt = `You are a pronunciation evaluator for ${lang === "en" ? "English" : "Spanish"} language learning.

ORIGINAL PHRASE: "${targetPhrase}"
STUDENT'S TRANSCRIPTION: "${transcription}"

Compare the student's pronunciation (via STT transcription) with the original phrase.

Return ONLY valid JSON (no markdown):
{
  "score": 0-100,
  "correct": true/false,
  "feedback_pt": "feedback in Portuguese for the student",
  "pronunciation_tip": "specific tip in Portuguese about how to improve pronunciation of any wrong words",
  "phonetic_help": "phonetic pronunciation of difficult words in the phrase"
}

RULES:
- Be encouraging even for mistakes
- If score >= 70, consider it correct
- Focus on the most important errors, not minor accent differences
- STT may have minor transcription artifacts — be lenient with articles and small words`;

                    try {
                      const evalResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
                        method: "POST",
                        headers: {
                          Authorization: `Bearer ${LOVABLE_API_KEY}`,
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          model: "google/gemini-2.5-flash",
                          messages: [{ role: "user", content: evalPrompt }],
                          max_tokens: 1000,
                        }),
                      });

                      if (evalResponse.ok) {
                        const evalData = await evalResponse.json();
                        let evalContent = evalData.choices?.[0]?.message?.content || "";
                        evalContent = evalContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
                        
                        const evaluation = JSON.parse(evalContent);
                        const isCorrect = evaluation.correct || evaluation.score >= 70;
                        const newScore = schoolScore + (isCorrect ? 10 : 2);

                        let responseMsg = "";
                        if (isCorrect) {
                          responseMsg = `🎯 Ouvi: _"${transcription}"_\n✅ *${evaluation.score >= 90 ? "Perfeito" : "Muito bom"}!* 🎉 (+10 pts)\n\n${evaluation.feedback_pt}\n\n⭐ Pontuação: *${newScore} pts*\n\nMande *próximo* para a próxima frase! 🚀`;
                        } else {
                          responseMsg = `🎯 Ouvi: _"${transcription}"_\n🔄 *Quase lá!* (+2 pts)\n\n${evaluation.feedback_pt}\n\n💡 *Dica:* ${evaluation.pronunciation_tip || ""}\n🔊 *Pronúncia:* ${evaluation.phonetic_help || ""}\n\n🎤 Tente de novo! Grave outro áudio lendo a frase.\nOu mande *próximo* para pular.`;
                        }

                        await sendWhatsAppMessage(phoneNumber, responseMsg);

                        const updatedSchoolData = {
                          ...schoolData,
                          _school_score: newScore,
                          _school_step: isCorrect ? "learning" : "waiting_pronunciation",
                          _mode_activated_at: new Date().toISOString(),
                        };
                        if (isCorrect) {
                          delete updatedSchoolData._school_target_phrase;
                        }
                        await supabase.from("whatsapp_conversations").update({
                          collected_data: updatedSchoolData,
                        }).eq("id", convForSchool.id);
                      }
                    } catch (evalErr) {
                      console.error("[SCHOOL] Pronunciation evaluation error:", evalErr);
                      await sendWhatsAppMessage(phoneNumber, "😅 Erro ao avaliar pronúncia. Tente novamente ou mande *próximo*!");
                    }
                  } else {
                    await sendWhatsAppMessage(phoneNumber, "🤔 Não consegui entender o áudio. Tente gravar novamente mais perto do microfone! 🎤");
                  }
                }
              }

              return new Response(JSON.stringify({ status: "ok", school_pronunciation: true }), {
                status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
              });
            }

            // Generate next lesson via AI
            if (/^(proximo|próximo|next|continuar|proxima|próxima|vamos|bora|1)$/i.test(lowerMsgSchool) || schoolStep === "learning") {
              // Only auto-advance on "próximo" commands, not random messages
              if (schoolStep === "waiting_pronunciation" && !/^(proximo|próximo|next|pular|skip)$/i.test(lowerMsgSchool)) {
                await sendWhatsAppMessage(phoneNumber, "🎤 Estou esperando seu áudio! Leia a frase em voz alta e mande um áudio.\nOu mande *próximo* para pular.");
                await supabase.from("whatsapp_conversations").update({
                  collected_data: { ...schoolData, _mode_activated_at: new Date().toISOString() },
                }).eq("id", convForSchool.id);
                return new Response(JSON.stringify({ status: "ok", school_waiting_audio: true }), {
                  status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
              }

              const lessonPrompt = `You are Téo School, a world-class ${lang === "en" ? "English" : "Spanish"} teacher specialized in travel/tourism for Brazilian Portuguese speakers.

STUDENT PROFILE:
- Level: ${schoolLevel || "beginner"}
- Module: ${schoolModule}/10 — "${MODULE_NAMES[schoolModule] || ""}"
- Lesson: ${schoolLesson}
- Score: ${schoolScore} pts
- Language: ${langName}

MODULE TOPICS:
1. Airport & Check-in, 2. Hotel & Accommodation, 3. Restaurant & Food, 4. Transport & Directions,
5. Shopping & Negotiation, 6. Emergencies & Health, 7. Tours & Attractions, 8. Socializing & Culture,
9. Problem Solving, 10. Advanced Conversation

GENERATE A LESSON IN PORTUGUESE with the target language phrases. Return ONLY valid JSON (no markdown):
{
  "lesson_title": "title in Portuguese",
  "exercise_type": "vocabulary|phrases|dialogue|pronunciation|quiz|challenge",
  "content_pt": "full lesson content formatted for WhatsApp with *bold* and emojis, in Portuguese with ${langName} phrases clearly marked",
  "target_phrase": "ONE key phrase in ${langName} for pronunciation practice (optional, only for pronunciation type)",
  "target_phrase_translation": "translation in Portuguese",
  "quiz_answer": "correct answer letter if quiz type (a/b/c)",
  "next_lesson": ${schoolLesson + 1}
}

RULES:
- Mix exercise types: vocabulary → phrases → pronunciation → quiz → dialogue → challenge
- For pronunciation: include ONE clear phrase the student should read aloud
- For quiz: include 3 options (a/b/c) with one correct answer
- For dialogue: simulate a real situation (you play waiter/clerk/agent, student responds)
- All explanations in Portuguese, target phrases in ${langName}
- Be encouraging, fun, use travel-themed examples
- Keep content under 1500 chars
- After every 5 lessons, advance to next module (lesson resets to 1)
- Level up difficulty within the module progressively`;

              try {
                const lessonResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${LOVABLE_API_KEY}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    model: "google/gemini-2.5-flash",
                    messages: [
                      { role: "system", content: lessonPrompt },
                      ...(schoolHistory.length > 0 ? schoolHistory.slice(-4) : []),
                      { role: "user", content: lowerMsgSchool === "learning" ? "Start the first lesson" : messageText || "next" },
                    ],
                    max_tokens: 2000,
                  }),
                });

                if (!lessonResponse.ok) {
                  console.error("[SCHOOL] AI error:", lessonResponse.status);
                  await sendWhatsAppMessage(phoneNumber, "😅 Erro ao gerar lição. Tente *próximo* novamente!");
                  return new Response(JSON.stringify({ status: "ok", school_error: true }), {
                    status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
                  });
                }

                const lessonData = await lessonResponse.json();
                let lessonContent = lessonData.choices?.[0]?.message?.content || "";
                lessonContent = lessonContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

                let lesson: any;
                try {
                  lesson = JSON.parse(lessonContent);
                } catch {
                  // If not valid JSON, use the content directly
                  await sendWhatsAppMessage(phoneNumber, lessonContent || "😅 Erro na lição. Mande *próximo*!");
                  return new Response(JSON.stringify({ status: "ok", school_parse_error: true }), {
                    status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
                  });
                }

                // Build message
                const header = `${langFlag} *Téo School — Módulo ${schoolModule}*\n📖 Lição ${schoolLesson} | ⭐ ${schoolScore} pts\n\n`;
                let lessonMsg = header + (lesson.content_pt || "Lição vazia");

                // Send lesson message
                await sendWhatsAppMessage(phoneNumber, lessonMsg);

                // If pronunciation exercise, also send TTS audio of the target phrase
                let newStep = "learning";
                const updatedSchoolDataLesson: Record<string, any> = {
                  ...schoolData,
                  _mode_activated_at: new Date().toISOString(),
                };

                if (lesson.target_phrase && lesson.exercise_type === "pronunciation") {
                  newStep = "waiting_pronunciation";
                  updatedSchoolDataLesson._school_target_phrase = lesson.target_phrase;

                  // Generate TTS for the target phrase
                  try {
                    const audioBuffer = await convertTextToAudio(lesson.target_phrase);
                    if (audioBuffer) {
                      const audioUrl = await uploadAudioToStorage(audioBuffer, phoneNumber);
                      if (audioUrl) {
                        await sendWhatsAppAudio(phoneNumber, audioUrl);
                        await sendWhatsAppMessage(phoneNumber, `🎧 Ouça e repita!\n\n🎯 _"${lesson.target_phrase}"_\n🇧🇷 _"${lesson.target_phrase_translation || ""}"_\n\n🎤 Agora é sua vez! Grave um áudio lendo a frase!`);
                      }
                    }
                  } catch (ttsErr) {
                    console.error("[SCHOOL] TTS error:", ttsErr);
                    await sendWhatsAppMessage(phoneNumber, `🎯 Leia em voz alta: _"${lesson.target_phrase}"_\n🇧🇷 _"${lesson.target_phrase_translation || ""}"_\n\n🎤 Grave um áudio lendo a frase!`);
                  }
                }

                // Advance lesson counter
                let newLesson = (lesson.next_lesson || schoolLesson + 1);
                let newModule = schoolModule;
                let newLessonsCompleted = (schoolData._school_lessons_completed || 0) + 1;
                let newModulesCompleted = schoolData._school_modules_completed || 0;
                let newLevel = schoolLevel || "beginner";

                if (newLesson > 5) {
                  newLesson = 1;
                  newModule = Math.min(schoolModule + 1, 10);
                  if (newModule > schoolModule) {
                    newModulesCompleted++;
                    // Level up logic
                    if (newModule >= 4 && newLevel === "beginner") newLevel = "intermediate";
                    if (newModule >= 7 && newLevel === "intermediate") newLevel = "advanced";
                    await sendWhatsAppMessage(phoneNumber, `🎉 *Módulo ${schoolModule} completo!*\n\n📖 Avançando para *Módulo ${newModule}: ${MODULE_NAMES[newModule]}*! 🚀`);
                  }
                }

                // Sync to school_progress with streak calculation
                try {
                  const existingProgress = await loadSchoolProgress(phoneNumber);
                  const { streak: newStreak, isNewDay } = calculateStreak(
                    existingProgress?.last_study_date || null,
                    existingProgress?.streak_days || 0
                  );
                  const longestStreak = Math.max(newStreak, existingProgress?.longest_streak || 0);

                  // Check and send badges
                  const allBadges = await checkAndSendBadges(
                    phoneNumber,
                    existingProgress || { phone_number: phoneNumber, language: schoolLang, level: newLevel, current_module: newModule, current_lesson: newLesson, total_score: schoolScore, streak_days: newStreak, longest_streak: longestStreak, last_study_date: null, lessons_completed: newLessonsCompleted, modules_completed: newModulesCompleted, badges: [] },
                    newStreak, schoolScore, newModule, newLevel, newLessonsCompleted, newModulesCompleted,
                  );

                  await saveSchoolProgress(phoneNumber, {
                    client_name: contactName || null,
                    language: schoolLang,
                    level: newLevel,
                    current_module: newModule,
                    current_lesson: newLesson,
                    total_score: schoolScore,
                    streak_days: newStreak,
                    longest_streak: longestStreak,
                    last_study_date: new Date().toISOString().split("T")[0],
                    lessons_completed: newLessonsCompleted,
                    modules_completed: newModulesCompleted,
                    badges: allBadges,
                  });

                  // Show advancement prediction
                  const prediction = getAdvancementPrediction(newModule, newLesson);
                  if (isNewDay && newStreak > 1) {
                    await sendWhatsAppMessage(phoneNumber, `🔥 *Streak de ${newStreak} dias!* Continue assim!\n\n${prediction}`);
                  }
                } catch (progressErr) {
                  console.error("[SCHOOL] Progress sync error:", progressErr);
                }

                // Update school history (isolated)
                const newHistory = [...schoolHistory, { role: "user", content: messageText || "próximo" }, { role: "assistant", content: lesson.content_pt || "" }];
                if (newHistory.length > 20) newHistory.splice(0, newHistory.length - 20);

                updatedSchoolDataLesson._school_step = newStep;
                updatedSchoolDataLesson._school_lesson = newLesson;
                updatedSchoolDataLesson._school_module = newModule;
                updatedSchoolDataLesson._school_level = newLevel;
                updatedSchoolDataLesson._school_lessons_completed = newLessonsCompleted;
                updatedSchoolDataLesson._school_modules_completed = newModulesCompleted;
                updatedSchoolDataLesson._school_history = newHistory;

                // If quiz, store expected answer
                if (lesson.exercise_type === "quiz" && lesson.quiz_answer) {
                  updatedSchoolDataLesson._school_quiz_answer = lesson.quiz_answer;
                  updatedSchoolDataLesson._school_step = "waiting_quiz";
                }

                await supabase.from("whatsapp_conversations").update({
                  collected_data: updatedSchoolDataLesson,
                }).eq("id", convForSchool.id);

              } catch (err) {
                console.error("[SCHOOL] Lesson generation error:", err);
                await sendWhatsAppMessage(phoneNumber, "😅 Erro ao gerar lição. Tente *próximo* novamente!");
              }

              return new Response(JSON.stringify({ status: "ok", school_lesson: true }), {
                status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
              });
            }

            // Handle quiz answers
            if (schoolStep === "waiting_quiz" || (schoolData._school_quiz_answer && /^[a-c]$/i.test(lowerMsgSchool))) {
              const expectedAnswer = schoolData._school_quiz_answer;
              const userAnswer = lowerMsgSchool.replace(/[^a-c]/g, "");
              const isCorrect = userAnswer === expectedAnswer;
              const newScore = schoolScore + (isCorrect ? 10 : 0);

              const feedbackMsg = isCorrect
                ? `✅ *Correto!* 🎉 (+10 pts)\n\n⭐ Pontuação: *${newScore} pts*\n\nMande *próximo* para a próxima lição!`
                : `❌ A resposta certa era *${expectedAnswer}*!\n\n⭐ Pontuação: *${newScore} pts*\n\nMande *próximo* para continuar!`;

              await sendWhatsAppMessage(phoneNumber, feedbackMsg);

              const cleanQuiz = { ...schoolData };
              delete cleanQuiz._school_quiz_answer;
              cleanQuiz._school_step = "learning";
              cleanQuiz._school_score = newScore;
              cleanQuiz._mode_activated_at = new Date().toISOString();
              await supabase.from("whatsapp_conversations").update({ collected_data: cleanQuiz }).eq("id", convForSchool.id);

              return new Response(JSON.stringify({ status: "ok", school_quiz: true }), {
                status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
              });
            }

            // Default: treat as dialogue interaction — send to AI for contextual response
            const dialoguePrompt = `You are Téo School, a ${lang === "en" ? "English" : "Spanish"} teacher for tourism. The student sent a message during a lesson.
Current module: ${schoolModule} — ${MODULE_NAMES[schoolModule]}
Level: ${schoolLevel}

Respond in Portuguese, correcting any ${langName} the student attempted. Be encouraging.
If they seem confused, explain what to do (send *próximo* for next lesson, *menu* for modules, *sair escola* to exit).
Keep response under 500 chars.`;

            try {
              const dialogResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
                method: "POST",
                headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                  model: "google/gemini-2.5-flash-lite",
                  messages: [
                    { role: "system", content: dialoguePrompt },
                    { role: "user", content: messageText || "" },
                  ],
                  max_tokens: 500,
                }),
              });

              if (dialogResponse.ok) {
                const dialogData = await dialogResponse.json();
                const reply = dialogData.choices?.[0]?.message?.content || "Mande *próximo* para a próxima lição! 📚";
                await sendWhatsAppMessage(phoneNumber, reply);
              } else {
                await sendWhatsAppMessage(phoneNumber, "📚 Mande *próximo* para a próxima lição, *menu* para ver módulos, ou *sair escola* para sair.");
              }
            } catch {
              await sendWhatsAppMessage(phoneNumber, "📚 Mande *próximo* para a próxima lição!");
            }

            await supabase.from("whatsapp_conversations").update({
              collected_data: { ...schoolData, _mode_activated_at: new Date().toISOString() },
            }).eq("id", convForSchool.id);

            return new Response(JSON.stringify({ status: "ok", school_dialogue: true }), {
              status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }

        // ===== SCHOOL MODE ACTIVATION =====
        if (schoolActivateRegex.test(lowerMsgSchool) || /aprender\s+(ingles|inglês|espanhol)/i.test(messageText || "")) {
          const savedConv = await ensureConversationAndSaveMessage(phoneNumber, contactName, messageText);

          // Check if message specifies language directly
          const wantsEnglish = /ingles|inglês|english/i.test(messageText || "");
          const wantsSpanish = /espanhol|spanish/i.test(messageText || "");

          const existingData = (savedConv?.collected_data as Record<string, any>) || {};

          if (wantsEnglish || wantsSpanish) {
            // Skip language selection
            const lang = wantsEnglish ? "en" : "es";
            const previousLevel = existingData._school_level;

            await supabase.from("whatsapp_conversations").update({
              collected_data: {
                ...existingData,
                _school_mode: true,
                _school_lang: lang,
                _school_step: previousLevel && existingData._school_lang === lang ? "learning" : "diagnostic_1",
                _mode_activated_at: new Date().toISOString(),
              },
            }).eq("id", savedConv!.id);

            if (previousLevel && existingData._school_lang === lang) {
              const MODULE_NAMES_ACT = ["", "Aeroporto ✈️", "Hotel 🏨", "Restaurante 🍽️", "Transporte 🚕", "Compras 🛍️", "Emergências 🏥", "Passeios 🎫", "Socialização 🤝", "Problemas ⚠️", "Conversação Avançada 🗣️"];
              await sendWhatsAppMessage(phoneNumber, `📚 *Téo School Ativado!*\n\n${wantsEnglish ? "🇺🇸" : "🇪🇸"} Retomando de onde parou!\n📖 Módulo ${existingData._school_module || 1}: *${MODULE_NAMES_ACT[existingData._school_module || 1]}*\n⭐ Pontuação: *${existingData._school_score || 0} pts*\n\nMande *próximo* para continuar!`);
            } else {
              const q1 = wantsEnglish
                ? "📝 *Diagnóstico Rápido*\n\nComo você diria \"Onde fica o banheiro?\" em inglês?\n\na) Where is the bathroom?\nb) How is the bathroom?\nc) What is the restroom?"
                : "📝 *Diagnóstico Rápido*\n\nComo você diria \"Onde fica o banheiro?\" em espanhol?\n\na) ¿Dónde está el baño?\nb) ¿Cómo es el baño?\nc) ¿Qué es el baño?";
              await sendWhatsAppMessage(phoneNumber, `📚 *Téo School Ativado!* ${wantsEnglish ? "🇺🇸" : "🇪🇸"}\n\nVou fazer 3 perguntinhas rápidas pra entender seu nível... 🎯\n\n${q1}`);
            }
          } else {
            // Ask language
            await supabase.from("whatsapp_conversations").update({
              collected_data: {
                ...existingData,
                _school_mode: true,
                _school_step: "choosing_lang",
                _mode_activated_at: new Date().toISOString(),
              },
            }).eq("id", savedConv!.id);

            await sendWhatsAppMessage(phoneNumber, "📚 *Téo School Ativado!*\n\nQual idioma você quer aprender para viagem?\n\n1️⃣ Inglês 🇺🇸\n2️⃣ Espanhol 🇪🇸");
          }

          return new Response(JSON.stringify({ status: "ok", school_activated: true }), {
            status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      // ========== TÉO CARTEIRA: Expense Tracker during Trip ==========
      {
        const lowerMsgGasto = (messageText || "").toLowerCase().trim();
        
        // Regex patterns for expense commands
        const gastoRegex = /^(?:gastei|gasto|paguei|pago)\s+/i;
        const resumoGastosRegex = /^(meus gastos|resumo gastos|extrato|resumo dos gastos|total gastos|gastos viagem|téo carteira|teo carteira)$/i;
        const gastosHojeRegex = /^(gastos hoje|gastos do dia|gastos de hoje)$/i;
        const apagarUltimoRegex = /^(apagar ultimo gasto|apagar último gasto|remover ultimo gasto|remover último gasto|desfazer gasto)$/i;
        const zerarGastosRegex = /^(zerar gastos|limpar gastos|apagar todos gastos|resetar gastos)$/i;
        const confirmarZerarRegex = /^(sim zerar|confirmar zerar|sim, zerar|sim limpar)$/i;
        const cambioRegex = /^c[aâ]mbio\s+([\d.,]+)$/i;

        // Currency rates fallback
        const CURRENCY_RATES: Record<string, number> = {
          "BRL": 1, "R$": 1,
          "USD": 5.50, "$": 5.50, "US$": 5.50, "dólar": 5.50, "dolar": 5.50, "dolares": 5.50, "dólares": 5.50,
          "EUR": 6.00, "€": 6.00, "euro": 6.00, "euros": 6.00,
          "GBP": 7.00, "£": 7.00, "libra": 7.00, "libras": 7.00,
          "ARS": 0.006, "peso": 0.006, "pesos": 0.006,
          "JPY": 0.037, "yen": 0.037, "iene": 0.037, "ienes": 0.037,
          "CLP": 0.006, "MXN": 0.32, "COP": 0.0013, "PEN": 1.45, "UYU": 0.13,
          "real": 1, "reais": 1,
        };

        const CATEGORY_EMOJIS: Record<string, string> = {
          "alimentacao": "🍽️", "transporte": "🚕", "hospedagem": "🏨",
          "passeios": "🎫", "compras": "🛍️", "saude": "💊", "outros": "📱",
        };

        const CATEGORY_LABELS: Record<string, string> = {
          "alimentacao": "Alimentação", "transporte": "Transporte", "hospedagem": "Hospedagem",
          "passeios": "Passeios", "compras": "Compras", "saude": "Saúde", "outros": "Outros",
        };

        // ===== REGISTER EXPENSE =====
        if (gastoRegex.test(lowerMsgGasto)) {
          const savedConv = await ensureConversationAndSaveMessage(phoneNumber, contactName, messageText);

          const expenseText = (messageText || "").replace(/^(?:gastei|gasto|paguei|pago)\s+/i, "").trim();
          
          const valueMatch = expenseText.match(/^(?:R\$|US\$|€|£|\$)?\s*([\d.,]+)\s*(.*)/i);
          if (!valueMatch) {
            await sendWhatsAppMessage(phoneNumber, "🤔 Não entendi o valor. Tenta assim:\n• *gastei 50 euros no almoço*\n• *gastei R$ 120 uber*\n• *gastei 25 dolares café*");
            return new Response(JSON.stringify({ status: "ok", gasto_parse_error: true }), {
              status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          const rawValue = parseFloat(valueMatch[1].replace(",", "."));
          if (isNaN(rawValue) || rawValue <= 0) {
            await sendWhatsAppMessage(phoneNumber, "❌ Valor inválido. Tenta novamente com um número válido!");
            return new Response(JSON.stringify({ status: "ok", gasto_invalid_value: true }), {
              status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          const restText = valueMatch[2].trim();

          let detectedCurrency = "BRL";
          let currencyRate = 1;
          const prefixMatch = (messageText || "").match(/(?:R\$|US\$|€|£|\$)\s*[\d]/i);
          if (prefixMatch) {
            const prefix = prefixMatch[0].charAt(0) === "$" ? "$" : prefixMatch[0].replace(/[\d\s]/g, "");
            if (CURRENCY_RATES[prefix]) {
              detectedCurrency = prefix === "€" ? "EUR" : prefix === "£" ? "GBP" : prefix === "$" || prefix === "US$" ? "USD" : "BRL";
              currencyRate = CURRENCY_RATES[prefix];
            }
          } else {
            for (const [key, rate] of Object.entries(CURRENCY_RATES)) {
              if (restText.toLowerCase().includes(key.toLowerCase()) && key.length > 1) {
                detectedCurrency = key.toUpperCase();
                currencyRate = rate;
                break;
              }
            }
          }

          const memory = await fetchClientMemory(supabase, phoneNumber);
          const prefs = (memory?.preferences as Record<string, any>) || {};
          const gastosData = prefs.gastos_viagem || { gastos: [], viagem_atual: "", moeda_principal: "BRL" };
          if (gastosData.taxa_cambio && detectedCurrency !== "BRL") {
            currencyRate = gastosData.taxa_cambio;
          }

          const valorBrl = detectedCurrency === "BRL" ? rawValue : rawValue * currencyRate;
          const descricao = restText
            .replace(/(?:reais|real|dol[aá]r(?:es)?|euro[s]?|libra[s]?|yen|iene[s]?|peso[s]?)/gi, "")
            .replace(/^\s*(?:no|na|em|de|do|da|com|pra|para|pro)\s+/i, "")
            .trim() || "Gasto não especificado";

          // Categorize via AI
          let categoria = "outros";
          try {
            const catResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                model: "google/gemini-2.5-flash-lite",
                tools: [{
                  type: "function",
                  function: {
                    name: "categorize_expense",
                    description: "Categorize a travel expense",
                    parameters: {
                      type: "object",
                      properties: {
                        category: { type: "string", enum: ["alimentacao", "transporte", "hospedagem", "passeios", "compras", "saude", "outros"] },
                      },
                      required: ["category"],
                      additionalProperties: false
                    }
                  }
                }],
                tool_choice: { type: "function", function: { name: "categorize_expense" } },
                messages: [{ role: "user", content: `Categorize this travel expense: "${descricao}". Value: ${rawValue} ${detectedCurrency}` }],
              }),
            });
            if (catResponse.ok) {
              const catData = await catResponse.json();
              const toolCall = catData.choices?.[0]?.message?.tool_calls?.[0];
              if (toolCall?.function?.arguments) {
                const args = JSON.parse(toolCall.function.arguments);
                categoria = args.category || "outros";
              }
            }
          } catch (catErr) {
            console.error("[CARTEIRA] Categorization error:", catErr);
          }

          const today = new Date().toISOString().split("T")[0];
          const newExpense = {
            valor: rawValue,
            moeda: detectedCurrency,
            valor_brl: Math.round(valorBrl * 100) / 100,
            categoria,
            descricao: descricao.substring(0, 100),
            data: today,
          };

          let viagemAtual = gastosData.viagem_atual || "";
          if (!viagemAtual) {
            try {
              const { data: activeTrip } = await supabase
                .from("active_trips")
                .select("destination_city, destination_country")
                .eq("client_phone", phoneNumber)
                .eq("concierge_active", true)
                .limit(1)
                .maybeSingle();
              if (activeTrip) {
                viagemAtual = `${activeTrip.destination_city || ""} ${new Date().getFullYear()}`.trim();
              }
            } catch {}
          }

          const gastos = Array.isArray(gastosData.gastos) ? gastosData.gastos : [];
          gastos.push(newExpense);

          const totalBrl = gastos.reduce((sum: number, g: any) => sum + (g.valor_brl || 0), 0);
          const todayExpenses = gastos.filter((g: any) => g.data === today);
          const totalHojeBrl = todayExpenses.reduce((sum: number, g: any) => sum + (g.valor_brl || 0), 0);

          const updatedGastos = { ...gastosData, viagem_atual: viagemAtual, gastos, total_brl: Math.round(totalBrl * 100) / 100 };
          const mergedPrefs = { ...prefs, gastos_viagem: updatedGastos };
          const normalizedWa = phoneNumber.replace(/\D/g, "");
          const waForDb = normalizedWa.startsWith("55") ? normalizedWa : `55${normalizedWa}`;

          if (memory) {
            await supabase.from("client_memory").update({ preferences: mergedPrefs, last_interaction_at: new Date().toISOString() }).eq("id", memory.id);
          } else {
            await supabase.from("client_memory").insert({ whatsapp: waForDb, client_name: contactName || null, preferences: mergedPrefs, last_interaction_at: new Date().toISOString() });
          }

          const emoji = CATEGORY_EMOJIS[categoria] || "📱";
          const label = CATEGORY_LABELS[categoria] || "Outros";
          let confirmMsg = `✅ *R$${valorBrl.toFixed(2)}*`;
          if (detectedCurrency !== "BRL") confirmMsg += ` (${detectedCurrency} ${rawValue.toFixed(2)})`;
          confirmMsg += ` registrado em ${emoji} ${label}`;
          confirmMsg += `\n_${newExpense.descricao}_`;
          confirmMsg += `\n\n💰 Total do dia: R$${totalHojeBrl.toFixed(2)} | Total viagem: R$${totalBrl.toFixed(2)}`;

          await sendWhatsAppMessage(phoneNumber, confirmMsg);

          if (savedConv) {
            const { data: convAfter } = await supabase.from("whatsapp_conversations").select("id, messages_history").eq("id", savedConv.id).single();
            if (convAfter) {
              const updH = [...((convAfter.messages_history as any[]) || []), { role: "assistant", content: confirmMsg, timestamp: new Date().toISOString() }];
              await supabase.from("whatsapp_conversations").update({ messages_history: updH }).eq("id", convAfter.id);
            }
          }

          console.log(`[CARTEIRA] Expense registered: ${rawValue} ${detectedCurrency} → R$${valorBrl.toFixed(2)} [${categoria}]`);
          return new Response(JSON.stringify({ status: "ok", gasto_registered: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // ===== EXPENSE SUMMARY =====
        if (resumoGastosRegex.test(lowerMsgGasto)) {
          await ensureConversationAndSaveMessage(phoneNumber, contactName, messageText);

          const memory = await fetchClientMemory(supabase, phoneNumber);
          const prefs = (memory?.preferences as Record<string, any>) || {};
          const gastosData = prefs.gastos_viagem || {};
          const gastos = Array.isArray(gastosData.gastos) ? gastosData.gastos : [];

          if (gastos.length === 0) {
            await sendWhatsAppMessage(phoneNumber, "📊 Você ainda não registrou nenhum gasto!\n\nPra começar, mande:\n• *gastei 50 euros no almoço*\n• *gastei R$ 120 uber*");
            return new Response(JSON.stringify({ status: "ok", gastos_empty: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
          }

          const byCategory: Record<string, { total: number; count: number }> = {};
          let totalBrl = 0;
          const dayTotals: Record<string, number> = {};

          for (const g of gastos) {
            const cat = g.categoria || "outros";
            if (!byCategory[cat]) byCategory[cat] = { total: 0, count: 0 };
            byCategory[cat].total += g.valor_brl || 0;
            byCategory[cat].count++;
            totalBrl += g.valor_brl || 0;
            const day = g.data || "?";
            dayTotals[day] = (dayTotals[day] || 0) + (g.valor_brl || 0);
          }

          const dates = gastos.map((g: any) => g.data).filter(Boolean).sort();
          const uniqueDays = new Set(dates).size;

          let report = `💰 *Téo Carteira — Resumo da Viagem*\n`;
          if (gastosData.viagem_atual) report += `📍 ${gastosData.viagem_atual} | `;
          report += `${uniqueDays} dia${uniqueDays !== 1 ? "s" : ""}\n\n`;

          const sortedCats = Object.entries(byCategory).sort((a, b) => b[1].total - a[1].total);
          for (const [cat, data] of sortedCats) {
            const emoji = CATEGORY_EMOJIS[cat] || "📱";
            const label = CATEGORY_LABELS[cat] || "Outros";
            const pct = totalBrl > 0 ? Math.round((data.total / totalBrl) * 100) : 0;
            const filled = Math.round(pct / 10);
            const bar = "█".repeat(filled) + "░".repeat(10 - filled);
            report += `${emoji} ${label}: R$${data.total.toFixed(2)} (${pct}%) ${bar}\n`;
          }

          report += `\n💵 *Total: R$${totalBrl.toFixed(2)}*`;
          if (uniqueDays > 0) report += `\n📊 Média diária: R$${(totalBrl / uniqueDays).toFixed(2)}/dia`;
          if (sortedCats.length > 0) report += `\n💡 Maior gasto: ${CATEGORY_EMOJIS[sortedCats[0][0]] || "📱"} ${CATEGORY_LABELS[sortedCats[0][0]] || "Outros"}`;

          const sortedDays = Object.entries(dayTotals).sort((a, b) => b[1] - a[1]);
          if (sortedDays.length > 0) {
            const [expDay, expVal] = sortedDays[0];
            const formattedDay = expDay.split("-").reverse().slice(0, 2).join("/");
            report += `\n⚡ Dia mais caro: ${formattedDay} (R$${expVal.toFixed(2)})`;
          }

          report += `\n\n📝 Total de registros: ${gastos.length}`;
          await sendWhatsAppMessage(phoneNumber, report);
          return new Response(JSON.stringify({ status: "ok", gastos_report: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // ===== TODAY'S EXPENSES =====
        if (gastosHojeRegex.test(lowerMsgGasto)) {
          await ensureConversationAndSaveMessage(phoneNumber, contactName, messageText);
          const memory = await fetchClientMemory(supabase, phoneNumber);
          const prefs = (memory?.preferences as Record<string, any>) || {};
          const gastos = Array.isArray(prefs.gastos_viagem?.gastos) ? prefs.gastos_viagem.gastos : [];
          const today = new Date().toISOString().split("T")[0];
          const todayGastos = gastos.filter((g: any) => g.data === today);

          if (todayGastos.length === 0) {
            await sendWhatsAppMessage(phoneNumber, "📊 Nenhum gasto registrado hoje!\n\nPra registrar: *gastei [valor] [descrição]*");
            return new Response(JSON.stringify({ status: "ok" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
          }

          let msg = `📊 *Gastos de Hoje*\n\n`;
          let totalHoje = 0;
          for (const g of todayGastos) {
            const emoji = CATEGORY_EMOJIS[g.categoria] || "📱";
            msg += `${emoji} R$${(g.valor_brl || 0).toFixed(2)} — _${g.descricao}_\n`;
            totalHoje += g.valor_brl || 0;
          }
          msg += `\n💰 *Total hoje: R$${totalHoje.toFixed(2)}*`;
          await sendWhatsAppMessage(phoneNumber, msg);
          return new Response(JSON.stringify({ status: "ok", gastos_hoje: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // ===== DELETE LAST EXPENSE =====
        if (apagarUltimoRegex.test(lowerMsgGasto)) {
          await ensureConversationAndSaveMessage(phoneNumber, contactName, messageText);
          const memory = await fetchClientMemory(supabase, phoneNumber);
          if (!memory) {
            await sendWhatsAppMessage(phoneNumber, "📊 Nenhum gasto registrado!");
            return new Response(JSON.stringify({ status: "ok" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
          }
          const prefs = (memory.preferences as Record<string, any>) || {};
          const gastosData = prefs.gastos_viagem || {};
          const gastos = Array.isArray(gastosData.gastos) ? [...gastosData.gastos] : [];
          if (gastos.length === 0) {
            await sendWhatsAppMessage(phoneNumber, "📊 Nenhum gasto registrado para apagar!");
            return new Response(JSON.stringify({ status: "ok" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
          }
          const removed = gastos.pop();
          const totalBrl = gastos.reduce((sum: number, g: any) => sum + (g.valor_brl || 0), 0);
          await supabase.from("client_memory").update({
            preferences: { ...prefs, gastos_viagem: { ...gastosData, gastos, total_brl: Math.round(totalBrl * 100) / 100 } },
            last_interaction_at: new Date().toISOString(),
          }).eq("id", memory.id);
          const emoji = CATEGORY_EMOJIS[removed.categoria] || "📱";
          await sendWhatsAppMessage(phoneNumber, `🗑️ Gasto removido: ${emoji} R$${(removed.valor_brl || 0).toFixed(2)} — _${removed.descricao}_\n\n💰 Novo total: R$${totalBrl.toFixed(2)}`);
          return new Response(JSON.stringify({ status: "ok", gasto_removed: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // ===== CLEAR ALL EXPENSES =====
        if (zerarGastosRegex.test(lowerMsgGasto)) {
          const savedConv = await ensureConversationAndSaveMessage(phoneNumber, contactName, messageText);
          if (savedConv) {
            const existingData = (savedConv.collected_data as Record<string, any>) || {};
            await supabase.from("whatsapp_conversations").update({ collected_data: { ...existingData, _gastos_confirmar_zerar: true } }).eq("id", savedConv.id);
          }
          await sendWhatsAppMessage(phoneNumber, "⚠️ Tem certeza que quer *zerar todos os gastos*?\n\nMande *sim zerar* para confirmar.");
          return new Response(JSON.stringify({ status: "ok", gastos_zerar_confirm: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // ===== CONFIRM CLEAR =====
        if (confirmarZerarRegex.test(lowerMsgGasto)) {
          const { data: convCheck } = await supabase.from("whatsapp_conversations")
            .select("id, collected_data").eq("phone_number", phoneNumber)
            .order("updated_at", { ascending: false }).limit(1).maybeSingle();
          const cData = (convCheck?.collected_data as Record<string, any>) || {};
          if (cData._gastos_confirmar_zerar) {
            await ensureConversationAndSaveMessage(phoneNumber, contactName, messageText);
            const memory = await fetchClientMemory(supabase, phoneNumber);
            if (memory) {
              const prefs = (memory.preferences as Record<string, any>) || {};
              const gastosData = prefs.gastos_viagem || {};
              const historico = Array.isArray(prefs.gastos_historico) ? prefs.gastos_historico : [];
              if (gastosData.gastos?.length > 0) {
                historico.push({ viagem: gastosData.viagem_atual || "Viagem", total_brl: gastosData.total_brl || 0, num_gastos: gastosData.gastos.length, data_arquivo: new Date().toISOString() });
                if (historico.length > 10) historico.shift();
              }
              await supabase.from("client_memory").update({
                preferences: { ...prefs, gastos_viagem: { gastos: [], viagem_atual: "", total_brl: 0 }, gastos_historico: historico },
                last_interaction_at: new Date().toISOString(),
              }).eq("id", memory.id);
            }
            if (convCheck) {
              const cleanData = { ...cData };
              delete cleanData._gastos_confirmar_zerar;
              await supabase.from("whatsapp_conversations").update({ collected_data: cleanData }).eq("id", convCheck.id);
            }
            await sendWhatsAppMessage(phoneNumber, "✅ Todos os gastos foram zerados! 🧹\n\nPra começar de novo: *gastei [valor] [descrição]*");
            return new Response(JSON.stringify({ status: "ok", gastos_cleared: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
          }
        }

        // ===== SET EXCHANGE RATE =====
        const cambioMatch = cambioRegex.exec(lowerMsgGasto);
        if (cambioMatch) {
          await ensureConversationAndSaveMessage(phoneNumber, contactName, messageText);
          const taxa = parseFloat(cambioMatch[1].replace(",", "."));
          if (isNaN(taxa) || taxa <= 0) {
            await sendWhatsAppMessage(phoneNumber, "❌ Taxa inválida. Ex: *câmbio 5.50*");
            return new Response(JSON.stringify({ status: "ok" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
          }
          const memory = await fetchClientMemory(supabase, phoneNumber);
          if (memory) {
            const prefs = (memory.preferences as Record<string, any>) || {};
            const gastosData = prefs.gastos_viagem || { gastos: [], viagem_atual: "", total_brl: 0 };
            gastosData.taxa_cambio = taxa;
            await supabase.from("client_memory").update({ preferences: { ...prefs, gastos_viagem: gastosData }, last_interaction_at: new Date().toISOString() }).eq("id", memory.id);
          }
          await sendWhatsAppMessage(phoneNumber, `✅ Taxa de câmbio definida: *1 moeda = R$${taxa.toFixed(2)}*\n\nTodos os próximos gastos em moeda estrangeira usarão essa taxa! 💱`);
          return new Response(JSON.stringify({ status: "ok", cambio_set: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
      }

      // ========== TÉO VIDENTE: Zodiac-based Travel Recommendations ==========
      {
        const videnteRegex = /^(meu signo|horóscopo viajante|destino do signo|signo viagem|vidente|horoscopo viajante|meu horóscopo|meu horoscopo)$/i;
        const videnteWithSignRegex = /^(?:meu signo|signo|signo de|signo do)\s+(.+)$/i;
        const birthdayRegex = /^(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?$/;

        const lowerMsgVidente = (messageText || "").toLowerCase().trim();
        const videnteMatch = videnteRegex.test(lowerMsgVidente);
        const videnteSignMatch = videnteWithSignRegex.exec(messageText || "");
        const birthdayMatch = birthdayRegex.exec(lowerMsgVidente);

        // Map birthday to zodiac sign
        const getSignFromDate = (day: number, month: number): { signo: string; emoji: string; elemento: string; planeta: string } => {
          const signs = [
            { signo: "Capricórnio", emoji: "♑", elemento: "Terra", planeta: "Saturno", start: [1, 1], end: [1, 19] },
            { signo: "Aquário", emoji: "♒", elemento: "Ar", planeta: "Urano", start: [1, 20], end: [2, 18] },
            { signo: "Peixes", emoji: "♓", elemento: "Água", planeta: "Netuno", start: [2, 19], end: [3, 20] },
            { signo: "Áries", emoji: "♈", elemento: "Fogo", planeta: "Marte", start: [3, 21], end: [4, 19] },
            { signo: "Touro", emoji: "♉", elemento: "Terra", planeta: "Vênus", start: [4, 20], end: [5, 20] },
            { signo: "Gêmeos", emoji: "♊", elemento: "Ar", planeta: "Mercúrio", start: [5, 21], end: [6, 20] },
            { signo: "Câncer", emoji: "♋", elemento: "Água", planeta: "Lua", start: [6, 21], end: [7, 22] },
            { signo: "Leão", emoji: "♌", elemento: "Fogo", planeta: "Sol", start: [7, 23], end: [8, 22] },
            { signo: "Virgem", emoji: "♍", elemento: "Terra", planeta: "Mercúrio", start: [8, 23], end: [9, 22] },
            { signo: "Libra", emoji: "♎", elemento: "Ar", planeta: "Vênus", start: [9, 23], end: [10, 22] },
            { signo: "Escorpião", emoji: "♏", elemento: "Água", planeta: "Plutão", start: [10, 23], end: [11, 21] },
            { signo: "Sagitário", emoji: "♐", elemento: "Fogo", planeta: "Júpiter", start: [11, 22], end: [12, 21] },
            { signo: "Capricórnio", emoji: "♑", elemento: "Terra", planeta: "Saturno", start: [12, 22], end: [12, 31] },
          ];
          for (const s of signs) {
            const afterStart = month > s.start[0] || (month === s.start[0] && day >= s.start[1]);
            const beforeEnd = month < s.end[0] || (month === s.end[0] && day <= s.end[1]);
            if (afterStart && beforeEnd) return s;
          }
          return signs[0]; // Capricórnio default
        };

        // Map sign name to data
        const getSignFromName = (name: string): { signo: string; emoji: string; elemento: string; planeta: string } | null => {
          const signMap: Record<string, { signo: string; emoji: string; elemento: string; planeta: string }> = {
            "áries": { signo: "Áries", emoji: "♈", elemento: "Fogo", planeta: "Marte" },
            "aries": { signo: "Áries", emoji: "♈", elemento: "Fogo", planeta: "Marte" },
            "touro": { signo: "Touro", emoji: "♉", elemento: "Terra", planeta: "Vênus" },
            "gêmeos": { signo: "Gêmeos", emoji: "♊", elemento: "Ar", planeta: "Mercúrio" },
            "gemeos": { signo: "Gêmeos", emoji: "♊", elemento: "Ar", planeta: "Mercúrio" },
            "câncer": { signo: "Câncer", emoji: "♋", elemento: "Água", planeta: "Lua" },
            "cancer": { signo: "Câncer", emoji: "♋", elemento: "Água", planeta: "Lua" },
            "leão": { signo: "Leão", emoji: "♌", elemento: "Fogo", planeta: "Sol" },
            "leao": { signo: "Leão", emoji: "♌", elemento: "Fogo", planeta: "Sol" },
            "virgem": { signo: "Virgem", emoji: "♍", elemento: "Terra", planeta: "Mercúrio" },
            "libra": { signo: "Libra", emoji: "♎", elemento: "Ar", planeta: "Vênus" },
            "escorpião": { signo: "Escorpião", emoji: "♏", elemento: "Água", planeta: "Plutão" },
            "escorpiao": { signo: "Escorpião", emoji: "♏", elemento: "Água", planeta: "Plutão" },
            "sagitário": { signo: "Sagitário", emoji: "♐", elemento: "Fogo", planeta: "Júpiter" },
            "sagitario": { signo: "Sagitário", emoji: "♐", elemento: "Fogo", planeta: "Júpiter" },
            "capricórnio": { signo: "Capricórnio", emoji: "♑", elemento: "Terra", planeta: "Saturno" },
            "capricornio": { signo: "Capricórnio", emoji: "♑", elemento: "Terra", planeta: "Saturno" },
            "aquário": { signo: "Aquário", emoji: "♒", elemento: "Ar", planeta: "Urano" },
            "aquario": { signo: "Aquário", emoji: "♒", elemento: "Ar", planeta: "Urano" },
            "peixes": { signo: "Peixes", emoji: "♓", elemento: "Água", planeta: "Netuno" },
          };
          return signMap[name.toLowerCase().trim()] || null;
        };

        let signData: { signo: string; emoji: string; elemento: string; planeta: string } | null = null;
        let birthDateStr: string | null = null;
        let shouldAskSign = false;

        if (videnteSignMatch) {
          // "meu signo sagitário" or "signo de leão"
          signData = getSignFromName(videnteSignMatch[1].trim());
          if (!signData) shouldAskSign = true;
        } else if (birthdayMatch && !videnteMatch) {
          // Skip — birthday match alone shouldn't trigger vidente
          // (will be caught by the regular flow)
        } else if (videnteMatch) {
          // Check if we already have signo in memory
          try {
            const memory = await fetchClientMemory(supabase, phoneNumber);
            if (memory?.preferences?.signo) {
              signData = getSignFromName(memory.preferences.signo);
            }
          } catch {}
          if (!signData) shouldAskSign = true;
        }

        // Check if user is answering the "what's your sign?" question
        if (!signData && !shouldAskSign && !videnteMatch) {
          const { data: convForVidente } = await supabase
            .from("whatsapp_conversations")
            .select("id, collected_data")
            .eq("phone_number", phoneNumber)
            .order("updated_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (convForVidente) {
            const vData = (convForVidente.collected_data as Record<string, any>) || {};
            if (vData._vidente_waiting_sign) {
              // User is replying with sign or birthday
              signData = getSignFromName(lowerMsgVidente);
              if (!signData && birthdayMatch) {
                const day = parseInt(birthdayMatch[1]);
                const month = parseInt(birthdayMatch[2]);
                if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
                  signData = getSignFromDate(day, month);
                  birthDateStr = `${birthdayMatch[1]}/${birthdayMatch[2]}`;
                }
              }
              if (!signData) {
                await ensureConversationAndSaveMessage(phoneNumber, contactName, messageText);
                await sendWhatsAppMessage(phoneNumber, "🤔 Não reconheci esse signo. Tenta de novo!\n\nExemplos: *Áries*, *Touro*, *Gêmeos*...\nOu mande sua data de nascimento: *25/03*");
                return new Response(JSON.stringify({ status: "ok", vidente_retry: true }), {
                  status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
              }
              // Clear waiting flag
              const cleanData = { ...vData };
              delete cleanData._vidente_waiting_sign;
              await supabase.from("whatsapp_conversations").update({
                collected_data: cleanData,
              }).eq("id", convForVidente.id);
            }
          }
        }

        if (shouldAskSign) {
          const savedConv = await ensureConversationAndSaveMessage(phoneNumber, contactName, messageText);
          const askMsg = "🔮 *Téo Vidente — Mapa Astral de Viagem*\n\nQual é o seu signo? ♈♉♊♋♌♍♎♏♐♑♒♓\n\nOu me manda sua data de nascimento (DD/MM) que eu descubro! 🌟";
          await sendWhatsAppMessage(phoneNumber, askMsg);

          if (savedConv) {
            const existingData = (savedConv.collected_data as Record<string, any>) || {};
            await supabase.from("whatsapp_conversations").update({
              collected_data: { ...existingData, _vidente_waiting_sign: true },
            }).eq("id", savedConv.id);

            const updH = [
              ...((savedConv.messages_history as any[]) || []),
              { role: "assistant", content: askMsg, timestamp: new Date().toISOString() },
            ];
            await supabase.from("whatsapp_conversations").update({ messages_history: updH }).eq("id", savedConv.id);
          }

          return new Response(JSON.stringify({ status: "ok", vidente_asking_sign: true }), {
            status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (signData) {
          const savedConv = await ensureConversationAndSaveMessage(phoneNumber, contactName, messageText);
          await sendWhatsAppMessage(phoneNumber, `🔮 *Consultando os astros para ${signData.signo}...*\nIsso pode levar alguns segundos! ✨`);

          // Gather DNA context for cross-referencing
          let dnaContext = "";
          let clientNameForVidente = contactName || "Viajante";
          try {
            const memory = await fetchClientMemory(supabase, phoneNumber);
            if (memory) {
              if (memory.client_name) clientNameForVidente = memory.client_name;
              const prefs = (memory.preferences as Record<string, any>) || {};
              if (prefs.dna_viajante) {
                const dna = prefs.dna_viajante;
                dnaContext = `\nDNA DE VIAJANTE DO CLIENTE:\n- Explorador: ${dna.explorador || 0}%\n- Culturalista: ${dna.culturalista || 0}%\n- Gourmet: ${dna.gourmet || 0}%\n- Zen: ${dna.zen || 0}%\n- Socialite: ${dna.socialite || 0}%`;
              }
            }
          } catch {}

          const currentMonth = new Date().toLocaleString("pt-BR", { month: "long", timeZone: "America/Sao_Paulo" });
          const currentYear = new Date().getFullYear();

          const videntePrompt = `Você é o Téo Vidente 🔮, astrólogo de viagens da Tomorrow Travel.

Gere um MAPA ASTRAL DE VIAGEM personalizado para o cliente.

SIGNO: ${signData.signo} (${signData.emoji})
ELEMENTO: ${signData.elemento}
PLANETA REGENTE: ${signData.planeta}
NOME DO CLIENTE: ${clientNameForVidente}
${dnaContext}

FORMATO (WhatsApp com emojis, *negrito* e _itálico_):

🔮 *Téo Vidente — Seu Mapa Astral de Viagem*

${signData.emoji} *${signData.signo}* | ${signData.elemento} | ${signData.planeta}
_[Frase poética de 1 linha sobre o signo como viajante]_

🌟 *Seu Perfil Astral de Viajante:*
[3-4 linhas descrevendo a personalidade viajante baseada no signo. Seja específico e divertido. Se houver DNA, cruze: "Seu lado ${signData.signo} combina com seu DNA Explorador pra criar um viajante imbatível!"]

✈️ *3 Destinos do seu Signo:*
1. [bandeira] *[Destino específico]* — [Por que combina com o signo + justificativa astrológica criativa em 1 linha]
2. [bandeira] *[Destino específico]* — [Por que combina]
3. [bandeira] *[Destino específico]* — [Por que combina]

🔮 *Horóscopo de Viagem — ${currentMonth} ${currentYear}:*
[3-4 linhas com previsões divertidas sobre viagens para este mês. Mencione planetas, fases da lua, alinhamentos. Seja criativo mas positivo.]

${dnaContext ? `\n🧬 *Signo + DNA:*\n[1-2 linhas cruzando signo com DNA. Ex: "Sagitário + Gourmet = rota gastronômica pelo sudeste asiático!"]` : ""}

💡 Quer que eu monte um roteiro pra algum desses destinos? 😊✈️

REGRAS:
- Destinos REAIS e ESPECÍFICOS (não "Europa", mas "Santorini, Grécia")
- Justificativas astrológicas criativas e divertidas (mas sem inventar dados científicos)
- Se houver DNA de Viajante, CRUZE os perfis para sugestões mais refinadas
- Tom divertido e místico, mas sem forçar
- Máximo 3000 caracteres
- Use emojis de bandeiras dos países dos destinos`;

          try {
            const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${LOVABLE_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "google/gemini-2.5-flash",
                messages: [
                  { role: "system", content: videntePrompt },
                  { role: "user", content: "Gere o mapa astral de viagem personalizado." },
                ],
                max_tokens: 4000,
              }),
            });

            if (!response.ok) {
              console.error("[VIDENTE] AI error:", response.status);
              await sendWhatsAppMessage(phoneNumber, "😅 Os astros não colaboraram agora. Tenta de novo em alguns segundos! 🌟");
              return new Response(JSON.stringify({ status: "ok", vidente_error: true }), {
                status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
              });
            }

            const data = await response.json();
            const videnteResult = data.choices?.[0]?.message?.content || "Erro ao consultar os astros.";

            // Split if too long
            if (videnteResult.length > 4000) {
              const mid = videnteResult.lastIndexOf("\n", 3900);
              await sendWhatsAppMessage(phoneNumber, videnteResult.substring(0, mid > 0 ? mid : 3900));
              await sendWhatsAppMessage(phoneNumber, videnteResult.substring(mid > 0 ? mid : 3900));
            } else {
              await sendWhatsAppMessage(phoneNumber, videnteResult);
            }

            // Save signo to client_memory
            try {
              const memory = await fetchClientMemory(supabase, phoneNumber);
              const mergedPrefs = { ...(memory?.preferences || {}) };
              mergedPrefs.signo = signData.signo;
              if (birthDateStr) mergedPrefs.data_nascimento = birthDateStr;
              mergedPrefs.ultimo_horoscopo = {
                data: new Date().toISOString().split("T")[0],
                signo: signData.signo,
                preview: videnteResult.substring(0, 200),
              };

              const normalizedWhatsapp = phoneNumber.replace(/\D/g, "");
              const whatsappForDb = normalizedWhatsapp.startsWith("55") ? normalizedWhatsapp : `55${normalizedWhatsapp}`;

              if (memory) {
                await supabase.from("client_memory").update({
                  preferences: mergedPrefs,
                  last_interaction_at: new Date().toISOString(),
                }).eq("id", memory.id);
              } else {
                await supabase.from("client_memory").insert({
                  whatsapp: whatsappForDb,
                  client_name: clientNameForVidente,
                  preferences: mergedPrefs,
                  last_interaction_at: new Date().toISOString(),
                });
              }
              console.log("[VIDENTE] Signo saved to client_memory:", signData.signo);
            } catch (memErr) {
              console.error("[VIDENTE] Memory save error:", memErr);
            }

            // Mode messages NOT saved to messages_history to keep main context clean

            console.log(`[VIDENTE] Generated for ${phoneNumber}, signo: ${signData.signo}`);
          } catch (err) {
            console.error("[VIDENTE] Error:", err);
            await sendWhatsAppMessage(phoneNumber, "😅 Erro ao consultar os astros. Tenta de novo!");
          }

          return new Response(JSON.stringify({ status: "ok", vidente: signData.signo }), {
            status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      // ========== AUTO-DEACTIVATE MODES AFTER 5 MINUTES OF INACTIVITY ==========
      {
        const { data: convForTimeout } = await supabase
          .from("whatsapp_conversations")
          .select("id, collected_data")
          .eq("phone_number", phoneNumber)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (convForTimeout) {
          const td = (convForTimeout.collected_data as Record<string, any>) || {};
          const modeActivatedAt = td._mode_activated_at;
          const FIVE_MINUTES = 5 * 60 * 1000;

          if (modeActivatedAt && (Date.now() - new Date(modeActivatedAt).getTime()) > FIVE_MINUTES) {
            // Check if any special mode is active (NOT cotacao — cotacao never auto-expires)
            const hasChef = td._chef_mode === true;
            const hasTranslator = td._translator_mode === true;
            const hasGroup = !!td._group_mode;
            const hasDna = td._dna_mode === "questioning";
            const hasVidente = td._vidente_waiting_sign === true;

            const hasSchool = td._school_mode === true;

            if (hasChef || hasTranslator || hasGroup || hasDna || hasVidente || hasSchool) {
              const cleanTd = { ...td };

              if (hasChef) {
                cleanTd._chef_mode = false;
                cleanTd._chef_menu_analysis = null;
              }
              if (hasTranslator) {
                cleanTd._translator_mode = false;
                cleanTd._translator_target_lang = null;
              }
              if (hasGroup) {
                delete cleanTd._group_mode;
                delete cleanTd._group_id;
                delete cleanTd._group_step;
                delete cleanTd._group_name;
                delete cleanTd._group_expected;
                delete cleanTd._active_groups;
              }
              if (hasDna) {
                delete cleanTd._dna_mode;
                delete cleanTd._dna_step;
                delete cleanTd._dna_answers;
              }
              if (hasVidente) {
                delete cleanTd._vidente_waiting_sign;
              }
              if (hasSchool) {
                cleanTd._school_mode = false;
                delete cleanTd._school_step;
                delete cleanTd._school_target_phrase;
                delete cleanTd._school_quiz_answer;
                // Keep progress: _school_lang, _school_level, _school_module, _school_lesson, _school_score
              }

              delete cleanTd._mode_activated_at;

              await supabase.from("whatsapp_conversations")
                .update({ collected_data: cleanTd })
                .eq("id", convForTimeout.id);

              const expiredModes = [
                hasChef && "Chef", hasTranslator && "Tradutor", hasGroup && "Galera",
                hasDna && "DNA", hasVidente && "Vidente", hasSchool && "School"
              ].filter(Boolean);
              console.log(`⏰ Auto-deactivated modes [${expiredModes.join(", ")}] after 5min inactivity for ${phoneNumber}`);
            }
          }
        }
      }

      {
        const { data: convForModeCheck } = await supabase
          .from("whatsapp_conversations")
          .select("id, collected_data, messages_history")
          .eq("phone_number", phoneNumber)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (convForModeCheck) {
          const normalizedMsg = (messageText || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim();

          const switchIntentSignals = /(?:quero cotar|cotar|cotacao|quanto custa|preco|valor|orcamento|pacote|passagem|reserva|reservar|destino|viagem|modo cotacao|modo concierge|modo normal|sair modo|tradutor|modo tradutor|chef|modo chef|meu dna|dna viajante|roleta|oraculo|vidente|mapa astral|criar grupo|entrar grupo|resultado grupo|meu grupo|sair grupo|datas grupo|minhas datas|votar|cancelar|parar|sair|escola|school)/i;

          const modeData = (convForModeCheck.collected_data as Record<string, any>) || {};
          const updatedModeData = { ...modeData };
          const clearedModes: string[] = [];

          if (switchIntentSignals.test(normalizedMsg)) {
            if (updatedModeData._chef_mode === true) {
              updatedModeData._chef_mode = false;
              updatedModeData._chef_menu_analysis = null;
              clearedModes.push("chef");
            }
            if (updatedModeData._translator_mode === true) {
              updatedModeData._translator_mode = false;
              updatedModeData._translator_target_lang = null;
              clearedModes.push("tradutor");
            }
            if (updatedModeData._group_mode === "questioning") {
              delete updatedModeData._group_mode;
              delete updatedModeData._group_id;
              delete updatedModeData._group_step;
              clearedModes.push("galera");
            }
            if (updatedModeData._dna_mode === "questioning") {
              delete updatedModeData._dna_mode;
              delete updatedModeData._dna_step;
              delete updatedModeData._dna_answers;
              clearedModes.push("dna");
            }
            if (updatedModeData._vidente_waiting_sign === true) {
              delete updatedModeData._vidente_waiting_sign;
              clearedModes.push("vidente");
            }
            if (updatedModeData._school_mode === true) {
              updatedModeData._school_mode = false;
              delete updatedModeData._school_step;
              delete updatedModeData._school_target_phrase;
              delete updatedModeData._school_quiz_answer;
              clearedModes.push("school");
            }

            if (clearedModes.length > 0) {
              await supabase
                .from("whatsapp_conversations")
                .update({ collected_data: updatedModeData })
                .eq("id", convForModeCheck.id);

              console.log(`Auto-exit modes [${clearedModes.join(", ")}] on intent switch: "${normalizedMsg.substring(0, 80)}"`);
            }
          }

          // Translator mode isolation removed — translator now handles text, audio, and images in the main translator block above

          if (updatedModeData._chef_mode === true && messageType !== "image") {
            const chefMsgLower = normalizedMsg;

            const explicitExitSignals = /(?:quanto custa|preco|valor|orcamento|pacote|cotar|cotacao|quero viajar|viagem para|passagem|reservar|disponibilidade|quantas pessoas|lua de mel|ferias|feriado|promoc|oferta|destino|pra onde|para onde|conhecer|quero ir|vamos para|bora para|me leva|minha viagem|durante a viagem|no hotel|checkin|check-in|checkout|check-out|meu voo|horario do voo|o que fazer|perto de mim|proximo|perto daqui|localizacao|emergencia|sos|hospital|farmacia|embaixada|traduz|tradutor|playlist|gastei|meus gastos|roleta|oraculo|vidente|meu dna|dna viajante|mapa astral|meu signo|horoscopo|compatibilidade|criar grupo|modo cotacao|modo concierge|modo normal|sair modo|modo auto|modos|menu modos)/i;

            const chefSignals = /(?:prato|comer|vegetariano|gluten|beber|sobremesa|ingrediente|leve|pesado|comida|vegano|lactose|alergen|drink|vinho|cerveja|suco|agua|cafe|doce|salgado|frito|grelhado|assado|cru|sashimi|sushi|pizza|hamburguer|salada|sopa|entrada|principal|acompanhamento|guarnicao|porcao|dose|copo|garrafa|harmoniza|sugest|recomend|indica.*prato|o que tem de|opcao|opcoes|quanto.*prato|mais barato|mais caro|sem lactose|sem gluten|alergico|alergia|intolerancia)/i;

            const wantsToExit = explicitExitSignals.test(chefMsgLower);
            const isAboutFood = chefSignals.test(chefMsgLower);
            const shouldAutoExit = wantsToExit || !isAboutFood;

            if (shouldAutoExit) {
              const updatedCollected = { ...updatedModeData, _chef_mode: false, _chef_menu_analysis: null };
              await supabase.from("whatsapp_conversations").update({ collected_data: updatedCollected }).eq("id", convForModeCheck.id);
              console.log(`Auto-exiting Chef Mode — wantsExit=${wantsToExit}, isFood=${isAboutFood}: "${chefMsgLower.substring(0, 50)}"`);
            } else {
              const savedMenuAnalysis = updatedModeData._chef_menu_analysis || "";

              if (!savedMenuAnalysis) {
                const noMenuMsg = "👨‍🍳 *Modo Chef ativo!*\n\nPrimeiro, mande uma *foto do cardápio* 📸 que eu analiso pra você!\n\nDepois da análise, pode me perguntar coisas como:\n• _\"Quero algo leve\"_\n• _\"O que tem sem glúten?\"_\n• _\"Qual o melhor custo-benefício?\"_\n\nPara sair: *sair chef*";
                await sendWhatsAppMessage(phoneNumber, noMenuMsg);

                // Mode messages NOT saved to messages_history to keep main context clean
                // Reset timer
                await supabase.from("whatsapp_conversations").update({ collected_data: { ...updatedModeData, _mode_activated_at: new Date().toISOString() } }).eq("id", convForModeCheck.id);

                return new Response(JSON.stringify({ status: "ok", mode_isolation: "chef_no_menu" }), {
                  status: 200,
                  headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
              }

              let chefResponse = "";
              try {
                let exchangeRateInfo = "";
                try {
                  const rateRes = await fetch("https://open.er-api.com/v6/latest/USD");
                  if (rateRes.ok) {
                    const rateData = await rateRes.json();
                    const brlRate = rateData.rates?.BRL;
                    if (brlRate) {
                      exchangeRateInfo = `\n\nCOTAÇÃO DO DIA: 1 USD = R$ ${brlRate.toFixed(2)}`;
                    }
                  }
                } catch (e) {
                  console.error("Exchange rate fetch error:", e);
                }

                const CHEF_MENU_CONTEXT_PROMPT = `Você é o Téo, um assistente culinário expert da Tomorrow Travel. Você está no *Modo Chef* 👨‍🍳.

O cliente já enviou uma foto do cardápio e aqui está a análise completa:

--- CARDÁPIO ANALISADO ---
${savedMenuAnalysis}
--- FIM DO CARDÁPIO ---
${exchangeRateInfo}

SUAS TAREFAS:
- Responder perguntas do cliente BASEADO nos itens do cardápio acima
- Se o cliente pedir algo "leve", "sem glúten", "vegetariano", etc., sugira itens ESPECÍFICOS do cardápio
- Cite o nome exato do prato e o preço quando disponível
- Se perguntarem algo que não está no cardápio, avise educadamente
- Sugira harmonizações com bebidas quando relevante
- **CONVERSÃO DE MOEDA**: Se os preços do cardápio estiverem em dólares (USD, $, US$), SEMPRE mostre abaixo de cada preço em dólar o valor equivalente em reais (R$) usando a cotação do dia fornecida acima. Formato: "$15.00 (~R$ XX,XX)"
- Se não houver cotação disponível, use R$ 5,50 como estimativa e avise que é aproximado

REGRAS:
- Responda SEMPRE em português brasileiro
- Use formatação WhatsApp: *negrito*, _itálico_, emojis
- Seja conciso (máximo 3 parágrafos)
- Base suas respostas EXCLUSIVAMENTE no cardápio analisado
- Foque nas perguntas sobre o cardápio. Se o cliente perguntar algo genérico não relacionado, responda brevemente e volte ao contexto do cardápio
- Nunca sugira cotações de viagem
- Lembre que o cliente pode enviar outra foto de cardápio a qualquer momento`;

                const chefAiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${LOVABLE_API_KEY}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    model: "google/gemini-2.5-flash",
                    messages: [
                      { role: "system", content: CHEF_MENU_CONTEXT_PROMPT },
                      { role: "user", content: messageText },
                    ],
                    max_tokens: 2000,
                  }),
                });

                if (chefAiResponse.ok) {
                  const chefJson = await chefAiResponse.json();
                  chefResponse = chefJson.choices?.[0]?.message?.content || "";
                }
              } catch (e) {
                console.error("Chef mode AI error:", e);
              }

              if (!chefResponse) {
                chefResponse = "👨‍🍳 Não consegui processar sua pergunta. Tente novamente ou mande outra *foto do cardápio*! 📸\n\nPara sair: *sair chef*";
              }

              await sendWhatsAppMessage(phoneNumber, chefResponse);

              // Mode messages NOT saved to messages_history to keep main context clean
              // Reset timer
              await supabase.from("whatsapp_conversations").update({ collected_data: { ...updatedModeData, _mode_activated_at: new Date().toISOString() } }).eq("id", convForModeCheck.id);

              return new Response(JSON.stringify({ status: "ok", mode_isolation: "chef_menu_qa" }), {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              });
            }
          }
        }
      }
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

      // ========== SISTEMA DE MODOS DO TÉO ==========
      {
        const modoLower = messageText.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const modoCotacaoRegex = /^(modo cota[cç][aã]o|cotar|quero cotar)$/i;
        const modoConciergeRegex = /^(modo concierge|concierge|minha viagem)$/i;
        const modoMenuRegex = /^(modo|modos|menu modos?)$/i;
        const modoSairRegex = /^(sair modo|modo normal|modo auto|modo automatico)$/i;

        const isModoCommand = modoCotacaoRegex.test(modoLower) || modoConciergeRegex.test(modoLower) || modoMenuRegex.test(modoLower) || modoSairRegex.test(modoLower);

        if (isModoCommand) {
          await ensureConversationAndSaveMessage(phoneNumber, contactName, messageText);
          const { data: convForMode } = await supabase
            .from("whatsapp_conversations")
            .select("id, collected_data, messages_history")
            .eq("phone_number", phoneNumber)
            .order("updated_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (convForMode) {
            const cd = (convForMode.collected_data as Record<string, any>) || {};
            const currentMode = cd._teo_mode || "auto";
            let newMode = currentMode;
            let responseMsg = "";

            if (modoCotacaoRegex.test(modoLower)) {
              newMode = "cotacao";
              responseMsg = "✈️ *Modo Cotação Ativado!*\n\nAgora estou focado em te ajudar a encontrar a viagem perfeita! Me conta pra onde quer ir? 🌍";
            } else if (modoConciergeRegex.test(modoLower)) {
              newMode = "concierge";
              responseMsg = "🎒 *Modo Concierge Ativado!*\n\nAgora sou seu companheiro de viagem! Me conta como posso te ajudar durante a viagem 😊";
            } else if (modoSairRegex.test(modoLower)) {
              newMode = "auto";
              responseMsg = "🔄 *Modo Automático Ativado!*\n\nAgora eu decido o melhor modo pra te atender. É só me mandar sua mensagem! 😊";
            } else if (modoMenuRegex.test(modoLower)) {
              const modeLabel = currentMode === "cotacao" ? "✈️ Cotação" : currentMode === "concierge" ? "🎒 Concierge" : "🔄 Automático";
              responseMsg = `🎯 *Modos do Téo:*\n\n✈️ *Cotação* — Te ajudo a encontrar e cotar viagens\n👉 mande: *modo cotação*\n\n🎒 *Concierge* — Sou seu companheiro durante a viagem\n👉 mande: *modo concierge*\n\n👨‍🍳 *Chef* — Traduzo e explico cardápios (envie foto!)\n👉 envie uma *foto de cardápio*\n\n🧬 *DNA Viajante* — Descubra seu perfil de viajante\n👉 mande: *meu dna*\n\n🎰 *Roleta* — Destino aleatório surpresa\n👉 mande: *roleta*\n\n🔮 *Oráculo* — Previsão personalizada da viagem\n👉 mande: *oráculo*\n\n🆘 *SOS* — Assistência de emergência\n👉 mande: *sos*\n\n🎵 *Playlist* — Playlist personalizada da viagem\n👉 mande: *playlist*\n\n💰 *Carteira* — Controle de gastos da viagem\n👉 mande: *gastei [valor]*\n\n🌐 *Tradutor* — Tradução universal\n👉 mande: *traduzir [texto]*\n\n👥 *Modo Galera* — Planeje viagem em grupo\n👉 mande: *criar grupo*\n📅 Negociador de Datas: *minhas datas* + *datas grupo*\n\n💕 *Compatibilidade* — Compare perfis de viajante\n👉 mande: *compatibilidade com [número]*\n\n🔄 *Automático* — Eu decido o melhor modo\n👉 mande: *sair modo*\n\n📌 Modo atual: *${modeLabel}*`;
            }

            const updatedCd = { ...cd, _teo_mode: newMode };
            const updatedHistory = [
              ...((convForMode.messages_history as any[]) || []),
              { role: "assistant", content: responseMsg, timestamp: new Date().toISOString() },
            ];
            await supabase.from("whatsapp_conversations").update({ collected_data: updatedCd, messages_history: updatedHistory }).eq("id", convForMode.id);
            await sendWhatsAppMessage(phoneNumber, responseMsg);

            return new Response(JSON.stringify({ status: "ok", teo_mode: newMode }), {
              status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
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

      // ========== WELCOME MESSAGE FOR NEW CONTACTS ==========
      // If conversation_state is "greeting" and no _teo_mode set and only 1 message (first contact)
      const isFirstContact = conversation.conversation_state === "greeting" && !collectedData._teo_welcome_sent;
      if (isFirstContact) {
        const firstName = (contactName || "").trim().split(" ")[0] || "viajante";
        const welcomeMsg = `Olá, ${firstName}! 👋 Eu sou o *Téo*, seu assistente de viagens da *Tomorrow Travel*! ✈️🌎\n\nComo posso te ajudar hoje? Escolha um dos modos abaixo:\n\n✈️ *Cotação* — Encontro a viagem perfeita pra você!\n👉 mande: *modo cotação*\n\n🎒 *Concierge* — Sou seu companheiro durante a viagem\n👉 mande: *modo concierge*\n\nOu simplesmente me conte o que precisa que eu já vou te ajudar! 😊`;

        // Mark welcome as sent and update state
        const updatedCd = { ...collectedData, _teo_welcome_sent: true };
        const updatedHistory = [
          ...((conversation.messages_history as any[]) || []),
          { role: "assistant", content: welcomeMsg, timestamp: new Date().toISOString() },
        ];
        await supabase.from("whatsapp_conversations").update({
          collected_data: updatedCd,
          messages_history: updatedHistory,
          conversation_state: "chatting",
        }).eq("id", conversation.id);

        await sendWhatsAppMessage(phoneNumber, welcomeMsg);

        // Don't return — continue processing the user's message so they get a response too
        // Update local references
        conversation.collected_data = updatedCd;
        conversation.messages_history = updatedHistory;
        conversation.conversation_state = "chatting";
      }

      // Legacy verification code handling removed — direct API doesn't need verification codes

      // Build messages for AI — filter out orphan survey responses and limit history
      const rawHistory = (conversation.messages_history as any[] || []);
      
      // Smart filtering: remove orphan sequences (multiple user msgs without assistant response)
      // and very short messages typical of survey/questionnaire answers
      const filteredHistory: any[] = [];
      for (let i = 0; i < rawHistory.length; i++) {
        const msg = rawHistory[i];
        if (!msg?.content) continue;
        
        const content = (msg.content || "").trim();
        const isUser = msg.role === "user";
        
        // Skip very short user messages (1-2 chars like "2", "3") that are survey answers
        // UNLESS they are the last message (the current one)
        if (isUser && content.length <= 2 && i < rawHistory.length - 1) {
          continue;
        }
        
        // Skip user messages that look like survey answers (just a number, "sim", "não", etc.)
        // UNLESS they are the last message
        if (isUser && i < rawHistory.length - 1 && /^(?:\d{1,2}|sim|nao|não|nenhum|votar\s*\d)$/i.test(content)) {
          continue;
        }
        
        filteredHistory.push(msg);
      }
      
      // Limit to last 20 messages to avoid context overflow
      const limitedHistory = filteredHistory.slice(-20);
      
      const historyForAi = limitedHistory.map((msg: any) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
      }));

      // Fetch client memory for personalization
      const clientMemory = await fetchClientMemory(supabase, phoneNumber);
      const memoryContext = clientMemory ? formatMemoryForPrompt(clientMemory) : "";
      if (clientMemory) {
        console.log("[MEMORY] Found memory for", phoneNumber, "- name:", clientMemory.client_name);
      }

      // ========== AUTO-DETECT MODE FROM MESSAGE CONTENT ==========
      // Analyze message to intelligently switch modes — works for ALL modes, not just "auto"
      let effectiveTeoMode = collectedData._teo_mode || "auto";
      
      {
        const msgLower = (messageText || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        
        // Concierge intent signals: travel companion needs, location queries, trip logistics
        const conciergeSignals = /(?:minha viagem|durante a viagem|no hotel|checkin|check-in|checkout|check-out|voo atras|meu voo|horario do voo|dica.*(restaurante|passeio|lugar)|o que fazer|perto de mim|proximo|perto daqui|localizacao|emergencia|sos|hospital|farmacia|embaixada|traduz|playlist|gastei|meus gastos|roleta|oraculo|vidente)/i;
        
        // Cotação intent signals: pricing, booking, destination planning  
        const cotacaoSignals = /(?:quanto custa|preco|valor|orcamento|pacote|cotar|cotacao|quero viajar|viagem para|passagem|reservar|disponibilidade|data.*(ida|volta)|quantas pessoas|lua de mel|ferias|feriado|promoc|oferta|destino|pra onde|para onde|conhecer|quero ir|vamos para|bora para|me leva)/i;
        
        const hasConcierge = conciergeSignals.test(msgLower);
        const hasCotacao = cotacaoSignals.test(msgLower);
        
        if (effectiveTeoMode === "auto") {
          // Auto mode: detect and switch
          if (hasConcierge) {
            effectiveTeoMode = "concierge";
            console.log(`🔄 Auto-detected CONCIERGE mode from message content`);
          } else if (hasCotacao) {
            effectiveTeoMode = "cotacao";
            console.log(`🔄 Auto-detected COTAÇÃO mode from message content`);
          }
        } else if (effectiveTeoMode === "cotacao" && hasConcierge && !hasCotacao) {
          // In cotação but message is clearly about concierge → switch
          effectiveTeoMode = "concierge";
          collectedData._teo_mode = "concierge";
          await supabase.from("whatsapp_conversations").update({
            collected_data: { ...collectedData, _teo_mode: "concierge" }
          }).eq("id", conversation.id);
          console.log(`🔄 Auto-switched from COTAÇÃO → CONCIERGE`);
        } else if (effectiveTeoMode === "concierge" && hasCotacao && !hasConcierge) {
          // In concierge but message is clearly about cotação → switch
          effectiveTeoMode = "cotacao";
          collectedData._teo_mode = "cotacao";
          await supabase.from("whatsapp_conversations").update({
            collected_data: { ...collectedData, _teo_mode: "cotacao" }
          }).eq("id", conversation.id);
          console.log(`🔄 Auto-switched from CONCIERGE → COTAÇÃO`);
        }
        // If no opposing signal detected, keep current mode
      }

      // Check if this client is a concierge client (active trip) — use concierge prompt instead of sales
      // RESPECTS _teo_mode: if client forced a mode, honor it
      let conciergePromptOverride: string | null = null;
      let conciergeContactContext: any = null;
      const teoMode = effectiveTeoMode;
      
      // If mode is "cotacao", skip concierge entirely (force sales prompt)
      if (teoMode !== "cotacao") {
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
              activeTripForPrompt.client_name = contactMatch.contact_name;
            }
          }
        }

        // If mode is "concierge" but no active trip, build minimal context
        if (!activeTripForPrompt && teoMode === "concierge") {
          // Try to find any recent client_trips for context
          const { data: recentTrip } = await supabase
            .from("client_trips")
            .select("destination_name, departure_date, return_date, hotel_name")
            .order("departure_date", { ascending: false })
            .limit(1)
            .maybeSingle();
          
          // Build a minimal concierge prompt even without active_trip
          const minCtx = recentTrip
            ? `\n\nCONTEXTO: O cliente ativou o modo concierge manualmente. Última viagem conhecida: ${recentTrip.destination_name}. Ajude como companheiro de viagem.`
            : `\n\nCONTEXTO: O cliente ativou o modo concierge manualmente. Sem dados de viagem ativa. Pergunte sobre a viagem atual para poder ajudar melhor.`;
          conciergePromptOverride = TEO_CONCIERGE_PROMPT + minCtx;
          console.log(`🎒 Using CONCIERGE prompt (forced mode, no active trip) for ${phoneNumber}`);
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
        // Check for itinerary visual tag BEFORE cleaning
        const itineraryDataFromTag = parseItineraryVisualTag(aiResponse);
        
        let cleanResponse = cleanAiResponse(aiResponse);

        // Safety: strip any remaining hallucinated external links
        if (/https?:\/\/[^\s]*(?:typeform|jotform|google.*form|forms\.gle|bit\.ly|tally|survey)/i.test(cleanResponse)) {
          cleanResponse = cleanResponse.replace(/https?:\/\/[^\s]*/g, '').replace(/\[[^\]]*\]\([^)]*\)/g, '').trim();
          cleanResponse += "\n\nPara viagem em grupo, mande *criar grupo* aqui no chat! 🎉";
        }
        
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

        const itineraryData = itineraryDataFromTag || parseItineraryFromPlainText(cleanResponse);

        // Send visual itinerary card — only once
        if (itineraryData && !conversation.collected_data?._itinerary_sent) {
          const clientNameForVisual = conversation.client_name || contactName || undefined;
          const visualSent = await generateAndSendItineraryVisual(phoneNumber, itineraryData, clientNameForVisual);

          if (visualSent) {
            await supabase
              .from("whatsapp_conversations")
              .update({ collected_data: { ...(conversation.collected_data || {}), _itinerary_sent: true } })
              .eq("id", conversation.id);
          } else {
            await sendWhatsAppMessage(phoneNumber, "Não consegui gerar o card do roteiro agora 😕 Pode me pedir novamente em alguns segundos?");
          }
        } else if (isLikelyItineraryText(cleanResponse)) {
          // Never send long itinerary text, only card
          await sendWhatsAppMessage(phoneNumber, "Estou preparando seu card de roteiro 🎨 Pode me pedir de novo com o destino para eu gerar certinho.");
        } else {
          await sendWhatsAppMessage(phoneNumber, cleanResponse);
        }

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

      // Check for itinerary visual tag BEFORE cleaning
      const itineraryVisualDataFromTag = parseItineraryVisualTag(aiResponse);

      // Clean response (remove all tags)
      let cleanResponse = cleanAiResponse(aiResponse);

      // Safety: strip any remaining hallucinated external links
      if (/https?:\/\/[^\s]*(?:typeform|jotform|google.*form|forms\.gle|bit\.ly|tally|survey)/i.test(cleanResponse)) {
        cleanResponse = cleanResponse.replace(/https?:\/\/[^\s]*/g, '').replace(/\[[^\]]*\]\([^)]*\)/g, '').trim();
        cleanResponse += "\n\nPara viagem em grupo, mande *criar grupo* aqui no chat! 🎉";
      }

      // Handle quotation if triggered
      if (quotationData) {
        console.log("AI triggered quotation request:", JSON.stringify(quotationData));
        
        // Send the clean message first
        if (cleanResponse) {
          await sendWhatsAppMessage(phoneNumber, cleanResponse);
        }

        // Save quotation request to table for tracking
        const saveResult = await saveQuotationRequest(
          quotationData,
          phoneNumber,
          newCollectedData.nome || conversation.client_name || contactName,
          newCollectedData.preferencias || newCollectedData.tipo_viagem || null
        );

        // Mark quotation as triggered to prevent duplicates
        newCollectedData._quotation_triggered = true;

        // Send "searching" message immediately
        const searchingMsg = `Buscando as melhores opções para ${quotationData.destino}... ✈️🔍 Já volto!`;
        await sendWhatsAppMessage(phoneNumber, searchingMsg);

        // Update conversation state immediately
        const updatedHistory = [
          ...(conversation.messages_history as any[] || []),
          { role: "assistant", content: cleanResponse, timestamp: new Date().toISOString() },
          { role: "assistant", content: searchingMsg, timestamp: new Date().toISOString() },
        ];

        await supabase
          .from("whatsapp_conversations")
          .update({
            client_name: newCollectedData.nome || conversation.client_name || contactName,
            conversation_state: "awaiting_quotation",
            collected_data: newCollectedData,
            messages_history: updatedHistory,
            is_ai_active: true,
          })
          .eq("id", conversation.id);

        // Fire-and-forget: process quotation asynchronously via self-invocation
        const selfUrl = `${SUPABASE_URL}/functions/v1/whatsapp-webhook`;
        fetch(selfUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({
            action: "process_quotation",
            phone_number: phoneNumber,
            quotation_data: quotationData,
            save_result_id: saveResult.success ? saveResult.id : null,
            conversation_id: conversation.id,
            client_name: newCollectedData.nome || conversation.client_name || contactName || "",
            collected_data: newCollectedData,
          }),
        }).catch(err => console.error("Error scheduling async quotation:", err));

        // Return immediately to Meta webhook (fast response)
        return new Response(JSON.stringify({ status: "ok", quotation: true, async: true }), {
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

      const itineraryVisualData = itineraryVisualDataFromTag || parseItineraryFromPlainText(cleanResponse);

      // Send visual itinerary card — only once per conversation
      if (itineraryVisualData && !collectedData._itinerary_sent) {
        const clientNameForVisual = newCollectedData.nome || conversation.client_name || contactName || undefined;
        const visualSent = await generateAndSendItineraryVisual(phoneNumber, itineraryVisualData, clientNameForVisual);

        if (visualSent) {
          newCollectedData._itinerary_sent = true;
        } else {
          await sendWhatsAppMessage(phoneNumber, "Não consegui gerar o card do roteiro agora 😕 Pode me pedir novamente em alguns segundos?");
        }
      } else if (isLikelyItineraryText(cleanResponse)) {
        // Never send long itinerary text, only card
        await sendWhatsAppMessage(phoneNumber, "Estou preparando seu card de roteiro 🎨 Pode me pedir de novo com o destino para eu gerar certinho.");
      } else {
        await sendWhatsAppMessage(phoneNumber, cleanResponse);
      }

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
