# Checkpoint — My Tomorrow Fase 6A — Alertas in-app

Data: 2026-09-11
Branch: `feat/my-tomorrow-phase-6a-inapp-alerts`
Base: `6c17dd1371390369887506e291d1d09c27ed04f8`
Estado: IMPLEMENTADA E TESTADA EM CI; migrations do lote ainda não aplicadas.

## Regra do lote de migrations

Por instrução do usuário, migrations devem ser acumuladas em lotes de 3 antes da aplicação.

Lote atual:

1. `20260911201000_travel_radars_grants_reconciliation.sql` — Fase 5;
2. `20260911202000_my_tomorrow_radar_matches.sql` — Fase 5;
3. `20260911213000_my_tomorrow_radar_alerts.sql` — Fase 6A.

Nenhuma das três foi aplicada durante o desenvolvimento da Fase 6A.

## Escopo implementado

- tabela `travel_radar_alerts` com RLS por usuário;
- alertas `new_match` e `offer_changed`;
- deduplicação por `dedupe_key` derivada de Radar, oferta, versão do algoritmo e hash do snapshot público relevante;
- `updated_at` isolado do fingerprint para não gerar falso alerta por regravação sem mudança material;
- leitura/não leitura;
- inbox em `/minha-area/notificacoes`;
- deep-link para oferta pública e Radar;
- contador de não lidos no dashboard My Tomorrow;
- matching passa a emitir alertas apenas quando houver match novo ou snapshot público relevante alterado;
- reprocessamento idêntico não cria novo alerta;
- snapshot de alerta permanece no contrato público sanitizado.

## Segurança e integridade

- nenhuma leitura de `raw_data` ou `source_url`;
- cliente lê/atualiza somente alertas próprios via RLS;
- geração de alertas ocorre server-side no matching;
- escrita de alertas não é liberada diretamente ao usuário autenticado;
- admin mantém acesso previsto por policy;
- sem e-mail, WhatsApp, Téo ou cron nesta fase.

## Validação

Run final: `34645350969` — PASS integral.

- testes focados Vitest: PASS;
- TypeScript: PASS;
- ESLint do escopo: PASS;
- build: PASS;
- testes de regressão do matcher: PASS;
- `deno check`: PASS;
- `git diff --check`: PASS.

## Fora do escopo

- Fase 6B e-mail;
- Fase 6C WhatsApp;
- agendamento automático de varredura;
- publicação do frontend;
- aplicação das 3 migrations pendentes;
- deploy da versão atualizada de `my-tomorrow-matching`.

## Próximo gate

Após merge da Fase 6A:

1. aplicar as 3 migrations do lote na ordem;
2. deployar `my-tomorrow-matching` já contendo geração de alertas;
3. validar RLS A × B;
4. validar novo match → 1 alerta;
5. reprocessar sem mudança → 0 alerta novo;
6. alterar snapshot elegível → 1 `offer_changed`;
7. validar leitura individual e `marcar tudo como lido`;
8. validar deep-links;
9. confirmar ausência de campos internos nos snapshots.
