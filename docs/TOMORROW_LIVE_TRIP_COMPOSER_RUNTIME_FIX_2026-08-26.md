# Tomorrow Live Trip Composer — Runtime fix 2026-08-26

## Contexto

Smoke real do fluxo de criação de roteiro revelou que o Téo Live acionava o Trip Composer, porém informava que a busca de experiências em tempo real não estava disponível.

Baseline da correção: `211213be207fccfc9307ed8977875b7fd5deb857`.

## Diagnóstico real do Cloud

### Discovery

`trip-composer-discovery` respondeu HTTP 200 e retornou lugares reais do Google Places (New), incluindo fotos e horários. `GOOGLE_MAPS_API_KEY` existe no ambiente. Portanto, Discovery/Places não era a causa da indisponibilidade.

### Planner / Routes

`trip-composer-planner` respondeu HTTP 200 quando chamado com seu contrato nativo (`context` + `candidates`). O Google Routes retornou HTTP 403 `PERMISSION_DENIED` porque Routes API ainda não está habilitada no projeto Google Cloud da chave. A função já trata isso como degradação controlada e continua sem contexto de rota (`route_context_applied=false`).

### Window — causa primária do erro

`trip-composer-window` respondeu HTTP 500. O log registrou `trip-composer-planner:400`.

Causa: incompatibilidade de contrato entre `trip-composer-window` e `trip-composer-planner`:
- Window enviava `available_minutes`, preferências, passageiros e clima no nível raiz;
- Planner exige `body.context.available_minutes` e demais campos dentro de `context`;
- Window enviava candidatos com `title/categories`;
- Planner exige `name/category/tags`;
- Window esperava `planner.recommendations`;
- Planner devolve `planner.candidates` com metadados em `candidate.planner`.

### Weather — falha secundária

`trip-composer-weather` não estava implantada (HTTP 404). Além disso, o Window enviava `date`, mas Weather exige `target_date`. O erro era absorvido pelo fallback do Window, por isso não causava o HTTP 500, mas impedia clima real de chegar ao Planner.

## Correção implementada

Branch: `fix/trip-composer-window-contract`.

Arquivos funcionais:
- `supabase/functions/trip-composer-window/index.ts`
- `supabase/functions/_shared/trip-composer-window.ts`
- `supabase/functions/_shared/trip-composer-window.test.ts`

Mudanças:
- Window agora envia ao Planner `{ context, origin, candidates }` no contrato correto;
- candidatos do Discovery são convertidos para o contrato real do Planner (`name`, `category`, `tags`, etc.);
- resposta `planner.candidates` é normalizada de volta para o contrato visual esperado pelo frontend (`recommendations` com `candidate` factual);
- Weather passa a receber `target_date` corretamente;
- somente previsão real (`mode=forecast`) injeta probabilidade de chuva no Planner;
- campos factuais do Google Places permanecem separados do metadata de scoring;
- falha do Discovery retorna `discovery_unavailable` e falha do Planner retorna `planner_unavailable`, em vez de mascarar tudo como `internal_error`.

## Validação

GitHub Actions run: `33031062530`.

Resultado:
- Deno check de `trip-composer-window`: PASS;
- testes focados Window: PASS;
- testes focados Planner: PASS;
- testes focados Weather: PASS;
- instalação sem reescrever lockfile: PASS;
- build completo: PASS.

Workflow temporário removido antes do PR/merge.

## Pendências de infraestrutura

1. Implantar a nova versão de `trip-composer-window`.
2. Implantar `trip-composer-weather` (a função existe no GitHub/config, mas não está no Cloud).
3. Habilitar **Routes API** no mesmo projeto Google Cloud associado a `GOOGLE_MAPS_API_KEY` para que `route_context_applied` possa ser verdadeiro e o Planner use tempo/distância reais.
4. Depois dos itens acima, repetir smoke real:
   - Discovery retorna experiências;
   - Window retorna HTTP 200 com até 3 `recommendations`;
   - cards aparecem no Tomorrow Live;
   - Weather aparece quando a data estiver dentro da janela de previsão;
   - Routes passa a ser aplicado quando origem/coordenadas estiverem disponíveis;
   - seleção persiste na timeline.

## Estados

- IMPLEMENTADO: sim, na branch.
- TESTADO: sim, em CI.
- MERGEADO: não neste checkpoint.
- EDGE FUNCTIONS IMPLANTADAS: não para esta correção.
- PUBLICADO: não.
- VALIDADO EM PRODUÇÃO: não.
