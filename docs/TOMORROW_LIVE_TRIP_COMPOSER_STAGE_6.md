# Tomorrow Live Trip Composer — Etapa 6: Construção multi-day

## Estado

**IMPLEMENTADO NO GIT — estado multi-day determinístico criado; integração com sessão persistente/Téo ainda não realizada.**

Baseline: `c5a4fa1a9d7821add65f8fb5231007dce1fa78e6`.

## Entregas

- `createComposerState(totalDays)` para inicializar uma viagem com vários dias;
- reducer determinístico `tripComposerReducer`;
- adicionar item a um dia;
- remover item;
- reordenar item;
- substituir uma escolha por outra;
- concluir um dia e avançar automaticamente ao próximo ainda em planejamento;
- reabrir um dia já concluído;
- trocar o dia ativo;
- registrar preferências declaradas;
- registrar preferências inferidas de escolhas;
- registrar rejeições;
- scoring simples de preferência para alimentar o planner futuramente;
- testes cobrindo operações multi-day e precedência de preferências declaradas.

## Regra de preferências

Preferência explicitamente declarada pelo cliente tem precedência sobre sinais inferidos conflitantes.

Exemplo:

- cliente declara `ritmo=tranquilo`;
- uma escolha isolada poderia parecer mais intensa;
- o sinal inferido não substitui a declaração explícita.

Rejeições geram score negativo e seleções geram score positivo. O reducer não altera automaticamente preferências declaradas.

## Regra de edição

O roteiro não é tratado como texto final. Cada item é independente e pode ser removido, movido ou substituído sem regenerar o restante da viagem.

Isso sustenta comandos futuros como:

- “troca esse passeio”;
- “tira o jantar”;
- “volta naquele anterior”;
- “quero ficar mais tempo aqui”;
- “vamos revisar o Dia 2”.

## Persistência

A Etapa 6 implementa o estado de domínio no frontend/lib, mas ainda não cria uma API de persistência. A gravação em `trip_sessions`, `trip_days`, `trip_day_items` e `trip_preferences` deve ocorrer por uma camada server-side própria, e não por acesso direto `anon` às tabelas protegidas.

## Segurança

- nenhuma alteração em RLS;
- nenhuma exposição pública de tabelas;
- nenhuma alteração em Téo/Realtime;
- nenhuma alteração em WhatsApp;
- nenhuma migration;
- nenhuma nova Edge Function.

## Próximo passo

Etapa 7 — Mapa Vivo: criar o contrato visual geográfico sincronizado com os itens da timeline, usando coordenadas reais já disponíveis no domínio, sem depender de nomes de lugares para posicionamento.
