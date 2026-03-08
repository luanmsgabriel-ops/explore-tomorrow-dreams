// Client Memory Helper - Fetch, format, and update client memory
import { callGemini } from "./gemini-client.ts";

interface ClientMemory {
  id: string;
  whatsapp: string;
  client_name: string | null;
  preferences: Record<string, any>;
  travel_history: any[];
  personal_notes: Record<string, any>;
  last_interaction_at: string;
}

/**
 * Fetch client memory by WhatsApp number
 */
export async function fetchClientMemory(
  supabase: any,
  whatsapp: string
): Promise<ClientMemory | null> {
  if (!whatsapp) return null;

  // Normalize: remove non-digits, ensure has country code
  const clean = whatsapp.replace(/\D/g, "");
  const variations = [clean, `55${clean}`, clean.replace(/^55/, "")];

  const { data, error } = await supabase
    .from("client_memory")
    .select("*")
    .in("whatsapp", variations)
    .order("last_interaction_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[MEMORY] Error fetching client memory:", error.message);
    return null;
  }

  return data;
}

/**
 * Format client memory into a string to inject into the system prompt
 */
export function formatMemoryForPrompt(memory: ClientMemory): string {
  const parts: string[] = [];

  parts.push(`\n\n=== MEMÓRIA DO CLIENTE (use naturalmente) ===`);

  if (memory.client_name) {
    parts.push(`Nome: ${memory.client_name}`);
  }

  // Preferences
  const prefs = memory.preferences || {};
  if (Object.keys(prefs).length > 0) {
    parts.push(`\nPREFERÊNCIAS CONHECIDAS:`);
    if (prefs.estilo_viagem) parts.push(`- Estilo: ${prefs.estilo_viagem}`);
    if (prefs.orcamento) parts.push(`- Orçamento: ${prefs.orcamento}`);
    if (prefs.tipo) parts.push(`- Tipo preferido: ${prefs.tipo}`);
    if (prefs.clima) parts.push(`- Clima: ${prefs.clima}`);
    if (prefs.companhia) parts.push(`- Companhia: ${prefs.companhia}`);
    // Any other prefs (excluding emotional fields - handled separately)
    const emotionalKeys = ["tom_emocional", "nivel_energia", "nivel_estresse", "momento_vida", "historico_emocional"];
    for (const [k, v] of Object.entries(prefs)) {
      if (!["estilo_viagem", "orcamento", "tipo", "clima", "companhia", ...emotionalKeys].includes(k) && v) {
        parts.push(`- ${k}: ${v}`);
      }
    }
  }

  // ===== EMOTIONAL PROFILE (Téo Lê Mentes) =====
  const emotional = prefs || {};
  const hasEmotionalData = emotional.tom_emocional || emotional.nivel_energia || emotional.nivel_estresse || emotional.momento_vida;
  if (hasEmotionalData) {
    parts.push(`\n🧠 PERFIL EMOCIONAL (ADAPTE SILENCIOSAMENTE — NUNCA mencione ao cliente):`);
    if (emotional.tom_emocional) parts.push(`- Tom atual: ${emotional.tom_emocional}`);
    if (emotional.nivel_energia) parts.push(`- Energia: ${emotional.nivel_energia}`);
    if (emotional.nivel_estresse) parts.push(`- Estresse: ${emotional.nivel_estresse}`);
    if (emotional.momento_vida) parts.push(`- Momento de vida: ${emotional.momento_vida}`);
    if (emotional.historico_emocional && Array.isArray(emotional.historico_emocional)) {
      const recent = emotional.historico_emocional.slice(-3);
      if (recent.length > 0) {
        parts.push(`- Tendência recente: ${recent.map((e: any) => e.tom || e).join(" → ")}`);
      }
    }
  }

  // Travel history
  const history = memory.travel_history || [];
  if (history.length > 0) {
    parts.push(`\nHISTÓRICO DE VIAGENS/INTERESSES:`);
    for (const item of history.slice(-10)) {
      const status = item.fechou ? "✅ Fechou" : item.cotou ? "📋 Cotou" : "💬 Conversou sobre";
      parts.push(`- ${status}: ${item.destino}${item.datas ? ` (${item.datas})` : ""}${item.pessoas ? `, ${item.pessoas} pessoas` : ""}`);
    }
  }

  // Personal notes
  const notes = memory.personal_notes || {};
  if (Object.keys(notes).length > 0) {
    parts.push(`\nNOTAS PESSOAIS:`);
    if (notes.aniversario) parts.push(`- Aniversário: ${notes.aniversario}`);
    if (notes.filhos && Array.isArray(notes.filhos)) {
      parts.push(`- Filhos: ${notes.filhos.map((f: any) => `${f.nome}${f.idade ? ` (${f.idade} anos)` : ""}`).join(", ")}`);
    }
    if (notes.acompanhantes) parts.push(`- Acompanhantes habituais: ${notes.acompanhantes}`);
    if (notes.observacoes) parts.push(`- Observações: ${notes.observacoes}`);
    for (const [k, v] of Object.entries(notes)) {
      if (!["aniversario", "filhos", "acompanhantes", "observacoes"].includes(k) && v) {
        parts.push(`- ${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`);
      }
    }
  }

  parts.push(`\nÚltima interação: ${new Date(memory.last_interaction_at).toLocaleDateString("pt-BR")}`);
  parts.push(`=== FIM DA MEMÓRIA ===`);

  return parts.join("\n");
}

const MEMORY_RULE = `

REGRA DE MEMÓRIA (OBRIGATÓRIO):
- Se houver MEMÓRIA DO CLIENTE acima, use-a naturalmente na conversa
- Mencione destinos já visitados ou discutidos: "Da última vez falamos sobre Maldivas, lembra?"
- Use preferências conhecidas para sugerir destinos sem precisar perguntar tudo de novo
- Se souber nomes de filhos/aniversários, mencione com naturalidade
- NÃO liste todos os dados de uma vez — use aos poucos, de forma orgânica
- Se o cliente nunca interagiu antes, siga o fluxo normal de coleta

REGRA DE ADAPTAÇÃO EMOCIONAL (TÉO LÊ MENTES — OBRIGATÓRIO):
- Se houver PERFIL EMOCIONAL acima, adapte SILENCIOSAMENTE suas sugestões:
  • Cliente estressado/cansado → Priorize destinos de descanso (spas, praias tranquilas, resorts all-inclusive)
  • Cliente animado/aventureiro → Sugira trilhas, esportes radicais, destinos vibrantes
  • Cliente nostálgico/saudoso → Sugira destinos com charme histórico, vilas acolhedoras
  • Cliente indeciso/ansioso → Seja mais assertivo, limite opções a 2-3, dê segurança
  • Cliente comemorando → Sugira experiências premium, jantares especiais, upgrades
  • Cliente econômico/preocupado com dinheiro → Foque em custo-benefício, promoções, parcelamento
- NUNCA diga "percebi que você está estressado" ou "você parece ansioso"
- NUNCA mencione a análise emocional — apenas adapte naturalmente o tom e as sugestões
- Ajuste seu tom: mais calmo e acolhedor para estressados, mais empolgado para aventureiros
- A adaptação deve ser SUTIL e INVISÍVEL para o cliente
`;

export { MEMORY_RULE };

/**
 * Extract memory data from conversation and upsert into client_memory
 * This runs AFTER the conversation stream is complete (fire-and-forget)
 */
export async function updateClientMemory(
  supabase: any,
  whatsapp: string,
  clientName: string | null,
  conversationMessages: Array<{ role: string; content: string }>,
  existingMemory: ClientMemory | null
): Promise<void> {
  if (!whatsapp || conversationMessages.length < 2) return;

  try {
    // Take last 20 messages for extraction
    const recentMessages = conversationMessages.slice(-20);
    const conversationText = recentMessages
      .map((m) => `${m.role === "user" ? "Cliente" : "Téo"}: ${m.content}`)
      .join("\n");

    const existingData = existingMemory
      ? `DADOS EXISTENTES DO CLIENTE:
Preferências: ${JSON.stringify(existingMemory.preferences)}
Histórico: ${JSON.stringify(existingMemory.travel_history)}
Notas pessoais: ${JSON.stringify(existingMemory.personal_notes)}`
      : "Cliente novo, sem dados anteriores.";

    const extractionPrompt = `Analise esta conversa entre um cliente e o Téo (consultor de viagens) e extraia dados para o perfil do cliente.

${existingData}

CONVERSA RECENTE:
${conversationText}

Extraia APENAS informações NOVAS ou ATUALIZADAS mencionadas na conversa acima. Retorne um JSON com esta estrutura:
{
  "preferences": {
    "estilo_viagem": "aventura/relaxamento/cultural/misto ou null se não mencionado",
    "orcamento": "luxo/intermediário/econômico ou null",
    "tipo": "praia/cidade/natureza/misto ou null",
    "clima": "tropical/frio/temperado ou null",
    "companhia": "casal/família/amigos/solo ou null"
  },
  "emotional_profile": {
    "tom_emocional": "detecte o tom predominante: animado/estressado/cansado/ansioso/empolgado/nostálgico/indeciso/tranquilo/comemorando/preocupado ou null",
    "nivel_energia": "alto/médio/baixo ou null (baseado na linguagem: muitos !, caps, emojis = alto; respostas curtas/secas = baixo)",
    "nivel_estresse": "alto/médio/baixo ou null (detecte sinais: pressa, reclamações, frustração, cansaço mencionado)",
    "momento_vida": "férias/lua-de-mel/aniversário/fuga-da-rotina/trabalho-remoto/família/amigos ou null"
  },
  "travel_history_new": [
    {"destino": "nome", "cotou": true/false, "fechou": true/false, "pessoas": 2, "datas": "jan/2026"}
  ],
  "personal_notes": {
    "aniversario": "DD/MM ou null",
    "filhos": [{"nome": "X", "idade": 5}],
    "acompanhantes": "nome do cônjuge etc ou null",
    "observacoes": "qualquer nota relevante ou null"
  },
  "has_new_data": true/false
}

REGRAS:
- Se não houver informação nova na conversa, retorne {"has_new_data": false}
- Use null para campos sem informação
- NÃO invente dados — extraia APENAS o que foi explicitamente mencionado ou fortemente implícito
- Para travel_history_new, inclua APENAS destinos discutidos NESTA conversa
- Para emotional_profile: analise o TOM e ENERGIA das mensagens do CLIENTE (não do Téo)
  • Sinais de estresse: "preciso sair daqui", "to exausto", "não aguento mais", "correria", respostas impacientes
  • Sinais de animação: "!!", "🔥", emojis, "mal posso esperar", "que sonho"
  • Sinais de ansiedade: muitas perguntas, "será que...", indecisão, trocar de ideia
  • Sinais de comemoração: "aniversário", "lua de mel", "promoção", "aposentadoria"
  • Sempre tente detectar o tom — mesmo respostas neutras indicam "tranquilo"
- Retorne APENAS o JSON, sem markdown, sem explicação`;

    const response = await callGemini(
      [{ role: "user", content: extractionPrompt }],
      { model: "google/gemini-2.5-flash-lite", maxTokens: 1200 }
    );

    if (!response.ok) {
      console.error("[MEMORY] Extraction AI error:", response.status);
      return;
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "";
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let extracted: any;
    try {
      extracted = JSON.parse(content);
    } catch {
      console.error("[MEMORY] Failed to parse extraction:", content.substring(0, 200));
      return;
    }

    if (!extracted.has_new_data) {
      // Just update last_interaction_at
      if (existingMemory) {
        await supabase
          .from("client_memory")
          .update({ last_interaction_at: new Date().toISOString() })
          .eq("id", existingMemory.id);
      }
      return;
    }

    // Merge preferences (new values override existing, nulls are ignored)
    const mergedPrefs = { ...(existingMemory?.preferences || {}) };
    if (extracted.preferences) {
      for (const [k, v] of Object.entries(extracted.preferences)) {
        if (v !== null && v !== undefined) {
          mergedPrefs[k] = v;
        }
      }
    }

    // ===== MERGE EMOTIONAL PROFILE (Téo Lê Mentes) =====
    if (extracted.emotional_profile) {
      const ep = extracted.emotional_profile;
      if (ep.tom_emocional) mergedPrefs.tom_emocional = ep.tom_emocional;
      if (ep.nivel_energia) mergedPrefs.nivel_energia = ep.nivel_energia;
      if (ep.nivel_estresse) mergedPrefs.nivel_estresse = ep.nivel_estresse;
      if (ep.momento_vida) mergedPrefs.momento_vida = ep.momento_vida;

      // Keep emotional history (last 10 entries) for trend detection
      const history = Array.isArray(mergedPrefs.historico_emocional) ? mergedPrefs.historico_emocional : [];
      if (ep.tom_emocional) {
        history.push({
          tom: ep.tom_emocional,
          energia: ep.nivel_energia || null,
          data: new Date().toISOString().split("T")[0],
        });
        // Keep only last 10
        mergedPrefs.historico_emocional = history.slice(-10);
      }
      console.log(`[MEMORY] Emotional profile detected: tom=${ep.tom_emocional}, energia=${ep.nivel_energia}, estresse=${ep.nivel_estresse}`);
    }

    // Merge travel history (append new entries)
    const mergedHistory = [...(existingMemory?.travel_history || [])];
    if (extracted.travel_history_new?.length > 0) {
      for (const item of extracted.travel_history_new) {
        // Avoid duplicates by destination name
        const existing = mergedHistory.find(
          (h: any) => h.destino?.toLowerCase() === item.destino?.toLowerCase()
        );
        if (existing) {
          // Update existing entry
          Object.assign(existing, item);
        } else {
          mergedHistory.push(item);
        }
      }
    }

    // Merge personal notes
    const mergedNotes = { ...(existingMemory?.personal_notes || {}) };
    if (extracted.personal_notes) {
      for (const [k, v] of Object.entries(extracted.personal_notes)) {
        if (v !== null && v !== undefined) {
          if (k === "filhos" && Array.isArray(v)) {
            // Merge children by name
            const existingKids = Array.isArray(mergedNotes.filhos) ? mergedNotes.filhos : [];
            for (const kid of v as any[]) {
              const existingKid = existingKids.find((ek: any) => ek.nome?.toLowerCase() === kid.nome?.toLowerCase());
              if (existingKid) {
                Object.assign(existingKid, kid);
              } else {
                existingKids.push(kid);
              }
            }
            mergedNotes.filhos = existingKids;
          } else {
            mergedNotes[k] = v;
          }
        }
      }
    }

    const clean = whatsapp.replace(/\D/g, "");
    const normalizedWhatsapp = clean.startsWith("55") ? clean : `55${clean}`;

    const upsertData = {
      whatsapp: existingMemory?.whatsapp || normalizedWhatsapp,
      client_name: clientName || existingMemory?.client_name || null,
      preferences: mergedPrefs,
      travel_history: mergedHistory,
      personal_notes: mergedNotes,
      last_interaction_at: new Date().toISOString(),
    };

    if (existingMemory) {
      const { error } = await supabase
        .from("client_memory")
        .update(upsertData)
        .eq("id", existingMemory.id);
      if (error) console.error("[MEMORY] Update error:", error.message);
      else console.log("[MEMORY] Updated memory for", normalizedWhatsapp);
    } else {
      const { error } = await supabase
        .from("client_memory")
        .insert(upsertData);
      if (error) console.error("[MEMORY] Insert error:", error.message);
      else console.log("[MEMORY] Created memory for", normalizedWhatsapp);
    }
  } catch (err) {
    console.error("[MEMORY] Error updating client memory:", err);
  }
}
