# Checkpoint — My Tomorrow Fase 5 — Matching Engine v1

Data: 2026-09-11
Branch: `feat/my-tomorrow-phase-5-matching-engine`
Base: `2be03f5f55f0070b39d545fcafa46115b936db97`
PR: #113
Estado: IMPLEMENTADA E TESTADA EM CI — migrations e Edge Function ainda não aplicadas

## Preflight

- `main` reconfirmada em `2be03f5f55f0070b39d545fcafa46115b936db97`;
- commit posterior do Lovable referente à aplicação da Fase 4 inspecionado;
- master plan, roadmap, PRD e checkpoint da Fase 4 lidos;
- contrato `travel-offers-public` reconfirmado;
- nenhuma alteração em Téo, WhatsApp ou Tomorrow Live.

## Reconciliação da Fase 4

Migration aditiva: `supabase/migrations/20260911201000_travel_radars_grants_reconciliation.sql`.

Registra no histórico os `GRANT` aplicados no gate real da Fase 4 sem reescrever a migration já executada.

## Persistência

Migration: `supabase/migrations/20260911202000_my_tomorrow_radar_matches.sql`.

Cria `travel_radar_matches` com ownership, RLS, classes `exact/flexible/discovery`, versão do algoritmo, score, fatores explicáveis, snapshot público sanitizado, deduplicação e expiração lógica. Escrita de matches fica reservada ao backend; cliente autenticado apenas lê seus próprios matches.

## Algoritmo

Versão: `radar-v1.0.0`.

- Exact: hard filters sem relaxamento.
- Flexible: apenas datas podem usar `flexibility_days` explicitamente cadastrado.
- Discovery: classe separada; pode relaxar destino somente quando demais hard filters permanecem válidos e existe afinidade positiva explícita do Travel Profile para a categoria pública da oferta.
- Score determinístico com origem, destino, datas, orçamento, vagas, duração, subtipo, categoria e afinidade explícita.
- Bloqueios seguem canonicalização pública atual `REC → Recife` e `POA → Porto Alegre`.

## Fonte e segurança

O motor consulta server-to-server `travel-offers-public`; não devolve `public.travel_offers` diretamente ao navegador.

Snapshot persistido contém apenas campos públicos necessários. Não contém `raw_data`, `source_url`, tokens, credenciais ou links internos.

Por execução, o v1 avalia até 4 páginas de 50 candidatos na busca principal e até 2 páginas de 50 para Discovery, deduplicando por `offer_id`.

## Atualização e expiração

Cada execução bem-sucedida:

1. recalcula candidatos;
2. faz upsert por `(radar_id, offer_id, algorithm_version)`;
3. atualiza snapshot e `last_matched_at`;
4. expira matches que deixaram de ser elegíveis;
5. atualiza `travel_radars.last_checked_at`.

Radar pausado ou arquivado não executa matching.

## Backend e frontend

Edge Function: `supabase/functions/my-tomorrow-matching/index.ts`.

Ações autenticadas: `run` e `list`. O JWT é validado dentro da Function; Service Role permanece somente server-side após validação de ownership.

`/minha-area/radares/:radarId` passa a exibir botão `Atualizar Radar`, resumo da execução, Exact/Flexible/Discovery, fatores de aderência, score quando há critérios suficientes e deep-link para a oportunidade pública real.

## Validação

Run final: `34641371497` — PASS integral.

- Vitest focado: PASS;
- TypeScript: PASS;
- ESLint do escopo: PASS;
- build de produção: PASS;
- Deno matcher tests: 5/5 PASS;
- `deno check`: PASS;
- `git diff --check`: PASS;
- revisão de diff concluída.

## Fora do escopo

Cron/agendamento automático, alertas, e-mail, WhatsApp, Téo, publicação, aplicação das migrations e deploy da nova Edge Function.

## Próximo gate após merge

1. aplicar `20260911201000_travel_radars_grants_reconciliation.sql`;
2. aplicar `20260911202000_my_tomorrow_radar_matches.sql`;
3. deployar somente `my-tomorrow-matching`;
4. validar ownership A × B;
5. executar Radar real com pacote, bloqueio e cenário sem resultado;
6. validar Exact/Flexible/Discovery quando houver dados reais sustentados;
7. repetir execução para validar deduplicação;
8. invalidar critério de teste para validar expiração;
9. confirmar ausência de `raw_data`/`source_url` no snapshot;
10. somente após esse gate iniciar Fase 6A — alertas in-app.

## Estados

- IMPLEMENTADO: SIM.
- TESTADO em CI/estático: SIM.
- MERGEADO: pendente neste checkpoint.
- MIGRATIONS EXECUTADAS: NÃO.
- EDGE FUNCTION DEPLOYADA: NÃO.
- SINCRONIZADO NO LOVABLE: NÃO confirmado.
- PUBLICADO: NÃO.
- VALIDADO EM PRODUÇÃO: NÃO.
