

# Plano: 5 Features Téo 2030

## Features Solicitadas (uma por vez, implementação completa)
1. ✅ **Téo Grupal** — Viagem em grupo com cruzamento de preferências via WhatsApp
2. ✅ **Téo Lê Mentes** — Perfil emocional por conversa
3. ✅ **Téo Tradutor Universal** — Tradução universal ao vivo (texto, áudio, fotos)
4. ✅ **Téo DNA** — Perfil genético de viajante
5. ✅ **Playlist da Viagem** — Curadoria IA com links Spotify
6. ✅ **Téo Vidente** — Roteiro por signos e astrologia
7. ✅ **Téo Compatibilidade** — Match de viagem entre DNAs de viajante

---

## 7. Téo Compatibilidade (IMPLEMENTADO ✅)

### Conceito
O cliente envia `compatibilidade com 5511999999999` e o Téo compara os DNAs de Viajante dos dois, calcula score de compatibilidade e sugere destinos ideais para ambos.

### Comandos WhatsApp
| Comando | Ação |
|---------|------|
| `compatibilidade com [número]` / `match viagem [número]` | Compara DNAs e sugere destino |
| `compatibilidade` (sem número) | Téo pede o número do parceiro |

### Armazenamento (zero novas tabelas)
Usa `client_memory.preferences`:
- `ultimo_match`: `{ parceiro_phone, parceiro_nome, score, data }`

### Arquivos modificados
- `supabase/functions/whatsapp-webhook/index.ts`: Bloco de comando com regex, busca de 2 memórias, chamada Gemini, formatação e save
- `supabase/functions/_shared/client-memory.ts`: `ultimo_match` no `formatMemoryForPrompt` + skipKeys

## 3. Téo DNA de Viajante (IMPLEMENTADO ✅)

### Conceito
Questionário profundo de 10 perguntas que gera um perfil "genético" de viajante com 5 categorias (Explorador, Culturalista, Gourmet, Zen, Socialite) que evolui com cada viagem.

### Comandos WhatsApp
| Comando | Ação |
|---------|------|
| `meu dna` / `dna viajante` / `teste dna` | Inicia o questionário de 10 perguntas |

### Categorias do DNA
- 🏔️ Explorador: aventura, adrenalina, natureza selvagem
- 🏛️ Culturalista: história, museus, arquitetura
- 🍽️ Gourmet: gastronomia, vinhos, experiências culinárias
- 🧘 Zen: relaxamento, praias, spas
- 🎉 Socialite: festas, vida noturna, experiências sociais

### Armazenamento (zero novas tabelas)
Usa `client_memory.preferences` (JSONB):
- `dna_viajante`: perfil atual com porcentagens, raw_result, answers
- `dna_historico`: array com últimas 10 análises (para detectar evolução)

### Evolução
O DNA evolui automaticamente:
- Cada vez que o teste é refeito, uma nova entrada é adicionada ao histórico
- O formatMemoryForPrompt mostra a evolução (↑↓ por categoria)
- Téo usa o DNA para personalizar sugestões sem perguntar demais

### Arquivos modificados
- `supabase/functions/whatsapp-webhook/index.ts`: Comando + questionário 10 perguntas + geração via Gemini
- `supabase/functions/_shared/client-memory.ts`: DNA no prompt, na formatação e na regra de adaptação

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
