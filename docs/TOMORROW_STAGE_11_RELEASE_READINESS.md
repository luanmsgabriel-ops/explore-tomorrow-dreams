# Tomorrow Travel — Etapa 11 — Release readiness

## Estado

Preparação de publicação controlada em andamento. Este documento consolida o que pode ser concluído no GitHub antes de gastar uma rodada de sincronização/implantação no Lovable.

## Baseline

- `main` de entrada: `c93db4c133d117e99478c90b0fa19fcca50097d5`.
- Etapa 10: encerrada pelo usuário após validação funcional em produção.
- Correção contextual de filtros/Recife: mergeada anteriormente e informada pelo usuário como corrigida em produção.
- Performance de imagens: implementada, testada e mergeada no PR #68; implantação da nova infraestrutura ainda pendente.
- Release smoke/rollback: implementado e mergeado no PR #69.
- Code splitting de rotas: validado no PR #70; chunk inicial reduziu de aproximadamente 2,22 MB / 627 KB gzip para 1,10 MB / 336 KB gzip, sem alterar comportamento das rotas.

## Pendências acumuladas para a próxima rodada Lovable/Supabase

### Migration

- `supabase/migrations/20260824030000_offer_images_cache_bucket.sql`
  - cria/configura o bucket público `offer-images-cache`;
  - não altera `public.travel_offers`;
  - não altera outros buckets.

### Edge Function

- `travel-offer-image`
  - nova função pública de leitura/cache de imagens;
  - `verify_jwt = false` conforme `supabase/config.toml`;
  - exige implantação isolada;
  - depende de Storage Image Transformations habilitado.

### Frontend

- alterações de miniatura/cache responsivo já estão na `main` desde o PR #68;
- code splitting das rotas não iniciais e do chat flutuante será incluído no SHA final acumulado da Etapa 11;
- a publicação deverá usar o SHA final acumulado da Etapa 11, não um SHA intermediário deste documento.

## Smoke test pós-publicação

Executar `node scripts/stage11-smoke.mjs` depois da sincronização e publicação.

Por padrão, o script verifica:

1. `/oportunidades/catalogo` retorna HTML 2xx;
2. `/oportunidades/calendario` retorna HTML 2xx;
3. `/oportunidades/live` retorna HTML 2xx.

Com `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` disponíveis, também verifica:

4. `travel-offers-public` retorna ao menos um pacote real;
5. a resposta pública não contém `raw_data`, `source_url`, `service_role` ou `service_role_key`;
6. `travel-offer-image` redireciona para `/storage/v1/render/image/public/offer-images-cache/...`.

O script não escreve no banco, não cria reserva e não envia mensagem.

## Critério de rollback

Interromper a publicação e voltar ao último SHA publicado validado se ocorrer qualquer um destes cenários:

- catálogo, calendário ou Live deixam de responder em 2xx;
- `travel-offers-public` retorna erro sistemático;
- campo interno aparece no DTO público;
- a nova função de imagem interfere no carregamento dos cards sem fallback;
- erro crítico de JavaScript impede uso das rotas principais;
- regressão no Téo, voz ou handoff.

A migration do bucket é aditiva e não deve exigir remoção imediata para rollback do frontend. Em rollback, o frontend pode voltar a usar a imagem original; o bucket pode permanecer sem ser consumido até investigação.

## Segurança do `.env`

A revisão da `main` confirmou que o `.env` versionado contém apenas variáveis `VITE_` destinadas ao frontend: identificação/URL do projeto Supabase e chave pública/anon. Nenhuma Service Role foi encontrada nesse arquivo. O arquivo não foi removido nesta etapa para não alterar o contrato de build do Lovable sem necessidade comprovada. Nenhum valor de credencial deve ser copiado para documentação ou respostas públicas.

## Ordem recomendada da futura rodada única no Lovable

1. sincronizar o SHA final acumulado da `main`;
2. aplicar migrations pendentes em ordem cronológica;
3. confirmar objetos criados no banco/Storage;
4. implantar somente Edge Functions novas ou alteradas acumuladas;
5. confirmar SHA/configuração de cada função;
6. sincronizar/buildar o frontend no mesmo SHA;
7. somente com autorização, publicar;
8. executar o smoke test;
9. validar manualmente catálogo, calendário, Tomorrow Live, Recife/REC e imagens;
10. registrar deployment ID, horário, SHA e resultado.

## Regra de consolidação

Até a próxima rodada no Lovable, toda nova alteração da Etapa 11 deve registrar neste documento qualquer migration, Edge Function ou configuração adicional que dependa de implantação. O prompt final será montado a partir deste manifesto para evitar chamadas fragmentadas e gasto desnecessário de crédito.
