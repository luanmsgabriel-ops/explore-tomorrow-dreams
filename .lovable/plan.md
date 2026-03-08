

# Plano: 5 Features Téo 2030

## Features Solicitadas (uma por vez, implementação completa)
1. ✅ **Téo Grupal** — Viagem em grupo com cruzamento de preferências via WhatsApp
2. 🔲 **Téo Lê Mentes** — Perfil emocional por conversa
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

### Questionário (5 perguntas)
1. Estilo de viagem
2. Clima preferido
3. Top 3 prioridades
4. Faixa de orçamento
5. Restrições

### Auto-trigger
Quando todos os membros completam o questionário (mín. 2), o cruzamento é disparado automaticamente e enviado a todos.

### Arquivos modificados
- Migração SQL: `travel_groups` + `travel_group_members`
- `supabase/functions/whatsapp-webhook/index.ts`: Bloco completo de grupo (~300 linhas)
- Schema do Admin Assistant atualizado com tabelas 26 e 27
