# Tomorrow Live Trip Composer — Etapa 1: Fundação de Dados

> Checkpoint técnico da Etapa 1. Deve ser lido junto com `docs/TOMORROW_LIVE_TRIP_COMPOSER_PRD.md`, `docs/TOMORROW_LIVE_TRIP_COMPOSER_STAGE_0.md` e `docs/TOMORROW_LIVE_MASTER_PLAN.md`.

## 1. Estado

**IMPLEMENTADO NO GIT — migration ainda não aplicada ao Supabase.**

Data: 25/08/2026.

Baseline da `main`: `a79e2426dab731a6ba1c5b50b1d026f71a089690`.

Branch: `feat/trip-composer-stage-1-data-foundation`.

Migration:

`supabase/migrations/20260826001500_trip_composer_stage1_foundation.sql`

## 2. Escopo implementado

A Etapa 1 cria o domínio persistente mínimo necessário para uma viagem ser criada, alterada e retomada sem depender do Tomorrow Live visual.

Estruturas incluídas:

- `public.traveler_profiles`;
- `public.trip_sessions`;
- `public.trip_days`;
- `public.trip_day_items`;
- `public.trip_preferences`.

Não foram criadas nesta etapa:

- `travel_places`;
- `travel_experiences`;
- `experience_media`;
- APIs públicas;
- ferramentas Realtime;
- integração com WhatsApp;
- integração com `active_trips`;
- integração com `client_trips`;
- integração com `client_memory`.

Essas responsabilidades permanecem nas etapas posteriores do roadmap.

## 3. Decisões de segurança

### 3.1 Sem acesso direto anônimo

Todas as tabelas novas têm RLS habilitado.

A migration cria somente policy administrativa baseada em `public.user_roles.role = 'admin'`.

Não há policy para `anon` ou para usuário autenticado comum.

A futura Session API deverá executar operações server-side e validar segredo de retomada/compartilhamento antes de acessar a viagem.

### 3.2 Tokens

`trip_sessions` possui:

- `access_token_hash`;
- `share_token_hash`.

A tabela nunca deve armazenar o token/segredo bruto. O backend futuro deverá gerar valor aleatório criptograficamente forte, devolver o segredo somente ao cliente autorizado e persistir apenas SHA-256.

### 3.3 Dados pessoais

`traveler_profiles` só deve ser criado quando o viajante atravessar o gate de identificação/compartilhamento.

Campos obrigatórios:

- nome completo;
- e-mail;
- WhatsApp normalizado em formato E.164;
- timestamp do consentimento de compartilhamento.

Consentimento para contato comercial permanece separado e opcional.

## 4. Contrato das tabelas

### `traveler_profiles`

Identidade leve do viajante, sem exigir conta autenticada.

Pode futuramente ser vinculada a `auth.users` por `user_id`.

### `trip_sessions`

Raiz da viagem em planejamento.

Suporta:

- sessão anônima;
- vinculação posterior a viajante;
- destino e coordenadas;
- datas;
- chegada/saída;
- hotel/base;
- composição dos passageiros;
- ritmo;
- orçamento de experiências;
- dia/slot atual;
- estados `PLANNING`, `CONFIRMED_ITINERARY`, `PRE_TRIP`, `IN_TRIP`, `COMPLETED`;
- segredo de retomada e compartilhamento armazenados somente como hash.

### `trip_days`

Um registro por dia da viagem.

Estados:

- `OPEN`;
- `PLANNED`;
- `LOCKED`.

### `trip_day_items`

Timeline granular.

Tipos:

- `EXPERIENCE`;
- `RESTAURANT`;
- `TRANSPORT`;
- `HOTEL`;
- `FREE_TIME`;
- `CUSTOM`.

Estados:

- `SUGGESTED`;
- `SELECTED`;
- `CONFIRMED`;
- `REMOVED`.

Possui identidade externa opcional, coordenadas, origem factual e snapshots estruturados. Esses snapshots não autorizam cache permanente de conteúdo sujeito à política de fornecedores.

### `trip_preferences`

Armazena preferências com origem explícita:

- `EXPLICIT`;
- `SELECTION`;
- `REJECTION`.

O modelo permite manter sinais inferidos sem substituir uma preferência declarada.

## 5. Compatibilidade com sistemas existentes

A migration não altera:

- `public.travel_offers`;
- `active_trips`;
- `client_trips`;
- `client_memory`;
- `ai_itineraries`;
- `concierge-engine`;
- `whatsapp-webhook`;
- `tomorrow-live-realtime-session`;
- prompt/tom do Téo.

O domínio do Composer permanece isolado e será conectado por adapters somente nas etapas previstas.

## 6. Validação realizada

### GitHub

- baseline da `main` reconfirmada antes da criação da branch;
- Master Plan relido;
- checkpoint da Etapa 0 relido;
- schema versionado e migration de RLS existente utilizados como referência;
- migration criada em branch isolada.

### Supabase

Foi tentada leitura direta do schema pelo conector usando o project ref versionado em `supabase/config.toml`, mas a ação retornou erro de permissão.

Por esse motivo:

- nenhuma alegação de aplicação/validação no banco foi feita;
- nenhuma DDL foi executada remotamente;
- a migration permanece pendente de aplicação controlada no Lovable Cloud/Supabase.

## 7. Critério de validação da migration

Antes do merge, executar em ambiente de banco controlado ou SQL Editor:

1. confirmar que `public.user_roles` existe e usa `user_id` + `role` como esperado;
2. aplicar a migration;
3. confirmar criação das cinco tabelas;
4. confirmar RLS habilitado nas cinco;
5. confirmar ausência de policies públicas/anon;
6. testar INSERT de `trip_sessions` anônima via contexto privilegiado;
7. criar `trip_days` e `trip_day_items`;
8. atualizar item e preferência;
9. vincular posteriormente um `traveler_profile` à mesma sessão;
10. confirmar cascata de exclusão sessão → dias → itens/preferências em dados de teste;
11. remover dados de teste;
12. confirmar que `travel_offers`, `active_trips`, `client_trips` e `client_memory` não foram alteradas.

## 8. Estado por marco

- IMPLEMENTADO NO CÓDIGO: sim.
- TESTADO EM BANCO: não.
- MIGRATION APLICADA: não.
- RLS VALIDADO NO BANCO: não.
- MERGEADO: não.
- SINCRONIZADO NO LOVABLE: não.
- PUBLICADO: não aplicável nesta subetapa.
- VALIDADO EM PRODUÇÃO: não.

## 9. Próxima ação exata

1. abrir PR da Etapa 1;
2. revisar diff da migration;
3. aplicar a migration de forma controlada no Lovable Cloud/Supabase;
4. executar os testes de persistência/alteração descritos acima;
5. somente após validação real do banco, atualizar este checkpoint com resultados e mergear;
6. iniciar Etapa 2 — Experience Discovery — em branch separada.