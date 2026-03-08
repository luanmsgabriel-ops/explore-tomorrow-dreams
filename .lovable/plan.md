

# Plano: 5 Features Téo 2030

## Features Solicitadas (uma por vez, implementação completa)
1. ✅ **Téo Grupal** — Viagem em grupo com cruzamento de preferências via WhatsApp
2. ✅ **Téo Lê Mentes** — Perfil emocional por conversa
3. 🔲 **Téo Tradutor Universal** — Tradução universal ao vivo
4. 🔲 **Téo DNA** — Perfil genético de viajante
5. 🔲 **Playlist da Viagem** — Integração Spotify completa

---

## 1. Téo Grupal (IMPLEMENTADO ✅)

### Tabelas criadas
- `travel_groups`: group_code, creator_phone, creator_name, status, final_recommendation
- `travel_group_members`: group_id, phone_number, member_name, preferences (JSONB), is_ready

### Comandos WhatsApp
| Comando | Ação |
|---------|------|
| `criar grupo` | Cria grupo, gera código 6 chars, inicia questionário |
| `entrar grupo XYZABC` | Adiciona membro, inicia questionário |
| `meu grupo` | Mostra status e membros |
| `resultado grupo` | Cruza preferências via Gemini, envia a todos |
| `sair grupo` | Remove membro |

---

## 2. Téo Lê Mentes (IMPLEMENTADO ✅)

### Conceito
Análise emocional SILENCIOSA das mensagens do cliente para adaptar recomendações automaticamente, sem nunca mencionar a análise.

### Implementação (zero novas tabelas)
Usa a infraestrutura existente de `client_memory.preferences` (JSONB):

**Campos emocionais adicionados:**
- `tom_emocional`: animado/estressado/cansado/ansioso/empolgado/nostálgico/indeciso/tranquilo/comemorando/preocupado
- `nivel_energia`: alto/médio/baixo
- `nivel_estresse`: alto/médio/baixo
- `momento_vida`: férias/lua-de-mel/aniversário/fuga-da-rotina/trabalho-remoto/família/amigos
- `historico_emocional`: array com últimas 10 leituras emocionais (para detectar tendências)

**Detecção de sinais:**
- Estresse: "preciso sair daqui", "to exausto", respostas impacientes
- Animação: "!!", emojis, "mal posso esperar"
- Ansiedade: muitas perguntas, "será que...", indecisão
- Comemoração: "aniversário", "lua de mel", "promoção"

**Adaptação silenciosa (via MEMORY_RULE):**
- Estressado → Sugere descanso, spas, all-inclusive
- Animado → Sugere aventura, esportes, destinos vibrantes
- Indeciso → Limita opções a 2-3, mais assertivo
- Comemorando → Sugere upgrades, experiências premium
- NUNCA menciona a análise ao cliente

### Arquivos modificados
- `supabase/functions/_shared/client-memory.ts`: Extraction prompt, merge logic, format, MEMORY_RULE
