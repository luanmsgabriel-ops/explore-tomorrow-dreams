# Checkpoint — My Tomorrow Fase 5 — Matching Engine v1

Data: 2026-09-11
Branch: `feat/my-tomorrow-phase-5-matching-engine`
Base: `2be03f5f55f0070b39d545fcafa46115b936db97`
Estado: IMPLEMENTAÇÃO EM VALIDAÇÃO — migrations e Edge Function ainda não aplicadas

## Preflight

- `main` reconfirmada em `2be03f5f55f0070b39d545fcafa46115b936db97`;
- o commit posterior da Lovable referente à aplicação da Fase 4 foi inspecionado;
- master plan lido e reconhecido como historicamente desatualizado frente à `main` e aos checkpoints My Tomorrow;
- roadmap e PRD My Tomorrow lidos;
- checkpoint da Fase 4 lido;
- contrato público `travel-offers-public` e tipos `TravelOfferCatalogItem` reconfirmados;
- nenhuma alteração em Téo, WhatsApp ou Tomorrow Live.

## Reconciliação da Fase 4

Durante o gate real da Fase 4, o Lovable precisou conceder privilégios à tabela `travel_radars`, mas esses `GRANT` não ficaram na migration já aplicada.

Para não reescrever histórico aplicado, foi criada a migration aditiva:

`supabase/migrations/20260911201000_travel_radars_grants_reconciliation.sql`

Ela reproduz de forma idempotente o estado de privilégios validado no banco.

## Persistência de matches

Migration:

`supabase/migrations/20260911202000_my_tomorrow_radar_matches.sql`

Cria `public.travel_radar_matches` com:

- ownership por `user_id` e `radar_id`;
- `offer_id` público;
- classe `exact`, `flexible` ou `discovery`;
- versão de algoritmo;
- score determinístico 0–100;
- fatores aderentes e não aderentes explicáveis;
- snapshot somente do contrato público sanitizado;
- timestamps de primeira/última aderência;
- `expired_at` para expiração lógica;
- unique `(radar_id, offer_id, algorithm_version)` para deduplicação;
- RLS de leitura por owner e admin;
- escrita de matches reservada ao backend/service role.

Nunca são persistidos `raw_data`, `source_url`, tokens, credenciais ou dados internos de fornecedor.

## Algoritmo v1

Versão: `radar-v1.0.0`.

### Exact

Exige todos os hard filters aplicáveis sem relaxamento:

- tipo/subtipo informado;
- origem;
- destino;
- período;
- moeda/faixa de orçamento;
- vagas quando a oferta informa disponibilidade.

### Flexible

Só pode relaxar datas quando `flexibility_days > 0` foi explicitamente cadastrado no Radar.

Não relaxa destino, orçamento, tipo, subtipo ou passageiros.

### Discovery

É classe separada, nunca apresentada como Exact.

No v1 só pode relaxar destino quando:

- os demais hard filters continuam válidos;
- há afinidade positiva explícita do Travel Profile para a categoria pública da oferta.

Não existe mapeamento inventado entre destinos/categorias.

### Soft factors

Score considera:

- origem;
- destino;
- datas;
- orçamento;
- vagas;
- duração;
- subtipo;
- categoria;
- afinidade explícita do perfil.

O score é determinístico para a mesma entrada e versão do algoritmo.

## Fonte de candidatos

O backend não lê `public.travel_offers` diretamente para montar resposta ao cliente.

Ele consulta server-to-server a Edge Function sanitizada `travel-offers-public`, reaproveitando:

- origem;
- destino/IATA;
- tipo/subtipo;
- datas;
- passageiros;
- preço;
- paginação.

Limite v1 por execução:

- até 4 páginas de 50 candidatos na busca principal;
- até 2 páginas de 50 candidatos para Discovery quando houver afinidade positiva;
- deduplicação por `offer_id` antes da avaliação.

Bloqueios aéreos respeitam a canonicalização pública atual `REC → Recife` e `POA → Porto Alegre`.

## Atualização e expiração

Cada execução bem-sucedida:

1. recalcula os candidatos atuais;
2. faz upsert dos matches da versão atual;
3. atualiza snapshot e `last_matched_at` quando a oferta pública mudou;
4. marca `expired_at` nos matches anteriores que deixaram de ser elegíveis;
5. atualiza `travel_radars.last_checked_at`.

Radar pausado/arquivado não executa matching.

## Backend

Nova Edge Function:

`supabase/functions/my-tomorrow-matching/index.ts`

Ações autenticadas:

- `run` — executa o Radar informado;
- `list` — retorna somente matches ativos do Radar pertencente ao usuário.

A Function valida o JWT mesmo com gateway `verify_jwt = false` e usa Service Role somente server-side depois de confirmar ownership do Radar.

## Frontend

`/minha-area/radares/:radarId` passa a oferecer:

- botão `Atualizar Radar`;
- resumo da execução;
- lista de matches atuais;
- distinção visual Exact / Flexible / Discovery;
- preço por pessoa sustentado pelo snapshot público;
- fatores de aderência;
- score exibido apenas quando há quantidade mínima de fatores;
- deep-link para a oportunidade pública real.

Não há alertas automáticos nesta fase.

## Fora do escopo

- cron/agendamento automático;
- central de alertas;
- e-mail;
- WhatsApp;
- alteração de Téo;
- matching opaco/comportamental fora das preferências explícitas;
- publicação do frontend;
- aplicação das migrations da Fase 5;
- deploy da nova Edge Function.

## Gate antes do merge

- testes Deno do algoritmo;
- teste focado do contrato frontend;
- TypeScript;
- ESLint do escopo;
- build;
- `deno check`;
- `git diff --check`;
- revisão final de diff;
- remoção do workflow temporário.

## Próximo gate após merge

1. aplicar a migration corretiva de grants;
2. aplicar a migration `travel_radar_matches`;
3. deployar somente `my-tomorrow-matching`;
4. validar autenticação/ownership A × B;
5. executar Radar real com pacote, bloqueio e cenário sem resultado;
6. validar Exact/Flexible/Discovery com dados reais quando houver candidatos sustentados;
7. executar duas vezes para validar deduplicação;
8. alterar/invalidar critério de teste e validar expiração;
9. confirmar ausência de `raw_data`/`source_url` no snapshot;
10. somente depois iniciar Fase 6A — alertas in-app.
